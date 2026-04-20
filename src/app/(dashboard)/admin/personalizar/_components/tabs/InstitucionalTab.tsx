"use client";

import React from "react";

interface InstitucionalTabProps {
  isActive: boolean;
  instData: any;
  setInstData: (data: any) => void;
  historyImageMethod: "KEEP" | "FILE" | "URL";
  setHistoryImageMethod: (method: "KEEP" | "FILE" | "URL") => void;
  historyImageFile: File | null;
  setHistoryImageFile: (file: File | null) => void;
  historyImageUrl: string;
  setHistoryImageUrl: (url: string) => void;
  historyFilePreview: string | null;
}

export default function InstitucionalTab({
  isActive,
  instData,
  setInstData,
  historyImageMethod,
  setHistoryImageMethod,
  historyImageFile,
  setHistoryImageFile,
  historyImageUrl,
  setHistoryImageUrl,
  historyFilePreview,
}: InstitucionalTabProps) {
  
  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  const handleArrayObjAdd = (field: string, defaultObj: any) => {
    setInstData({ ...instData, [field]: [...(instData[field] || []), defaultObj] });
  };
  const handleArrayObjUpdate = (field: string, index: number, prop: string, value: any) => {
    const newArr = [...(instData[field] || [])];
    newArr[index] = { ...newArr[index], [prop]: value };
    setInstData({ ...instData, [field]: newArr });
  };
  const handleArrayObjRemove = (field: string, index: number) => {
    const newArr = [...(instData[field] || [])];
    newArr.splice(index, 1);
    setInstData({ ...instData, [field]: newArr });
  };

  const handleArrayStringAdd = (field: string) => {
    setInstData({ ...instData, [field]: [...(instData[field] || []), ""] });
  };
  const handleArrayStringUpdate = (field: string, index: number, value: string) => {
    const newArr = [...(instData[field] || [])];
    newArr[index] = value;
    setInstData({ ...instData, [field]: newArr });
  };
  const handleArrayStringRemove = (field: string, index: number) => {
    const newArr = [...(instData[field] || [])];
    newArr.splice(index, 1);
    setInstData({ ...instData, [field]: newArr });
  };

  const showHistoryUpload = !instData?.historyImage || historyImageMethod !== "KEEP";
  const activeHistoryMethod = showHistoryUpload && historyImageMethod === "KEEP" ? "FILE" : historyImageMethod;
  const newHistoryPreview = activeHistoryMethod === "FILE" ? historyFilePreview : activeHistoryMethod === "URL" && historyImageUrl ? historyImageUrl : null;

  const stats = instData?.stats || [];
  const historyParagraphs = instData?.historyParagraphs || [];
  const valuesList = instData?.valuesList || [];
  const boardMembers = instData?.boardMembers || [];
  const testimonials = instData?.testimonials || [];

  return (
    <div className={`max-w-4xl space-y-12 pb-8 ${isActive ? "block animate-fade-in" : "hidden"}`}>
      
      {/* ==========================================
          1. ESTATÍSTICAS
      ========================================== */}
      <section className="space-y-5 bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <i className="fa-solid fa-chart-line text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Estatísticas</h3>
              <p className="text-xs text-gray-500 font-medium">Números de impacto do grupo</p>
            </div>
          </div>
          <button type="button" onClick={() => handleArrayObjAdd("stats", { value: "", label: "" })} className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95">
            <i className="fa-solid fa-plus"></i> Adicionar Dado
          </button>
        </div>

        {stats.length === 0 && (
          <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-bold text-gray-500">Nenhuma estatística cadastrada.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stats.map((stat: any, index: number) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-200 relative group">
              <input type="text" placeholder="Valor (Ex: 25)" value={stat.value} onChange={e => handleArrayObjUpdate("stats", index, "value", e.target.value)} className="w-full sm:w-1/3 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green focus:outline-none transition-all" />
              <input type="text" placeholder="Rótulo (Ex: Anos de História)" value={stat.label} onChange={e => handleArrayObjUpdate("stats", index, "label", e.target.value)} className="w-full sm:flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-800 focus:bg-white focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green focus:outline-none transition-all" />
              <button type="button" onClick={() => handleArrayObjRemove("stats", index)} className="sm:absolute sm:-top-2 sm:-right-2 w-full sm:w-8 h-10 sm:h-8 flex items-center justify-center bg-red-50 sm:bg-white text-red-500 sm:border border-gray-200 hover:border-red-200 hover:bg-red-50 sm:rounded-full rounded-xl transition-colors sm:opacity-0 group-hover:opacity-100 shadow-sm mt-1 sm:mt-0">
                <i className="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          2. NOSSA HISTÓRIA
      ========================================== */}
      <section className="space-y-6 bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
            <i className="fa-solid fa-book-open text-lg"></i>
          </div>
          <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Nossa História</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Selo: Ano (Ex: 1998)</label>
            <input type="text" placeholder="1998" value={instData?.historyBadgeYear || ""} onChange={e => setInstData({...instData, historyBadgeYear: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Selo: Rótulo (Ex: Fundação)</label>
            <input type="text" placeholder="Fundação" value={instData?.historyBadgeLabel || ""} onChange={e => setInstData({...instData, historyBadgeLabel: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Subtítulo do Bloco</label>
            <input type="text" placeholder="Ex: Nossas Raízes" value={instData?.historySubtitle || ""} onChange={e => setInstData({...instData, historySubtitle: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Título Principal</label>
            <input type="text" placeholder="Ex: Como tudo começou..." value={instData?.historyTitle || ""} onChange={e => setInstData({...instData, historyTitle: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-lg text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all" />
          </div>
        </div>

        {/* Parágrafos da História */}
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <label className="block text-sm font-bold text-gray-800">Parágrafos da História</label>
            <button type="button" onClick={() => handleArrayStringAdd("historyParagraphs")} className="w-full sm:w-auto px-4 py-2 bg-scout-green/10 text-scout-green font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-scout-green hover:text-white transition-colors flex items-center justify-center gap-2">
              <i className="fa-solid fa-plus"></i> Novo Parágrafo
            </button>
          </div>
          
          {historyParagraphs.length === 0 && (
            <div className="py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-500">Nenhum texto adicionado.</p>
            </div>
          )}

          <div className="space-y-3">
            {historyParagraphs.map((text: string, index: number) => (
              <div key={index} className="flex gap-3 items-start bg-gray-50/50 p-2 pl-3 rounded-2xl border border-gray-200">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-2">
                  <span className="text-[10px] font-black text-gray-500">{index + 1}</span>
                </div>
                <textarea rows={3} value={text} onChange={e => handleArrayStringUpdate("historyParagraphs", index, e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 bg-transparent hover:bg-white text-sm text-gray-700 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all custom-scrollbar" placeholder="Digite o parágrafo..." />
                <button type="button" onClick={() => handleArrayStringRemove("historyParagraphs", index)} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1 shrink-0">
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Imagem da História */}
        <div className="p-5 md:p-6 border border-gray-200 rounded-2xl bg-gray-50 space-y-5">
          <label className="block text-sm font-bold text-gray-800">Imagem Fotográfica</label>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {instData?.historyImage && (
              <div className="flex-1 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                <span className="absolute top-0 left-0 bg-gray-800/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-br-xl z-10">Atual</span>
                <img src={instData.historyImage} alt="Atual" className="w-full h-32 md:h-40 object-cover rounded-xl border border-gray-100" />
              </div>
            )}
            {newHistoryPreview && (
              <div className="flex-1 bg-scout-green/5 p-3 rounded-2xl border border-scout-green/30 shadow-sm relative overflow-hidden animate-fade-in">
                <span className="absolute top-0 left-0 bg-scout-green text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-br-xl z-10"><i className="fa-solid fa-star mr-1"></i> Nova</span>
                <img src={newHistoryPreview} alt="Nova" className="w-full h-32 md:h-40 object-cover rounded-xl border border-scout-green/20" />
              </div>
            )}
          </div>

          {!showHistoryUpload ? (
            <button type="button" onClick={() => setHistoryImageMethod("FILE")} className="w-full sm:w-auto px-5 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
              <i className="fa-solid fa-image text-gray-400"></i> Trocar Imagem
            </button>
          ) : (
            <div className="space-y-5 bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer font-bold text-sm py-2.5 rounded-lg transition-all ${activeHistoryMethod === "FILE" ? "bg-white text-scout-green shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                  <input type="radio" checked={activeHistoryMethod === "FILE"} onChange={() => setHistoryImageMethod("FILE")} className="hidden" /> 
                  <i className="fa-solid fa-upload"></i> Upload
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer font-bold text-sm py-2.5 rounded-lg transition-all ${activeHistoryMethod === "URL" ? "bg-white text-scout-green shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                  <input type="radio" checked={activeHistoryMethod === "URL"} onChange={() => setHistoryImageMethod("URL")} className="hidden" /> 
                  <i className="fa-solid fa-link"></i> Link Externo
                </label>
              </div>

              {activeHistoryMethod === "FILE" ? (
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 hover:border-scout-green/50 transition-colors">
                  <input type="file" accept="image/*" onChange={e => setHistoryImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-300 mb-3"></i>
                  <p className="text-sm font-bold text-gray-700">Selecione uma imagem</p>
                  {historyImageFile && <p className="text-xs font-bold text-scout-green mt-3 bg-scout-green/10 inline-block px-3 py-1 rounded-full"><i className="fa-solid fa-check mr-1"></i> {historyImageFile.name}</p>}
                </div>
              ) : (
                <input type="url" value={historyImageUrl} onChange={e => setHistoryImageUrl(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all" placeholder="https://..." />
              )}
              {instData?.historyImage && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button type="button" onClick={() => { setHistoryImageMethod("KEEP"); setHistoryImageFile(null); setHistoryImageUrl("") }} className="text-xs text-gray-500 hover:text-red-500 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"><i className="fa-solid fa-xmark"></i> Cancelar Troca</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          3. NOSSA BÚSSOLA (Essência)
      ========================================== */}
      <section className="space-y-6 bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
            <i className="fa-solid fa-compass text-lg"></i>
          </div>
          <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Nossa Essência</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Título da Seção</label>
            <input type="text" placeholder="Ex: Nossa Bússola" value={instData?.compassTitle || ""} onChange={e => setInstData({...instData, compassTitle: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-lg text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Subtítulo</label>
            <input type="text" placeholder="Ex: Os princípios que nos norteiam" value={instData?.compassSubtitle || ""} onChange={e => setInstData({...instData, compassSubtitle: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/10 focus:border-scout-green transition-all" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-blue-500 uppercase tracking-wider items-center gap-2"><i className="fa-solid fa-bullseye"></i> Missão</label>
            <textarea rows={3} value={instData?.missionText || ""} onChange={e => setInstData({...instData, missionText: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/30 text-gray-800 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all custom-scrollbar" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider items-center gap-2"><i className="fa-solid fa-eye"></i> Visão</label>
            <textarea rows={3} value={instData?.visionText || ""} onChange={e => setInstData({...instData, visionText: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-amber-100 bg-amber-50/30 text-gray-800 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all custom-scrollbar" />
          </div>
        </div>

        {/* Valores */}
        <div className="p-5 border border-green-100 rounded-2xl bg-green-50/30 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <label className="block text-xs font-bold text-scout-green uppercase tracking-wider items-center gap-2"><i className="fa-solid fa-gem"></i> Nossos Valores</label>
            <button type="button" onClick={() => handleArrayStringAdd("valuesList")} className="w-full sm:w-auto px-4 py-2.5 bg-white border border-green-200 text-scout-green font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <i className="fa-solid fa-plus"></i> Adicionar Valor
            </button>
          </div>
          
          {valuesList.length === 0 && <p className="text-sm text-gray-500 italic py-2 text-center">Nenhum valor adicionado.</p>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {valuesList.map((val: string, index: number) => (
              <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-green-100 shadow-sm focus-within:ring-2 focus-within:ring-scout-green/20 focus-within:border-scout-green transition-all">
                <i className="fa-solid fa-check text-scout-green ml-3 opacity-50"></i>
                <input type="text" placeholder="Ex: Lealdade" value={val} onChange={e => handleArrayStringUpdate("valuesList", index, e.target.value)} className="flex-1 px-2 py-2 bg-transparent text-sm font-semibold text-gray-800 focus:outline-none" />
                <button type="button" onClick={() => handleArrayStringRemove("valuesList", index)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-1">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          4. DIRETORIA (Board Members)
      ========================================== */}
      <section className="space-y-5 bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <i className="fa-solid fa-users-tie text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Diretoria</h3>
              <p className="text-xs text-gray-500 font-medium">Equipe de liderança do grupo</p>
            </div>
          </div>
          <button type="button" onClick={() => handleArrayObjAdd("boardMembers", { name: "", role: "", bio: "", imageUrl: "" })} className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95">
            <i className="fa-solid fa-plus"></i> Adicionar Membro
          </button>
        </div>

        {boardMembers.length === 0 && (
          <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-bold text-gray-500">Nenhum membro cadastrado.</p>
          </div>
        )}

        <div className="space-y-6 pt-2">
          {boardMembers.map((member: any, index: number) => (
            <div key={index} className="p-5 md:p-6 bg-gray-50/50 border border-gray-200 rounded-3xl relative shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 group">
              
              {/* Lado Esquerdo: Imagem e URL */}
              <div className="w-full md:w-32 flex flex-col gap-3 shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto md:mx-0 bg-white rounded-full overflow-hidden border-4 border-white shadow-sm relative group-hover:border-scout-green/20 transition-colors">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fa-solid fa-user text-3xl"></i></div>
                  )}
                </div>
                <div className="text-center md:text-left space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link da Foto</label>
                  <input type="url" placeholder="https://..." value={member.imageUrl} onChange={e => handleArrayObjUpdate("boardMembers", index, "imageUrl", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-xs text-center md:text-left transition-all" />
                </div>
              </div>

              {/* Lado Direito: Dados Textuais */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                    <input type="text" placeholder="Ex: Ricardo Almeida" value={member.name} onChange={e => handleArrayObjUpdate("boardMembers", index, "name", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-sm font-bold text-gray-800 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo Oficial</label>
                    <input type="text" placeholder="Ex: Diretor Presidente" value={member.role} onChange={e => handleArrayObjUpdate("boardMembers", index, "role", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-sm text-gray-800 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Biografia / Mensagem (Opcional)</label>
                  <textarea rows={2} placeholder="Biografia curta..." value={member.bio} onChange={e => handleArrayObjUpdate("boardMembers", index, "bio", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-sm text-gray-600 custom-scrollbar transition-all" />
                </div>
              </div>

              {/* Botão Remover (Absoluto no Desktop, Relativo no Mobile) */}
              <button type="button" onClick={() => handleArrayObjRemove("boardMembers", index)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-100 hover:border-red-100 rounded-xl transition-colors shadow-sm md:opacity-0 group-hover:opacity-100">
                <i className="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          5. DEPOIMENTOS (Testimonials)
      ========================================== */}
      <section className="space-y-5 bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <i className="fa-solid fa-comments text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Depoimentos</h3>
              <p className="text-xs text-gray-500 font-medium">O que dizem sobre o grupo</p>
            </div>
          </div>
          <button type="button" onClick={() => handleArrayObjAdd("testimonials", { authorName: "", authorRole: "", quote: "", rating: 5 })} className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95">
            <i className="fa-solid fa-plus"></i> Adicionar Depoimento
          </button>
        </div>

        {testimonials.length === 0 && (
          <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-bold text-gray-500">Nenhum depoimento cadastrado.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {testimonials.map((testim: any, index: number) => (
            <div key={index} className="p-5 md:p-6 bg-gray-50/50 border border-gray-200 rounded-3xl shadow-sm space-y-4 relative group hover:border-gray-300 transition-colors">
              
              <div className="space-y-4 pr-10">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome do Autor</label>
                  <input type="text" placeholder="Ex: Ana Paula" value={testim.authorName} onChange={e => handleArrayObjUpdate("testimonials", index, "authorName", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-sm font-bold text-gray-800 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Relação / Papel</label>
                  <input type="text" placeholder="Ex: Mãe de Escoteiro" value={testim.authorRole} onChange={e => handleArrayObjUpdate("testimonials", index, "authorRole", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-sm text-gray-600 transition-all" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mensagem</label>
                <textarea rows={3} placeholder="Texto do depoimento..." value={testim.quote} onChange={e => handleArrayObjUpdate("testimonials", index, "quote", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-sm custom-scrollbar text-gray-600 transition-all" />
              </div>

              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-3">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2"><i className="fa-solid fa-star text-scout-yellow"></i> Nota:</label>
                   <input type="number" min="1" max="5" value={testim.rating} onChange={e => handleArrayObjUpdate("testimonials", index, "rating", parseInt(e.target.value) || 5)} className="w-16 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/10 text-sm text-center font-bold text-gray-800 transition-all" />
                 </div>
              </div>
              
              <button type="button" onClick={() => handleArrayObjRemove("testimonials", index)} className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-100 hover:border-red-100 rounded-xl transition-colors shadow-sm md:opacity-0 group-hover:opacity-100">
                <i className="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}