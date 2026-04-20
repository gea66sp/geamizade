"use client";

import { useState } from "react";
import { deleteUser } from "../actions";
import { useRouter } from "next/navigation";

interface ModalExcluirUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string | null;
}

export default function ModalExcluirUsuario({ isOpen, onClose, userId, userName }: ModalExcluirUsuarioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  if (!isOpen || !userId) return null;

  async function handleDelete() {
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await deleteUser(userId!);
      if (res.success) {
        setMessage({ text: "Usuário excluído permanentemente.", type: "success" });
        setTimeout(() => {
          router.refresh(); // Atualiza a tabela por baixo
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ text: res.error || "Erro ao excluir.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Erro de conexão com o servidor.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative text-center">
        
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
          <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
        </div>
        
        <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">Excluir Usuário?</h3>
        <p className="text-gray-500 text-sm mb-6">
          Você está prestes a excluir permanentemente <strong>{userName || "este usuário"}</strong>. Esta ação não pode ser desfeita e removerá todos os acessos dele.
        </p>

        {message && (
          <div className={`mb-6 p-3 rounded-xl text-sm font-bold ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onClose} disabled={isLoading} className="cursor-pointer flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={isLoading} className="cursor-pointer flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-trash-can"></i>}
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  );
}