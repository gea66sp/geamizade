"use client";

import { useState } from "react";
import { dischargeInventoryItem } from "../actions";

export default function DischargeModal({ isOpen, onClose, item }: { isOpen: boolean, onClose: () => void, item: any }) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !item) return null;

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      return setError("A justificativa deve ser detalhada (mínimo 10 caracteres).");
    }
    
    setIsLoading(true);
    setError("");
    
    const result = await dischargeInventoryItem(item.id, reason);
    
    setIsLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else {
      setReason("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        
        {/* ==========================================
            CABEÇALHO DO MODAL (ESTILO ALERTA)
        ========================================== */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-red-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-red-100 text-red-600">
              <i className="fa-solid fa-triangle-exclamation text-2xl animate-pulse"></i>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-red-900 leading-tight">
                Dar Baixa no Material
              </h2>
              <p className="text-red-700/70 text-xs font-semibold mt-0.5 uppercase tracking-widest">Ação Irreversível</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer shadow-sm border border-gray-200"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleDischarge} className="p-6 space-y-5">
          
          {/* Resumo do Material a ser Baixado */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg font-mono tracking-widest">
              #{item.chargeNumber}
            </div>
            <div className="flex items-center gap-3 pr-12">
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                <i className="fa-solid fa-box"></i>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate">{item.name}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Cat: {item.category}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 bg-red-50/50 p-4 rounded-xl border border-red-100">
            <strong>Atenção:</strong> Esta ação removerá o item permanentemente do estoque ativo do Grupo Escoteiro. A justificativa inserida abaixo fará parte do relatório de auditoria do almoxarifado.
          </p>

          {/* Área de Erro (Animada) */}
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in-up border border-red-200 shadow-sm">
              <i className="fa-solid fa-circle-exclamation text-lg"></i> {error}
            </div>
          )}

          {/* Campo Justificativa */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Justificativa do Descarte / Destino <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute top-3.5 left-4 pointer-events-none">
                <i className="fa-solid fa-comment-dots text-gray-400"></i>
              </div>
              <textarea 
                required 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-red-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-gray-800 custom-scrollbar resize-none h-32 font-medium" 
                placeholder="Detalhe o que aconteceu com o material. Ex: A barraca rasgou no Acampamento Regional e o conserto ficou inviável." 
              />
            </div>
          </div>

          {/* Rodapé com Botões */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full sm:w-auto px-6 py-3 text-sm text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full sm:w-auto px-6 py-3 text-sm bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-95"
            >
              {isLoading ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Processando...</>
              ) : (
                <><i className="fa-solid fa-trash"></i> Confirmar Baixa</>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}