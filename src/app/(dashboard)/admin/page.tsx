import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

// Componentes (Certifique-se de que eles existem na pasta _components)
import { OverviewCharts } from "./_components/OverviewCharts";
import { ModuleShortcuts } from "./_components/ModuleShortcuts";

export const metadata: Metadata = {
  title: "Dashboard Administrativo",
  description: "Central de controle para os líderes e administradores do Grupo Escoteiro.",
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
function formatGoogleDate(date: Date) {
  // Converte a data para o formato UTC sem hifens, pontos ou dois-pontos (ex: 20261231T235959Z)
  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

function extractTextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const firstName = session?.user?.name?.split(" ")[0] || "Chefe";

  // ==========================================
  // 1. BUSCA DE MÉTRICAS GERAIS (KPIs)
  // ==========================================
  const [totalUsers, totalDocs, pendingTransactions] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.document.count({ where: { isPublic: true } }).catch(() => 0),
    prisma.financialTransaction.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  // ==========================================
  // 2. BUSCA DOS PRÓXIMOS EVENTOS DO CALENDÁRIO
  // ==========================================
  const upcomingEvents = await prisma.event.findMany({
    where: {
      startDate: { gte: new Date() }, // Apenas eventos de hoje em diante
    },
    orderBy: { startDate: "asc" },
    take: 3, // Reduzido para 3 para o layout lateral não ficar muito longo
  });

  // ==========================================
  // 3. BUSCA DAS ÚLTIMAS NOTÍCIAS DO BLOG
  // ==========================================
  const recentPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // ==========================================
  // 4. PREPARAÇÃO DE DATAS (Últimos 6 meses)
  // ==========================================
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); 
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
    return {
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      name: monthNames[d.getMonth()],
    };
  });

  // ==========================================
  // 5. DADOS PARA O GRÁFICO DE MEMBROS (Acumulado)
  // ==========================================
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const initialUserCount = await prisma.user.count({
    where: { createdAt: { lt: sixMonthsAgo } },
  });

  let runningTotal = initialUserCount;
  const memberData = last6Months.map((month) => {
    const newUsersThisMonth = recentUsers.filter(u => 
      u.createdAt.getMonth() === month.monthIndex && 
      u.createdAt.getFullYear() === month.year
    ).length;
    
    runningTotal += newUsersThisMonth; 
    return { name: month.name, membros: runningTotal };
  });

  // ==========================================
  // 6. DADOS PARA O GRÁFICO FINANCEIRO 
  // ==========================================
  const recentTransactions = await prisma.financialTransaction.findMany({
    where: { 
      status: "PAID", 
      paidDate: { gte: sixMonthsAgo } 
    },
    select: { amount: true, type: true, paidDate: true }
  });

  const financeData = last6Months.map((month) => {
    const txsThisMonth = recentTransactions.filter(tx => 
      tx.paidDate && 
      tx.paidDate.getMonth() === month.monthIndex && 
      tx.paidDate.getFullYear() === month.year
    );

    const receitas = txsThisMonth
      .filter(tx => tx.type === "INCOME")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
    const despesas = txsThisMonth
      .filter(tx => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return { name: month.name, receitas, despesas };
  });

  // ==========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================
  return (
    <div className="w-full animate-fade-in-down pb-16 md:pb-24">

      {/* ÁREA DE CONTEÚDO DIVIDIDA */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* ========================================== */}
        {/* COLUNA ESQUERDA: GRÁFICOS */}
        {/* No mobile vai para baixo (order-2), no desktop vai para esquerda (xl:order-1) */}
        {/* ========================================== */}
        <div className="xl:col-span-2 order-2 xl:order-1 space-y-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-chart-area"></i> Desempenho nos Últimos 6 Meses
          </h2>
          <OverviewCharts memberData={memberData} financeData={financeData} />
        </div>

        {/* ========================================== */}
        {/* COLUNA DIREITA: EVENTOS, NOTÍCIAS E ATALHOS */}
        {/* No mobile fica no topo (order-1), no desktop fica na direita (xl:order-2) */}
        {/* ========================================== */}
        <div className="xl:col-span-1 order-1 xl:order-2 flex flex-col gap-6">
          
          {/* BLOCO 1: Próximos Eventos (Sempre visível, topo no mobile) */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-regular fa-calendar-days"></i> Próximos Eventos
            </h2>
            
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col gap-3">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <i className="fa-regular fa-calendar-xmark text-3xl text-gray-200 mb-2"></i>
                  <p className="text-xs text-gray-500">Nenhum evento programado.</p>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const startStr = formatGoogleDate(new Date(event.startDate));
                  const endStr = formatGoogleDate(new Date(event.endDate));
                  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(event.location || "")}`;
                  
                  const dateObj = new Date(event.startDate);
                  const day = dateObj.getDate().toString().padStart(2, '0');
                  const month = dateObj.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
                  const time = dateObj.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={event.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors group">
                      <div className="flex flex-col items-center justify-center bg-scout-green/10 text-scout-green rounded-lg w-12 h-12 shrink-0">
                        <span className="text-base font-bold leading-none">{day}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider">{month}</span>
                      </div>
                      <div className="flex flex-col justify-center grow overflow-hidden">
                        <h4 className="text-sm font-bold text-gray-800 truncate" title={event.title}>{event.title}</h4>
                        <span className="text-[11px] text-gray-500 mb-1 truncate">
                          <i className="fa-regular fa-clock mr-1"></i> {time} {event.location ? `• ${event.location}` : ""}
                        </span>
                        <a 
                          href={googleCalendarUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] text-scout-green font-semibold flex items-center gap-1 w-fit hover:text-scout-dark transition-colors"
                        >
                          <i className="fa-brands fa-google text-scout-yellow"></i> Salvar na Agenda
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
              {upcomingEvents.length > 0 && (
                <Link href="/admin/calendario" className="text-center text-xs font-bold text-gray-400 hover:text-scout-green mt-2 pt-3 border-t border-gray-50 transition-colors">
                  Ver Calendário Completo <i className="fa-solid fa-arrow-right ml-1"></i>
                </Link>
              )}
            </div>
          </div>

          {/* BLOCO 2: Últimas Notícias do Blog */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-regular fa-newspaper"></i> Últimas Notícias
            </h2>
            
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col gap-3">
              {recentPosts.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Nenhuma notícia publicada.</p>
              ) : (
                recentPosts.map((post) => (
                  <Link 
                    key={post.id} 
                    href={`/blog/${post.slug}`} 
                    className="group block border-b border-gray-50 last:border-0 pb-3 last:pb-0"
                  >
                    <h4 className="text-sm font-bold text-gray-800 group-hover:text-scout-green transition-colors line-clamp-1">
                      {post.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {extractTextFromHtml(post.content)}
                    </p>
                  </Link>
                ))
              )}
              <Link href="/admin/blog" className="text-center text-xs font-bold text-gray-400 hover:text-scout-green mt-1 pt-3 border-t border-gray-50 transition-colors">
                Gerenciar Blog <i className="fa-solid fa-arrow-right ml-1"></i>
              </Link>
            </div>
          </div>

          {/* BLOCO 3: Acesso Rápido (OCULTO NO MOBILE, VISÍVEL EM TELAS MAIORES) */}
          <div className="hidden lg:block space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-compass"></i> Acesso Rápido
            </h2>
            
            {/* Como o ModuleShortcuts ficará dentro de uma coluna estreita, os botões naturalmente ficarão em formato menor e mais organizados como um painel lateral. */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
              <ModuleShortcuts />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}