"use client";

import { useState, useEffect } from "react";
import { saveSiteSettings } from "../actions";

export default function PersonalizarForm({ initialHome, initialFaqs }: { initialHome: any, initialFaqs: any[] }) {
  const [activeTab, setActiveTab] = useState("HOME");
  const [isSaving, setIsSaving] = useState(false);

  // Estados de UI
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  // Estados dos Formulários
  const [homeData, setHomeData] = useState(initialHome);
  const [faqs, setFaqs] = useState(initialFaqs);

  // Controle das imagens: Hero
  const [heroImageMethod, setHeroImageMethod] = useState<"KEEP" | "FILE" | "URL">("KEEP");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroFilePreview, setHeroFilePreview] = useState<string | null>(null);

  // Controle das imagens: About
  const [aboutImageMethod, setAboutImageMethod] = useState<"KEEP" | "FILE" | "URL">("KEEP");
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [aboutImageUrl, setAboutImageUrl] = useState("");
  const [aboutFilePreview, setAboutFilePreview] = useState<string | null>(null);

  // Previews
  useEffect(() => {
    if (!heroImageFile) { setHeroFilePreview(null); return; }
    const objectUrl = URL.createObjectURL(heroImageFile);
    setHeroFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [heroImageFile]);

  useEffect(() => {
    if (!aboutImageFile) { setAboutFilePreview(null); return; }
    const objectUrl = URL.createObjectURL(aboutImageFile);
    setAboutFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [aboutImageFile]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDiscard = () => {
    setHomeData(initialHome);
    setFaqs(initialFaqs);
    setHeroImageMethod("KEEP");
    setHeroImageFile(null);
    setHeroImageUrl("");
    setAboutImageMethod("KEEP");
    setAboutImageFile(null);
    setAboutImageUrl("");
    setShowConfirmDiscard(false);
    showToast("Alterações descartadas com sucesso.", "success");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append("heroTitle", homeData.heroTitle || "");
    formData.append("heroShortText", homeData.heroShortText || "");
    formData.append("aboutText", homeData.aboutText || "");
    formData.append("impactedYouthCount", (homeData.impactedYouthCount || 0).toString());

    const finalHeroMethod = (!homeData.heroImage && heroImageMethod === "KEEP") ? "FILE" : heroImageMethod;
    formData.append("heroImageMethod", finalHeroMethod);
    if (heroImageFile) formData.append("heroImageFile", heroImageFile);
    if (heroImageUrl) formData.append("heroImageUrl", heroImageUrl);

    const finalAboutMethod = (!homeData.aboutImage && aboutImageMethod === "KEEP") ? "FILE" : aboutImageMethod;
    formData.append("aboutImageMethod", finalAboutMethod);
    if (aboutImageFile) formData.append("aboutImageFile", aboutImageFile);
    if (aboutImageUrl) formData.append("aboutImageUrl", aboutImageUrl);

    formData.append("faqs", JSON.stringify(faqs));

    try {
      await saveSiteSettings(formData);
      showToast("Configurações atualizadas com sucesso!", "success");
      setHeroImageMethod("KEEP"); 
      setAboutImageMethod("KEEP"); 
      setHeroImageFile(null);
      setAboutImageFile(null);
      setHeroImageUrl("");
      setAboutImageUrl("");
    } catch (err) {
      showToast("Erro ao salvar as configurações.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  const addFaq = () => setFaqs([...faqs, { question: "", answer: "", isActive: true }]);
  const updateFaq = (index: number, field: string, value: any) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFaqs(newFaqs);
  };
  const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index));

  const showHeroUpload = !homeData.heroImage || heroImageMethod !== "KEEP";
  const activeHeroMethod = showHeroUpload && heroImageMethod === "KEEP" ? "FILE" : heroImageMethod;
  const newHeroPreview = activeHeroMethod === "FILE" ? heroFilePreview : activeHeroMethod === "URL" && heroImageUrl ? heroImageUrl : null;

  const showAboutUpload = !homeData.aboutImage || aboutImageMethod !== "KEEP";
  const activeAboutMethod = showAboutUpload && aboutImageMethod === "KEEP" ? "FILE" : aboutImageMethod;
  const newAboutPreview = activeAboutMethod === "FILE" ? aboutFilePreview : activeAboutMethod === "URL" && aboutImageUrl ? aboutImageUrl : null;

  const tabs = [
    { id: "HOME", label: "Página Inicial", icon: "fa-solid fa-house" },
    { id: "FAQ", label: "Dúvidas Frequentes", icon: "fa-solid fa-circle-question" },
    { id: "INSTITUCIONAL", label: "Institucional", icon: "fa-solid fa-building" }
  ];

  return (
    <>
      {/* Removido o 'items-start' daqui para garantir que no mobile o conteúdo ocupe 100% da largura naturalmente */}
      <form 
        onSubmit={handleSubmit} 
        className="flex flex-col lg:flex-row w-full bg-white rounded-3xl shadow-sm border border-gray-200 lg:h-[calc(100vh-8rem)] lg:overflow-hidden relative"
      >
        
        {/* MENU MOBILE */}
        <div className="lg:hidden w-full bg-gray-50 border-b border-gray-200 p-4 shrink-0">
          <label htmlFor="mobile-tab-select" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Editando a Seção:</label>
          <div className="relative">
            <select
              id="mobile-tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 text-gray-800 font-bold py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green shadow-sm"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <i className="fa-solid fa-chevron-down text-sm"></i>
            </div>
          </div>
        </div>

        {/* SIDEBAR DESKTOP - FIXA NA ESQUERDA */}
        <div className="hidden lg:flex w-72 bg-gray-50 border-r border-gray-200 flex-col shrink-0 h-full">
          <div className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
            Seções do Site
          </div>
          
          <div className="flex flex-col p-4 gap-2 overflow-y-auto custom-scrollbar flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id} type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm text-left ${
                  activeTab === tab.id 
                    ? 'bg-scout-green/10 text-scout-green shadow-sm border border-scout-green/20' 
                    : 'text-gray-600 hover:bg-gray-200/50 border border-transparent'
                }`}
              >
                <i className={`${tab.icon} ${activeTab === tab.id ? 'text-scout-green' : 'text-gray-400'} w-5 text-center`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Botões de Ação fixos na base da Sidebar */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button type="submit" disabled={isSaving} className="w-full mb-3 px-4 py-3 bg-scout-green hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
              {isSaving ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
              ) : (
                <><i className="fa-solid fa-floppy-disk"></i> Salvar Tudo</>
              )}
            </button>
            <button type="button" onClick={() => setShowConfirmDiscard(true)} disabled={isSaving} className="w-full px-4 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-sm text-center">
              Descartar
            </button>
          </div>
        </div>

        {/* ÁREA DE EDIÇÃO - Adicionado w-full e overflow-x-hidden para evitar qualquer scroll horizontal acidental */}
        <div className="flex-1 flex flex-col min-w-0 bg-white w-full h-full lg:overflow-y-auto overflow-x-hidden custom-scrollbar relative">
          
          {/* Header do formulário fixo ao topo enquanto rola */}
          <div className="px-5 md:px-10 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 hidden lg:block">
              <h2 className="font-heading text-2xl font-bold text-gray-800">
               {activeTab === "HOME" ? "Conteúdo da Página Inicial" : activeTab === "FAQ" ? "Gerenciar Dúvidas (FAQ)" : "Página Institucional"}
            </h2>
          </div>

          <div className="p-5 sm:p-6 md:p-10">
            
            {/* TAB: PÁGINA INICIAL */}
            <div className={`max-w-4xl space-y-12 ${activeTab === "HOME" ? "block animate-fade-in" : "hidden"}`}>
              
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                  <i className="fa-solid fa-desktop text-gray-400 text-lg"></i>
                  <h3 className="text-base font-bold text-gray-700 uppercase tracking-widest">Hero Section (Topo)</h3>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Título Principal</label>
                  <input type="text" value={homeData.heroTitle || ""} onChange={e => setHomeData({...homeData, heroTitle: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Subtítulo</label>
                  <textarea rows={2} value={homeData.heroShortText || ""} onChange={e => setHomeData({...homeData, heroShortText: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all custom-scrollbar" />
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
                  <textarea rows={4} value={homeData.aboutText || ""} onChange={e => setHomeData({...homeData, aboutText: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all custom-scrollbar" />
                </div>

                <div className="space-y-1.5 md:w-1/2 lg:w-1/3">
                  <label className="block text-sm font-bold text-gray-700">Jovens Impactados</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fa-solid fa-arrow-trend-up text-gray-400"></i>
                    </div>
                    <input type="number" value={homeData.impactedYouthCount || 0} onChange={e => setHomeData({...homeData, impactedYouthCount: parseInt(e.target.value) || 0})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green transition-all" />
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
                          <button type="button" onClick={() => {setAboutImageMethod("KEEP"); setAboutImageFile(null); setAboutImageUrl("")}} className="text-xs text-gray-500 hover:text-red-500 font-bold cursor-pointer transition-colors flex items-center gap-1"><i className="fa-solid fa-xmark"></i> Cancelar Substituição</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* TAB: FAQ */}
            <div className={`max-w-4xl space-y-6 ${activeTab === "FAQ" ? "block animate-fade-in" : "hidden"}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <p className="text-gray-500 text-sm">Organize as dúvidas mais comuns dos pais e visitantes.</p>
                <button type="button" onClick={addFaq} className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-blue-100 shadow-sm">
                  <i className="fa-solid fa-plus"></i> Adicionar Pergunta
                </button>
              </div>

              {faqs.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <i className="fa-solid fa-comments text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500 font-bold">Nenhuma dúvida cadastrada ainda.</p>
                </div>
              )}

              {faqs.map((faq, index) => (
                <div key={index} className={`p-4 md:p-6 rounded-2xl border transition-colors shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 relative ${faq.isActive ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-100/50 opacity-70'}`}>
                  <div className="hidden md:flex w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shrink-0">
                    <span className="text-gray-400 font-black text-lg">{index + 1}</span>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 pointer-events-none">
                          <i className="fa-solid fa-circle-question text-scout-yellow"></i>
                        </div>
                        <input type="text" placeholder="Pergunta..." value={faq.question || ""} onChange={e => updateFaq(index, "question", e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-scout-green/20" />
                      </div>
                    </div>
                    <div className="relative">
                      <textarea rows={3} placeholder="Resposta..." value={faq.answer || ""} onChange={e => updateFaq(index, "answer", e.target.value)} className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-scout-green/20 custom-scrollbar" />
                    </div>
                  </div>

                  {/* Restauração da formatação do Mobile para os botões do FAQ */}
                  <div className="flex flex-row md:flex-col items-center justify-between gap-4 mt-2 pt-4 border-t border-gray-100 md:mt-0 md:pt-0 md:border-t-0 md:border-l md:border-gray-200 md:pl-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={faq.isActive} onChange={e => updateFaq(index, "isActive", e.target.checked)} className="w-5 h-5 text-scout-green rounded border-gray-300 cursor-pointer focus:ring-scout-green transition-colors" />
                      <span className="text-xs font-bold text-gray-500 uppercase group-hover:text-gray-800 transition-colors">Visível</span>
                    </label>
                    <button type="button" onClick={() => removeFaq(index)} className="text-sm md:text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 md:px-3 py-2 md:py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
                      <i className="fa-solid fa-trash"></i> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* TAB: INSTITUCIONAL */}
            <div className={`${activeTab === "INSTITUCIONAL" ? "block animate-fade-in text-center py-20 lg:py-32" : "hidden"}`}>
              <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <i className="fa-solid fa-person-digging text-3xl text-gray-400"></i>
              </div>
              <h3 className="font-heading text-2xl font-bold text-gray-700">Página Institucional</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">Esta seção será liberada em breve.</p>
            </div>

            {/* BOTÕES DE AÇÃO MOBILE */}
            <div className="lg:hidden mt-10 pt-6 border-t border-gray-200 flex flex-col gap-3">
              <button type="submit" disabled={isSaving} className="w-full px-6 py-4 bg-scout-green hover:bg-green-700 text-white font-bold text-base rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {isSaving ? (
                  <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
                ) : (
                  <><i className="fa-solid fa-floppy-disk"></i> Salvar Configurações</>
                )}
              </button>
              <button type="button" onClick={() => setShowConfirmDiscard(true)} disabled={isSaving} className="w-full px-6 py-3 text-gray-600 font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                Descartar Alterações
              </button>
            </div>

          </div>
        </div>

      </form>

      {/* MODAL DE CONFIRMAÇÃO */}
      {showConfirmDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
              <i className="fa-solid fa-rotate-left text-2xl"></i>
            </div>
            <h3 className="font-heading font-bold text-gray-800 text-xl mb-2">Descartar Alterações?</h3>
            <p className="text-gray-500 text-sm mb-8">Você perderá todo o texto digitado e as novas imagens selecionadas. Esta ação não pode ser desfeita.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowConfirmDiscard(false)} className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Continuar Editando</button>
              <button onClick={handleDiscard} className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors shadow-md">Sim, Descartar</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION - Ajustado para mobile (não colar no canto da tela) */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${toast.type === "success" ? "bg-scout-green text-white border-green-800" : "bg-red-600 text-white border-red-800"}`}>
             <i className={`fa-solid text-lg ${toast.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
            <p className="font-bold text-sm flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 pl-2 border-l border-white/20 transition-opacity"><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      )}
    </>
  );
}