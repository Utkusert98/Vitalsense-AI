"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; 

export default function Home() {
  // --- HAFIZA ALANI (STATES) ---
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false); 

  // --- FONKSİYONLAR ---

  // 1. Analizi Başlat Butonuna Basılınca Çalışacak Fonksiyon
  const handleAnalyze = async () => {
    try {
      // A. Kontrol Et: Her şey dolu mu?
      if (!fullName || !age || !gender || !file) {
        alert("Lütfen tüm alanları doldurun ve bir dosya seçin.");
        return;
      }

      setLoading(true); // Yükleniyor modunu aç

      // B. Dosya İsmini Benzersiz Yap (Çakışmasın diye)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // C. Dosyayı Supabase 'scans' Kutusuna Yükle
      const { error: uploadError } = await supabase.storage
        .from("scans")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // D. Yüklenen Dosyanın Linkini (URL) Al
      const { data: urlData } = supabase.storage
        .from("scans")
        .getPublicUrl(filePath);

      // E. Bilgileri Veritabanına (Tabloya) Yaz
      const { error: dbError } = await supabase
        .from("analysis_requests")
        .insert([
          {
            full_name: fullName,
            age: parseInt(age), 
            gender: gender,
            file_url: urlData.publicUrl,
            status: "pending", // Bekliyor durumunda
          },
        ]);

      if (dbError) throw dbError;

      // F. Mutlu Son: Başarılı Mesajı
      alert("Tahlil başarıyla yüklendi! Analiz başlıyor...");
      // Burada ileride "Sonuç Ekranı"na yönlendireceğiz.

    } catch (error) {
      console.error("Hata:", error);
      alert("Bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false); // Yükleme bitti, modu kapat
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-blue-700 mb-4 tracking-tight">
          VitalSense AI
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Tahlillerinizi yapay zeka ile analiz edin, saniyeler içinde yorumlayın.
        </p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-6 space-y-4">
          
          {/* Ad Soyad Girişi */}
          <input
            type="text"
            placeholder="Adınız Soyadınız"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
          />

          {/* Cinsiyet Seçimi */}
          <div className="flex gap-4">
            <button
              onClick={() => setGender("male")}
              className={`flex-1 py-3 px-4 rounded-lg border transition font-medium ${
                gender === "male"
                  ? "bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-500 ring-opacity-50"
                  : "border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600"
              }`}
            >
              Erkek
            </button>
            <button
              onClick={() => setGender("female")}
              className={`flex-1 py-3 px-4 rounded-lg border transition font-medium ${
                gender === "female"
                  ? "bg-pink-100 border-pink-500 text-pink-700 ring-2 ring-pink-500 ring-opacity-50"
                  : "border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600 "
              }`}
            >
              Kadın
            </button>
          </div>

          {/* Yaş Girişi */}
          <input
            type="number"
            placeholder="Yaşınız"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
          />
        </div>

        {/* Dosya Yükleme Alanı */}
        <div className="relative">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={`border-2 border-dashed rounded-xl p-10 text-center transition 
            ${file ? "bg-green-50 border-green-400" : "border-blue-200 bg-blue-50/50 hover:bg-blue-50"}`}>
            
            <div className="text-4xl mb-2">{file ? "✅" : "📄"}</div>
            <p className="text-sm text-gray-500 font-medium">
              {file ? file.name : "Tahlil Sonucunu Yükle veya Sürükle"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {file ? "Dosya seçildi" : "PDF, JPG veya PNG"}
            </p>
          </div>
        </div>

        {/* Analizi Başlat Butonu */}
        <button
          onClick={handleAnalyze}
          disabled={loading} // Yüklenirken tıklanmasın
          className={`w-full mt-6 font-bold py-4 rounded-xl transition shadow-lg 
            ${loading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"}`}
        >
          {loading ? "Yükleniyor..." : "Analizi Başlat"}
        </button>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Kişisel verileriniz KVKK kapsamında korunmaktadır.
      </p>
    </main>
  );
}