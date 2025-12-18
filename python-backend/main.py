import os
import requests
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Şifreleri Yükle
load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
gemini_api_key = os.environ.get("GEMINI_API_KEY")

# 2. Supabase Kontrol
if not url or not key:
    print("UYARI: Supabase şifreleri eksik, sadece yapay zeka çalışacak.")
else:
    supabase = create_client(url, key)

# 3. DOKTOR FONKSİYONU
def ask_gemini_doctor(text):
    # DÜZELTME: Senin listende kesin olarak var olan model bu!
    model_name = "gemini-flash-latest"
    
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_api_key}"
    
    headers = {'Content-Type': 'application/json'}
    
    # Doktora karakter yükleyelim
    prompt_text = f"""
    Sen VitalSense AI adında, çok yardımsever bir sağlık asistanısın.
    Kullanıcının sorusu: {text}
    Lütfen kullanıcıyı rahatlatacak, samimi ve kısa bir cevap ver.
    Cevabının sonunda "Geçmiş olsun dileklerimle, VitalSense." yaz.
    """
    
    data = {
        "contents": [{
            "parts": [{"text": prompt_text}]
        }]
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            answer = result['candidates'][0]['content']['parts'][0]['text']
            return answer
        else:
            return f"Hata Kodu {response.status_code}: {response.text}"
            
    except Exception as e:
        return f"Bağlantı hatası: {str(e)}"

# --- ÇALIŞTIRMA ALANI ---
if __name__ == "__main__":
    print(f"👨‍⚕️ Doktor VitalSense (Flash Latest) Hazırlanıyor...")
    
    soru = "Merhaba doktor, başım biraz ağrıyor, ne yapmalıyım?"
    print(f"\nSoru: {soru}")
    print("Cevap bekleniyor...\n")
    
    cevap = ask_gemini_doctor(soru)
    
    print("--------------------------------")
    print("DOKTORUN CEVABI:")
    print(cevap)
    print("--------------------------------")
    