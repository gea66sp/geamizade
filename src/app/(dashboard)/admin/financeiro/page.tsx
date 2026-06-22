import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/src/lib/auth"; 
import BtnNovaTransacao from "./_components/BtnNovaTransacao";
import TransactionTable from "./_components/TransactionTable";
import BtnGerarRelatorio from "./_components/BtnGerarRelatorio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financeiro | GE Amizade 66SP",
  description: "Gerencie as finanças do Grupo Escoteiro Amizade 66/SP, controle mensalidades, despesas e visualize relatórios financeiros para manter a saúde financeira do grupo em dia.",
};

export default async function FinanceiroDashboardPage() {
  const user = await getAuthUser();

  // VERIFICAÇÃO DE ACESSO
  const isAuthorized = user && (
    user.role === "ADMIN" || 
    user.role === "FINANCEIRO" || 
    user.branch === "DIRETORIA"
  );

  if (!isAuthorized) {
    redirect("/"); 
  }

  // ==========================================
  // BUSCA FINANCEIRA GERAL (Tudo incluído)
  // ==========================================
  // Tiramos o filtro para que a tabela debaixo mantenha o registro das Tropas e Patrulhas.
  const rawTransactions = await prisma.financialTransaction.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      user: { select: { name: true } },
      troop: { select: { name: true } },
      patrol: { select: { name: true } },
    }
  });

  // SANITIZAÇÃO DE DADOS (Resolve o erro do Decimal)
  const transactions = rawTransactions.map(t => ({
    ...t,
    amount: Number(t.amount), 
  }));

  // ==========================================
  // SEPARAÇÃO PARA OS CARTÕES (Apenas Global)
  // ==========================================
  // Criamos uma lista isolada apenas com o que pertence à Diretoria/Grupo Geral
  const globalTransactions = transactions.filter(t => !t.troopId && !t.patrolId);

  // Busca todos os usuários
  const users = await prisma.user.findMany({
    select: { id: true, name: true, branch: true },
    orderBy: { name: "asc" }
  });

  // Busca todas as Tropas e Patrulhas para o Modal
  const troops = await prisma.troop.findMany({
    select: { 
      id: true, 
      name: true,
      patrols: { select: { id: true, name: true } }
    },
    orderBy: { name: "asc" }
  });

  // ==========================================
  // CÁLCULOS DO DASHBOARD (Usando APENAS o Caixa Global)
  // ==========================================
  
  // 1. Saldo em Caixa (Receitas Pagas - Despesas Pagas do GRUPO)
  const receitasPagas = globalTransactions
    .filter(t => t.type === "INCOME" && t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const despesasPagas = globalTransactions
    .filter(t => t.type === "EXPENSE" && t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const saldoAtual = receitasPagas - despesasPagas;

  // 2. A Receber do GRUPO
  const aReceber = globalTransactions
    .filter(t => t.type === "INCOME" && t.status === "PENDING")
    .reduce((acc, t) => acc + t.amount, 0);

  // 3. A Pagar do GRUPO
  const aPagar = globalTransactions
    .filter(t => t.type === "EXPENSE" && t.status === "PENDING")
    .reduce((acc, t) => acc + t.amount, 0);

  // Formatador de Moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-down flex flex-col gap-6 h-full min-h-[calc(100vh-10rem)]">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-1 sm:px-0">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-scout-green tracking-tight">Gestão Financeira</h1>
          <p className="text-gray-500 text-sm md:text-base mt-1">Controle do Caixa Central e auditoria das seções.</p>
        </div>
        
        {/* Botões de Ação */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <BtnGerarRelatorio /> 
          <BtnNovaTransacao users={users} troops={troops} />
        </div>
      </div>

      {/* AVISO VISUAL CLARO */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
        <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Resumo do Caixa Central</h4>
          <p className="text-xs text-blue-700 mt-1">
            Os cartões abaixo refletem <strong>estritamente</strong> o saldo e as pendências do <strong>Caixa Geral do Grupo</strong>. 
            O dinheiro gerenciado de forma independente pelas Tropas e Patrulhas não está somado aqui, mas pode ser auditado na tabela de registros abaixo.
          </p>
        </div>
      </div>

      {/* CARDS DE RESUMO (DASHBOARD - SÓ GLOBAL) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 shrink-0">
        
        {/* Card: Saldo Atual (Cor primária/Azulada) */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-vault text-xl"></i>
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">Caixa Geral do Grupo</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">Saldo Atual</h3>
            <p className={`font-heading text-2xl lg:text-3xl font-black tracking-tight ${saldoAtual >= 0 ? 'text-scout-green' : 'text-red-600'}`}>
              {formatCurrency(saldoAtual)}
            </p>
          </div>
        </div>

        {/* Card: A Receber */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-hand-holding-dollar text-xl"></i>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">Apenas Caixa Geral</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">Inadimplência / A Receber</h3>
            <p className="font-heading text-2xl lg:text-3xl font-black tracking-tight text-gray-800">
              {formatCurrency(aReceber)}
            </p>
          </div>
        </div>

        {/* Card: A Pagar */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-file-invoice-dollar text-xl pl-1"></i>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">Apenas Caixa Geral</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">Despesas Pendentes</h3>
            <p className="font-heading text-2xl lg:text-3xl font-black tracking-tight text-gray-800">
              {formatCurrency(aPagar)}
            </p>
          </div>
        </div>

      </div>

      {/* ÁREA DA TABELA (TODAS AS TRANSAÇÕES PARA AUDITORIA) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-100 mt-2">
        <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-list-ul text-gray-400"></i> Registro de Todas as Transações
            </span>
            <p className="text-xs text-gray-500 mt-1">Exibindo fluxo do Grupo, Tropas e Patrulhas.</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* O componente TransactionTable já possui as "Badges" (Etiquetas) que mostram se é Geral, Tropa ou Patrulha! */}
          <TransactionTable transactions={transactions} users={users} troops={troops} />
        </div>
      </div>

    </div>
  );
}