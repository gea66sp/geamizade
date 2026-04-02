import prisma from "@/src/lib/prisma";
import PublicTree from "./_components/PublicTree";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal da Transparência",
  description: "Prezamos pela honestidade e clareza em nossas ações. Neste espaço, você tem acesso livre aos nossos relatórios, atas, balanços financeiros e demais documentos públicos do grupo.",
};

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
    <main className="min-h-screen bg-gray-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800 animate-fade-in-down">
      <div className="max-w-5xl mx-auto">
        
        {/* NOVO: Cabeçalho da Página (Essencial para UX, SEO e Acessibilidade) */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-scout-green mb-3">
            Portal da Transparência
          </h1>
          <div className="w-16 h-1 bg-scout-yellow rounded-full"></div>
        </div>

        {/* Banner Informativo Discreto e Aprimorado */}
        <div className="bg-white border-l-4 border-scout-yellow p-5 sm:p-6 rounded-lg shadow-sm mb-8 flex gap-4 items-start transition-shadow hover:shadow-md">
          <i className="fa-solid fa-circle-info text-scout-yellow text-xl mt-0.5 shrink-0"></i>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Prezamos pela honestidade e clareza em nossas ações. Neste espaço, você tem acesso livre aos nossos relatórios, atas, balanços financeiros e demais documentos públicos do grupo.
          </p>
        </div>

        {/* Área Principal do Acervo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Cabeçalho da Lista de Documentos */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <h2 className="font-heading font-bold text-gray-700 flex items-center gap-2.5 text-sm sm:text-base">
              <i className="fa-regular fa-folder-open text-scout-green/70 text-lg"></i>
              Documentos Disponíveis
            </h2>
            <span className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full shadow-sm">
              {publicFolders.length + publicDocuments.length} itens
            </span>
          </div>

          {/* Conteúdo (Árvore ou Vazio) */}
          <div className="p-4 sm:p-6">
            {publicFolders.length === 0 && publicDocuments.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center min-h-75">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100 shadow-inner">
                  {/* Contraste melhorado no ícone (text-gray-400 em vez de 300) */}
                  <i className="fa-regular fa-file-lines text-3xl text-gray-400"></i>
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-700 mb-2">Acervo vazio</h3>
                <p className="text-gray-500 text-sm sm:text-base max-w-sm leading-relaxed">
                  Ainda não há documentos públicos disponibilizados nesta seção. Por favor, retorne mais tarde.
                </p>
              </div>
            ) : (
              // Componente da árvore de arquivos com classe de altura fixa corrigida
              <div className="min-h-75 w-full overflow-x-auto pb-2">
                <PublicTree folders={publicFolders} documents={publicDocuments} />
              </div>
            )}
          </div>
          
        </div>
        
      </div>
    </main>
  );
}