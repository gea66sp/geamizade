"use client";

import React from "react";

interface HomeTabProps {
  isActive: boolean;
  homeData: any;
  setHomeData: (data: any) => void;
  heroImageMethod: "KEEP" | "FILE" | "URL";
  setHeroImageMethod: (method: "KEEP" | "FILE" | "URL") => void;
  heroImageFile: File | null;
  setHeroImageFile: (file: File | null) => void;
  heroImageUrl: string;
  setHeroImageUrl: (url: string) => void;
  heroFilePreview: string | null;
  aboutImageMethod: "KEEP" | "FILE" | "URL";
  setAboutImageMethod: (method: "KEEP" | "FILE" | "URL") => void;
  aboutImageFile: File | null;
  setAboutImageFile: (file: File | null) => void;
  aboutImageUrl: string;
  setAboutImageUrl: (url: string) => void;
  aboutFilePreview: string | null;
}

export default function HomeTab({
  isActive,
  homeData,
  setHomeData,
  heroImageMethod,
  setHeroImageMethod,
  heroImageFile,
  setHeroImageFile,
  heroImageUrl,
  setHeroImageUrl,
  heroFilePreview,
  aboutImageMethod,
  setAboutImageMethod,
  aboutImageFile,
  setAboutImageFile,
  aboutImageUrl,
  setAboutImageUrl,
  aboutFilePreview,
}: HomeTabProps) {
  const showHeroUpload = !homeData.heroImage || heroImageMethod !== "KEEP";
  const activeHeroMethod = showHeroUpload && heroImageMethod === "KEEP" ? "FILE" : heroImageMethod;
  const newHeroPreview = activeHeroMethod === "FILE" ? heroFilePreview : activeHeroMethod === "URL" && heroImageUrl ? heroImageUrl : null;

  const showAboutUpload = !homeData.aboutImage || aboutImageMethod !== "KEEP";
  const activeAboutMethod = showAboutUpload && aboutImageMethod === "KEEP" ? "FILE" : aboutImageMethod;
  const newAboutPreview = activeAboutMethod === "FILE" ? aboutFilePreview : activeAboutMethod === "URL" && aboutImageUrl ? aboutImageUrl : null;

  return (
    <div className={`max-w-4xl space-y-12 ${isActive ? "block animate-fade-in" : "hidden"}`}>
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
          <i className="fa-solid fa-desktop text-gray-400 text-lg"></i>
          <h3 className="text-base font-bold text-gray-700 uppercase tracking-widest">Hero Section (Topo)</h3>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Título Principal</label>
          <input
            type="text"
            value={homeData.heroTitle || ""}
            onChange={e => setHomeData({ ...homeData, heroTitle: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Subtítulo</label>
          <textarea
            rows={2}
            value={homeData.heroShortText || ""}
            onChange={e => setHomeData({ ...homeData, heroShortText: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all custom-scrollbar"
          />
        </div>

        <div className="p-4 md:p-6 border border-gray-200 rounded-2xl bg-gray-50 space-y-5 shadow-sm">
          <label className="block text-sm font-bold text-gray-800">Imagem de Fundo</label>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {homeData.heroImage && (
              <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative group overflow-hidden">
                <span className="absolute top-0 left-0 bg-gray-800/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 uppercase rounded-br-lg z-10">Atual</span>
                <img src={homeData.heroImage} alt="Atual" className="w-full h-32 md:h-40 object-cover rounded-lg border border-gray-100" />
              </div>
            )}
            {newHeroPreview && (
              <div className="flex-1 bg-scout-green/5 p-3 rounded-xl border border-scout-green/20 shadow-sm animate-fade-in relative overflow-hidden">
                <span className="absolute top-0 left-0 bg-scout-green text-white text-[10px] font-bold px-2 py-1 uppercase rounded-br-lg z-10"><i className="fa-solid fa-star mr-1"></i>Nova</span>
                <img src={newHeroPreview} alt="Nova" className="w-full h-32 md:h-40 object-cover rounded-lg border border-scout-green/20" />
              </div>
            )}
          </div>

          {!showHeroUpload ? (
            <button type="button" onClick={() => setHeroImageMethod("FILE")} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-2 shadow-sm">
              <i className="fa-solid fa-image text-gray-400"></i> Substituir Imagem
            </button>
          ) : (
            <div className="space-y-5 bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-scout-green transition-colors">
                  <input type="radio" checked={activeHeroMethod === "FILE"} onChange={() => setHeroImageMethod("FILE")} className="text-scout-green focus:ring-scout-green cursor-pointer" /> <i className="fa-solid fa-upload text-gray-400 mx-1"></i> Arquivo
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-scout-green transition-colors">
                  <input type="radio" checked={activeHeroMethod === "URL"} onChange={() => setHeroImageMethod("URL")} className="text-scout-green focus:ring-scout-green cursor-pointer" /> <i className="fa-solid fa-link text-gray-400 mx-1"></i> Link Externo
                </label>
              </div>

              {activeHeroMethod === "FILE" ? (
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                  <input type="file" accept="image/*" onChange={e => setHeroImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-2"></i>
                  <p className="text-sm font-bold text-gray-700">Selecione uma imagem</p>
                  {heroImageFile && <p className="text-xs font-bold text-scout-green mt-3"><i className="fa-solid fa-check mr-1"></i> {heroImageFile.name}</p>}
                </div>
              ) : (
                <input type="url" placeholder="https://exemplo.com/imagem.jpg" value={heroImageUrl || ""} onChange={e => setHeroImageUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all" />
              )}

              {homeData.heroImage && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button type="button" onClick={() => { setHeroImageMethod("KEEP"); setHeroImageFile(null); setHeroImageUrl(""); }} className="text-xs text-gray-500 hover:text-red-500 font-bold cursor-pointer transition-colors flex items-center gap-1"><i className="fa-solid fa-xmark"></i> Cancelar Substituição</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
          <i className="fa-solid fa-users text-gray-400 text-lg"></i>
          <h3 className="text-base font-bold text-gray-700 uppercase tracking-widest">Seção "Sobre Nós"</h3>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Texto Institucional (Resumo)</label>
          <textarea
            rows={4}
            value={homeData.aboutText || ""}
            onChange={e => setHomeData({ ...homeData, aboutText: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all custom-scrollbar"
          />
        </div>

        <div className="space-y-1.5 md:w-1/2 lg:w-1/3">
          <label className="block text-sm font-bold text-gray-700">Jovens Impactados</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-arrow-trend-up text-gray-400"></i>
            </div>
            <input
              type="number"
              value={homeData.impactedYouthCount || 0}
              onChange={e => setHomeData({ ...homeData, impactedYouthCount: parseInt(e.target.value) || 0 })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all"
            />
          </div>
        </div>

        {/* Foto About */}
        <div className="p-4 md:p-6 border border-gray-200 rounded-2xl bg-gray-50 space-y-5 shadow-sm">
          <label className="block text-sm font-bold text-gray-800">Foto da Seção Institucional</label>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {homeData.aboutImage && (
              <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <span className="absolute top-0 left-0 bg-gray-800/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 uppercase rounded-br-lg z-10">Atual</span>
                <img src={homeData.aboutImage} alt="Atual" className="w-full h-32 md:h-40 object-cover rounded-lg border border-gray-100" />
              </div>
            )}
            {newAboutPreview && (
              <div className="flex-1 bg-scout-green/5 p-3 rounded-xl border border-scout-green/20 shadow-sm animate-fade-in relative overflow-hidden">
                <span className="absolute top-0 left-0 bg-scout-green text-white text-[10px] font-bold px-2 py-1 uppercase rounded-br-lg z-10"><i className="fa-solid fa-star mr-1"></i>Nova</span>
                <img src={newAboutPreview} alt="Nova" className="w-full h-32 md:h-40 object-cover rounded-lg border border-scout-green/20" />
              </div>
            )}
          </div>

          {!showAboutUpload ? (
            <button type="button" onClick={() => setAboutImageMethod("FILE")} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm">
              <i className="fa-solid fa-image text-gray-400"></i> Substituir Imagem
            </button>
          ) : (
            <div className="space-y-5 bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-scout-green transition-colors">
                  <input type="radio" checked={activeAboutMethod === "FILE"} onChange={() => setAboutImageMethod("FILE")} className="text-scout-green focus:ring-scout-green cursor-pointer" /> <i className="fa-solid fa-upload text-gray-400 mx-1"></i> Arquivo
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-scout-green transition-colors">
                  <input type="radio" checked={activeAboutMethod === "URL"} onChange={() => setAboutImageMethod("URL")} className="text-scout-green focus:ring-scout-green cursor-pointer" /> <i className="fa-solid fa-link text-gray-400 mx-1"></i> Link Externo
                </label>
              </div>

              {activeAboutMethod === "FILE" ? (
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                  <input type="file" accept="image/*" onChange={e => setAboutImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-2"></i>
                  <p className="text-sm font-bold text-gray-700">Selecione uma imagem</p>
                  {aboutImageFile && <p className="text-xs font-bold text-scout-green mt-3"><i className="fa-solid fa-check mr-1"></i> {aboutImageFile.name}</p>}
                </div>
              ) : (
                <input type="url" value={aboutImageUrl} onChange={e => setAboutImageUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20" placeholder="https://..." />
              )}
              {homeData.aboutImage && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button type="button" onClick={() => { setAboutImageMethod("KEEP"); setAboutImageFile(null); setAboutImageUrl("") }} className="text-xs text-gray-500 hover:text-red-500 font-bold cursor-pointer transition-colors flex items-center gap-1"><i className="fa-solid fa-xmark"></i> Cancelar Substituição</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}