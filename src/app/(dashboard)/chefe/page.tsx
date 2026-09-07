import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { getTroopFinancials, summarizeFinancials } from "@/src/lib/finance";

export const metadata: Metadata = {
  title: "Painel do Chefe",
  description: "Resumo da(s) tropa(s) que você gerencia.",
};

export default async function ChefeHomePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const firstName = user.name?.split(" ")[0] || "Chefe";

  const managedTroops = await prisma.troop.findMany({
    where: { managerId: user.id },
    select: {
      id: true,
      name: true,
      _count: { select: { members: true, patrols: true } },
    },
  });

  const troopIds = managedTroops.map((t) => t.id);

  const [totalMembers, totalPatrols, pendingPosts, financials, inventoryCount] = await Promise.all([
    managedTroops.reduce((sum, t) => sum + t._count.members, 0),
    managedTroops.reduce((sum, t) => sum + t._count.patrols, 0),
    prisma.blogPost.count({
      where: { troopId: { in: troopIds }, status: "PENDING_REVIEW" },
    }),
    getTroopFinancials(troopIds),
    prisma.inventoryItem.count({
      where: { OR: [{ troopId: { in: troopIds } }, { patrol: { troopId: { in: troopIds } } }] },
    }),
  ]);

  const { saldo } = summarizeFinancials(financials);
  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">Olá, {firstName}!</h1>
        <p className="text-sm text-gray-500 mt-1">
          {managedTroops.length === 1
            ? `Aqui está um resumo da ${managedTroops[0].name}.`
            : `Aqui está um resumo das ${managedTroops.length} tropas que você gerencia.`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <i className="fa-solid fa-users"></i>
          </div>
          <p className="text-3xl font-black text-gray-800">{totalMembers}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Jovens na Tropa</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-scout-green/10 text-scout-green flex items-center justify-center mb-2">
            <i className="fa-solid fa-flag"></i>
          </div>
          <p className="text-3xl font-black text-gray-800">{totalPatrols}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Patrulhas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <i className="fa-solid fa-hourglass-half"></i>
            </div>
            {pendingPosts > 0 && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                Ação Necessária
              </span>
            )}
          </div>
          <p className="text-3xl font-black text-gray-800">{pendingPosts}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Posts Aguardando Aprovação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/chefe/tropa"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-scout-green/10 text-scout-green group-hover:bg-scout-green group-hover:text-white transition-colors">
            <i className="fa-solid fa-users"></i>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-gray-900">Minha Tropa</span>
        </Link>

        <Link
          href="/chefe/blog"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <i className="fa-solid fa-newspaper"></i>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-gray-900">Blog da Tropa</span>
        </Link>

        <Link
          href="/chefe/financeiro"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <i className="fa-solid fa-coins"></i>
          </div>
          <div>
            <span className="font-bold text-gray-700 group-hover:text-gray-900 block">Financeiro</span>
            <span className="text-xs text-gray-500">Saldo da seção: {brl(saldo)}</span>
          </div>
        </Link>

        <Link
          href="/chefe/patrimonio"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <div>
            <span className="font-bold text-gray-700 group-hover:text-gray-900 block">Patrimônio</span>
            <span className="text-xs text-gray-500">{inventoryCount} item(ns) na seção</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
