"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import NotificationBell from "@/src/components/dashboard/NotificationBell";

interface ChefeSidebarProps {
  userName?: string | null;
  userRole?: string;
  userImage?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: "/chefe", label: "Início", icon: "fa-house", exact: true },
  { href: "/chefe/tropa", label: "Minha Tropa", icon: "fa-users" },
  { href: "/chefe/calendario", label: "Calendário", icon: "fa-calendar-days" },
  { href: "/chefe/financeiro", label: "Financeiro", icon: "fa-coins" },
  { href: "/chefe/patrimonio", label: "Patrimônio", icon: "fa-boxes-stacked" },
  { href: "/chefe/notificacoes", label: "Notificações", icon: "fa-bell" },
  { href: "/chefe/blog", label: "Blog da Tropa", icon: "fa-newspaper" },
];

export default function ChefeSidebar({
  userName = "Chefe",
  userRole = "CHEFE",
  userImage = null,
  isOpen = false,
  onClose,
}: ChefeSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path || pathname === `${path}/` : pathname?.startsWith(path);

  return (
    <>
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
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-9 z-50 w-6 h-6 bg-scout-yellow text-scout-dark rounded-full items-center justify-center hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,0,0,0.3)] border border-scout-dark"
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <i className={`fa-solid text-[10px] ${isCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`}></i>
        </button>

        <div className="absolute top-0 left-0 w-full h-1 bg-scout-yellow" />

        <div className={`p-6 pb-8 border-b border-white/10 flex items-center ${isCollapsed ? "md:justify-center justify-between" : "justify-between"}`}>
          <Link href="/chefe" title="GE Amizade" className={`flex items-center gap-3 cursor-pointer group ${isCollapsed ? "md:gap-0" : ""}`}>
            <i className="fa-solid fa-fire text-scout-yellow text-2xl group-hover:scale-110 transition-transform duration-300 shrink-0"></i>
            <span className={`font-heading font-bold text-xl text-white tracking-wide transition-opacity duration-200 ${isCollapsed ? "hidden" : "block"}`}>
              GE Amizade
            </span>
          </Link>

          <div className={`flex items-center gap-1 ${isCollapsed ? "md:hidden" : ""}`}>
            <NotificationBell basePath="/chefe" tone="dark" onNavigate={onClose} />

            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="md:hidden text-gray-400 hover:text-scout-yellow p-2 w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <div className={`text-xs font-bold text-scout-yellow uppercase tracking-widest mb-4 px-6 whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>
            Minha Tropa
          </div>
          <div className={`hidden w-6 h-px bg-white/20 mx-auto mb-4 ${isCollapsed ? "md:block" : ""}`}></div>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={item.label}
                className={`flex items-center px-6 py-3.5 transition-all duration-200 group border-l-4 ${
                  active
                    ? "border-scout-yellow bg-white/5 text-scout-yellow font-bold"
                    : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                } ${isCollapsed ? "md:px-0 md:justify-center gap-0" : "gap-3"}`}
              >
                <i className={`fa-solid ${item.icon} text-lg w-5 text-center transition-colors shrink-0 ${active ? "text-scout-yellow" : "text-gray-500 group-hover:text-white"}`}></i>
                <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-white/10 bg-black/20 mt-auto shrink-0 transition-all duration-300 ${isCollapsed ? "md:p-2 p-4" : "p-4"}`}>
          <Link
            href="/chefe/perfil"
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

              <div className={`overflow-hidden transition-opacity duration-200 ${isCollapsed ? "hidden" : "block"}`}>
                <p className="text-sm font-bold text-white truncate group-hover:text-scout-yellow transition-colors">
                  {userName}
                </p>
                <p className="text-[10px] text-scout-yellow/80 font-semibold tracking-widest uppercase truncate">
                  {userRole}
                </p>
              </div>
            </div>

            <i className={`fa-solid fa-pen-to-square text-gray-500 group-hover:text-scout-yellow transition-colors shrink-0 pl-2 ${isCollapsed ? "hidden" : "block"}`}></i>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Encerrar Sessão"
            className={`cursor-pointer w-full flex items-center justify-center rounded-xl text-sm font-bold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 ${isCollapsed ? "md:px-0 md:py-3 gap-0" : "gap-2 px-4 py-3"}`}
          >
            <i className="fa-solid fa-arrow-right-from-bracket shrink-0 text-lg"></i>
            <span className={`whitespace-nowrap ${isCollapsed ? "hidden" : "block"}`}>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}
