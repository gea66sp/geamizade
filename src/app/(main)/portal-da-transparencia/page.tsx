import prisma from "@/src/lib/prisma";
import Link from "next/link";
import PublicTree from "./_components/PublicTree";

// Força a página a sempre buscar dados novos (evita cache antigo para o público)
export const revalidate = 60; 

export default async function TransparenciaPublicPage() {
  // Busca APENAS pastas e documentos marcados como públicos
  const publicFolders = await prisma.folder.findMany({
    where: { isPublic: true },
    orderBy: { name: "asc" },
  });

  const publicDocuments = await prisma.document.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-stone-50 pb-16 md:pb-20 animate-fade-in-down">
      
      {/* Cabeçalho da Página Pública */}
      <div className="bg-emerald-800 text-emerald-50 py-10 md:py-16 px-4 sm:px-6 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="scout-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="currentColor" opacity="0.5"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#scout-pattern)" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 md:mb-4 text-white">
              Portal da Transparência
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-emerald-100 max-w-2xl leading-relaxed">
              O Grupo Escoteiro Amizade preza pela honestidade e clareza. Navegue pelo nosso acervo de relatórios, atas e balanços disponíveis para consulta pública.
            </p>
          </div>
          
          <Link 
            href="/" 
            className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 md:py-3.5 rounded-xl md:rounded-full font-bold transition-all backdrop-blur-sm shrink-0 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar ao Início
          </Link>
        </div>
      </div>

      {/* Área da Árvore de Arquivos */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {publicFolders.length === 0 && publicDocuments.length === 0 ? (
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-stone-200 text-center">
            <svg className="w-12 h-12 md:w-16 md:h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-xl md:text-2xl font-bold text-stone-700 mb-2">Acervo em Organização</h2>
            <p className="text-stone-500 max-w-md mx-auto text-sm md:text-base">
              Nenhum documento público está disponível no momento. Volte em breve.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Barra de título do visualizador */}
            <div className="bg-stone-100/80 border-b border-stone-200 px-5 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <span className="ml-2 text-xs font-bold text-stone-500 uppercase tracking-widest">Acervo Público</span>
            </div>
            
            <div className="p-2 sm:p-4">
              <PublicTree folders={publicFolders} documents={publicDocuments} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}