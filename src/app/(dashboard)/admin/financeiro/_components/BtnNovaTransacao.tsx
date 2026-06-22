"use client";

import { useState } from "react";
import ModalNovaTransacao from "./ModalNovaTransacao";

// Agora tipamos corretamente para receber as tropas também!
export default function BtnNovaTransacao({ users, troops }: { users: any[], troops: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-full sm:w-auto px-6 py-3 bg-scout-green hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
      >
        <i className="fa-solid fa-plus text-sm"></i>
        Novo Lançamento
      </button>

      {/* Renderiza o modal repassando os usuários E as tropas */}
      <ModalNovaTransacao 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        users={users} 
        troops={troops} // <-- NOVO: Repassando as tropas para o modal
      />
    </>
  );
}