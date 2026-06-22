"use client";

import { useState } from "react";
import Link from "next/link";
import TroopFormModal from "./TroopFormModal";
import { deleteTroop } from "../actions";

export default function TroopClient({ initialTroops, managers }: { initialTroops: any[], managers: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [troopToEdit, setTroopToEdit] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenNew = () => {
    setTroopToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (troop: any) => {
    setTroopToEdit(troop);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("ATENÇÃO: Excluir uma Tropa apagará permanentemente todas as suas Patrulhas e Lançamentos Financeiros associados! Tem certeza absoluta?")) {
      setIsLoading(true);
      await deleteTroop(id);
      setIsLoading(false);
    }
  };

  const branchStyles: Record<string, string> = {
    LOBINHO: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ESCOTEIRO: "bg-green-100 text-green-800 border-green-200",
    SENIOR: "bg-rose-100 text-rose-800 border-rose-200",
    PIONEIRO: "bg-red-100 text-red-800 border-red-200",
    DIRETORIA: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-end">
        <button
          onClick={handleOpenNew}
          className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-scout-green text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <i className="fa-solid fa-plus"></i> Nova Seção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialTroops.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-gray-200 text-center shadow-sm">
            <i className="fa-solid fa-tents text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 font-bold">Nenhuma Seção cadastrada.</p>
          </div>
        ) : (
          initialTroops.map((troop) => (
            <div key={troop.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              
              <div className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-widest border-b border-l ${branchStyles[troop.branch] || "bg-gray-100 text-gray-600"}`}>
                {troop.branch}
              </div>

              <div className="p-6 flex-1">
                <div className="flex items-center gap-4 mb-5 pr-16">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 group-hover:bg-scout-green/10 group-hover:text-scout-green transition-all">
                    <i className="fa-solid fa-people-group"></i>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-gray-900 leading-tight">
                      {troop.name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-scout-yellow flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-user-shield text-xs"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Escotista Responsável</p>
                      {troop.manager ? (
                        <p className="text-sm font-bold text-gray-800 truncate">{troop.manager.name}</p>
                      ) : (
                        <p className="text-sm font-medium text-red-500 italic">Não designado</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200/60">
                     <div className="text-center">
                        <p className="text-lg font-black text-gray-700">{troop._count.members}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Membros</p>
                     </div>
                     <div className="text-center border-l border-gray-200/60">
                        <p className="text-lg font-black text-gray-700">{troop._count.patrols}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Patrulhas</p>
                     </div>
                  </div>
                </div>
              </div>

              {/* RODAPÉ DO CARD */}
              <div className="grid grid-cols-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => handleOpenEdit(troop)}
                  className="py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 text-sm font-bold border-r border-gray-100 flex items-center justify-center transition-colors"
                  title="Editar Informações"
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button
                  onClick={() => handleDelete(troop.id)}
                  disabled={isLoading}
                  className="py-3 text-red-400 hover:text-red-600 hover:bg-red-50 text-sm font-bold border-r border-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Apagar Tropa"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
                
                {/* O GRANDE BOTÃO DE INTEGRAÇÃO */}
                <Link 
                  href={`/admin/tropas/${troop.id}`}
                  className="py-3 text-scout-green hover:bg-scout-green hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  Gerenciar <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>

            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <TroopFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          troopToEdit={troopToEdit}
          managers={managers}
        />
      )}
    </div>
  );
}