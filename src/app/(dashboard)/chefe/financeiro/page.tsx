import type { Metadata } from "next";
import { redirect } from "next/navigation";

import prisma from "@/src/lib/prisma";
import { getTroopFinancials, getViewerContext, summarizeFinancials } from "@/src/lib/finance";
import ChefeFinanceClient from "./_components/ChefeFinanceClient";

export const metadata: Metadata = {
  title: "Financeiro da Seção",
  description: "Caixa da sua tropa e das patrulhas dela.",
};

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function ChefeFinanceiroPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  // O layout de /chefe já barra quem não é CHEFE; isto é a segunda trava.
  if (ctx.kind !== "CHEFE" && ctx.kind !== "GLOBAL") redirect("/chefe");

  const [transactions, troops] = await Promise.all([
    getTroopFinancials(ctx.managedTroopIds),
    prisma.troop.findMany({
      where: { id: { in: ctx.managedTroopIds } },
      select: {
        id: true,
        name: true,
        patrols: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Só os jovens da seção podem ser vinculados a um lançamento do chefe.
  const users = await prisma.user.findMany({
    where: { troopId: { in: ctx.managedTroopIds } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const { saldo, aReceber, aPagar } = summarizeFinancials(transactions);

  const cards = [
    { label: "Saldo da Seção", value: saldo, icon: "fa-vault", cls: saldo >= 0 ? "text-scout-green" : "text-red-600", box: "bg-blue-50 text-blue-600" },
    { label: "A Receber", value: aReceber, icon: "fa-hand-holding-dollar", cls: "text-gray-800", box: "bg-amber-50 text-amber-500" },
    { label: "A Pagar", value: aPagar, icon: "fa-file-invoice-dollar", cls: "text-gray-800", box: "bg-red-50 text-red-500" },
  ];

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-coins"></i>
          </span>
          Financeiro da Seção
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Caixa da sua tropa e das patrulhas dela. O caixa geral do grupo é gerido pela Diretoria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.box}`}>
              <i className={`fa-solid ${c.icon} text-xl`}></i>
            </div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">{c.label}</h3>
            <p className={`font-heading text-2xl lg:text-3xl font-black tracking-tight ${c.cls}`}>
              {brl(c.value)}
            </p>
          </div>
        ))}
      </div>

      <ChefeFinanceClient transactions={transactions} troops={troops} users={users} />
    </div>
  );
}
