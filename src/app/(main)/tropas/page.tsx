import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nossas Tropas | Grupo Escoteiro Amizade 66/SP",
  description: "Conheça as tropas, alcateias e ramos do Grupo Escoteiro Amizade. Veja nossos eventos e atividades.",
};

// Mapeamento de cores e nomes amigáveis para os Ramos
const branchStyles: Record<string, { label: string; badge: string; borderHover: string }> = {
  LOBINHO: { label: "Alcateia", badge: "bg-amber-100 text-amber-800 border-amber-200", borderHover: "group-hover:bg-amber-400" },
  ESCOTEIRO: { label: "Tropa Escoteira", badge: "bg-scout-green/10 text-scout-green border-scout-green/20", borderHover: "group-hover:bg-scout-green" },
  SENIOR: { label: "Tropa Sênior", badge: "bg-rose-100 text-rose-800 border-rose-200", borderHover: "group-hover:bg-rose-500" },
  PIONEIRO: { label: "Clã Pioneiro", badge: "bg-red-100 text-red-800 border-red-200", borderHover: "group-hover:bg-red-600" },
  DIRETORIA: { label: "Diretoria", badge: "bg-gray-100 text-gray-800 border-gray-200", borderHover: "group-hover:bg-gray-800" },
};

export default async function TropasPublicPage() {
  // Busca as tropas e conta as relações otimizando a performance com _count
  const tropas = await prisma.troop.findMany({
    where: {
      // Opcional: Ocultar a diretoria da lista de tropas públicas
      branch: { not: "DIRETORIA" } 
    },
    orderBy: [
      { branch: 'asc' }, // Agrupa por ramo
      { name: 'asc' }    // Depois ordena por nome alfabético
    ],
    include: {
      manager: {
        select: { name: true }, // Trazemos apenas o nome do chefe para não vazar dados
      },
      _count: {
        select: {
          members: true,
          events: true,
          blogPosts: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50/50 py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ==========================================
            GRID DE TROPAS (CARDS)
        ========================================== */}
        {tropas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm animate-fade-in">
            <i className="fa-solid fa-tents text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-700">O Acampamento está sendo montado</h3>
            <p className="text-gray-500 font-medium mt-1">Em breve atualizaremos as informações das nossas seções.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tropas.map((tropa) => {
              // Pegamos o estilo baseando-se no ramo da tropa (se não achar, usa Escoteiro como default)
              const style = branchStyles[tropa.branch] || branchStyles.ESCOTEIRO;

              return (
                <div 
                  key={tropa.id} 
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col overflow-hidden group animate-fade-in-up"
                >
                  {/* Borda Superior Decorativa Dinâmica */}
                  <div className={`h-2.5 w-full bg-gray-100 transition-colors duration-500 ${style.borderHover}`}></div>
                  
                  <div className="p-6 md:p-8 flex-1 flex flex-col relative">
                    
                    {/* Badge do Ramo */}
                    <div className="mb-5">
                      <span className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>

                    {/* Nome e Descrição da Tropa */}
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight line-clamp-2">
                      {tropa.name}
                    </h2>
                    
                    <p className="text-gray-500 flex-1 text-sm leading-relaxed line-clamp-4 mb-6 font-medium">
                      {tropa.description || "Nenhuma descrição informada para esta seção ainda. Em breve teremos mais detalhes sobre nossas atividades!"}
                    </p>

                    <hr className="border-gray-100 mb-5" />

                    {/* Informações do Chefe Responsável */}
                    <div className="mb-6 flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-scout-yellow/10 group-hover:text-scout-yellow group-hover:border-scout-yellow/20 transition-colors duration-300">
                        <i className="fa-solid fa-user-tie text-lg"></i>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Escotista Responsável</p>
                        <p className="text-sm font-bold text-gray-800 truncate max-w-50">
                          {tropa.manager?.name ? `Ch. ${tropa.manager.name}` : <span className="text-gray-400 italic font-medium">A definir</span>}
                        </p>
                      </div>
                    </div>

                    {/* Estatísticas e Informações Técnicas */}
                    <div className="grid grid-cols-3 gap-2 mt-auto bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex flex-col items-center justify-center text-center">
                        <i className="fa-solid fa-users text-gray-400 mb-1.5 text-sm"></i>
                        <span className="text-base font-black text-gray-800 leading-none mb-1">{tropa._count.members}</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Jovens</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center text-center border-x border-gray-200">
                        <i className="fa-solid fa-calendar-days text-gray-400 mb-1.5 text-sm"></i>
                        <span className="text-base font-black text-gray-800 leading-none mb-1">{tropa._count.events}</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Eventos</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center text-center">
                        <i className="fa-solid fa-newspaper text-gray-400 mb-1.5 text-sm"></i>
                        <span className="text-base font-black text-gray-800 leading-none mb-1">{tropa._count.blogPosts}</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Notícias</span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}