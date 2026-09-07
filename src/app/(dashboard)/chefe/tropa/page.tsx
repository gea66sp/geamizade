import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

import ChefeTroopClient from "./_components/ChefeTroopClient";

export const metadata: Metadata = {
  title: "Minha Tropa",
  description: "Gerencie os membros e patrulhas da sua tropa.",
};

interface ChefeTroopPageProps {
  searchParams: Promise<{ troopId?: string }>;
}

export default async function ChefeTroopPage({ searchParams }: ChefeTroopPageProps) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const managedTroops = await prisma.troop.findMany({
    where: { managerId: user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // O layout já bloqueia chefes sem nenhuma tropa; isso é só uma garantia extra.
  if (managedTroops.length === 0) redirect("/chefe");

  const { troopId: requestedTroopId } = await searchParams;
  const selectedTroopId =
    requestedTroopId && managedTroops.some((t) => t.id === requestedTroopId)
      ? requestedTroopId
      : managedTroops[0].id;

  const troop = await prisma.troop.findUnique({
    where: { id: selectedTroopId },
    select: {
      id: true,
      name: true,
      branch: true,
      patrols: {
        select: {
          id: true,
          name: true,
          leaderId: true,
          subLeaderId: true,
          members: { select: { id: true, name: true, email: true, phone: true, image: true, role: true }, orderBy: { name: "asc" } },
        },
        orderBy: { name: "asc" },
      },
      members: {
        where: { patrolId: null },
        select: { id: true, name: true, email: true, phone: true, image: true, role: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!troop) redirect("/chefe");

  const availableYouth = await prisma.user.findMany({
    where: { role: "MEMBER", troopId: null },
    select: { id: true, name: true, branch: true, image: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-scout-green/10 text-scout-green rounded-2xl flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-tent"></i>
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              {troop.name}
            </h1>
            <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{troop.branch}</span>
            </p>
          </div>
        </div>

        {managedTroops.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {managedTroops.map((t) => (
              <Link
                key={t.id}
                href={`/chefe/tropa?troopId=${t.id}`}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  t.id === selectedTroopId
                    ? "bg-scout-green text-white border-scout-green"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ChefeTroopClient troop={troop} availableYouth={availableYouth} />
    </div>
  );
}
