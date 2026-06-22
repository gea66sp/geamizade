"use client";

import { useState } from "react";
import ModalRelatorio from "./ModalRelatorio"; // Certifique-se de que o nome do arquivo importado está correto

export default function BtnGerarRelatorio() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)} 
        className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-scout-green text-scout-green hover:bg-scout-green hover:text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
      >
        <i className="fa-solid fa-file-pdf text-sm"></i> 
        Relatório PDF
      </button>

      {/* Chama o modal de seleção de período real que criamos */}
      <ModalRelatorio 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}