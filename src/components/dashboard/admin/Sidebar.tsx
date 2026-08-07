"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface SidebarProps {
  userName?: string | null;
  userRole?: string;
  userImage?: string | null;
  isOpen?: boolean; 
  onClose?: () => void; 
}

export default function Sidebar({ 
  userName = "Chefe", 
  userRole = "ADMIN", 
  userImage = null, 
  isOpen = false, 
  onClose 
}: SidebarProps) {
  const pathname = usePathname();
  
  // Novo estado para controlar se a barra está expandida ou recolhida (apenas desktop)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Verifica se a rota começa com o caminho (para os submenus)
  const isActive = (path: string) => pathname?.startsWith(path);
  
  // Verifica se a rota é exatamente /admin (para o botão Início não ficar sempre aceso)
  const isExactActive = (path: string) => pathname === path || pathname === `${path}/`;

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
          fixed inset-y-0 left-0 z-40 bg-scout-dark text-gray-300 flex flex-col min-h-screen shadow-2xl shrink-0 
          transition-all duration-300 ease-in-out border-r border-white/5
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "md:w-20 w-64" : "w-64"}
        `}
      >
        {/* Botão flutuante de Expandir/Recolher (Apenas Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-9 z-50 w-6 h-6 bg-scout-yellow text-scout-dark rounded-full items-center justify-center hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,0,0,0.3)] border border-scout-dark"
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <i className={`fa-solid text-[10px] ${isCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`}></i>
        </button>

        {/* Detalhe visual superior com a cor da marca */}
        <div className="absolute top-0 left-0 w-full h-1 bg-scout-yellow" />

        {/* Header / Logo */}
        <div className={`p-6 pb-8 border-b border-white/10 flex items-center ${isCollapsed ? "md:justify-center justify-between" : "justify-between"}`}>
          <Link href="/admin" title="GE Amizade" className={`flex items-center gap-3 cursor-pointer group ${isCollapsed ? "md:gap-0" : ""}`}>
            <i className="fa-solid fa-fire text-scout-yellow text-2xl group-hover:scale-110 transition-transform duration-300 shrink-0"></i>
            <span className={`font-heading font-bold text-xl text-white tracking-wide transition-opacity duration-200 ${isCollapsed ? "hidden" : "block"}`}>
              GE Amizade
            </span>
          </Link>

          {/* Botão de fechar (X) visível apenas no mobile */}
          <button 
            onClick={onClose} 
            aria-label="Fechar menu"
            className="md:hidden text-gray-400 hover:text-scout-yellow p-2 w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          
          <Link 
            href="/admin"
            onClick={onClose}
            title="Início"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isExactActive("/admin") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-house text-lg w-5 text-center transition-colors shrink-0 ${isExactActive("/admin") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Início</span>
          </Link>

          {/* Divisor Visual quando Recolhido / Texto quando Expandido */}
          <div className={`text-xs font-bold text-scout-yellow uppercase tracking-widest mb-4 mt-6 px-6 whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>
            Gestão do Grupo
          </div>
          <div className={`hidden w-6 h-px bg-white/20 mx-auto mb-4 mt-6 ${isCollapsed ? "md:block" : ""}`}></div>

          <Link 
            href="/admin/usuarios"
            onClick={onClose}
            title="Membros"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/usuarios") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-users text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/usuarios") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Membros</span>
          </Link>

          <Link 
            href="/admin/financeiro"
            onClick={onClose}
            title="Financeiro"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/financeiro") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-money-bill-trend-up text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/financeiro") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Financeiro</span>
          </Link>

          <Link 
            href="/admin/calendario"
            onClick={onClose}
            title="Calendário"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/calendario") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-calendar-days text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/calendario") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Calendário</span>
          </Link>

          <Link 
            href="/admin/patrimonio"
            onClick={onClose}
            title="Patrimônio"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/patrimonio") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-warehouse text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/patrimonio") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Patrimônio</span>
          </Link>
            
          <Link 
            href="/admin/tropas"
            onClick={onClose}
            title="Tropas e Seções"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/tropas") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-users text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/tropas") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Tropas</span>
          </Link>

          {/* Divisor Visual quando Recolhido / Texto quando Expandido */}
          <div className={`text-xs font-bold text-scout-yellow uppercase tracking-widest mb-4 mt-6 px-6 whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>
            Gestão do Site
          </div>
          <div className={`hidden w-6 h-px bg-white/20 mx-auto mb-4 mt-6 ${isCollapsed ? "md:block" : ""}`}></div>

          <Link 
            href="/admin/transparencia"
            onClick={onClose}
            title="Portal da Transparência"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/transparencia") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-magnifying-glass-chart text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/transparencia") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Transparência</span>
          </Link>  

          <Link 
            href="/admin/personalizar"
            onClick={onClose}
            title="Personalizar Site"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/personalizar") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-palette text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/personalizar") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Personalizar Site</span>
          </Link>

          <Link 
            href="/admin/blog"
            onClick={onClose}
            title="Notícias e Blog"
            className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
              isActive("/admin/blog") 
                ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
          >
            <i className={`fa-solid fa-newspaper text-lg w-5 text-center transition-colors shrink-0 ${isActive("/admin/blog") ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Notícias / Blog</span>
          </Link>
        </nav>

        {/* Rodapé da Sidebar: Usuário e Sair */}
        <div className={`border-t border-white/10 bg-black/20 mt-auto shrink-0 transition-all duration-300 ${isCollapsed ? "md:p-2 p-4" : "p-4"}`}>
          
          <Link 
            href="/admin/perfil" 
            onClick={onClose}
            title="Editar meu perfil"
            className={`flex items-center mb-3 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer p-2 ${isCollapsed ? "md:justify-center justify-between" : "justify-between"}`}
          >
            <div className={`flex items-center overflow-hidden ${isCollapsed ? "md:gap-0 gap-3" : "gap-3"}`}>
              
              <div className="w-10 h-10 rounded-full bg-scout-green flex items-center justify-center text-scout-yellow font-bold uppercase shadow-inner shrink-0 transition-transform group-hover:scale-105 overflow-hidden border border-scout-green/50">
                {userImage ? (
                  <img src={userImage} alt={userName || "Usuário"} className="w-full h-full object-cover" />
                ) : (
                  userName?.charAt(0) || "U"
                )}
              </div>
              
              {/* Informações do usuário: Ocultas no desktop quando recolhido */}
              <div className={`overflow-hidden transition-opacity duration-200 ${isCollapsed ? "hidden" : "block"}`}>
                <p className="text-sm font-bold text-white truncate group-hover:text-scout-yellow transition-colors">
                  {userName}
                </p>
                <p className="text-[10px] text-scout-yellow/80 font-semibold tracking-widest uppercase truncate">
                  {userRole}
                </p>
              </div>
            </div>

            {/* Ícone de Lápis: Fica invisível se estiver no desktop e o painel encolhido */}
            <i className={`fa-solid fa-pen-to-square text-gray-500 group-hover:text-scout-yellow transition-colors shrink-0 pl-2 ${isCollapsed ? "hidden" : "block"}`}></i>
          </Link>

          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Encerrar Sessão"
            className={`cursor-pointer w-full flex items-center justify-center rounded-xl text-sm font-bold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 ${isCollapsed ? "md:px-0 md:py-3 gap-0" : "gap-2 px-4 py-3"}`}
          >
            <i className="fa-solid fa-arrow-right-from-bracket shrink-0 text-lg"></i>
            {/* Texto de Encerrar Sessão: Oculto no desktop quando recolhido */}
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}