"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-scout-green text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo / Nome */}
          <Link href="/" className="shrink-0 flex items-center gap-3 cursor-pointer group">
            <i className="fa-solid fa-fire text-scout-yellow text-3xl group-hover:scale-110 transition-transform duration-300"></i>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl leading-tight">GE Amizade</span>
              <span className="text-xs text-scout-yellow font-semibold tracking-wider">66/SP</span>
            </div>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="hover:text-scout-yellow transition-colors font-semibold">Home</Link>
            <Link href="#ramos" className="hover:text-scout-yellow transition-colors font-semibold">Ramos</Link>
            <Link href="/portal-da-transparencia" className="hover:text-scout-yellow transition-colors font-semibold">Portal da Transparência</Link>
            <Link href="#calendario" className="hover:text-scout-yellow transition-colors font-semibold">Calendário</Link>
            <Link href="#contato" className="bg-scout-yellow text-scout-dark px-6 py-2.5 rounded-full font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-md active:scale-95">
              Junte-se a nós
            </Link>
          </div>

          {/* Botão Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-scout-yellow focus:outline-none p-2 w-10 h-10 flex items-center justify-center transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {/* Feedback visual dinâmico (Hamburguer <-> X) */}
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl transition-transform duration-300`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Dropdown (Com transição suave CSS) */}
      <div 
        className={`md:hidden bg-scout-dark shadow-inner overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {/* Adicionado padding interno superior e inferior para respiro visual */}
        <div className="px-4 pb-6 pt-2 space-y-1">
          <Link href="/" onClick={closeMenu} className="block py-3 px-3 text-white hover:text-scout-yellow hover:bg-white/5 rounded-lg transition-colors font-semibold">
            Home
          </Link>
          <Link href="#ramos" onClick={closeMenu} className="block py-3 px-3 text-white hover:text-scout-yellow hover:bg-white/5 rounded-lg transition-colors font-semibold">
            Ramos
          </Link>
          <Link href="/portal-da-transparencia" onClick={closeMenu} className="block py-3 px-3 text-white hover:text-scout-yellow hover:bg-white/5 rounded-lg transition-colors font-semibold">
            Portal da Transparência
          </Link>
          <Link href="#calendario" onClick={closeMenu} className="block py-3 px-3 text-white hover:text-scout-yellow hover:bg-white/5 rounded-lg transition-colors font-semibold">
            Calendário
          </Link>
          <Link href="#contato" onClick={closeMenu} className="block mt-6 text-center bg-scout-yellow text-scout-dark px-5 py-4 rounded-xl font-bold shadow-lg hover:bg-yellow-400 active:bg-yellow-500 transition-colors">
            Junte-se a nós
          </Link>
        </div>
      </div>
    </nav>
  );
}