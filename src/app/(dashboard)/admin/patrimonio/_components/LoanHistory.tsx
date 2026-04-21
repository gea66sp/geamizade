"use client";

import { useState, useMemo } from "react";

export default function LoanHistory({ allLoans }: { allLoans: any[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, ACTIVE, RETURNED, LATE

  const filteredLoans = useMemo(() => {
    return allLoans.filter((loan) => {
      // Busca pelo nome do item ou usuário
      const matchSearch = 
        loan.item.name.toLowerCase().includes(search.toLowerCase()) || 
        loan.user.name.toLowerCase().includes(search.toLowerCase());
      
      // Checagem de Status
      const isReturned = !!loan.returnedAt;
      const isLate = !isReturned && loan.expectedReturn && new Date(loan.expectedReturn) < new Date();
      
      let matchStatus = true;
      if (filterStatus === "ACTIVE") matchStatus = !isReturned && !isLate;
      if (filterStatus === "RETURNED") matchStatus = isReturned;
      if (filterStatus === "LATE") matchStatus = isLate;

      return matchSearch && matchStatus;
    });
  }, [allLoans, search, filterStatus]);

  const getStatusBadge = (loan: any) => {
    if (loan.returnedAt) {
      return (
        <span className="flex w-fit items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
          <i className="fa-solid fa-check-double"></i> Devolvido
        </span>
      );
    }
    
    if (loan.expectedReturn && new Date(loan.expectedReturn) < new Date()) {
      return (
        <span className="flex w-fit items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
          <i className="fa-solid fa-triangle-exclamation animate-pulse"></i> Atrasado
        </span>
      );
    }

    return (
      <span className="flex w-fit items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
        <i className="fa-regular fa-clock"></i> Em uso
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Barra de Filtros do Histórico */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200">
        
        {/* Pesquisa */}
        <div className="relative flex-1 md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar material ou membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-medium"
          />
        </div>
        
        {/* Filtro Dropdown */}
        <div className="relative w-full md:w-auto md:min-w-50">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-filter text-gray-400"></i>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
          >
            <option value="ALL">Todos os Registros</option>
            <option value="ACTIVE">Em Uso (No Prazo)</option>
            <option value="LATE">Atrasados</option>
            <option value="RETURNED">Devolvidos</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
          </div>
        </div>
      </div>

      {/* ==========================================
          VISÃO MOBILE (Lista de Cards)
      ========================================== */}
      <div className="md:hidden space-y-4">
        {filteredLoans.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center text-3xl mb-3"><i className="fa-solid fa-clock-rotate-left"></i></div>
            <p className="text-gray-500 font-bold">Nenhum registro encontrado.</p>
          </div>
        ) : (
          filteredLoans.map((loan) => (
            <div key={loan.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative">
              
              {/* Box de Status Absoluto no Topo */}
              <div className="absolute top-4 right-4">
                {getStatusBadge(loan)}
              </div>

              {/* Informação do Material */}
              <div className="flex gap-3 mb-4 pr-24">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-lg shrink-0">
                  <i className="fa-solid fa-box"></i>
                </div>
                <div>
                  <p className="font-bold text-gray-800 leading-tight">{loan.item.name}</p>
                  <p className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider mt-0.5">#{loan.item.chargeNumber}</p>
                </div>
              </div>

              {/* Informação do Membro Responsável */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 font-bold shrink-0">
                  {loan.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{loan.user.name}</p>
                  
                </div>
              </div>

              {/* Datas de Empréstimo */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3">
                <div>
                  <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-0.5">Retirada</p>
                  <p className="font-medium text-gray-700 flex items-center gap-1.5"><i className="fa-regular fa-calendar"></i> {new Date(loan.borrowedAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-0.5">Devolução / Prev.</p>
                  {loan.returnedAt ? (
                    <p className="font-bold text-emerald-600 flex items-center gap-1.5"><i className="fa-solid fa-check"></i> {new Date(loan.returnedAt).toLocaleDateString('pt-BR')}</p>
                  ) : loan.expectedReturn ? (
                    <p className={`font-medium flex items-center gap-1.5 ${new Date(loan.expectedReturn) < new Date() ? 'text-red-500 font-bold' : 'text-gray-700'}`}><i className="fa-regular fa-calendar"></i> {new Date(loan.expectedReturn).toLocaleDateString('pt-BR')}</p>
                  ) : (
                    <p className="text-gray-400 italic">Sem prazo</p>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ==========================================
          VISÃO DESKTOP (Tabela)
      ========================================== */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-200">
              <th className="p-4 w-1/4">Material e Carga</th>
              <th className="p-4 w-1/4">Responsável</th>
              <th className="p-4 text-center">Retirada</th>
              <th className="p-4 text-center">Prev. Devolução</th>
              <th className="p-4 w-48 text-right">Status Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLoans.map((loan) => (
              <tr key={loan.id} className={`hover:bg-gray-50 transition-colors ${!loan.returnedAt && loan.expectedReturn && new Date(loan.expectedReturn) < new Date() ? 'bg-red-50/20' : ''}`}>
                
                {/* Material */}
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                      <i className="fa-solid fa-box"></i>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 leading-tight">{loan.item.name}</p>
                      <p className="text-[10px] font-mono font-bold text-gray-400 tracking-wider">#{loan.item.chargeNumber}</p>
                    </div>
                  </div>
                </td>

                {/* Usuário */}
                <td className="p-4 align-middle">
                  <p className="font-bold text-gray-800">{loan.user.name}</p>
                  
                </td>

                {/* Retirada */}
                <td className="p-4 text-center align-middle text-sm font-medium text-gray-600">
                  {new Date(loan.borrowedAt).toLocaleDateString('pt-BR')}
                </td>

                {/* Previsão */}
                <td className="p-4 text-center align-middle text-sm font-medium text-gray-600">
                  {loan.expectedReturn ? new Date(loan.expectedReturn).toLocaleDateString('pt-BR') : <span className="text-gray-300">-</span>}
                </td>

                {/* Status */}
                <td className="p-4 align-middle text-right">
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(loan)}
                    {loan.returnedAt && (
                      <span className="text-[10px] font-bold text-gray-400">
                        em {new Date(loan.returnedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredLoans.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <i className="fa-solid fa-clock-rotate-left text-3xl text-gray-300"></i>
                    <p className="text-base font-bold text-gray-600">Nenhum registro no histórico.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}