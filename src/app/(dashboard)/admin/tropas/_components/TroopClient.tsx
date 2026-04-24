"use client";

import { useState } from "react";
import TroopFormModal from "./TroopFormModal";
import { deleteTroop } from "../actions";

// Tipagem básica para o componente cliente
type TroopWithRelations = any; 

export default function TroopClient({
  initialTroops,
  users,
}: {
  initialTroops: TroopWithRelations[];
  users: any[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [troopToEdit, setTroopToEdit] = useState<TroopWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenNew = () => {
    setTroopToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (troop: TroopWithRelations) => {
    setTroopToEdit(troop);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tropa/alcatéia? Os membros não serão deletados, apenas desvinculados.")) {
      setIsLoading(true);
      await deleteTroop(id);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* BARRA DE AÇÕES */}
      <div className="flex justify-end">
        <button
          onClick={handleOpenNew}
          className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-scout-green text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          Nova Tropa / Alcatéia
        </button>
      </div>

      {/* ==========================================
          VISÃO MOBILE (LISTA DE CARDS)
      ========================================== */}
      <div className="md:hidden space-y-4">
        {initialTroops.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center shadow-sm">
            <i className="fa-solid fa-tents text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 font-bold">Nenhuma seção cadastrada.</p>
          </div>
        ) : (
          initialTroops.map((troop) => (
            <div key={troop.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
              
              {/* Badge do Ramo */}
              <div className="absolute top-0 right-0 bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-widest border-b border-l border-gray-200">
                {troop.branch}
              </div>

              {/* Título da Tropa */}
              <div className="flex items-center gap-4 mb-4 pr-16 mt-1">
                <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-people-group"></i>
                </div>
                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                  {troop.name}
                </h3>
              </div>

              {/* Informações (Chefe e Membros) */}
              <div className="space-y-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-scout-yellow flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-user-shield text-xs"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Escotista Responsável</p>
                    {troop.manager ? (
                      <p className="text-sm font-bold text-gray-800 truncate">{troop.manager.name}</p>
                    ) : (
                      <p className="text-sm font-medium text-red-500 italic">Sem responsável</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-users text-xs"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jovens</p>
                    <p className="text-sm font-bold text-gray-800">{troop.members?.length || 0} membros</p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 mt-2">
                <button
                  onClick={() => handleOpenEdit(troop)}
                  className="cursor-pointer py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold border border-gray-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <i className="fa-solid fa-pen"></i> Editar
                </button>
                <button
                  onClick={() => handleDelete(troop.id)}
                  disabled={isLoading}
                  className="cursor-pointer py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold border border-red-200 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <i className="fa-solid fa-trash"></i> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==========================================
          VISÃO DESKTOP (TABELA)
      ========================================== */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-widest text-xs font-bold">
              <tr>
                <th className="p-4 w-1/3">Seção / Ramo</th>
                <th className="p-4 w-1/3">Escotista Responsável</th>
                <th className="p-4 text-center">Efetivo</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialTroops.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fa-solid fa-tents text-3xl text-gray-300"></i>
                      <span className="font-medium text-base">Nenhuma seção cadastrada no sistema.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                initialTroops.map((troop) => (
                  <tr key={troop.id} className="hover:bg-gray-50/80 transition-colors group">
                    
                    {/* Tropa e Ramo */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center text-lg shrink-0">
                          <i className="fa-solid fa-people-group"></i>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base">{troop.name}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                            {troop.branch}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Responsável */}
                    <td className="p-4 align-middle">
                      {troop.manager ? (
                        <div className="flex items-center gap-2.5 text-gray-800 font-bold">
                          <div className="w-6 h-6 rounded-full bg-scout-yellow/20 text-scout-yellow flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-user-shield text-xs"></i>
                          </div>
                          {troop.manager.name}
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100">Sem Responsável</span>
                      )}
                    </td>
                    
                    {/* Membros */}
                    <td className="p-4 align-middle text-center">
                      <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-bold">
                        <i className="fa-solid fa-users text-gray-400"></i>
                        {troop.members?.length || 0}
                      </div>
                    </td>
                    
                    {/* Ações */}
                    <td className="p-4 align-middle text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(troop)}
                          className="cursor-pointer w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-200 hover:text-gray-800 rounded-lg transition-colors border border-gray-200 shadow-sm"
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(troop.id)}
                          disabled={isLoading}
                          className="cursor-pointer w-8 h-8 flex items-center justify-center text-red-500 bg-white hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-red-200 shadow-sm disabled:opacity-50"
                          title="Excluir"
                        >
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <TroopFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          troopToEdit={troopToEdit}
          users={users}
        />
      )}
    </div>
  );
}