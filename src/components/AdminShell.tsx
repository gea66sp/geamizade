"use client";

import { useState } from "react";
import Sidebar from "./Sidebar"; // Ajuste o caminho se necessário

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string | null;
  userRole?: string;
}

export default function AdminShell({ children, userName, userRole }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // Fundo alterado para bg-gray-50 (neutro e limpo) para destacar os 'cards' brancos do painel
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      {/* Menu Lateral que agora recebe o controle de estado */}
      <Sidebar 
        userName={userName} 
        userRole={userRole} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Container principal (Conteúdo + Header Mobile) */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        
        {/* Cabeçalho Mobile - Sincronizado com o Design System */}
        <header className="md:hidden flex items-center justify-between p-4 bg-scout-dark text-white shadow-md z-10 border-b border-scout-yellow/20">
          <div className="font-heading font-bold text-xl tracking-wide flex items-center gap-3">
            <i className="fa-solid fa-fire text-scout-yellow text-2xl"></i>
            GE Amizade
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menu administrativo"
            aria-expanded={isSidebarOpen}
            className="p-2 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-scout-yellow transition-all"
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
        </header>

        {/* Área onde as páginas vão renderizar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          {/* O max-w-7xl previne que o conteúdo estique demais em monitores ultrawide */}
          <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}