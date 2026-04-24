"use client";

import { useState, useEffect } from "react";
import { saveTroop } from "../actions";

export default function TroopFormModal({
  isOpen,
  onClose,
  troopToEdit,
  users,
}: {
  isOpen: boolean;
  onClose: () => void;
  troopToEdit?: any;
  users: any[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    branch: "ESCOTEIRO",
    description: "",
    managerId: "",
  });
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Carrega os dados se for edição
  useEffect(() => {
    if (troopToEdit) {
      setFormData({
        name: troopToEdit.name || "",
        branch: troopToEdit.branch || "ESCOTEIRO",
        description: troopToEdit.description || "",
        managerId: troopToEdit.managerId || "",
      });
      setSelectedMembers(troopToEdit.members.map((m: any) => m.id));
    } else {
      // Reseta caso o usuário feche a edição e abra um "Novo"
      setFormData({
        name: "",
        branch: "ESCOTEIRO",
        description: "",
        managerId: "",
      });
      setSelectedMembers([]);
    }
  }, [troopToEdit, isOpen]);

  if (!isOpen) return null;

  // Filtra os usuários para mostrar na lista de seleção 
  // (Filtramos por MEMBER para não mostrar os Chefes aqui)
  const filteredUsers = users.filter((u) => 
    u.role === "MEMBER" && u.name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await saveTroop({
      id: troopToEdit?.id,
      name: formData.name,
      branch: formData.branch,
      description: formData.description,
      managerId: formData.managerId,
      memberIds: selectedMembers,
    });

    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
        
        {/* ==========================================
            CABEÇALHO DO MODAL
        ========================================== */}
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className={`fa-solid ${troopToEdit ? "fa-pen" : "fa-users-line"} text-xl`}></i>
            </div>
            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                {troopToEdit ? "Editar Seção" : "Nova Seção Escoteira"}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Defina o ramo, o responsável e os jovens.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* ==========================================
            CORPO DO MODAL (COM SCROLL)
        ========================================== */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form id="troopForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Nome da Tropa/Alcateia <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-tents text-gray-400"></i>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Tropa Xavante"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800"
                  />
                </div>
              </div>

              {/* Ramo */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Ramo <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-leaf text-gray-400"></i>
                  </div>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-bold text-gray-800 appearance-none cursor-pointer"
                  >
                    <option value="LOBINHO">Ramo Lobinho</option>
                    <option value="ESCOTEIRO">Ramo Escoteiro</option>
                    <option value="SENIOR">Ramo Sênior</option>
                    <option value="PIONEIRO">Ramo Pioneiro</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Descrição / Lema</label>
              <textarea
                rows={2}
                placeholder="Breve descrição, grito de guerra, história da tropa..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all resize-none text-gray-800 custom-scrollbar"
              />
            </div>

            <div className="border-t border-gray-100"></div>

            {/* Chefe Responsável */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <i className="fa-solid fa-user-shield text-scout-yellow"></i>
                Escotista Responsável (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-user-tie text-gray-400"></i>
                </div>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="">Nenhum responsável definido ainda...</option>
                  {users
                    .filter((u) => u.role === "CHEFE" || u.role === "ADMIN")
                    .map((chefe) => (
                      <option key={chefe.id} value={chefe.id}>
                        {chefe.name}
                      </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100"></div>

            {/* Seleção de Membros */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <i className="fa-solid fa-users text-scout-green"></i>
                  Adicionar Jovens à Seção
                </label>
                <span className="bg-scout-green text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm w-fit">
                  {selectedMembers.length} Jovens Vinculados
                </span>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Buscar jovem pelo nome..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all shadow-sm"
                />
              </div>

              <div className="border border-gray-200 rounded-xl max-h-62.5 overflow-y-auto p-3 bg-gray-50 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm font-medium text-gray-500 p-6 text-center md:col-span-2">
                    Nenhum jovem encontrado com esse nome.
                  </p>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedMembers.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-scout-green/5 border-scout-green shadow-sm" 
                            : "bg-white border-transparent hover:border-gray-200 shadow-sm"
                        }`}
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(user.id)}
                            className="w-5 h-5 opacity-0 absolute cursor-pointer"
                          />
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                            isSelected ? "bg-scout-green border-scout-green text-white" : "border-gray-300"
                          }`}>
                            {isSelected && <i className="fa-solid fa-check text-xs"></i>}
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-sm font-bold truncate ${isSelected ? "text-scout-green" : "text-gray-800"}`}>
                            {user.name || "Jovem sem Nome"}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Ramo {user.branch || "Indefinido"}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

          </form>
        </div>

        {/* ==========================================
            RODAPÉ DO MODAL
        ========================================== */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer w-full sm:w-auto px-6 py-3.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors font-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="troopForm"
            disabled={isLoading}
            className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-scout-green text-white rounded-xl hover:bg-green-700 transition-all font-bold disabled:opacity-70 active:scale-95 shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
            ) : (
              <><i className="fa-solid fa-check"></i> Salvar Seção</>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}