"use client";

import { useState, useEffect } from "react";
import { Cookie, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se já existe UMA escolha (seja aceitar tudo ou só necessários)
    const hasConsented = localStorage.getItem("geamizade_cookie_preference");
    
    if (!hasConsented) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("geamizade_cookie_preference", "all");
    // Dispara um evento customizado para o Analytics ligar imediatamente
    window.dispatchEvent(new Event('cookie_consent_updated'));
    setIsVisible(false);
  };

  const handleAcceptNecessaryOnly = () => {
    localStorage.setItem("geamizade_cookie_preference", "necessary");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 flex flex-col gap-5">
        
        <div className="flex items-start gap-4">
          <div className="bg-emerald-50 p-3 rounded-full shrink-0">
            <Cookie className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Sua privacidade é importante</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento seguro do sistema (login e segurança). Também gostaríamos de usar cookies do <strong>Google Analytics</strong> para entender como você usa nosso site e melhorá-lo.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-50">
          <Link 
            href="/privacidade" 
            className="text-xs font-medium text-gray-500 hover:text-emerald-700 hover:underline w-full sm:w-auto text-center"
          >
            Política de Privacidade
          </Link>
          
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={handleAcceptNecessaryOnly}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Apenas Essenciais
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Check className="w-4 h-4" />
              Aceitar Todos
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}