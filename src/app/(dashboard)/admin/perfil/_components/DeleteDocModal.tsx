"use client";

import { useState } from "react";
import { deletePersonalDocument } from "../actions";

type DeleteDocModalProps = {
  document: any;
  onClose: () => void;
};

export default function DeleteDocModal({ document, onClose }: DeleteDocModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!document) return null;

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    try {
      const result = await deletePersonalDocument(document.id, document.fileUrl);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Erro ao eliminar.");
      }
    } catch (err) {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-scale-in">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 className="font-bold text-xl text-gray-800">Eliminar Ficheiro?</h3>
          <p className="text-sm text-gray-500">Tem a certeza de que deseja eliminar o documento <strong>{document.title}</strong>? Esta ação removerá o ficheiro permanentemente.</p>
          {error && <p className="text-sm text-red-600 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button type="button" onClick={onClose} disabled={isDeleting} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">Cancelar</button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 flex justify-center items-center">
            {isDeleting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Sim, Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}