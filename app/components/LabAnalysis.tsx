"use client";

import { useState } from "react";

export default function LabAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<string>("");

  // --- YENİ EKLENEN HASTA BİLGİLERİ ---
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Cinsiyetinizi Seçin");
  const [chronicDiseases, setChronicDiseases] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [note, setNote] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileType(file.type);
      setResult("");
      if (file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !age) {
      alert("Lütfen yaşınızı ve dosyanızı giriniz.");
      return;
    }

    setLoading(true);
    setResult("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    // --- YENİ VERİLERİ PAKETLE ---
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("chronic_diseases", chronicDiseases);
    formData.append("is_pregnant", isPregnant ? "true" : "false");
    formData.append("note", note);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data.result || "Bir hata oluştu.");
    } catch (error) {
      console.error("Hata:", error);
      setResult("Sunucuya bağlanılamadı.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100 mt-10">
      <h2 className="text-3xl font-extrabold text-blue-800 mb-8 flex items-center gap-3">
        🧬 VitalSense Akıllı Tahlil Analizi
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* SOL TARA: Form Bilgileri */}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Yaşınız *</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
              placeholder="Örn: 25"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cinsiyet *</label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                if (e.target.value === "Erkek") setIsPregnant(false);
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-600"
            >
              <option disabled>Cinsiyetinizi Seçin</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
            </select>
          </div>

          {/* Sadece Kadın seçilirse Gebelik sorusu çıkar */}
          {gender === "Kadın" && (
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                id="pregnant"
                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
              />
              <label htmlFor="pregnant" className="text-pink-700 font-medium cursor-pointer">
                Şu an hamile misiniz?
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 text-gray-600">Kronik Rahatsızlıklar (Varsa)</label>
            <input
              type="text"
              value={chronicDiseases}
              onChange={(e) => setChronicDiseases(e.target.value)}
              className="w-full p-3 border rounded-lg outline-none text-gray-600"
              placeholder="Örn: Diyabet, Tansiyon..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Eklemek İstedikleriniz</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 border rounded-lg outline-none h-24 resize-none text-gray-600"
              placeholder="Örn: Son günlerde çok yorgunum..."
            />
          </div>
        </div>

        {/* SAĞ TARAF: Dosya Yükleme */}
        <div className="space-y-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tahlil Dosyası (Resim/PDF) *</label>

          <div className="relative border-2 border-dashed border-blue-300 rounded-xl p-6 hover:bg-blue-50 transition text-center cursor-pointer group">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-2 group-hover:scale-110 transition">📂</span>
              <span className="text-blue-600 font-medium">Dosya Seçmek İçin Tıkla</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG veya PDF</span>
            </div>
          </div>

          {/* Önizleme */}
          {preview && (
            <div className="mt-4 border rounded-lg p-2 bg-gray-50">
              <p className="text-xs text-center text-gray-500 mb-2">Seçilen Resim</p>
              <img src={preview} alt="Preview" className="h-40 mx-auto object-contain" />
            </div>
          )}

          {/* PDF İkonu */}
          {!preview && selectedFile && fileType === "application/pdf" && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
              <span className="text-3xl">📄</span>
              <div className="overflow-hidden">
                <p className="text-red-700 font-bold truncate">{selectedFile.name}</p>
                <p className="text-xs text-red-500">PDF Analize Hazır</p>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || !age || loading}
            className={`w-full py-4 mt-4 rounded-xl font-bold text-white text-lg shadow-lg transition transform hover:scale-[1.02] 
              ${!selectedFile || !age || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"}`}
          >
            {loading ? "⌛ Analiz Yapılıyor..." : "🚀 Sonuçları Yorumla"}
          </button>
        </div>
      </div>

      {/* SONUÇ ALANI */}
      {result && (
        <div className="mt-10 p-8 bg-green-50 rounded-2xl border border-green-200 shadow-sm animate-fade-in">
          <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
            ✅ VitalSense Raporu
          </h3>
          <div className="prose prose-blue max-w-none text-gray-800 whitespace-pre-line leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}