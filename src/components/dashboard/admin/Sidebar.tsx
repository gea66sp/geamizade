"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface SidebarProps {
  userName?: string | null;
  userRole?: string;
  userImage?: string | null; // ADICIONADO: Prop para receber a foto
  isOpen?: boolean; 
  onClose?: () => void; 
}

export default function Sidebar({ 
  userName = "Chefe", 
  userRole = "ADMIN", 
  userImage = null, // Inicializa como nulo
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
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-scout-dark text-gray-300 flex flex-col min-h-screen shadow-2xl shrink-0 
          transform transition-transform duration-300 ease-in-out border-r border-white/5
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Detalhe visual superior com a cor da marca */}
        <div className="absolute top-0 left-0 w-full h-1 bg-scout-yellow" />

        {/* Header / Logo */}
        <div className="p-6 pb-8 border-b border-white/10 flex justify-between items-center">
          <Link href="/admin" className="flex items-center gap-3 cursor-pointer group">
            <i className="fa-solid fa-fire text-scout-yellow text-2xl group-hover:scale-110 transition-transform duration-300"></i>
            <span className="font-heading font-bold text-xl text-white tracking-wide">
              GE Amizade
            </span>
          </Link>

          {/* Botão de fechar (X) visível apenas no mobile */}
          <button 
            onClick={onClose} 
            aria-label="Fechar menu"
            className="md:hidden text-gray-400 hover:text-scout-yellow p-2 w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-scout-yellow uppercase tracking-widest mb-4 px-6">
            Gestão do Grupo
          </div>

          <Link 
            href="/admin/usuarios"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/usuarios") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-users text-lg w-5 text-center transition-colors ${isActive("/admin/usuarios") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Membros
          </Link>

          <Link 
            href="/admin/financeiro"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/financeiro") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-money-bill-trend-up text-lg w-5 text-center transition-colors ${isActive("/admin/financeiro") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Financeiro
          </Link>

          <Link 
            href="/admin/calendario"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/calendario") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-calendar-days text-lg w-5 text-center transition-colors ${isActive("/admin/calendario") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Calendário
          </Link>

          <Link 
            href="/admin/patrimonio"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/patrimonio") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-warehouse text-lg w-5 text-center transition-colors ${isActive("/admin/patrimonio") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Patrimônio
          </Link>
            
          <Link 
            href="/admin/tropas"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/tropas") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-users text-lg w-5 text-center transition-colors ${isActive("/admin/tropas") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Tropas
          </Link>

          <div className="text-xs font-bold text-scout-yellow uppercase tracking-widest mb-4 mt-6 px-6">
            Gestão do Site
          </div>

          <Link 
            href="/admin/transparencia"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/transparencia") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-magnifying-glass-chart text-lg w-5 text-center transition-colors ${isActive("/admin/transparencia") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Transparência
          </Link>  

          <Link 
            href="/admin/personalizar"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/personalizar") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-palette text-lg w-5 text-center transition-colors ${isActive("/admin/personalizar") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Personalizar Site
          </Link>

          {/* === NOVO LINK DO BLOG AQUI === */}
          <Link 
            href="/admin/blog"
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/blog") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid fa-newspaper text-lg w-5 text-center transition-colors ${isActive("/admin/blog") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            Notícias / Blog
          </Link>
        </nav>

        {/* Rodapé da Sidebar: Usuário e Sair */}
        <div className="p-4 border-t border-white/10 bg-black/20 mt-auto shrink-0">
          
          <Link 
            href="/admin/perfil" 
            onClick={onClose}
            className="flex items-center justify-between p-2 mb-3 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
            title="Editar meu perfil"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              
              {/* === AVATAR ATUALIZADO AQUI === */}
              <div className="w-10 h-10 rounded-full bg-scout-green flex items-center justify-center text-scout-yellow font-bold uppercase shadow-inner shrink-0 transition-transform group-hover:scale-105 overflow-hidden border border-scout-green/50">
                {userImage ? (
                  <img src={userImage} alt={userName || "Usuário"} className="w-full h-full object-cover" />
                ) : (
                  userName?.charAt(0) || "U"
                )}
              </div>
              
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate group-hover:text-scout-yellow transition-colors">
                  {userName}
                </p>
                <p className="text-xs text-scout-yellow/80 font-semibold tracking-wide truncate">
                  {userRole}
                </p>
              </div>
            </div>
            <i className="fa-solid fa-pen-to-square text-gray-500 group-hover:text-scout-yellow transition-colors pl-2"></i>
          </Link>

          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 "
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Encerrar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}