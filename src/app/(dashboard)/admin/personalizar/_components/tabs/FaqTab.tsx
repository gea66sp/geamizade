"use client";

import React from "react";

interface FaqTabProps {
  isActive: boolean;
  faqs: any[];
  addFaq: () => void;
  updateFaq: (index: number, field: string, value: any) => void;
  removeFaq: (index: number) => void;
}

export default function FaqTab({ isActive, faqs, addFaq, updateFaq, removeFaq }: FaqTabProps) {
  return (
    <div className={`max-w-4xl space-y-6 ${isActive ? "block animate-fade-in" : "hidden"}`}>
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
  );
}