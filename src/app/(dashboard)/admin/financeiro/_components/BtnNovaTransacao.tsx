"use client";

import { useState } from "react";
import ModalNovaTransacao from "./ModalNovaTransacao";

export default function BtnNovaTransacao({ users }: { users: any[] }) {
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

      {/* Renderiza o modal e gerencia seu estado de abertura */}
      <ModalNovaTransacao 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        users={users} 
      />
    </>
  );
}