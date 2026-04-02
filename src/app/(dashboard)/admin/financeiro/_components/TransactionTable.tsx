"use client";

import { useState, useEffect } from "react";
import ModalEditarTransacao from "./ModalEditarTransacao";
import { deleteTransaction } from "../actions";

export default function TransactionTable({ transactions, users }: { transactions: any[], users: any[] }) {
  const [editingTx, setEditingTx] = useState<any | null>(null);
  
  // Controle do Menu Mobile (3 pontinhos)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Controle do Modal de Confirmação customizado (substituindo o window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fecha o menu mobile ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const formatDate = (date: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));

  const handleMobileAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setOpenMenuId(null);
    action();
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (error) {
      alert("Erro ao excluir o lançamento.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Componente auxiliar para padronizar as etiquetas de status
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'PAID') {
      return <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-200/50"><i className="fa-solid fa-check mr-1 text-[8px]"></i> Pago</span>;
    }
    if (status === 'PENDING') {
      return <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-200/50"><i className="fa-solid fa-clock mr-1 text-[8px]"></i> Pendente</span>;
    }
    if (status === 'CANCELLED') {
      return <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-200/50"><i className="fa-solid fa-ban mr-1 text-[8px]"></i> Cancelado</span>;
    }
    return null;
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 m-4 sm:m-6 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <i className="fa-solid fa-file-invoice-dollar text-3xl text-gray-300"></i>
        </div>
        <h3 className="font-heading font-bold text-gray-700 text-lg mb-1">Nenhum lançamento</h3>
        <p className="text-gray-500 text-sm">Não há transações financeiras registradas no momento.</p>
      </div>
    );
  }

  return (
    <>
      {/* =========================================
          VERSÃO MOBILE: LISTA DE CARDS (FLEX)
          Oculta a tabela nativa em telas < md
      ============================================= */}
      <div className="md:hidden flex flex-col divide-y divide-gray-100 pb-4">
        {transactions.map((tx) => {
          const isMenuOpen = openMenuId === tx.id;
          
          return (
            <div key={tx.id} className={`p-4 bg-white hover:bg-gray-50 transition-colors ${isMenuOpen ? 'relative z-40' : 'relative z-auto'}`}>
              <div className="flex justify-between items-start gap-3">
                
                {/* Lado Esquerdo: Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate leading-tight mb-1">{tx.title}</h4>
                  {tx.user && (
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5 truncate">
                      <i className="fa-solid fa-user text-gray-300"></i> {tx.user.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar-days text-gray-300"></i> Venc: {formatDate(tx.dueDate)}
                  </p>
                </div>

                {/* Lado Direito: Valores, Badge e 3 Pontinhos */}
                <div className="flex flex-col items-end shrink-0 gap-2">
                  <span className={`font-black text-sm sm:text-base ${tx.type === 'INCOME' ? 'text-scout-green' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tx.status} />
                    
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : tx.id); }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {/* Menu Suspenso (Dropdown) */}
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}></div>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col py-1.5 animate-fade-in-down origin-top-right">
                            <button onClick={(e) => handleMobileAction(e, () => setEditingTx(tx))} className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-left font-medium text-sm">
                              <i className="fa-solid fa-pen w-4 text-center text-blue-500"></i> Editar
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2"></div>
                            <button onClick={(e) => handleMobileAction(e, () => setConfirmDeleteId(tx.id))} className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 text-left font-bold text-sm">
                              <i className="fa-solid fa-trash w-4 text-center"></i> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================
          VERSÃO DESKTOP: TABELA TRADICIONAL
          Oculta no mobile
      ============================================= */}
      <table className="hidden md:table w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 sticky top-0 z-10 shadow-sm">
            <th className="px-5 py-3.5 font-bold">Descrição</th>
            <th className="px-5 py-3.5 font-bold">Vencimento</th>
            <th className="px-5 py-3.5 font-bold">Valor</th>
            <th className="px-5 py-3.5 font-bold">Status</th>
            <th className="px-5 py-3.5 font-bold text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors group">
              <td className="px-5 py-4">
                <div className="font-bold text-gray-800">{tx.title}</div>
                {tx.user && <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><i className="fa-solid fa-user text-gray-300"></i> {tx.user.name}</div>}
              </td>
              <td className="px-5 py-4 text-gray-600 font-medium">{formatDate(tx.dueDate)}</td>
              <td className={`px-5 py-4 font-black ${tx.type === 'INCOME' ? 'text-scout-green' : 'text-red-600'}`}>
                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={tx.status} />
              </td>
              <td className="px-5 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                
                {/* Botão de Editar */}
                <button onClick={() => setEditingTx(tx)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer mr-1" title="Editar">
                  <i className="fa-solid fa-pen text-sm"></i>
                </button>
                
                {/* Botão de Excluir */}
                <button onClick={() => setConfirmDeleteId(tx.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Apagar">
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* =========================================
          MODAIS E DIÁLOGOS
      ============================================= */}
      
      {/* Modal Nativo de Edição */}
      <ModalEditarTransacao 
        transaction={editingTx} 
        isOpen={!!editingTx} 
        onClose={() => setEditingTx(null)} 
        users={users} 
      />

      {/* Modal de Confirmação de Exclusão (Substituindo window.confirm) */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <h3 className="font-heading font-bold text-gray-800 text-xl mb-2">Excluir Lançamento?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Tem certeza que deseja apagar este lançamento permanentemente? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                disabled={isDeleting}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={isDeleting}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Excluindo...</> : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}