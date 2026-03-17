import prisma from "@/src/lib/prisma";
import Link from "next/link";

// Força a página a sempre buscar dados novos (evita cache antigo para o público)
export const revalidate = 60; // Atualiza a cada 60 segundos se houver visitas

// Função para agrupar os documentos pela propriedade "folder"
type Document = {
  id: string;
  title: string;
  folder: string;
  fileUrl: string;
  createdAt: Date;
};

const groupDocumentsByFolder = (docs: Document[]) => {
  return docs.reduce((acc, doc) => {
    if (!acc[doc.folder]) {
      acc[doc.folder] = [];
    }
    acc[doc.folder].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);
};

export default async function TransparenciaPublicPage() {
  // Busca todos os documentos, ordenando dos mais novos para os mais antigos
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Agrupa os documentos
  const groupedDocuments = groupDocumentsByFolder(documents);
  const categories = Object.keys(groupedDocuments).sort();

  return (
    <main className="min-h-screen bg-stone-50 pb-16 md:pb-20 animate-fade-in-down">
      
      {/* Cabeçalho da Página Pública */}
      {/* Redução de padding vertical no mobile (py-10) e maior no desktop (md:py-16) */}
      <div className="bg-emerald-800 text-emerald-50 py-10 md:py-16 px-4 sm:px-6 relative overflow-hidden">
        {/* Padrão de fundo escoteiro */}
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
            {/* Fontes escalonadas para evitar quebras estranhas no celular */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 md:mb-4 text-white">
              Portal da Transparência
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-emerald-100 max-w-2xl leading-relaxed">
              O Grupo Escoteiro Amizade preza pela honestidade e clareza. Aqui você encontra todos os nossos relatórios, atas de diretoria e balanços financeiros disponíveis para consulta pública.
            </p>
          </div>
          
          {/* O botão ocupa a largura toda no celular (w-full) para facilitar o clique, e volta ao normal (sm:w-auto) a partir dos tablets */}
          <Link 
            href="/" 
            className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 md:py-3.5 rounded-xl md:rounded-full font-bold transition-all backdrop-blur-sm shrink-0 flex items-center justify-center"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>

      {/* Área de Listagem */}
      {/* Ajuste do padding lateral (px-4 no mobile, sm:px-6) e vertical (py-8 md:py-12) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {documents.length === 0 ? (
          // Estado Vazio para o Público
          <div className="bg-white p-8 md:p-12 rounded-2xl md:rounded-3xl shadow-sm border border-stone-200 text-center">
            <svg className="w-12 h-12 md:w-16 md:h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-xl md:text-2xl font-bold text-stone-700 mb-2">Acervo em Organização</h2>
            <p className="text-stone-500 max-w-md mx-auto text-sm md:text-base">
              Nossa diretoria está preparando os documentos para publicação. Volte em breve para consultar nosso acervo completo.
            </p>
          </div>
        ) : (
          // Listagem Agrupada por Categoria
          // Menos espaçamento entre as categorias no mobile (space-y-8)
          <div className="space-y-8 md:space-y-12">
            {categories.map((category) => (
              <section key={category} className="animate-fade-in-down">
                
                {/* Cabeçalho da Categoria */}
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/* Note: Ajustei o SVG que estava sem a tag <path> correta de fecho no original da categoria, adicionei o path completo abaixo */}
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-stone-800 tracking-tight">{category}</h2>
                  <div className="h-px bg-stone-200 flex-1 ml-4 hidden sm:block"></div>
                </div>

                {/* Grid de Cartões */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
                  {groupedDocuments[category].map((doc) => (
                    <a 
                      key={doc.id}
                      href={`/portal-da-transparencia/arquivo/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      // Padding interno dinâmico (p-4 no mobile, p-5 desktop)
                      className="group bg-white border border-stone-200 p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {/* Data menor no celular */}
                        <span className="text-[10px] md:text-xs font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded-md text-center">
                          {new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(doc.createdAt).toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Título */}
                      <h3 className="font-bold text-stone-700 text-sm md:text-base leading-snug mb-2 group-hover:text-emerald-700 transition-colors">
                        {doc.title}
                      </h3>
                      
                      {/* Call to action "Visualizar PDF" */}
                      <div className="mt-auto pt-3 md:pt-4 flex items-center text-xs md:text-sm font-semibold text-emerald-600">
                        Visualizar PDF
                        {/* CORREÇÃO DO HOVER: A setinha agora está visível por padrão no mobile (opacity-100 translate-x-0) e só aplica o efeito de hover/fade-in a partir de telas médias (md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0) */}
                        <svg className="w-3 h-3 md:w-4 md:h-4 ml-1 opacity-100 translate-x-0 md:opacity-0 md:group-hover:opacity-100 md:-translate-x-2 md:group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>

              </section>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}