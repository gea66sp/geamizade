"use client";

import { useState } from "react";
import { createTransaction } from "../actions";

interface ModalNovaTransacaoProps {
  isOpen: boolean;
  onClose: () => void;
  users: { id: string; name: string | null; branch: string | null }[];
  troops: any[]; // <-- NOVO: Recebe as tropas e patrulhas
}

export default function ModalNovaTransacao({ isOpen, onClose, users, troops }: ModalNovaTransacaoProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [status, setStatus] = useState<"PENDING" | "PAID">("PENDING");
  
  // <-- NOVOS ESTADOS PARA O ESCOPO FINANCEIRO
  const [scope, setScope] = useState<"GLOBAL" | "TROOP" | "PATROL">("GLOBAL");
  const [selectedTroopId, setSelectedTroopId] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createTransaction(formData);
      onClose(); // Fecha após salvar
      
      // Reseta os campos para o próximo uso
      setScope("GLOBAL");
      setSelectedTroopId("");
      setType("INCOME");
      setStatus("PENDING");
    } catch (err: any) {
      if (err.message !== "NEXT_REDIRECT") {
        alert(err.message || "Erro ao salvar transação.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  // Encontra as patrulhas da tropa selecionada para popular o segundo select
  const currentPatrols = selectedTroopId ? troops.find(t => t.id === selectedTroopId)?.patrols || [] : [];

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Header do Modal com botão de Fechar nativo */}
        <div className="flex justify-between items-start mb-6 md:mb-8 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${type === "INCOME" ? "bg-scout-green/10 text-scout-green" : "bg-red-50 text-red-500"}`}>
              {type === "INCOME" ? (
                <i className="fa-solid fa-arrow-turn-down text-xl"></i>
              ) : (
                <i className="fa-solid fa-arrow-turn-up text-xl"></i>
              )}
            </div>
            <div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">Novo Lançamento</h3>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Registre uma nova entrada ou saída no caixa.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0"
            aria-label="Fechar modal"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seletor de Tipo (Receita/Despesa) */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl shadow-inner border border-gray-200">
            <label className={`flex-1 text-center py-2.5 rounded-lg font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${type === "INCOME" ? "bg-white text-scout-green shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
              <input type="radio" name="type" value="INCOME" checked={type === "INCOME"} onChange={() => setType("INCOME")} className="hidden" />
              <i className="fa-solid fa-circle-plus text-xs"></i> Receita
            </label>
            <label className={`flex-1 text-center py-2.5 rounded-lg font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${type === "EXPENSE" ? "bg-white text-red-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
              <input type="radio" name="type" value="EXPENSE" checked={type === "EXPENSE"} onChange={() => setType("EXPENSE")} className="hidden" />
              <i className="fa-solid fa-circle-minus text-xs"></i> Despesa
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Título */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="tx-title" className="block text-sm font-bold text-gray-700">Descrição do Lançamento <span className="text-red-500">*</span></label>
              <input 
                id="tx-title"
                type="text" 
                name="title" 
                required 
                placeholder="Ex: Mensalidade João, Compra de Cordas..." 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all" 
              />
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <label htmlFor="tx-amount" className="block text-sm font-bold text-gray-700">Valor (R$) <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-bold">R$</span>
                </div>
                <input 
                  id="tx-amount"
                  type="number" 
                  name="amount" 
                  step="0.01"
                  min="0.01"
                  required 
                  placeholder="0.00" 
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 font-black transition-all" 
                />
              </div>
            </div>

            {/* Vencimento */}
            <div className="space-y-1.5">
              <label htmlFor="tx-date" className="block text-sm font-bold text-gray-700">Data de Vencimento <span className="text-red-500">*</span></label>
              <input 
                id="tx-date"
                type="date" 
                name="dueDate" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all cursor-text md:cursor-pointer" 
              />
            </div>

            {/* ==========================================
                NOVO: ESCOPO DO LANÇAMENTO (CAIXA)
            ========================================== */}
            <div className="space-y-3 md:col-span-2 border-t border-gray-100 pt-5 mt-2">
              <label className="block text-sm font-bold text-gray-700">
                Centro de Custo (Caixa) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`text-center py-2.5 rounded-lg font-bold cursor-pointer transition-all border ${scope === "GLOBAL" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                  <input type="radio" name="scope" value="GLOBAL" checked={scope === "GLOBAL"} onChange={() => {setScope("GLOBAL"); setSelectedTroopId("");}} className="hidden" />
                  <i className="fa-solid fa-globe mb-1 block text-lg"></i> Geral
                </label>
                <label className={`text-center py-2.5 rounded-lg font-bold cursor-pointer transition-all border ${scope === "TROOP" ? "bg-scout-green/10 border-scout-green/30 text-scout-green" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                  <input type="radio" name="scope" value="TROOP" checked={scope === "TROOP"} onChange={() => {setScope("TROOP"); setSelectedTroopId("");}} className="hidden" />
                  <i className="fa-solid fa-tent mb-1 block text-lg"></i> Tropa
                </label>
                <label className={`text-center py-2.5 rounded-lg font-bold cursor-pointer transition-all border ${scope === "PATROL" ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                  <input type="radio" name="scope" value="PATROL" checked={scope === "PATROL"} onChange={() => {setScope("PATROL"); setSelectedTroopId("");}} className="hidden" />
                  <i className="fa-solid fa-paw mb-1 block text-lg"></i> Patrulha
                </label>
              </div>
            </div>

            {/* Filtros dinâmicos baseados no Escopo */}
            {(scope === "TROOP" || scope === "PATROL") && (
              <div className="space-y-1.5 md:col-span-1 animate-fade-in-up">
                <label className="block text-sm font-bold text-gray-700">Selecione a Tropa <span className="text-red-500">*</span></label>
                <select 
                  name="troopId" 
                  value={selectedTroopId}
                  onChange={(e) => setSelectedTroopId(e.target.value)}
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {troops.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {scope === "PATROL" && (
              <div className="space-y-1.5 md:col-span-1 animate-fade-in-up">
                <label className="block text-sm font-bold text-gray-700">Selecione a Patrulha <span className="text-red-500">*</span></label>
                <select 
                  name="patrolId" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all cursor-pointer disabled:opacity-50"
                  disabled={!selectedTroopId}
                >
                  <option value="">{selectedTroopId ? "Selecione..." : "Escolha a Tropa primeiro"}</option>
                  {currentPatrols.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Vinculado a um Membro */}
            <div className="space-y-1.5 md:col-span-2 border-t border-gray-100 pt-5 mt-2">
              <label htmlFor="tx-user" className="block text-sm font-bold text-gray-700">Vincular a um Membro (Opcional)</label>
              <select 
                id="tx-user"
                name="userId" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 cursor-pointer transition-all"
              >
                <option value="">Sem vínculo com pessoa (Caixa comum)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} {u.branch ? `(${u.branch})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5 md:col-span-2 border-t border-gray-100 pt-5 mt-2">
              <label htmlFor="tx-status" className="block text-sm font-bold text-gray-700">Status do Lançamento</label>
              <select 
                id="tx-status"
                name="status" 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 cursor-pointer font-bold transition-all"
              >
                <option value="PENDING">⌛ Pendente (A Receber / A Pagar)</option>
                <option value="PAID">✅ Liquidado (Pago / Recebido)</option>
              </select>
            </div>

            {/* Data de Pagamento (Só aparece se estiver pago) */}
            {status === "PAID" && (
              <div className="space-y-1.5 md:col-span-2 animate-fade-in bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                <label htmlFor="tx-paid-date" className="block text-sm font-bold text-gray-700">Data de Liquidação (Efetivação) <span className="text-red-500">*</span></label>
                <input 
                  id="tx-paid-date"
                  type="date" 
                  name="paidDate" 
                  required 
                  className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all cursor-text md:cursor-pointer" 
                />
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSaving} 
              className="w-full sm:w-auto px-6 py-3 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="w-full sm:w-auto px-6 py-3 text-sm bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
            >
              {isSaving ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Registrando...</>
              ) : (
                <><i className="fa-solid fa-floppy-disk"></i> Registrar Lançamento</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}