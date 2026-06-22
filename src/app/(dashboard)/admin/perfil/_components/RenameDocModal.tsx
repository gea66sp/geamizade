"use client";

import { useState } from "react";
import { renamePersonalDocument } from "../actions";

type RenameDocModalProps = {
  document: any;
  onClose: () => void;
};

export default function RenameDocModal({ document, onClose }: RenameDocModalProps) {
  const [title, setTitle] = useState(document?.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!document) return null;

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const result = await renamePersonalDocument(document.id, title);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Erro ao renomear.");
      }
    } catch (err) {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-scale-in">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-pen text-blue-500"></i> Renomear Documento
          </h3>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-red-500">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <form onSubmit={handleRename} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Novo Título</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              disabled={isSaving}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800"
            />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 flex justify-center items-center">
              {isSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}