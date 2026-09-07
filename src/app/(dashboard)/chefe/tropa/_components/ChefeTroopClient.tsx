"use client";

import { useState } from "react";
import {
  toggleTroopMember,
  moveMemberToPatrol,
  setPatrolLeadership,
  deletePatrolInternal,
} from "@/src/app/(dashboard)/admin/tropas/[id]/actions";
import PatrolFormModal from "@/src/app/(dashboard)/admin/tropas/[id]/_components/PatrolFormModal";
import MembroFormModal, { type MembroParaEditar } from "@/src/components/dashboard/chefe/MembroFormModal";

type Member = {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  image: string | null;
  role: string;
};
type Patrol = {
  id: string;
  name: string;
  leaderId: string | null;
  subLeaderId: string | null;
  members: Member[];
};
type Troop = {
  id: string;
  name: string;
  patrols: Patrol[];
  members: Member[];
};
type AvailableYouth = { id: string; name: string | null; branch: string | null; image: string | null };

export default function ChefeTroopClient({
  troop,
  availableYouth,
}: {
  troop: Troop;
  availableYouth: AvailableYouth[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPatrolModalOpen, setIsPatrolModalOpen] = useState(false);
  const [patrolToEdit, setPatrolToEdit] = useState<Patrol | null>(null);

  // Cadastro/edição de jovem da seção. `null` = cadastro novo.
  const [isMembroModalOpen, setMembroModalOpen] = useState(false);
  const [membroParaEditar, setMembroParaEditar] = useState<MembroParaEditar | null>(null);

  const abrirNovoMembro = () => {
    setMembroParaEditar(null);
    setMembroModalOpen(true);
  };

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
    const res = await moveMemberToPatrol(userId, targetPatrolId, troop.id);
    if (res?.error) alert(res.error);
    setIsLoading(false);
  };

  const handleAddYouthToTroop = async (userId: string) => {
    setIsLoading(true);
    const res = await toggleTroopMember(userId, troop.id);
    if (res?.error) alert(res.error);
    setIsLoading(false);
  };

  const handleRemoveYouthFromTroop = async (userId: string) => {
    if (confirm("Você tem certeza que deseja remover este jovem da Tropa?")) {
      setIsLoading(true);
      const res = await toggleTroopMember(userId, null);
      if (res?.error) alert(res.error);
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
      const res = await deletePatrolInternal(patrolId, troop.id);
      if (res?.error) alert(res.error);
      setIsLoading(false);
    }
  };

  const YouthCard = ({ member, patrolId = null }: { member: Member; patrolId?: string | null }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, member.id)}
      onDragEnd={handleDragEnd}
      className="flex items-center justify-between p-3 mb-2 bg-white border border-gray-200 rounded-xl shadow-sm cursor-grab hover:border-scout-green hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
          {member.image ? (
            <img src={member.image} alt={member.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <i className="fa-solid fa-user text-xs"></i>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-800 leading-tight">{member.name}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Membro</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            setMembroParaEditar({ id: member.id, name: member.name, email: member.email ?? null, phone: member.phone ?? null });
            setMembroModalOpen(true);
          }}
          title="Editar dados"
          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-pen text-xs"></i>
        </button>

        {!patrolId && (
          <button
            onClick={() => handleRemoveYouthFromTroop(member.id)}
            title="Remover da tropa"
            className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-100 flex items-center justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-scout-green">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i> Atualizando dados...
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start animate-fade-in">
        <div
          className="w-full lg:w-1/3 bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col h-150"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200/60 shrink-0">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-user-clock text-gray-400"></i>
              <h2 className="font-bold text-gray-700 text-lg">Sem Patrulha</h2>
            </div>
            <span className="bg-gray-200 text-gray-700 text-xs font-black px-2.5 py-1 rounded-md">{troop.members.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {troop.members.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium text-sm bg-white/50">
                Nenhum jovem aguardando patrulha.
              </div>
            ) : (
              troop.members.map((m) => <YouthCard key={m.id} member={m} />)
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 shrink-0 space-y-3">
            <button
              onClick={abrirNovoMembro}
              className="cursor-pointer w-full flex items-center justify-center gap-2 bg-scout-green hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-user-plus"></i>
              Cadastrar novo jovem
            </button>

            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
              Ou trazer um jovem já cadastrado
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) handleAddYouthToTroop(e.target.value);
                e.target.value = "";
              }}
              className="w-full p-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-scout-green cursor-pointer font-medium text-gray-700 shadow-sm"
            >
              <option value="">Selecione um jovem sem tropa...</option>
              {availableYouth.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Organização de Patrulhas</h3>
              <p className="text-xs text-gray-400 mt-0.5">Crie matilhas ou patrulhas para esta tropa.</p>
            </div>
            <button
              onClick={() => {
                setPatrolToEdit(null);
                setIsPatrolModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-plus"></i> Criar Patrulha
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {troop.patrols.map((patrol) => (
              <div
                key={patrol.id}
                className="bg-white border-2 border-transparent hover:border-amber-200 rounded-2xl shadow-sm transition-colors flex flex-col h-130 overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, patrol.id)}
              >
                <div className="bg-amber-50/70 p-4 border-b border-amber-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-paw text-amber-500 text-base"></i>
                    <h3 className="font-bold text-amber-900 font-heading text-base">{patrol.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                      {patrol.members.length} Jovens
                    </span>
                    <button
                      onClick={() => {
                        setPatrolToEdit(patrol);
                        setIsPatrolModalOpen(true);
                      }}
                      className="text-gray-400 hover:text-blue-500 cursor-pointer p-0.5"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button onClick={() => handleDeletePatrol(patrol.id)} className="text-gray-400 hover:text-red-500 cursor-pointer p-0.5">
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-star text-amber-400 w-4 text-center text-xs"></i>
                    <select
                      value={patrol.leaderId || ""}
                      onChange={(e) => handleLeadershipChange(patrol.id, e.target.value || null, patrol.subLeaderId)}
                      className="flex-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded p-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="">Monitor / Primo (Não definido)</option>
                      {patrol.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-regular fa-star text-gray-400 w-4 text-center text-xs"></i>
                    <select
                      value={patrol.subLeaderId || ""}
                      onChange={(e) => handleLeadershipChange(patrol.id, patrol.leaderId, e.target.value || null)}
                      className="flex-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded p-1.5 focus:outline-none focus:border-gray-400 cursor-pointer"
                    >
                      <option value="">Submonitor / Segundo (Não definido)</option>
                      {patrol.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50/30">
                  {patrol.members.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium text-xs bg-white/40">
                      Arraste jovens aqui para vinculá-los
                    </div>
                  ) : (
                    patrol.members.map((m) => (
                      <div key={m.id} className="relative">
                        {patrol.leaderId === m.id && (
                          <i className="fa-solid fa-star absolute -left-1.5 -top-1.5 text-amber-400 z-10 text-xs drop-shadow-sm" title="Monitor"></i>
                        )}
                        {patrol.subLeaderId === m.id && (
                          <i
                            className="fa-regular fa-star absolute -left-1.5 -top-1.5 text-gray-400 z-10 text-xs drop-shadow-sm bg-white rounded-full"
                            title="Submonitor"
                          ></i>
                        )}
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

      {isPatrolModalOpen && (
        <PatrolFormModal isOpen={isPatrolModalOpen} onClose={() => setIsPatrolModalOpen(false)} patrolToEdit={patrolToEdit} troopId={troop.id} />
      )}

      <MembroFormModal
        key={membroParaEditar?.id ?? "novo"}
        isOpen={isMembroModalOpen}
        onClose={() => setMembroModalOpen(false)}
        troopId={troop.id}
        troopName={troop.name}
        membro={membroParaEditar}
      />
    </div>
  );
}
