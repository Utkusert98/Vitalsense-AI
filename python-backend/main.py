import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from supabase import create_client, Client

# 1. Ayarları Yükle
load_dotenv()
gemini_api_key = os.environ.get("GEMINI_API_KEY")



SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Kontrol: Eğer hala boşsa hata vermeden önce uyarı
if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ UYARI: Supabase bilgileri .env dosyasından okunamadı!")
else:
    print("✅ Supabase bağlantı bilgileri alındı.")

# Supabase'e Bağlan
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"⚠️ Supabase bağlantı hatası: {e}")

genai.configure(api_key=gemini_api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. ANALİZ VE KAYIT FONKSİYONU
def analyze_and_save(file_bytes, mime_type, age, gender, chronic_diseases, is_pregnant, user_note):
    try:
        # A) Analiz Yap
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        patient_profile = f"""
        HASTA PROFİLİ:
        - Yaş: {age}
        - Cinsiyet: {gender}
        - Kronik Hastalıklar: {chronic_diseases}
        - Gebelik: {"Evet" if is_pregnant == 'true' else "Hayır"}
        - Not: {user_note}
        """

        prompt = f"""
        Sen VitalSense AI, üst düzey bir Tıbbi Laboratuvar ve Sağlık Asistanısın.
        
        {patient_profile}
        
        GÖREVİN:
        1. Yüklenen belgedeki laboratuvar değerlerini oku.
        2. HASTANIN YAŞINA, CİNSİYETİNE VE GEBELİK DURUMUNA GÖRE sonuçları değerlendir. (Örneğin: Hamilelerde bazı değerler farklı yorumlanabilir).
        3. Referans dışı değerleri tespit et ve bu hasta profili için ne anlama geldiğini açıkla.
        4. Sonucu hastanın anlayacağı dilde, korkutmadan ama net maddeler halinde ver.
        5. Eğer acil/kritik bir durum varsa mutlaka doktora yönlendir.
        6. Sonuçları kısa ve öz tut, maksimum 300 kelime.
        7. Cevabını Türkçe ver.
        8. Tahlilleri açıklarken tıbbi terimleri basitçe açıkla. Açıklarken de tıbbi terimleri kullanma anlaşılır şekilde ifade et.
        9. Eğer belge okunamıyorsa veya tahlil sonuçları yoksa bunu belirt ve kullanıcıyı bilgilendir.
        10. Cevabında "Sonuçlar", "Değerlendirme" veya "Öneriler" gibi başlıklar kullan.
        11. Kritik bir durum varsa bunu bold yazı ile yaz (vurgula).
        """
        
        file_blob = {"mime_type": mime_type, "data": file_bytes}
        response = model.generate_content([prompt, file_blob])
        ai_result = response.text
        
        # B) Veritabanına Kaydet
        try:
            data_to_save = {
                "age": age,
                "gender": gender,
                "is_pregnant": True if is_pregnant == 'true' else False,
                "chronic_diseases": chronic_diseases,
                "user_note": user_note,
                "analysis_result": ai_result
            }
            supabase.table("analysis_results").insert(data_to_save).execute()
            print("✅ Veri Supabase'e başarıyla kaydedildi!")
            
        except Exception as db_error:
            print(f"⚠️ Veritabanı Hatası: {db_error}")

        return ai_result
        
    except Exception as e:
        return f"Yapay Zeka Hatası: {str(e)}"

# 3. API KAPISI
@app.post("/analyze")
async def analyze_endpoint(
    file: UploadFile = File(...), 
    age: str = Form(...),
    gender: str = Form(...),
    chronic_diseases: str = Form(""),
    is_pregnant: str = Form("false"),
    note: str = Form("")
):
    print(f"📄 Dosya: {file.filename} işleniyor...")
    try:
        file_content = await file.read()
        sonuc = analyze_and_save(
            file_content, file.content_type, age, gender, chronic_diseases, is_pregnant, note
        )
        return {"result": sonuc}
    except Exception as e:
        return {"result": f"Sunucu Hatası: {str(e)}"}