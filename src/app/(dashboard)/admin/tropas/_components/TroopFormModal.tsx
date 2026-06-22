"use client";

import { useState, useEffect } from "react";
import { saveTroop } from "../actions";

export default function TroopFormModal({
  isOpen,
  onClose,
  troopToEdit,
  managers,
}: {
  isOpen: boolean;
  onClose: () => void;
  troopToEdit?: any;
  managers: any[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    branch: "ESCOTEIRO",
    description: "",
    managerId: "",
  });

  useEffect(() => {
    if (troopToEdit) {
      setFormData({
        name: troopToEdit.name || "",
        branch: troopToEdit.branch || "ESCOTEIRO",
        description: troopToEdit.description || "",
        managerId: troopToEdit.managerId || "",
      });
    } else {
      setFormData({ name: "", branch: "ESCOTEIRO", description: "", managerId: "" });
    }
  }, [troopToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await saveTroop({
      id: troopToEdit?.id,
      name: formData.name,
      branch: formData.branch,
      description: formData.description,
      managerId: formData.managerId,
    });

    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
        
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className={`fa-solid ${troopToEdit ? "fa-pen" : "fa-tents"} text-xl`}></i>
            </div>
            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                {troopToEdit ? "Editar Seção" : "Nova Seção Escoteira"}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Defina o ramo e o chefe responsável.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <form id="troopForm" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Nome da Seção <span className="text-red-500">*</span></label>
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
                  <option value="LOBINHO">Ramo Lobinho (Alcateia)</option>
                  <option value="ESCOTEIRO">Ramo Escoteiro</option>
                  <option value="SENIOR">Ramo Sênior</option>
                  <option value="PIONEIRO">Ramo Pioneiro (Clã)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Descrição / Lema</label>
              <textarea
                rows={2}
                placeholder="História da tropa, lema ou informações úteis..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all resize-none text-gray-800"
              />
            </div>

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
                  <option value="">Nenhum responsável definido...</option>
                  {managers.map((chefe) => (
                    <option key={chefe.id} value={chefe.id}>{chefe.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-3xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-6 py-3 text-sm text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="troopForm" disabled={isLoading} className="flex items-center gap-2 px-8 py-3 bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-95 disabled:opacity-70">
            {isLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</> : <><i className="fa-solid fa-check"></i> Salvar</>}
          </button>
        </div>
        
      </div>
    </div>
  );
}