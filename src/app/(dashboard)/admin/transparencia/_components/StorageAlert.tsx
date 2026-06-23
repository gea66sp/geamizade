"use client";

import { useState } from "react";

export default function StorageAlert() {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div className="relative flex items-start gap-3.5 text-sm text-gray-600 bg-blue-50/80 p-4 pr-12 rounded-xl border border-blue-100 animate-fade-in">
      <i className="fa-solid fa-circle-info text-blue-500 text-lg mt-0.5 shrink-0"></i>
      
      <p className="leading-relaxed">
        O tamanho máximo permitido para envios é de <strong className="text-gray-800">500 MB por arquivo</strong>. 
        Para solicitar o aumento do limite individual de arquivo ou expandir o armazenamento total, entre em contato com o administrador do sistema. O tamanho real utilizado pode variar, pois fotos de perfil, avatares e outros arquivos relacionados ao usuário também consomem espaço de armazenamento.
      </p>

      {/* Botão de Fechar */}
      <button 
        type="button"
        onClick={() => setShow(false)}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
        aria-label="Fechar aviso"
      >
        <i className="fa-solid fa-xmark text-base"></i>
      </button>
    </div>
  );
}