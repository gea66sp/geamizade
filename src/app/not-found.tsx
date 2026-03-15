"use client";

import React, { useState, useEffect, MouseEvent } from 'react';
import Link from 'next/link';
import { 
  Code, ArrowLeft, Zap, Github, Linkedin, Instagram, 
  Search, Terminal, FileWarning
} from 'lucide-react';

/**
 * UTILS & HOOKS
 */

// Hook para seguir o mouse (Reutilizado para manter o background igual)
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent | any) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);
  return mousePosition;
};

export default function NotFound() {
  const mousePos = useMousePosition();
  const [mounted, setMounted] = useState(false);

  // Evita hidratação incorreta em animações
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-hidden flex flex-col relative">
      
      {/* Reutilizando os estilos globais para o Grid */}
      <style jsx global>{`
        .bg-grid {
          background-size: 50px 50px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }
      `}</style>

      {/* Dynamic Background (Idêntico à Home) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid mask-[linear-gradient(to_bottom,transparent,black)]" />
        <div 
          className="absolute inset-0 bg-black/90 transition-colors duration-700"
          style={{
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.06), transparent 40%)`
          }}
        />
      </div>

      {/* Navbar Simplificada */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tighter cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div>LEV <span className="font-light text-neutral-400">BRANDS</span></div>
          </Link>

          <Link
            href="/"
            className="hidden md:flex bg-white/5 border border-white/10 text-white px-5 py-2 rounded-full font-medium hover:bg-white/10 transition-all items-center gap-2 text-sm"
          >
            <ArrowLeft size={14} /> Voltar ao Início
          </Link>
        </div>
      </nav>

      {/* Conteúdo Principal 404 */}
      <main className="grow flex items-center justify-center relative z-10 px-6 mt-20">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Ícone Animado */}
          <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-2xl bg-white/5 border border-white/10 relative group">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Terminal size={40} className="text-neutral-400 group-hover:text-red-400 transition-colors" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          </div>

          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-none mb-4">
            <span className="bg-linear-to-b from-white to-neutral-600 bg-clip-text text-transparent">404</span>
          </h1>

          <h2 className="text-2xl md:text-4xl font-bold mb-6 text-white">
            Página não encontrada
          </h2>
          
          <p className="text-lg text-neutral-400 max-w-lg mx-auto mb-10 font-light leading-relaxed">
            Parece que o link que você tentou acessar foi movido ou não existe mais no nosso ecossistema digital.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <ArrowLeft size={20} className="text-black" /> Retornar à Home
            </Link>
            
            <a 
              href="https://wa.me/5592984228634"
              target="_blank"
              className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white rounded hover:bg-white/5 transition-all flex items-center justify-center gap-2 hover:border-white/50"
            >
              <Zap size={20} /> Informar Erro
            </a>
          </div>

        </div>
      </main>

      {/* Footer Minimalista (Reutilizado) */}
      <footer className="relative z-10 border-t border-white/10 pt-8 pb-8 px-6 text-sm bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 items-center">
            <a href="https://github.com/CheckMat007" target="_blank" className="text-neutral-500 hover:text-white transition-colors"><Github size={18} /></a>
            <a href="https://instagram.com/levbrands" target="_blank" className="text-neutral-500 hover:text-white transition-colors"><Instagram size={18} /></a>
            <a href="www.linkedin.com/in/gustavolevenhagen" target="_blank" className="text-neutral-500 hover:text-white transition-colors"><Linkedin size={18} /></a>
          </div>
          <div className="text-neutral-600 flex items-center gap-2">
             <span>&copy; {new Date().getFullYear()} LEV BRANDS</span>
             <span className="hidden md:inline text-neutral-800">|</span>
             <span className="flex items-center gap-1"><FileWarning size={12} /> Error Page</span>
          </div>
        </div>
      </footer>
    </div>
  );
}