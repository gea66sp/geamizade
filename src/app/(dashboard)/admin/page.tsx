import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho se necessário
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Administrativo",
  description: "Gerencie as informações do Grupo Escoteiro Amizade, acesse relatórios, métricas e configure os módulos disponíveis para os membros. Esta é a central de controle para os líderes e administradores do grupo.",
};

// Ilustração com as cores atualizadas para a paleta Scout
const CompassIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-28 h-28 md:w-40 md:h-40 drop-shadow-xl mx-auto mb-6 md:mb-8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill="#f3f4f6" />
    <circle cx="100" cy="100" r="70" fill="#ffffff" />
    <path d="M100 35 L100 45" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
    <path d="M100 165 L100 155" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
    <path d="M35 100 L45 100" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
    <path d="M165 100 L155 100" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
    {/* Ponteiros com as cores do GE Amizade (Amarelo e Verde Escuro) */}
    <path d="M100 45 L115 100 L85 100 Z" fill="#facc15" /> 
    <path d="M100 155 L115 100 L85 100 Z" fill="#166534" />
    <circle cx="100" cy="100" r="8" fill="#1f2937" />
    <circle cx="100" cy="100" r="3" fill="#ffffff" />
  </svg>
);

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  
  // Pegamos apenas o primeiro nome para uma saudação mais amigável
  const firstName = session?.user?.name?.split(" ")[0] || "Chefe";

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full animate-fade-in-down">
      
      {/* Saudação de Boas-vindas */}
      <div className="mb-6 md:mb-10">
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-scout-green tracking-tight">
          Sempre Alerta, {firstName}!
        </h1>
        <p className="text-gray-500 mt-2 text-base md:text-lg">
          Bem-vindo ao acampamento base digital do Grupo Escoteiro Amizade.
        </p>
      </div>

      {/* Grid responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        
        {/* Card Principal: Em Construção */}
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 text-center relative overflow-hidden group hover:shadow-md transition-shadow">
          {/* Detalhe superior da marca */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-scout-yellow" />
          
          <CompassIllustration />

          <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-3 tracking-tight">
            Mapeando Novas Trilhas...
          </h2>
          <p className="text-gray-500 mb-6 text-sm md:text-base leading-relaxed">
            Nossa equipe de pioneiros está preparando os relatórios e métricas que aparecerão aqui. Em breve você terá uma visão completa das tropas.
          </p>

          <div className="inline-flex items-center gap-2.5 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full font-bold text-xs md:text-sm border border-yellow-200 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-scout-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
            </span>
            Módulos em Desenvolvimento
          </div>
        </div>

        {/* Card Secundário: Atalhos Rápidos */}
        <div className="bg-scout-dark p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-lg text-white relative overflow-hidden flex flex-col h-full">
          {/* Marca d'água de fundo sutil */}
          <i className="fa-solid fa-map-location-dot hidden sm:block absolute -bottom-10 -right-10 text-[12rem] text-white opacity-5"></i>

          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="font-heading text-xl md:text-2xl font-bold mb-2">Atalhos Disponíveis</h3>
            <p className="text-gray-300 mb-6 md:mb-8 text-sm md:text-base leading-relaxed">
              Acesse rapidamente os módulos que já estão com a pioneiria montada e prontos para uso.
            </p>

            {/* Lista de Atalhos */}
            <div className="mt-auto space-y-3">
              
              {/* 1. Transparência */}
              <Link 
                href="/admin/transparencia" 
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-scout-yellow/30 p-3 md:p-4 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 text-scout-yellow rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-scout-yellow group-hover:text-scout-dark transition-all shrink-0">
                    <i className="fa-solid fa-magnifying-glass-chart text-lg md:text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-base md:text-lg leading-tight text-white group-hover:text-scout-yellow transition-colors">Transparência</h4>
                    <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">Gerir atas e documentos públicos</p>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-500 group-hover:text-scout-yellow group-hover:translate-x-1 transition-all shrink-0 text-sm"></i>
              </Link>

              {/* 2. Financeiro */}
              <Link 
                href="/admin/financeiro" 
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-scout-yellow/30 p-3 md:p-4 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 text-scout-yellow rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-scout-yellow group-hover:text-scout-dark transition-all shrink-0">
                    <i className="fa-solid fa-money-bill-trend-up text-lg md:text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-base md:text-lg leading-tight text-white group-hover:text-scout-yellow transition-colors">Financeiro</h4>
                    <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">Controle de caixa e mensalidades</p>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-500 group-hover:text-scout-yellow group-hover:translate-x-1 transition-all shrink-0 text-sm"></i>
              </Link>

              {/* 3. Personalizar Site */}
              <Link 
                href="/admin/personalizar" 
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-scout-yellow/30 p-3 md:p-4 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 text-scout-yellow rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-scout-yellow group-hover:text-scout-dark transition-all shrink-0">
                    <i className="fa-solid fa-palette text-lg md:text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-base md:text-lg leading-tight text-white group-hover:text-scout-yellow transition-colors">Personalizar Site</h4>
                    <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">Editar textos e imagens da Home</p>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-500 group-hover:text-scout-yellow group-hover:translate-x-1 transition-all shrink-0 text-sm"></i>
              </Link>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}