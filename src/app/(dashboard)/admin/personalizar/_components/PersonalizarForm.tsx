"use client";

import { useState, useEffect } from "react";
import { saveSiteSettings } from "../actions";
import HomeTab from "./tabs/HomeTab";
import FaqTab from "./tabs/FaqTab";
import InstitucionalTab from "./tabs/InstitucionalTab";

export default function PersonalizarForm({ 
  initialHome, 
  initialFaqs, 
  initialInst 
}: { 
  initialHome: any, 
  initialFaqs: any[], 
  initialInst: any 
}) {
  const [activeTab, setActiveTab] = useState("HOME");
  const [isSaving, setIsSaving] = useState(false);

  // Estados de UI
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  // Estados dos Formulários
  const [homeData, setHomeData] = useState(initialHome);
  const [faqs, setFaqs] = useState(initialFaqs);
  const [instData, setInstData] = useState(initialInst);

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

  // Controle das imagens: História (Institucional)
  const [historyImageMethod, setHistoryImageMethod] = useState<"KEEP" | "FILE" | "URL">("KEEP");
  const [historyImageFile, setHistoryImageFile] = useState<File | null>(null);
  const [historyImageUrl, setHistoryImageUrl] = useState("");
  const [historyFilePreview, setHistoryFilePreview] = useState<string | null>(null);

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

  useEffect(() => {
    if (!historyImageFile) { setHistoryFilePreview(null); return; }
    const objectUrl = URL.createObjectURL(historyImageFile);
    setHistoryFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [historyImageFile]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDiscard = () => {
    setHomeData(initialHome);
    setFaqs(initialFaqs);
    setInstData(initialInst);
    
    setHeroImageMethod("KEEP");
    setHeroImageFile(null);
    setHeroImageUrl("");
    
    setAboutImageMethod("KEEP");
    setAboutImageFile(null);
    setAboutImageUrl("");
    
    setHistoryImageMethod("KEEP");
    setHistoryImageFile(null);
    setHistoryImageUrl("");
    
    setShowConfirmDiscard(false);
    showToast("Alterações descartadas com sucesso.", "success");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    
    // --- Dados Home ---
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

    // --- Dados FAQs ---
    formData.append("faqs", JSON.stringify(faqs));

    // --- Dados Institucionais ---
    formData.append("historyBadgeYear", instData.historyBadgeYear || "");
    formData.append("historyBadgeLabel", instData.historyBadgeLabel || "");
    formData.append("historySubtitle", instData.historySubtitle || "");
    formData.append("historyTitle", instData.historyTitle || "");
    formData.append("compassTitle", instData.compassTitle || "");
    formData.append("compassSubtitle", instData.compassSubtitle || "");
    formData.append("missionText", instData.missionText || "");
    formData.append("visionText", instData.visionText || "");

    const finalHistoryMethod = (!instData.historyImage && historyImageMethod === "KEEP") ? "FILE" : historyImageMethod;
    formData.append("historyImageMethod", finalHistoryMethod);
    if (historyImageFile) formData.append("historyImageFile", historyImageFile);
    if (historyImageUrl) formData.append("historyImageUrl", historyImageUrl);

    formData.append("stats", JSON.stringify(instData.stats || []));
    formData.append("historyParagraphs", JSON.stringify(instData.historyParagraphs || []));
    formData.append("valuesList", JSON.stringify(instData.valuesList || []));
    formData.append("boardMembers", JSON.stringify(instData.boardMembers || []));
    formData.append("testimonials", JSON.stringify(instData.testimonials || []));

    try {
      await saveSiteSettings(formData);
      showToast("Configurações atualizadas com sucesso!", "success");
      setHeroImageMethod("KEEP"); 
      setAboutImageMethod("KEEP"); 
      setHistoryImageMethod("KEEP");
      setHeroImageFile(null);
      setAboutImageFile(null);
      setHistoryImageFile(null);
      setHeroImageUrl("");
      setAboutImageUrl("");
      setHistoryImageUrl("");
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

  const tabs = [
    { id: "HOME", label: "Página Inicial", icon: "fa-solid fa-house" },
    { id: "FAQ", label: "Dúvidas Frequentes", icon: "fa-solid fa-circle-question" },
    { id: "INSTITUCIONAL", label: "Institucional", icon: "fa-solid fa-building" }
  ];

  return (
    <>
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

        {/* ÁREA DE EDIÇÃO */}
        <div className="flex-1 flex flex-col min-w-0 bg-white w-full h-full lg:overflow-y-auto overflow-x-hidden custom-scrollbar relative">
          
          {/* Header do formulário fixo ao topo enquanto rola */}
          <div className="px-5 md:px-10 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 hidden lg:block">
              <h2 className="font-heading text-2xl font-bold text-gray-800">
               {activeTab === "HOME" ? "Conteúdo da Página Inicial" : activeTab === "FAQ" ? "Gerenciar Dúvidas (FAQ)" : "Página Institucional"}
            </h2>
          </div>

          <div className="p-5 sm:p-6 md:p-10">
            
            <HomeTab 
              isActive={activeTab === "HOME"}
              homeData={homeData}
              setHomeData={setHomeData}
              heroImageMethod={heroImageMethod}
              setHeroImageMethod={setHeroImageMethod}
              heroImageFile={heroImageFile}
              setHeroImageFile={setHeroImageFile}
              heroImageUrl={heroImageUrl}
              setHeroImageUrl={setHeroImageUrl}
              heroFilePreview={heroFilePreview}
              aboutImageMethod={aboutImageMethod}
              setAboutImageMethod={setAboutImageMethod}
              aboutImageFile={aboutImageFile}
              setAboutImageFile={setAboutImageFile}
              aboutImageUrl={aboutImageUrl}
              setAboutImageUrl={setAboutImageUrl}
              aboutFilePreview={aboutFilePreview}
            />

            <FaqTab 
              isActive={activeTab === "FAQ"}
              faqs={faqs}
              addFaq={addFaq}
              updateFaq={updateFaq}
              removeFaq={removeFaq}
            />

            <InstitucionalTab 
              isActive={activeTab === "INSTITUCIONAL"}
              instData={instData}
              setInstData={setInstData}
              historyImageMethod={historyImageMethod}
              setHistoryImageMethod={setHistoryImageMethod}
              historyImageFile={historyImageFile}
              setHistoryImageFile={setHistoryImageFile}
              historyImageUrl={historyImageUrl}
              setHistoryImageUrl={setHistoryImageUrl}
              historyFilePreview={historyFilePreview}
            />

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

      {/* TOAST NOTIFICATION */}
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