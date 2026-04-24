import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";
import TroopClient from "./_components/TroopClient";

export const metadata: Metadata = {
  title: "Gerenciar Tropas | GE Amizade",
  description: "Gerenciamento de tropas, ramos e membros do grupo.",
};

export default async function TropasPage() {
  // ==========================================
  // BUSCA DE DADOS EM PARALELO (Alta Performance)
  // ==========================================
  // Usamos Promise.all para que o Prisma busque as tropas e os usuários
  // ao mesmo tempo, reduzindo o tempo de carregamento da página.
  const [tropas, users] = await Promise.all([
    // 1. Busca as tropas
    prisma.troop.findMany({
      include: {
        manager: true,
        members: {
          select: { id: true, name: true, branch: true }, // Trazemos apenas o necessário
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    
    // 2. Busca os usuários
    prisma.user.findMany({
      select: { id: true, name: true, role: true, branch: true },
      orderBy: { name: "asc" },
    })
  ]);

  return (
    <div className="w-full animate-fade-in-down space-y-6 pb-12">
      {/* ==========================================
          COMPONENTE CLIENTE (Tabela e Modais)
      ========================================== */}
      <div className="mt-6">
        <TroopClient initialTroops={tropas} users={users} />
      </div>
      
    </div>
  );
}