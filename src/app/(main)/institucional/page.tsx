import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institucional | Grupo Escoteiro Amizade 66/SP",
  description:
    "Conheça a nossa história, nossos valores, a diretoria atual e o impacto do escotismo na vida dos nossos jovens.",
};

export default async function InstitucionalPage() {
  const instData = await prisma.institutionalPage.findFirst({
    include: {
      boardMembers: true,
      testimonials: true,
    },
  });

  if (!instData) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
          <i className="fa-solid fa-person-digging text-gray-400 text-3xl" />
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-800 mb-2">
          Página em construção
        </h1>
        <p className="text-sm md:text-base text-gray-500 max-w-md">
          Em breve você poderá conhecer mais sobre nossa história e equipe.
        </p>
      </main>
    );
  }

  const stats = Array.isArray(instData.stats) ? instData.stats : [];

  return (
    <main className="bg-white w-full animate-fade-in">
      
      {/* ==========================================
          1. HERO / NOSSA HISTÓRIA
      ========================================== */}
      <section className="relative overflow-hidden bg-linear-to-b from-gray-50 to-white pt-10 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
            
            {/* Textos (Mobile: Centralizado | Desktop: Esquerda) */}
            <div className="w-full lg:w-1/2 text-center lg:text-left order-2 lg:order-1">
              {instData.historySubtitle && (
                <span className="text-scout-green font-bold uppercase tracking-widest text-xs md:text-sm mb-2 block">
                  {instData.historySubtitle}
                </span>
              )}
              
              <h1 className="section-title text-gray-900! font-black! text-4xl! md:text-5xl! mb-5!">
                {instData.historyTitle || "Nossa Instituição"}
              </h1>
              <div className="section-divider mx-auto lg:mx-0 mb-8"></div>

              <div className="space-y-4 text-gray-600 text-sm md:text-base leading-relaxed text-left">
                {instData.historyParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Imagem (Otimizada para Mobile com aspect-video) */}
            <div className="w-full lg:w-1/2 relative order-1 lg:order-2">
              <div className="absolute -inset-2 bg-scout-yellow/20 rounded-4xl blur-2xl -z-10"></div>
              <div className="relative aspect-video md:aspect-4/3 rounded-4xl overflow-hidden shadow-xl bg-gray-100 border border-white">
                {instData.historyImage ? (
                  <img
                    src={instData.historyImage}
                    alt="História do grupo"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <i className="fa-solid fa-image text-4xl md:text-5xl" />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==========================================
          2. ESTATÍSTICAS
      ========================================== */}
      {stats.length > 0 && (
        <section className="bg-scout-green text-white relative z-10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center divide-x-0 md:divide-x divide-white/20">
              {stats.map((stat: any, i: number) => (
                <div key={i} className="flex flex-col items-center justify-center">
                  <p className="text-3xl md:text-5xl font-black mb-1 drop-shadow-sm">{stat.value}</p>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-scout-yellow">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          3. MISSÃO / VISÃO / VALORES (Design Unboxed & Orgânico)
      ========================================== */}
      <section className="relative py-16 md:py-28 bg-scout-dark text-white overflow-hidden">
        {/* Blurs de fundo decorativos */}
        <div className="absolute top-0 right-0 w-75 h-75 bg-scout-green/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-62.5 h-62.5 bg-scout-yellow/10 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white mb-4">
              {instData.compassTitle || "Nossa Essência"}
            </h2>
            <div className="section-divider mx-auto"></div>
            {instData.compassSubtitle && (
              <p className="text-gray-400 mt-6 text-sm md:text-lg font-light">
                {instData.compassSubtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
            {/* Missão */}
            {instData.missionText && (
              <div className="flex flex-col items-center md:items-start text-center md:text-left group">
                <div className="icon-box group-hover:bg-scout-green/20">
                  <i className="fa-solid fa-bullseye text-scout-yellow text-2xl" />
                </div>
                <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 text-white">Missão</h3>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed font-light">
                  {instData.missionText}
                </p>
              </div>
            )}

            {/* Visão */}
            {instData.visionText && (
              <div className="flex flex-col items-center md:items-start text-center md:text-left group">
                <div className="icon-box group-hover:bg-scout-yellow/20">
                  <i className="fa-solid fa-eye text-scout-yellow text-2xl" />
                </div>
                <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 text-white">Visão</h3>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed font-light">
                  {instData.visionText}
                </p>
              </div>
            )}

            {/* Valores */}
            {instData.valuesList.length > 0 && (
              <div className="flex flex-col items-center md:items-start text-center md:text-left group">
                <div className="icon-box group-hover:bg-blue-500/20">
                  <i className="fa-solid fa-gem text-scout-yellow text-2xl" />
                </div>
                <h3 className="text-xl md:text-2xl font-heading font-bold mb-4 text-white">Valores</h3>
                <ul className="space-y-3 text-sm md:text-base text-gray-300 text-left">
                  {instData.valuesList.map((v, i) => (
                    <li key={i} className="flex items-start gap-3 font-light">
                      <i className="fa-solid fa-check text-scout-green mt-1 text-xs"></i>
                      <span className="leading-snug">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          4. DIRETORIA (Design Limpo e Responsivo)
      ========================================== */}
      {instData.boardMembers.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <span className="text-xs md:text-sm font-bold tracking-widest uppercase text-scout-green mb-2 block">
                Liderança Servidora
              </span>
              <h2 className="section-title">
                Nossa Diretoria
              </h2>
              <div className="section-divider mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-12">
              {instData.boardMembers.map((m) => (
                <div key={m.id} className="flex flex-col items-center text-center group">
                  {/* Note que inserimos o group-hover:scale-105 group-hover:shadow-xl diretamente aqui */}
                  <div className="avatar-profile group-hover:scale-105 group-hover:shadow-xl">
                    {m.imageUrl ? (
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <i className="fa-solid fa-user text-4xl" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1">{m.name}</h3>
                  <p className="text-xs font-black text-scout-yellow uppercase tracking-widest mb-3">
                    {m.role}
                  </p>
                  {m.bio && (
                    <p className="text-sm text-gray-500 leading-relaxed max-w-62.5 font-medium">
                      {m.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          5. DEPOIMENTOS
      ========================================== */}
      {instData.testimonials.length > 0 && (
        <section className="relative py-16 md:py-24 bg-white border-t border-gray-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="text-center mb-12 md:mb-16">
              <i className="fa-solid fa-quote-right text-4xl text-scout-green/30 mb-4 block"></i>
              <h2 className="section-title">
                O que dizem sobre nós
              </h2>
              <div className="section-divider mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {instData.testimonials.map((t) => (
                <div key={t.id} className="card-testimonial group">
                  
                  <div className="flex gap-1 text-scout-yellow mb-4 text-xs md:text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`fa-${i < t.rating ? 'solid' : 'regular'} fa-star`}></i>
                    ))}
                  </div>

                  <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8 italic flex-1">
                    "{t.quote}"
                  </p>

                  <div className="flex items-center gap-4 mt-auto border-t border-gray-200 pt-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-scout-green text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {t.authorName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm md:text-base truncate">
                        {t.authorName}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest truncate">
                        {t.authorRole}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}