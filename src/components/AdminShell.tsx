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
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Menu Lateral que agora recebe o controle de estado */}
      <Sidebar 
        userName={userName} 
        userRole={userRole} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Container principal (Conteúdo + Header Mobile) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Cabeçalho Mobile com Botão Hambúrguer (Oculto no Desktop) */}
        <header className="md:hidden flex items-center justify-between p-4 bg-stone-900 text-stone-100 shadow-md z-10">
          <div className="font-bold text-lg tracking-wide flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            GE Amizade
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Área onde as páginas vão renderizar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}