"use client";

import { useState } from "react";
import { toggleTroopMember, moveMemberToPatrol, setPatrolLeadership, deletePatrolInternal } from "../actions";
import PatrolFormModal from "./PatrolFormModal";
import Link from "next/link";

export default function TroopDetailClient({ 
  troop, 
  availableYouth,
  financials,
  inventory
}: { 
  troop: any; 
  availableYouth: any[];
  financials: any[];
  inventory: any[];
}) {
  const [activeTab, setActiveTab] = useState<"MEMBROS" | "FINANCEIRO" | "PATRIMONIO">("MEMBROS");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para o Modal de Patrulha
  const [isPatrolModalOpen, setIsPatrolModalOpen] = useState(false);
  const [patrolToEdit, setPatrolToEdit] = useState<any | null>(null);

  // ==========================================
  // LÓGICA DE ARRASTAR E SOLTAR (MEMBROS)
  // ==========================================
  const handleDragStart = (e: React.DragEvent, userId: string) => {
    e.dataTransfer.setData("userId", userId);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault(); 

  const handleDrop = async (e: React.DragEvent, targetPatrolId: string | null) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData("userId");
    if (!userId) return;

    setIsLoading(true);
    await moveMemberToPatrol(userId, targetPatrolId, troop.id);
    setIsLoading(false);
  };

  const handleAddYouthToTroop = async (userId: string) => {
    setIsLoading(true);
    await toggleTroopMember(userId, troop.id);
    setIsLoading(false);
  };

  const handleRemoveYouthFromTroop = async (userId: string) => {
    if (confirm("Você tem certeza que deseja remover este jovem da Tropa?")) {
      setIsLoading(true);
      await toggleTroopMember(userId, null);
      setIsLoading(false);
    }
  };

  const handleLeadershipChange = async (patrolId: string, leaderId: string | null, subLeaderId: string | null) => {
    setIsLoading(true);
    const res = await setPatrolLeadership(patrolId, leaderId, subLeaderId, troop.id);
    if (res?.error) alert(res.error);
    setIsLoading(false);
  };

  const handleDeletePatrol = async (patrolId: string) => {
    if (confirm("Você tem certeza que deseja excluir esta patrulha?")) {
      setIsLoading(true);
      await deletePatrolInternal(patrolId, troop.id);
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const formatDate = (date: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));

  // Componente Reutilizável: Cartão do Jovem
  const YouthCard = ({ member, patrolId = null }: { member: any, patrolId?: string | null }) => (
    <div 
      draggable 
      onDragStart={(e) => handleDragStart(e, member.id)}
      onDragEnd={handleDragEnd}
      className="flex items-center justify-between p-3 mb-2 bg-white border border-gray-200 rounded-xl shadow-sm cursor-grab hover:border-scout-green hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
          {member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-xs"></i>}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-800 leading-tight">{member.name}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Membro</span>
        </div>
      </div>
      
      {!patrolId && (
        <button 
          onClick={() => handleRemoveYouthFromTroop(member.id)}
          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  );

  // Cálculos Financeiros
  const receitas = financials.filter(t => t.type === "INCOME" && t.status === "PAID").reduce((acc, t) => acc + t.amount, 0);
  const despesas = financials.filter(t => t.type === "EXPENSE" && t.status === "PAID").reduce((acc, t) => acc + t.amount, 0);
  const saldo = receitas - despesas;

  // Cálculos de Patrimônio
  const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const damagedItems = inventory.filter(i => i.condition === "DAMAGED").reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-6">
      
      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-200 gap-6">
        <button onClick={() => setActiveTab("MEMBROS")} className={`pb-3 text-sm font-bold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === "MEMBROS" ? "border-b-2 border-scout-green text-scout-green" : "text-gray-500 hover:text-gray-800"}`}>
          <i className="fa-solid fa-users"></i> Gestão de Efetivo
        </button>
        <button onClick={() => setActiveTab("FINANCEIRO")} className={`pb-3 text-sm font-bold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === "FINANCEIRO" ? "border-b-2 border-scout-green text-scout-green" : "text-gray-500 hover:text-gray-800"}`}>
          <i className="fa-solid fa-coins"></i> Finanças da Seção
        </button>
        <button onClick={() => setActiveTab("PATRIMONIO")} className={`pb-3 text-sm font-bold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === "PATRIMONIO" ? "border-b-2 border-scout-green text-scout-green" : "text-gray-500 hover:text-gray-800"}`}>
          <i className="fa-solid fa-boxes-stacked"></i> Almoxarifado
        </button>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-100 flex items-center justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-scout-green">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i> Atualizando dados...
          </div>
        </div>
      )}

      {/* ==========================================
          ABA 1: GESTÃO DE EFETIVO
      ========================================== */}
      {activeTab === "MEMBROS" && (
        <div className="flex flex-col lg:flex-row gap-6 items-start animate-fade-in">
          {/* COLUNA: JOVENS SEM PATRULHA */}
          <div className="w-full lg:w-1/3 bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col h-150" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, null)}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200/60 shrink-0">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-user-clock text-gray-400"></i>
                <h2 className="font-bold text-gray-700 text-lg">Sem Patrulha</h2>
              </div>
              <span className="bg-gray-200 text-gray-700 text-xs font-black px-2.5 py-1 rounded-md">{troop.members.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {troop.members.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium text-sm bg-white/50">Nenhum jovem aguardando patrulha.</div>
              ) : ( troop.members.map((m: any) => <YouthCard key={m.id} member={m} />) )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 shrink-0">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Adicionar Novo Escoteiro à Seção</label>
              <select onChange={(e) => { if(e.target.value) handleAddYouthToTroop(e.target.value); e.target.value = ""; }} className="w-full p-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-scout-green cursor-pointer font-medium text-gray-700 shadow-sm">
                <option value="">Selecione um jovem do Grupo...</option>
                {availableYouth.map(y => <option key={y.id} value={y.id}>{y.name}</option> )}
              </select>
            </div>
          </div>

          {/* COLUNA: LISTA DE PATRULHAS */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
               <div>
                  <h3 className="font-bold text-gray-800 text-sm">Organização de Patrulhas</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Crie matilhas ou patrulhas para esta seção.</p>
               </div>
               <button onClick={() => { setPatrolToEdit(null); setIsPatrolModalOpen(true); }} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
                  <i className="fa-solid fa-plus"></i> Criar Patrulha
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {troop.patrols.map((patrol: any) => (
                  <div key={patrol.id} className="bg-white border-2 border-transparent hover:border-amber-200 rounded-2xl shadow-sm transition-colors flex flex-col h-130 overflow-hidden" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, patrol.id)}>
                    <div className="bg-amber-50/70 p-4 border-b border-amber-100 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-paw text-amber-500 text-base"></i>
                        <h3 className="font-bold text-amber-900 font-heading text-base">{patrol.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded">{patrol.members.length} Jovens</span>
                         <button onClick={() => { setPatrolToEdit(patrol); setIsPatrolModalOpen(true); }} className="text-gray-400 hover:text-blue-500 cursor-pointer p-0.5"><i className="fa-solid fa-edit text-xs"></i></button>
                         <button onClick={() => handleDeletePatrol(patrol.id)} className="text-gray-400 hover:text-red-500 cursor-pointer p-0.5"><i className="fa-solid fa-trash text-xs"></i></button>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-star text-amber-400 w-4 text-center text-xs"></i>
                        <select value={patrol.leaderId || ""} onChange={(e) => handleLeadershipChange(patrol.id, e.target.value || null, patrol.subLeaderId)} className="flex-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded p-1.5 focus:outline-none focus:border-amber-400 cursor-pointer">
                          <option value="">Monitor / Primo (Não definido)</option>
                          {patrol.members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fa-regular fa-star text-gray-400 w-4 text-center text-xs"></i>
                        <select value={patrol.subLeaderId || ""} onChange={(e) => handleLeadershipChange(patrol.id, patrol.leaderId, e.target.value || null)} className="flex-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded p-1.5 focus:outline-none focus:border-gray-400 cursor-pointer">
                          <option value="">Submonitor / Segundo (Não definido)</option>
                          {patrol.members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50/30">
                      {patrol.members.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium text-xs bg-white/40">Arraste jovens aqui para vinculá-los</div>
                      ) : (
                        patrol.members.map((m: any) => (
                          <div key={m.id} className="relative">
                            {patrol.leaderId === m.id && <i className="fa-solid fa-star absolute -left-1.5 -top-1.5 text-amber-400 z-10 text-xs drop-shadow-sm" title="Monitor"></i>}
                            {patrol.subLeaderId === m.id && <i className="fa-regular fa-star absolute -left-1.5 -top-1.5 text-gray-400 z-10 text-xs drop-shadow-sm bg-white rounded-full" title="Submonitor"></i>}
                            <YouthCard member={m} patrolId={patrol.id} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ABA 2: FINANCEIRO DA SEÇÃO
      ========================================== */}
      {activeTab === "FINANCEIRO" && (
        <div className="animate-fade-in space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
             <div>
                <h2 className="font-bold text-gray-800 text-lg">Caixas Vinculados</h2>
                <p className="text-sm text-gray-500">Histórico de mensalidades, vaquinhas e despesas da Seção.</p>
             </div>
             <Link href="/admin/financeiro" className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors text-sm">
               Ir para Módulo Financeiro
             </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Entradas (Pagas)</p>
              <p className="text-2xl font-black text-green-600">{formatCurrency(receitas)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Saídas (Pagas)</p>
              <p className="text-2xl font-black text-red-600">{formatCurrency(despesas)}</p>
            </div>
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm text-center">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Saldo em Caixa</p>
              <p className={`text-2xl font-black ${saldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{formatCurrency(saldo)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest text-xs font-bold">
                <tr>
                  <th className="p-4">Data</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Centro de Custo</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {financials.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Nenhuma transação financeira encontrada.</td></tr>
                ) : (
                  financials.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="p-4 text-gray-600">{formatDate(t.dueDate)}</td>
                      <td className="p-4 font-bold text-gray-800">
                        {t.title}
                        {t.user && <span className="block text-xs font-normal text-gray-400"><i className="fa-solid fa-user text-[10px]"></i> {t.user.name}</span>}
                      </td>
                      <td className="p-4">
                        {t.patrol ? (
                          <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold border border-amber-100"><i className="fa-solid fa-paw mr-1"></i> {t.patrol.name}</span>
                        ) : (
                          <span className="bg-scout-green/10 text-scout-green px-2 py-1 rounded text-xs font-bold border border-scout-green/20"><i className="fa-solid fa-tent mr-1"></i> Tropa</span>
                        )}
                      </td>
                      <td className={`p-4 font-black ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="p-4">
                        {t.status === 'PAID' ? <span className="text-green-600 font-bold text-xs"><i className="fa-solid fa-check"></i> Pago</span> : <span className="text-amber-500 font-bold text-xs"><i className="fa-solid fa-clock"></i> Pendente</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          ABA 3: PATRIMÔNIO DA SEÇÃO
      ========================================== */}
      {activeTab === "PATRIMONIO" && (
        <div className="animate-fade-in space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
             <div>
                <h2 className="font-bold text-gray-800 text-lg">Materiais Alocados</h2>
                <p className="text-sm text-gray-500">Tendas, ferramentas e materiais de campo desta Seção.</p>
             </div>
             <Link href="/admin/patrimonio" className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors text-sm">
               Ir para Almoxarifado
             </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-boxes-stacked"></i></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total de Materiais</p>
                <p className="text-2xl font-black text-gray-800">{totalItems} <span className="text-sm font-medium text-gray-500">itens</span></p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-triangle-exclamation"></i></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Danificados / Baixa</p>
                <p className="text-2xl font-black text-red-600">{damagedItems} <span className="text-sm font-medium text-gray-500">itens</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest text-xs font-bold">
                <tr>
                  <th className="p-4">Nº Carga</th>
                  <th className="p-4">Material</th>
                  <th className="p-4">Alocado para</th>
                  <th className="p-4">Qtd</th>
                  <th className="p-4">Condição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Nenhum material alocado para esta seção.</td></tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono text-xs text-gray-500">{item.chargeNumber}</td>
                      <td className="p-4 font-bold text-gray-800">
                        {item.name}
                        <span className="block text-xs font-normal text-gray-400">{item.category}</span>
                      </td>
                      <td className="p-4">
                        {item.patrol ? (
                          <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold border border-amber-100"><i className="fa-solid fa-paw mr-1"></i> {item.patrol.name}</span>
                        ) : (
                          <span className="bg-scout-green/10 text-scout-green px-2 py-1 rounded text-xs font-bold border border-scout-green/20"><i className="fa-solid fa-tent mr-1"></i> Tropa Inteira</span>
                        )}
                      </td>
                      <td className="p-4 font-black text-gray-700">{item.quantity}</td>
                      <td className="p-4">
                        {item.condition === 'NEW' && <span className="text-blue-500 font-bold text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100">Novo</span>}
                        {item.condition === 'GOOD' && <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">Bom</span>}
                        {item.condition === 'FAIR' && <span className="text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded border border-amber-100">Regular</span>}
                        {item.condition === 'DAMAGED' && <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">Danificado</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPatrolModalOpen && (
        <PatrolFormModal isOpen={isPatrolModalOpen} onClose={() => setIsPatrolModalOpen(false)} patrolToEdit={patrolToEdit} troopId={troop.id} />
      )}
    </div>
  );
}