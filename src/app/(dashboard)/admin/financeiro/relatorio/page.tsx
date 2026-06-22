import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import PrintButton from "./PrintButton";

// Tipagem correta para o Next.js 15+, onde searchParams é uma Promise!
interface RelatorioPageProps {
  searchParams: Promise<{ inicio?: string; fim?: string }>;
}

export default async function RelatorioFinanceiroPage({ searchParams }: RelatorioPageProps) {
  
  // 1. CORREÇÃO CRÍTICA: Aguarda a resolução dos parâmetros da URL
  const resolvedSearchParams = await searchParams;
  const inicio = resolvedSearchParams.inicio;
  const fim = resolvedSearchParams.fim;

  // Se não houver os parâmetros corretos, aí sim redireciona de forma segura
  if (!inicio || !fim) {
    redirect("/admin/financeiro");
  }

  // Define o intervalo de tempo cobrindo o dia inteiro (de 00:00 até 23:59)
  const startDate = new Date(`${inicio}T00:00:00`);
  const endDate = new Date(`${fim}T23:59:59`);

  // Busca as transações do período no banco de dados
  const rawTransactions = await prisma.financialTransaction.findMany({
    where: {
      dueDate: { gte: startDate, lte: endDate },
    },
    include: {
      user: { select: { name: true } },
      troop: { select: { name: true } },
      patrol: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // SANITIZAÇÃO DE DADOS: Transforma o Decimal do Prisma em Number puro para evitar quebras
  const transactions = rawTransactions.map(t => ({
    ...t,
    amount: Number(t.amount),
  }));

  // ==========================================
  // CÁLCULOS DOS SUBTOTAIS (Lógica de Relatório)
  // ==========================================
  const receitasPagas = transactions
    .filter(t => t.type === "INCOME" && t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const despesasPagas = transactions
    .filter(t => t.type === "EXPENSE" && t.status === "PAID")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const saldoAtual = receitasPagas - despesasPagas;

  // Separação em Caixas Independentes
  const caixaGeral = transactions.filter(t => !t.troopId && !t.patrolId);
  const caixasTropas = transactions.filter(t => t.troopId && !t.patrolId);
  const caixasPatrulhas = transactions.filter(t => t.patrolId);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
  };

  // Componente de Tabela Interno Reutilizável
  const TabelaLancamentos = ({ titulo, itens, icone }: { titulo: string; itens: any[]; icone: string }) => {
    if (itens.length === 0) return null;
    return (
      <div className="mb-10 break-inside-avoid">
        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4 flex items-center gap-2">
          <i className={`fa-solid ${icone} text-gray-400 text-sm`}></i> 
          {titulo}
        </h2>
        <table className="w-full text-left text-xs border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider">
              <th className="p-3 border border-gray-200 w-[15%]">Data</th>
              <th className="p-3 border border-gray-200 w-[45%]">Descrição</th>
              <th className="p-3 border border-gray-200 w-[20%]">Associado</th>
              <th className="p-3 border border-gray-200 text-right w-[20%]">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/50 border-b border-gray-200 transition-colors">
                <td className="p-3 border border-gray-200 text-gray-600">{formatDate(t.dueDate)}</td>
                <td className="p-3 border border-gray-200 font-semibold text-gray-800">
                  {t.title} 
                  {t.troop && <span className="text-[10px] bg-green-50 text-scout-green px-1.5 py-0.5 rounded ml-1.5 font-bold">{t.troop.name}</span>}
                  {t.patrol && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded ml-1.5 font-bold">{t.patrol.name}</span>}
                </td>
                <td className="p-3 border border-gray-200 text-gray-500">{t.user?.name || "-"}</td>
                <td className={`p-3 border border-gray-200 text-right font-black ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen text-black">
      
      {/* Barra de Ações Superior (print:hidden esconde isso no PDF gerado) */}
      <div className="print:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <p className="text-sm font-medium">
          <i className="fa-solid fa-circle-info text-blue-400 mr-2"></i> 
          Visualização de Impressão ativa. Clique no botão ao lado para salvar o PDF.
        </p>
        <div className="flex gap-3">
          <a 
            href="/admin/financeiro" 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-sm transition-all text-center"
          >
            Voltar ao Painel
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Página A4 Virtual simulada no Navegador */}
      <div className="max-w-[210mm] mx-auto p-8 md:p-14 bg-white print:p-0 print:max-w-none shadow-[0_0_40px_rgba(0,0,0,0.03)] my-6 print:my-0 border border-gray-100 print:border-0 rounded-2xl print:rounded-none">
        
        {/* Cabeçalho Oficial do Relatório */}
        <div className="border-b-4 border-scout-green pb-6 mb-8 flex justify-between items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Demonstrativo Financeiro</h1>
            <p className="text-gray-500 font-bold text-sm tracking-wide mt-1">GRUPO ESCOTEIRO AMIZADE 66/SP</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200">
              Período: {formatDate(startDate)} a {formatDate(endDate)}
            </p>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Emitido em: {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Quadro de Resumo Consolidado (Dashboard Executivo) */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receitas Liquidadas</p>
            <p className="text-lg font-black text-green-600 mt-1">{formatCurrency(receitasPagas)}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Despesas Liquidadas</p>
            <p className="text-lg font-black text-red-600 mt-1">{formatCurrency(despesasPagas)}</p>
          </div>
          <div className="bg-scout-green/5 border border-scout-green/20 p-4 rounded-xl text-center">
            <p className="text-[10px] font-bold text-scout-green uppercase tracking-wider">Saldo do Período</p>
            <p className={`text-xl font-black mt-1 ${saldoAtual >= 0 ? 'text-scout-green' : 'text-red-600'}`}>
              {formatCurrency(saldoAtual)}
            </p>
          </div>
        </div>

        {/* Renderização condicional das tabelas por Centro de Custo */}
        {transactions.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <i className="fa-solid fa-money-bill-transfer text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 font-semibold">Nenhuma movimentação financeira encontrada neste intervalo de datas.</p>
          </div>
        ) : (
          <>
            <TabelaLancamentos titulo="1. Caixa Geral (Diretoria)" itens={caixaGeral} icone="fa-globe" />
            <TabelaLancamentos titulo="2. Caixas das Tropas (Ramos)" itens={caixasTropas} icone="fa-tent" />
            <TabelaLancamentos titulo="3. Caixas de Patrulhas (Matilhas)" itens={caixasPatrulhas} icone="fa-paw" />
          </>
        )}

        {/* Rodapé de Assinaturas Executivas para Auditoria */}
        <div className="mt-24 pt-8 border-t border-gray-200 flex flex-row justify-around gap-8 text-center break-inside-avoid">
          <div className="w-56 md:w-64">
            <div className="border-b border-gray-400 mb-2"></div>
            <p className="text-[11px] font-bold text-gray-700">Diretoria Financeira</p>
            <p className="text-[9px] text-gray-400 mt-0.5">GE Amizade 66SP</p>
          </div>
          <div className="w-56 md:w-64">
            <div className="border-b border-gray-400 mb-2"></div>
            <p className="text-[11px] font-bold text-gray-700">Diretoria Presidente</p>
            <p className="text-[9px] text-gray-400 mt-0.5">GE Amizade 66SP</p>
          </div>
        </div>

      </div>
    </div>
  );
}