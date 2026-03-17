"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface SidebarProps {
  userName?: string | null;
  userRole?: string;
  isOpen?: boolean; // Controle de abertura no mobile
  onClose?: () => void; // Função para fechar no mobile
}

export default function Sidebar({ 
  userName = "Chefe", 
  userRole = "ADMIN", 
  isOpen = false, 
  onClose 
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <>
      {/* Overlay escuro para mobile (clicar fora fecha a sidebar) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-stone-900 text-stone-300 flex flex-col min-h-screen shadow-2xl shrink-0 
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-emerald-700" />

        <div className="p-6 pb-8 border-b border-stone-800 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white font-bold text-xl tracking-wide">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-inner drop-shadow-md shrink-0">
              <svg className="w-6 h-6 text-emerald-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            GE Amizade
          </div>

          {/* Botão de fechar (X) visível apenas no mobile */}
          <button 
            onClick={onClose} 
            className="md:hidden text-stone-400 hover:text-white p-1 rounded-md bg-stone-800 hover:bg-stone-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4 px-3 mt-4">
            Gestão
          </div>

          <Link 
            href="/admin/transparencia"
            onClick={onClose} // Fecha a sidebar ao clicar em um link no mobile
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive("/admin/transparencia") 
                ? "bg-emerald-600/10 text-emerald-400 font-semibold" 
                : "hover:bg-stone-800 hover:text-stone-100"
            }`}
          >
            <svg className={`w-5 h-5 transition-colors ${isActive("/admin/transparencia") ? "text-emerald-400" : "text-stone-500 group-hover:text-stone-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Transparência
          </Link>
        </nav>

        <div className="p-4 border-t border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-emerald-500 font-bold uppercase shrink-0">
              {userName?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-stone-200 truncate">{userName}</p>
              <p className="text-xs text-stone-500 truncate">{userRole}</p>
            </div>
          </div>

          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-stone-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Encerrar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}