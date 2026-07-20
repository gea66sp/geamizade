import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nossas Tropas | Grupo Escoteiro Amizade 66/SP",
  description: "Conheça as tropas, alcateias e ramos do Grupo Escoteiro Amizade. Veja nossos eventos e atividades.",
};

// Mapeamento de cores, nomes amigáveis e ícones para os Ramos
const branchStyles: Record<string, { label: string; badge: string; borderHover: string; icon: string; colorText: string }> = {
  LOBINHO: { label: "Ramo Lobinho", badge: "bg-amber-100 text-amber-800 border-amber-200", borderHover: "group-hover:bg-amber-400", icon: "fa-paw", colorText: "text-amber-600" },
  ESCOTEIRO: { label: "Ramo Escoteiro", badge: "bg-scout-green/10 text-scout-green border-scout-green/20", borderHover: "group-hover:bg-scout-green", icon: "fa-compass", colorText: "text-scout-green" },
  SENIOR: { label: "Ramo Sênior", badge: "bg-rose-100 text-rose-800 border-rose-200", borderHover: "group-hover:bg-rose-500", icon: "fa-mountain", colorText: "text-rose-600" },
  PIONEIRO: { label: "Ramo Pioneiro", badge: "bg-red-100 text-red-800 border-red-200", borderHover: "group-hover:bg-red-600", icon: "fa-fire", colorText: "text-red-600" },
  DIRETORIA: { label: "Diretoria", badge: "bg-gray-100 text-gray-800 border-gray-200", borderHover: "group-hover:bg-gray-800", icon: "fa-users-gear", colorText: "text-gray-600" },
};

export default async function TropasPublicPage() {
  // Busca as tropas trazendo Chefe, Patrulhas (Patrol) e Contagens
  const tropas = await prisma.troop.findMany({
    where: { branch: { not: "DIRETORIA" } },
    orderBy: [
      { branch: 'asc' },
      { name: 'asc' }
    ],
    include: {
      manager: {
        select: { name: true },
      },
      // Aqui nós incluímos as patrulhas vinculadas à tropa!
      patrols: {
        select: { id: true, name: true },
        orderBy: { name: 'asc' } // Traz as patrulhas em ordem alfabética
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

  // Função para agrupar as tropas por Ramo (Branch)
  const groupedTropas = tropas.reduce((acc, tropa) => {
    const branch = tropa.branch;
    if (!acc[branch]) acc[branch] = [];
    acc[branch].push(tropa);
    return acc;
  }, {} as Record<string, typeof tropas>);

  // Padrão SVG de fundo (Pinheiros/Trilhas)
  const bgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322543d' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <main 
      className="min-h-screen bg-gray-50/80 py-16 md:py-24 overflow-hidden relative"
      style={{ backgroundImage: bgPattern }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20">
        {Object.keys(groupedTropas).length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-sm animate-fade-in">
            <i className="fa-solid fa-tents text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-700">O Acampamento está sendo montado</h3>
            <p className="text-gray-500 font-medium mt-1">Em breve atualizaremos as informações das nossas seções.</p>
          </div>
        ) : (
          // Renderiza as seções agrupadas por Ramo
          Object.entries(groupedTropas).map(([branch, branchTropas]) => {
            const style = branchStyles[branch] || branchStyles.ESCOTEIRO;

            return (
              <section key={branch} className="animate-fade-in-up">
                {/* Divisor de Ramo / Título da Seção */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border ${style.badge}`}>
                    <i className={`fa-solid ${style.icon} text-2xl`}></i>
                  </div>
                  <h2 className={`text-3xl font-heading font-black tracking-tight ${style.colorText}`}>
                    {style.label}
                  </h2>
                  <div className="flex-1 h-px bg-linear-to-r from-gray-200 to-transparent ml-4"></div>
                </div>

                {/* Grid das Tropas daquele Ramo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {branchTropas.map((tropa) => (
                    <div 
                      key={tropa.id} 
                      className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col overflow-hidden group"
                    >
                      {/* Borda Superior Decorativa Dinâmica */}
                      <div className={`h-2.5 w-full bg-gray-100 transition-colors duration-500 ${style.borderHover}`}></div>
                      
                      <div className="p-6 md:p-8 flex-1 flex flex-col relative">
                        
                        {/* Nome e Descrição da Tropa */}
                        <h3 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight line-clamp-2">
                          {tropa.name}
                        </h3>
                        
                        <p className="text-gray-500 flex-1 text-sm leading-relaxed line-clamp-3 mb-6 font-medium">
                          {tropa.description || "Nenhuma descrição informada para esta seção ainda. Em breve teremos mais detalhes sobre nossas atividades!"}
                        </p>

                        <hr className="border-gray-100 mb-5" />

                        {/* LISTAGEM DINÂMICA DE PATRULHAS / MATILHAS */}
                        <div className="mb-6">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">
                            {branch === 'LOBINHO' ? 'Matilhas' : branch === 'PIONEIRO' ? 'Equipes' : 'Patrulhas'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {tropa.patrols && tropa.patrols.length > 0 ? (
                              tropa.patrols.map((patrol) => (
                                <span 
                                  key={patrol.id} 
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                  <i className="fa-solid fa-flag text-gray-400"></i> {patrol.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic font-medium">Nenhuma cadastrada</span>
                            )}
                          </div>
                        </div>

                        {/* Informações do Chefe Responsável */}
                        <div className="mb-6 flex items-center gap-3.5 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-scout-yellow/10 group-hover:text-scout-yellow transition-colors duration-300">
                            <i className="fa-solid fa-user-tie text-base"></i>
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
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}