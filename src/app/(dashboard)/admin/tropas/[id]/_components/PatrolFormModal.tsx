"use client";

import { useState, useEffect } from "react";
import { savePatrolInternal } from "../actions";

export default function PatrolFormModal({
  isOpen,
  onClose,
  patrolToEdit,
  troopId,
}: {
  isOpen: boolean;
  onClose: () => void;
  patrolToEdit?: any;
  troopId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (patrolToEdit) {
      setName(patrolToEdit.name || "");
    } else {
      setName("");
    }
  }, [patrolToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);

    const res = await savePatrolInternal({
      id: patrolToEdit?.id,
      name: name,
      troopId: troopId,
    });

    setIsLoading(false);
    if (res.success) {
      onClose();
    } else {
      alert(res.error || "Erro ao salvar patrulha.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-150 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-heading text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-paw text-amber-500"></i>
            {patrolToEdit ? "Editar Patrulha/Matilha" : "Nova Patrulha/Matilha"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Nome da Patrulha / Matilha <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Ex: Patrulha Águia, Matilha Cinza..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-semibold text-gray-800"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 text-sm text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 text-sm bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}