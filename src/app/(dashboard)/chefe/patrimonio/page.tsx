import type { Metadata } from "next";
import { redirect } from "next/navigation";

import prisma from "@/src/lib/prisma";
import { getTroopInventory, getViewerContext } from "@/src/lib/finance";
import ChefeAssetsClient from "./_components/ChefeAssetsClient";

export const metadata: Metadata = {
  title: "Patrimônio da Seção",
  description: "Material da sua tropa e das patrulhas dela.",
};

export default async function ChefePatrimonioPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  if (ctx.kind !== "CHEFE" && ctx.kind !== "GLOBAL") redirect("/chefe");

  const [items, users] = await Promise.all([
    getTroopInventory(ctx.managedTroopIds),
    // Só os membros da seção — o chefe não empresta material para fora dela.
    prisma.user.findMany({
      where: { troopId: { in: ctx.managedTroopIds } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const emprestados = items.filter((i) => i.loans.length > 0).length;
  const total = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-boxes-stacked"></i>
          </span>
          Patrimônio da Seção
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Material alocado à sua tropa e às patrulhas. O cadastro e a baixa de material são feitos
          pelo Almoxarifado do grupo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Itens na seção", value: items.length, icon: "fa-box", box: "bg-blue-50 text-blue-600" },
          { label: "Unidades no total", value: total, icon: "fa-cubes", box: "bg-scout-green/10 text-scout-green" },
          { label: "Emprestados agora", value: emprestados, icon: "fa-hand-holding", box: "bg-amber-50 text-amber-500" },
        ].map((c) => (
          <div key={c.label} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${c.box}`}>
              <i className={`fa-solid ${c.icon}`}></i>
            </div>
            <p className="text-3xl font-black text-gray-800">{c.value}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <ChefeAssetsClient items={items} users={users} />
    </div>
  );
}
