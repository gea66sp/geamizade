import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/src/lib/auth"; 
import BtnNovaTransacao from "./_components/BtnNovaTransacao";
import TransactionTable from "./_components/TransactionTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financeiro | GE Amizade 66SP",
  description: "Gerencie as finanças do Grupo Escoteiro Amizade 66/SP, controle mensalidades, despesas e visualize relatórios financeiros para manter a saúde financeira do grupo em dia.",
};

export default async function FinanceiroDashboardPage() {
  const user = await getAuthUser();

  // VERIFICAÇÃO DE ACESSO (Garante que existe usuário E que ele tem o cargo certo)
  const isAuthorized = user && (
    user.role === "ADMIN" || 
    user.role === "FINANCEIRO" || 
    user.branch === "DIRETORIA"
  );

  if (!isAuthorized) {
    redirect("/"); // Redireciona se não estiver logado ou não tiver permissão
  }

  // Busca todas as transações, trazendo o nome do usuário associado (se houver)
  const transactions = await prisma.financialTransaction.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      user: { select: { name: true } }
    }
  });

  // Busca todos os usuários para poder vincular mensalidades/taxas no Modal
  const users = await prisma.user.findMany({
    select: { id: true, name: true, branch: true },
    orderBy: { name: "asc" }
  });

  // ==========================================
  // CÁLCULOS DO DASHBOARD (Lógica de Negócio)
  // ==========================================
  
  // 1. Saldo em Caixa (Receitas Pagas - Despesas Pagas)
  const receitasPagas = transactions
    .filter(t => t.type === "INCOME" && t.status === "PAID")
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const despesasPagas = transactions
    .filter(t => t.type === "EXPENSE" && t.status === "PAID")
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const saldoAtual = receitasPagas - despesasPagas;

  // 2. A Receber (Mensalidades/Taxas Pendentes)
  const aReceber = transactions
    .filter(t => t.type === "INCOME" && t.status === "PENDING")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // 3. A Pagar (Contas do Grupo Pendentes)
  const aPagar = transactions
    .filter(t => t.type === "EXPENSE" && t.status === "PENDING")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // Formatador de Moeda (BRL)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    // Removido a altura rígida (h-[calc...]) e substituído por uma estrutura flexível e responsiva
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-down flex flex-col gap-6 h-full min-h-[calc(100vh-10rem)]">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-1 sm:px-0">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-scout-green tracking-tight">Gestão Financeira</h1>
          <p className="text-gray-500 text-sm md:text-base mt-1">Controle de caixa, mensalidades e despesas do Grupo.</p>
        </div>
        
        {/* Componente Client que abre o Modal */}
        <div className="w-full sm:w-auto">
          <BtnNovaTransacao users={users} />
        </div>
      </div>

      {/* CARDS DE RESUMO (DASHBOARD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 shrink-0">
        
        {/* Card: Saldo Atual (Cor primária/Azulada) */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-vault text-xl"></i>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">Caixa</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">Saldo Atual</h3>
            <p className={`font-heading text-2xl lg:text-3xl font-black tracking-tight ${saldoAtual >= 0 ? 'text-scout-green' : 'text-red-600'}`}>
              {formatCurrency(saldoAtual)}
            </p>
          </div>
        </div>

        {/* Card: A Receber (Cor Amarelo/Âmbar para Pendências) */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-hand-holding-dollar text-xl"></i>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">Inadimplência</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">Total a Receber</h3>
            <p className="font-heading text-2xl lg:text-3xl font-black tracking-tight text-gray-800">
              {formatCurrency(aReceber)}
            </p>
          </div>
        </div>

        {/* Card: A Pagar (Cor Vermelha para Despesas) */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-file-invoice-dollar text-xl pl-1"></i>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">Despesas</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">Total a Pagar</h3>
            <p className="font-heading text-2xl lg:text-3xl font-black tracking-tight text-gray-800">
              {formatCurrency(aPagar)}
            </p>
          </div>
        </div>

      </div>

      {/* ÁREA DA TABELA */}
      {/* min-h-[400px] garante que a tabela tenha espaço mínimo antes de criar barra de rolagem */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-100 lg:min-h-0 mt-2">
        <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <i className="fa-solid fa-list-ul text-gray-400"></i> Lançamentos Recentes
          </span>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* Componente Client gerencia a tabela e as ações */}
          <TransactionTable transactions={transactions} users={users} />
        </div>
      </div>

    </div>
  );
}