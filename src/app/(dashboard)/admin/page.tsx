import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho se necessário
import Link from "next/link";

const CompassIllustration = () => (
  // Diminuí o tamanho base da ilustração no mobile e mantive maior no desktop (md:w-40 md:h-40)
  <svg viewBox="0 0 200 200" className="w-28 h-28 md:w-40 md:h-40 drop-shadow-xl mx-auto mb-6 md:mb-8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill="#E7E5E4" />
    <circle cx="100" cy="100" r="70" fill="#FAFAF9" />
    <path d="M100 35 L100 45" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />
    <path d="M100 165 L100 155" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />
    <path d="M35 100 L45 100" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />
    <path d="M165 100 L155 100" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />
    <path d="M100 45 L115 100 L85 100 Z" fill="#EA580C" />
    <path d="M100 155 L115 100 L85 100 Z" fill="#059669" />
    <circle cx="100" cy="100" r="8" fill="#292524" />
    <circle cx="100" cy="100" r="3" fill="#FAFAF9" />
  </svg>
);

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  
  // Pegamos apenas o primeiro nome para uma saudação mais amigável
  const firstName = session?.user?.name?.split(" ")[0] || "Chefe";

  return (
    // Ajuste de padding: menor no mobile (p-4), maior a partir do breakpoint sm (sm:p-6 md:p-10)
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full animate-fade-in-down">
      
      {/* Saudação de Boas-vindas */}
      {/* Ajuste de margem inferior no mobile (mb-6) e desktop (md:mb-10) */}
      <div className="mb-6 md:mb-10">
        {/* Tamanho da fonte adaptável: menor no celular (text-2xl) para não quebrar a linha de forma estranha */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-800 tracking-tight">
          Sempre Alerta, {firstName}!
        </h1>
        {/* Texto de apoio com tamanho ligeiramente reduzido no mobile */}
        <p className="text-stone-500 mt-2 text-base md:text-lg">
          Bem-vindo ao acampamento base digital do Grupo Escoteiro Amizade.
        </p>
      </div>

      {/* Grid: 1 coluna no mobile, 2 no lg. Espaçamento (gap) ajustado. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        
        {/* Card Principal: Em Construção */}
        {/* Padding interno adaptativo: p-6 no mobile, md:p-10 no desktop */}
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-stone-200 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
          
          <CompassIllustration />

          {/* Fonte ajustada para mobile */}
          <h2 className="text-xl md:text-2xl font-bold text-stone-800 mb-2 md:mb-3 tracking-tight">
            Mapeando Novas Trilhas...
          </h2>
          <p className="text-stone-500 mb-6 text-sm md:text-base">
            Nossa equipe de pioneiros está preparando os relatórios e métricas que aparecerão aqui. Em breve você terá uma visão completa das tropas.
          </p>

          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-medium text-xs md:text-sm border border-amber-100">
            <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-amber-500"></span>
            </span>
            Módulos em Desenvolvimento
          </div>
        </div>

        {/* Card Secundário: Atalhos Rápidos */}
        <div className="bg-emerald-800 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-lg text-white relative overflow-hidden flex flex-col h-full">
          {/* Ocultado o detalhe de fundo em telas muito pequenas (mobile) para não sujar o visual, visível a partir do sm */}
          <svg className="hidden sm:block absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 text-emerald-700 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2zm0 3.8l7.2 14.4H4.8L12 5.8z" />
          </svg>

          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="text-lg md:text-xl font-bold mb-2">Atalhos Disponíveis</h3>
            <p className="text-emerald-100/80 mb-6 md:mb-8 text-sm md:text-base">
              Acesse rapidamente os módulos que já estão com a pioneiria montada e prontos para uso.
            </p>

            {/* Container para que os atalhos cresçam e ocupem o espaço, caso haja mais no futuro */}
            <div className="mt-auto space-y-3">
              <Link 
                href="/admin/transparencia" 
                className="flex items-center justify-between bg-white/10 hover:bg-white/20 border border-white/10 p-3 md:p-4 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-emerald-600 rounded-lg group-hover:scale-105 md:group-hover:scale-110 transition-transform shrink-0">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-base md:text-lg leading-tight">Transparência</h4>
                    <p className="text-emerald-200 text-[10px] md:text-xs mt-0.5">Gerir atas e documentos</p>
                  </div>
                </div>
                <svg className="w-4 h-4 md:w-5 md:h-5 text-emerald-300 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}