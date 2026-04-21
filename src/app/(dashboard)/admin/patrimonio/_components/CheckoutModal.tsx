"use client";

import { useState } from "react";
import { checkoutItem, returnItem } from "../actions";

export default function CheckoutModal({ isOpen, onClose, item, users }: { isOpen: boolean, onClose: () => void, item: any, users: any[] }) {
  const [userId, setUserId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !item) return null;

  // Descobre se tem empréstimo ativo analisando o array loans do item recebido
  const activeLoan = item.loans?.[0]; 

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert("Selecione um responsável");
    setIsLoading(true);

    // CORREÇÃO DO FUSO HORÁRIO:
    // Adicionamos "T12:00:00" para forçar que a data seja salva ao meio-dia.
    // Isso impede que fusos horários negativos (como o do Brasil) joguem a data para o dia anterior.
    let returnDate;
    if (expectedReturn) {
      returnDate = new Date(`${expectedReturn}T12:00:00`);
    }

    await checkoutItem(item.id, userId, returnDate);
    setIsLoading(false);
    onClose();
  };

  const handleReturn = async () => {
    setIsLoading(true);
    await returnItem(item.id);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        
        {/* ==========================================
            CABEÇALHO DO MODAL
        ========================================== */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activeLoan ? 'bg-scout-green/10 text-scout-green' : 'bg-blue-50 text-blue-600'}`}>
              <i className={`fa-solid ${activeLoan ? 'fa-arrow-rotate-left' : 'fa-hand-holding-hand'} text-xl`}></i>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-800 leading-tight">
                {activeLoan ? "Devolução" : "Novo Empréstimo"}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">Registre a movimentação do material.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6">
          
          {/* Resumo do Material */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg font-mono">
              #{item.chargeNumber}
            </div>
            <p className="font-bold text-gray-800 pr-12 leading-tight">{item.name}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">Categoria: {item.category}</p>
            <div className="mt-2 inline-flex items-center justify-center bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">
              Qtd em Estoque: {item.quantity}
            </div>
          </div>

          {/* ==========================================
              FLUXO 1: DEVOLUÇÃO (Material já está emprestado)
          ========================================== */}
          {activeLoan ? (
            <div className="space-y-6">
              <div className="text-center p-5 border border-amber-200 bg-amber-50 rounded-2xl relative">
                <i className="fa-solid fa-user-check text-amber-500/20 text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></i>
                
                <div className="relative z-10">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                    Atualmente com:
                  </p>
                  <p className="text-lg font-black text-amber-900">{activeLoan.user?.name}</p>
                  
                  <div className="mt-4 pt-4 border-t border-amber-200/50 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest">
                      Data de Retirada: <span className="font-medium text-amber-900">{new Date(activeLoan.borrowedAt).toLocaleDateString('pt-BR')}</span>
                    </p>
                    {activeLoan.expectedReturn && (
                      <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest">
                        Prev. Devolução: <span className="font-medium text-amber-900">{new Date(activeLoan.expectedReturn).toLocaleDateString('pt-BR')}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleReturn} 
                disabled={isLoading} 
                className="w-full py-3.5 bg-scout-green text-white rounded-xl font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <><i className="fa-solid fa-circle-notch fa-spin"></i> Processando...</>
                ) : (
                  <><i className="fa-solid fa-check-double"></i> Confirmar Devolução</>
                )}
              </button>
            </div>
          ) : (
            
            /* ==========================================
               FLUXO 2: NOVO EMPRÉSTIMO
            ========================================== */
            <form onSubmit={handleCheckout} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Responsável pela Retirada <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-user-tag text-gray-400"></i>
                  </div>
                  <select 
                    required 
                    value={userId} 
                    onChange={e => setUserId(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Selecione um membro...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">
                  Previsão de Devolução <span className="text-gray-400 font-normal text-xs">(Opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-regular fa-calendar text-gray-400"></i>
                  </div>
                  <input 
                    type="date" 
                    value={expectedReturn} 
                    onChange={e => setExpectedReturn(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-medium text-gray-800" 
                  />
                </div>
              </div>

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
                  className="w-full sm:w-auto px-6 py-3 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-95"
                >
                  {isLoading ? (
                    <><i className="fa-solid fa-circle-notch fa-spin"></i> Processando...</>
                  ) : (
                    <><i className="fa-solid fa-hand-holding-hand"></i> Confirmar Empréstimo</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}