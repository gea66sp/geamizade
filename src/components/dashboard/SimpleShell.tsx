"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import NotificationBell from "@/src/components/dashboard/NotificationBell";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

interface SimpleShellProps {
  children: React.ReactNode;
  title: string;
  homeHref: string;
  navItems: NavItem[];
  userName?: string | null;
  userRole?: string;
  userImage?: string | null;
}

// Shell enxuto e parametrizável, reaproveitado pelas áreas de membro e
// responsável (navegação simples, poucos itens). Admin e chefe têm shells
// próprios porque têm bem mais itens de navegação.
export default function SimpleShell({
  children,
  title,
  homeHref,
  navItems,
  userName = "Usuário",
  userRole = "",
  userImage = null,
}: SimpleShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href || pathname === `${item.href}/` : pathname?.startsWith(item.href);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      <header className="bg-scout-dark text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-3 font-heading font-bold text-lg tracking-wide">
            <i className="fa-solid fa-fire text-scout-yellow text-xl"></i>
            {title}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isActive(item)
                    ? "bg-white/10 text-scout-yellow"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`fa-solid ${item.icon} mr-2`}></i>
                {item.label}
              </Link>
            ))}
            <NotificationBell basePath={homeHref} tone="dark" />

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer px-4 py-2 rounded-lg text-sm font-bold text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>
              Sair
            </button>
          </nav>

          <div className="md:hidden flex items-center gap-1">
            <NotificationBell basePath={homeHref} tone="dark" onNavigate={() => setIsOpen(false)} />

            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isOpen}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"} text-lg`}></i>
            </button>
          </div>
        </div>

        <div
          className={`md:hidden bg-scout-dark/95 border-t border-white/10 overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-bold ${
                  isActive(item) ? "bg-white/10 text-scout-yellow" : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <i className={`fa-solid ${item.icon} mr-2`}></i>
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-gray-300 hover:bg-red-500/10 hover:text-red-400"
            >
              <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-3 max-w-5xl mx-auto w-full px-4 md:px-6 pt-6">
        <div className="w-9 h-9 rounded-full bg-scout-green flex items-center justify-center text-scout-yellow font-bold uppercase shrink-0 overflow-hidden border border-scout-green/50">
          {userImage ? (
            <img src={userImage} alt={userName || "Usuário"} className="w-full h-full object-cover" />
          ) : (
            userName?.charAt(0) || "U"
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 leading-tight">{userName}</p>
          <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">{userRole}</p>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6">{children}</main>
    </div>
  );
}
