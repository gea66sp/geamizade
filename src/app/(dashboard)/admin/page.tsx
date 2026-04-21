import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";

// Componentes (Certifique-se de que eles existem na pasta _components)
import { StatCards } from "./_components/StatCards";
import { OverviewCharts } from "./_components/OverviewCharts";
import { ModuleShortcuts } from "./_components/ModuleShortcuts";

export const metadata: Metadata = {
  title: "Dashboard Administrativo | GE Amizade",
  description: "Central de controle para os líderes e administradores do Grupo Escoteiro.",
};

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const firstName = session?.user?.name?.split(" ")[0] || "Chefe";

  // ==========================================
  // 1. BUSCA DE MÉTRICAS GERAIS (KPIs)
  // ==========================================
  // O uso do Promise.all permite buscar tudo ao mesmo tempo, sem gargalos.
  const [totalUsers, totalDocs, pendingTransactions] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.document.count({ where: { isPublic: true } }).catch(() => 0),
    prisma.financialTransaction.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  // ==========================================
  // 2. PREPARAÇÃO DE DATAS (Últimos 6 meses)
  // ==========================================
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); 
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Estrutura base para o array de gráficos
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
    return {
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      name: monthNames[d.getMonth()],
    };
  });

  // ==========================================
  // 3. DADOS PARA O GRÁFICO DE MEMBROS (Acumulado)
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
  // 4. DADOS PARA O GRÁFICO FINANCEIRO 
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
    // O pb-24 garante que no mobile o conteúdo não fique escondido sob a barra de navegação dos celulares mais recentes
    <div className="w-full animate-fade-in-down space-y-8 pb-16 md:pb-24">

      {/* Atalhos Rápidos (Ocupam 1/3 da tela no Desktop XL) */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-compass"></i> Acesso Rápido
          </h2>
          <ModuleShortcuts />
        </div>


      {/* ÁREA DE CONTEÚDO (Gráficos + Atalhos) */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* Gráficos (Ocupam 2/3 da tela no Desktop XL) */}
        <div className="xl:col-span-3 space-y-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-chart-area"></i> Desempenho nos Últimos 6 Meses
          </h2>
          <OverviewCharts memberData={memberData} financeData={financeData} />
        </div>

        
      </section>

    </div>
  );
}