"use client";

import { useState, useMemo,  } from "react";

// Importação dos outros componentes (Modais e Histórico)
import ItemModal from "./ItemModal";
import CheckoutModal from "./CheckoutModal";
import LoanHistory from "./LoanHistory";
import DischargeModal from "./DischargeModal";
import ReportModal from "./ReportModal";
import { FileText, Plus } from "lucide-react";


// Mapa de cores para os status de conservação (Design Premium)
const CONDITION_MAP = {
  NEW: { label: "Novo", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  GOOD: { label: "Bom", color: "bg-blue-50 text-blue-700 border-blue-200" },
  FAIR: { label: "Regular", color: "bg-amber-50 text-amber-700 border-amber-200" },
  DAMAGED: { label: "Danificado", color: "bg-red-50 text-red-700 border-red-200" },
};

export default function InventoryManager({ 
  initialItems, 
  allLoans, 
  users 
}: { 
  initialItems: any[], 
  allLoans: any[], 
  users: any[] 
}) {
  // Controle de Abas
  const [activeTab, setActiveTab] = useState<"ESTOQUE" | "HISTORICO">("ESTOQUE");
  
  // Controle de Filtros
  const [search, setSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ACTIVE_ALL");

  // Controle de Modais
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isDischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  // Filtragem dinâmica dos itens
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const matchSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.chargeNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      
      const matchCondition = filterCondition === "ALL" || item.condition === filterCondition;
      
      const isCheckedOut = item.loans && item.loans.length > 0;
      let matchStatus = true;
      
      if (filterStatus === "ACTIVE_ALL") matchStatus = item.isActive;
      if (filterStatus === "AVAILABLE") matchStatus = item.isActive && !isCheckedOut;
      if (filterStatus === "CHECKED_OUT") matchStatus = item.isActive && isCheckedOut;
      if (filterStatus === "DISCHARGED") matchStatus = !item.isActive;

      return matchSearch && matchCondition && matchStatus;
    });
  }, [initialItems, search, filterCondition, filterStatus]);

  const handleOpenEdit = (item: any) => { setSelectedItem(item); setItemModalOpen(true); };
  const handleOpenCheckout = (item: any) => { setSelectedItem(item); setCheckoutModalOpen(true); };
  const handleOpenDischarge = (item: any) => { setSelectedItem(item); setDischargeModalOpen(true); };
  const handleOpenNew = () => { setSelectedItem(null); setItemModalOpen(true); };

  return (
    <div className="space-y-6">
      
      {/* ==========================================
          SISTEMA DE ABAS (Mobile-First "Pill" Style)
      ========================================== */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
        <button
          onClick={() => setActiveTab("ESTOQUE")}
          className={`cursor-pointer flex-1 min-w-40 flex items-center justify-center gap-2 py-3 px-6 font-bold text-sm rounded-xl transition-all shadow-sm ${
            activeTab === "ESTOQUE" ? "bg-scout-green text-white" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-gray-200"
          }`}
        >
          <i className="fa-solid fa-boxes-stacked"></i>
          Estoque de Materiais
        </button>
        <button
          onClick={() => setActiveTab("HISTORICO")}
          className={`cursor-pointer flex-1 min-w-40 flex items-center justify-center gap-2 py-3 px-6 font-bold text-sm rounded-xl transition-all shadow-sm ${
            activeTab === "HISTORICO" ? "bg-scout-green text-white" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-gray-200"
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left"></i>
          Histórico de Empréstimos
        </button>
      </div>

      {activeTab === "ESTOQUE" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* ==========================================
              BARRA DE FERRAMENTAS E FILTROS
          ========================================== */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row flex-1 gap-3 md:gap-4">
              
              {/* Pesquisa */}
              <div className="relative flex-1 md:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Buscar material ou Nº..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-medium"
                />
              </div>

              {/* Filtro de Status */}
              <div className="relative flex-1 md:max-w-50">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-filter text-gray-400"></i>
                </div>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="ACTIVE_ALL">Estoque Ativo</option>
                  <option value="AVAILABLE">Disponíveis</option>
                  <option value="CHECKED_OUT">Emprestados</option>
                  <option value="DISCHARGED">Descartados / Baixa</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i></div>
              </div>

              {/* Filtro de Condição */}
              <div className="relative flex-1 md:max-w-45">
                <select 
                  value={filterCondition} 
                  onChange={(e) => setFilterCondition(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="ALL">Qualquer estado</option>
                  <option value="NEW">Novo</option>
                  <option value="GOOD">Bom estado</option>
                  <option value="FAIR">Regular</option>
                  <option value="DAMAGED">Danificado</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i></div>
              </div>
            </div>

            {/* Botões de Ação */}
            
              <button 
                onClick={() => setReportModalOpen(true)} 
                className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                <FileText className="w-5 h-5 text-blue-600" /> Relatórios
              </button>

              <button 
              onClick={handleOpenNew} 
              className="cursor-pointer w-full md:w-auto bg-scout-green hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
            >
              <i className="fa-solid fa-plus"></i> Novo Material
            </button>
            

            
          </div>

          {/* ==========================================
              VISÃO MOBILE (LISTA DE CARDS)
          ========================================== */}
          <div className="md:hidden space-y-4">
            {filteredItems.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-gray-200 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center text-3xl mb-3"><i className="fa-solid fa-box-open"></i></div>
                <p className="text-gray-500 font-bold">Nenhum material encontrado.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const activeLoan = item.loans?.[0];
                return (
                  <div key={item.id} className={`bg-white p-4 rounded-2xl border ${!item.isActive ? 'border-red-200 opacity-80' : 'border-gray-200'} shadow-sm relative`}>
                    
                    {/* Badge Numero de Carga */}
                    <div className="absolute top-0 right-0 bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl tracking-widest font-mono">
                      #{item.chargeNumber}
                    </div>

                    <div className="flex items-start gap-4 mb-4 mt-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${item.isActive ? 'bg-scout-green/10 text-scout-green' : 'bg-red-50 text-red-500'}`}>
                        {item.category.toLowerCase().includes('barraca') ? <i className="fa-solid fa-tent"></i> : <i className="fa-solid fa-box"></i>}
                      </div>
                      <div className="flex-1 min-w-0 pr-10">
                        <h4 className={`font-bold text-base leading-tight truncate ${item.isActive ? 'text-gray-800' : 'text-gray-500 line-through decoration-red-400'}`}>{item.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">{item.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Qtd: {item.quantity}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CONDITION_MAP[item.condition as keyof typeof CONDITION_MAP].color}`}>
                            {CONDITION_MAP[item.condition as keyof typeof CONDITION_MAP].label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Box */}
                    <div className="mb-4">
                      {!item.isActive ? (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                          <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 flex items-center gap-1.5"><i className="fa-solid fa-triangle-exclamation"></i> Material Baixado</p>
                          <p className="text-xs text-red-600 line-clamp-2">{item.dischargeReason}</p>
                        </div>
                      ) : activeLoan ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1.5"><i className="fa-regular fa-clock"></i> Emprestado para</p>
                          <p className="text-sm font-bold text-amber-900 truncate">{activeLoan.user?.name}</p>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest">
                          <i className="fa-solid fa-circle-check text-base"></i> Disponível no Galpão
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    {item.isActive && (
                      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                        <button 
                          onClick={() => handleOpenCheckout(item)} 
                          className={`cursor-pointer py-2 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${
                            activeLoan ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          <i className={`cursor-pointer fa-solid ${activeLoan ? 'cursor-pointer fa-arrow-rotate-left' : 'cursor-pointer fa-hand-holding-hand'}`}></i>
                          {activeLoan ? "Devolver" : "Emprestar"}
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEdit(item)} className="cursor-pointer flex-1 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 py-2 rounded-xl text-sm font-bold flex items-center justify-center transition-colors">
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button onClick={() => handleOpenDischarge(item)} className="cursor-pointer w-12 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 hover:text-red-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center transition-colors">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ==========================================
              VISÃO DESKTOP (TABELA)
          ========================================== */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-200">
                  <th className="p-4 w-28">Nº Carga</th>
                  <th className="p-4">Material</th>
                  <th className="p-4 text-center w-20">Qtd</th>
                  <th className="p-4 w-32">Condição</th>
                  <th className="p-4 max-w-50">Status Atual</th>
                  <th className="p-4 text-right w-52">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const activeLoan = item.loans?.[0];
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors group ${!item.isActive ? 'bg-red-50/30' : ''}`}>
                      
                      {/* Nº Carga */}
                      <td className="p-2 align-middle">
                        <span className="font-mono bg-gray-100 border border-gray-200 px-2 py-1 rounded text-xs text-gray-700 font-bold shadow-sm tracking-wider">
                          #{item.chargeNumber}
                        </span>
                      </td>

                      {/* Material */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.isActive ? 'bg-scout-green/10 text-scout-green' : 'bg-red-100 text-red-500'}`}>
                            {item.category.toLowerCase().includes('barraca') ? <i className="fa-solid fa-tent"></i> : <i className="fa-solid fa-box"></i>}
                          </div>
                          <div>
                            <p className={`font-bold text-sm ${item.isActive ? 'text-gray-900' : 'text-gray-500 line-through decoration-red-400'}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">{item.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Quantidade */}
                      <td className="p-4 text-center font-black text-gray-700 align-middle">
                        {item.quantity}
                      </td>

                      {/* Condição */}
                      <td className="p-4 align-middle">
                        <span className={`px-2.5 py-1 rounded border text-[10px] uppercase tracking-widest font-bold ${CONDITION_MAP[item.condition as keyof typeof CONDITION_MAP].color}`}>
                          {CONDITION_MAP[item.condition as keyof typeof CONDITION_MAP].label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 align-middle">
                        {!item.isActive ? (
                           <div className="flex flex-col gap-1 text-red-700 max-w-50">
                             <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                               <i className="fa-solid fa-triangle-exclamation"></i> Baixado
                             </div>
                             <p className="text-xs text-red-600/90 truncate" title={item.dischargeReason}>{item.dischargeReason}</p>
                           </div>
                        ) : activeLoan ? (
                          <div className="flex flex-col gap-1 text-amber-700 max-w-50">
                            <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                               <i className="fa-regular fa-clock"></i> Emprestado para
                            </div>
                            <p className="text-xs font-bold text-amber-900 truncate" title={activeLoan.user?.name}>{activeLoan.user?.name}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 w-fit text-[10px] uppercase tracking-widest">
                            <i className="fa-solid fa-circle-check text-sm"></i> Disponível
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right align-middle">
                        {item.isActive && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenCheckout(item)} 
                              className={`cursor-pointer text-xs px-3 py-2 rounded-lg font-bold transition-colors border ${
                                activeLoan 
                                  ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-100" 
                                  : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              }`}
                            >
                              {activeLoan ? "Devolver" : "Emprestar"}
                            </button>
                            
                            <button onClick={() => handleOpenEdit(item)} className="cursor-pointer w-8 h-8 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 hover:border-gray-300 transition-all flex items-center justify-center" title="Editar">
                              <i className="fa-solid fa-pen text-xs"></i>
                            </button>
                            
                            <button onClick={() => handleOpenDischarge(item)} className="cursor-pointer w-8 h-8 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all flex items-center justify-center" title="Dar Baixa">
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <i className="fa-solid fa-box-open text-4xl text-gray-300"></i>
                        <p className="text-base font-bold text-gray-600">Nenhum material atende aos filtros.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Renderiza a aba de Histórico */
        <LoanHistory allLoans={allLoans} />
      )}

      {/* Renderização dos Modais */}
      <ItemModal isOpen={isItemModalOpen} onClose={() => setItemModalOpen(false)} item={selectedItem} />
      <CheckoutModal isOpen={isCheckoutModalOpen} onClose={() => setCheckoutModalOpen(false)} item={selectedItem} users={users} />
      <DischargeModal isOpen={isDischargeModalOpen} onClose={() => setDischargeModalOpen(false)} item={selectedItem} />
        <ReportModal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} />
    </div>
  );
}