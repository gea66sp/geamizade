"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verifica se é um dispositivo Apple (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Verifica se já está instalado (rodando em modo standalone)
    const isAlreadyInstalled = window.matchMedia("(display-mode: standalone)").matches || 
                               ("standalone" in window.navigator && (window.navigator as any).standalone === true);

    setIsIOS(isIosDevice);
    setIsStandalone(isAlreadyInstalled);

    // Se for iOS e não estiver instalado, mostra o aviso
    if (isIosDevice && !isAlreadyInstalled) {
      // Pequeno delay para não assustar o usuário assim que a tela abre
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Se não deve mostrar, ou se o usuário fechou, não renderiza nada
  if (!showPrompt || isStandalone || !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white shadow-2xl rounded-2xl p-4 border border-gray-100 flex gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex-1">
        <h3 className="font-bold text-scout-green mb-1">Instale nosso App!</h3>
        <p className="text-sm text-gray-600 leading-tight">
          Para instalar o GE Amizade no seu iPhone, toque no ícone de Compartilhar <Share className="inline w-4 h-4 mx-1" /> abaixo e depois em <strong>Adicionar à Tela de Início</strong> <PlusSquare className="inline w-4 h-4 mx-1" />.
        </p>
      </div>
      <button 
        onClick={() => setShowPrompt(false)}
        className="self-start text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1 shrink-0"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>
      
      {/* Setinha apontando para baixo (para o menu do Safari) */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
    </div>
  );
}