import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";
import { getAuthUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import TroopClient from "./_components/TroopClient";

export const metadata: Metadata = {
  title: "Gestão de Tropas | GE Amizade 66SP",
  description: "Organização dos ramos, escotistas e patrulhas do Grupo Escoteiro.",
};

export default async function TropasPage() {
  const user = await getAuthUser();

  const isAuthorized = user && (user.role === "ADMIN" || user.role === "CHEFE" || user.branch === "DIRETORIA");
  if (!isAuthorized) redirect("/"); 

  // Busca os dados da Tropa de forma hiper-otimizada (apenas contagens e o nome do chefe)
  const [tropas, users] = await Promise.all([
    prisma.troop.findMany({
      include: {
        manager: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true, patrols: true } },
      },
      orderBy: { branch: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["CHEFE", "ADMIN"] } },
      select: { id: true, name: true, branch: true },
      orderBy: { name: "asc" },
    })
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-down h-full min-h-[calc(100vh-10rem)] pb-12">
      

      {/* COMPONENTE CLIENTE */}
      <TroopClient initialTroops={tropas} managers={users} />
    </div>
  );
}