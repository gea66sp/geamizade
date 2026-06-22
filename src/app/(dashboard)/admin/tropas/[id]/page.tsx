import prisma from "@/src/lib/prisma";
import { getAuthUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TroopDetailClient from "./_components/TroopDetailClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalhes da Seção | GE Amizade 66SP",
  description: "Gerenciamento profundo de membros, patrulhas, finanças e patrimônio.",
};

interface TroopDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TroopDetailPage({ params }: TroopDetailPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const user = await getAuthUser();
  const isAuthorized = user && (user.role === "ADMIN" || user.role === "CHEFE" || user.branch === "DIRETORIA");
  
  if (!isAuthorized) redirect("/");

  // ==========================================
  // 1. BUSCA PROFUNDA DA TROPA E MEMBROS
  // ==========================================
  const troop = await prisma.troop.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, image: true } },
      patrols: {
        include: {
          leader: { select: { id: true, name: true, image: true } },
          subLeader: { select: { id: true, name: true, image: true } },
          members: { select: { id: true, name: true, image: true, role: true }, orderBy: { name: "asc" } }
        },
        orderBy: { name: "asc" }
      },
      members: {
        where: { patrolId: null },
        select: { id: true, name: true, image: true, role: true },
        orderBy: { name: "asc" }
      }
    }
  });

  if (!troop) redirect("/admin/tropas");

  const availableYouth = await prisma.user.findMany({
    where: { role: "MEMBER", troopId: null },
    select: { id: true, name: true, branch: true, image: true },
    orderBy: { name: "asc" }
  });

  // ==========================================
  // 2. BUSCA FINANCEIRA (Tropa + Patrulhas)
  // ==========================================
  const rawFinancials = await prisma.financialTransaction.findMany({
    where: {
      OR: [
        { troopId: id }, // Transações da Tropa
        { patrol: { troopId: id } } // Transações das Patrulhas desta Tropa
      ]
    },
    include: {
      patrol: { select: { name: true } },
      user: { select: { name: true } }
    },
    orderBy: { dueDate: "desc" }
  });

  // Sanitiza o Decimal do Prisma para Number
  const financials = rawFinancials.map(t => ({
    ...t,
    amount: Number(t.amount)
  }));

  // ==========================================
  // 3. BUSCA DE PATRIMÔNIO (Tropa + Patrulhas)
  // ==========================================
  const inventory = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { troopId: id },
        { patrol: { troopId: id } }
      ]
    },
    include: {
      patrol: { select: { name: true } }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-down h-full min-h-[calc(100vh-10rem)] pb-12">
      
      {/* NAVEGAÇÃO / BREADCRUMBS */}
      <div className="mb-4">
        <Link href="/admin/tropas" className="text-sm font-bold text-gray-400 hover:text-scout-green transition-colors flex items-center gap-2 w-fit">
          <i className="fa-solid fa-arrow-left"></i> Voltar para Tropas
        </Link>
      </div>

      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-scout-green/10 text-scout-green rounded-2xl flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-tent"></i>
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              {troop.name}
            </h1>
            <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{troop.branch}</span>
              {troop.manager && <span>Chefe: {troop.manager.name}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* COMPONENTE CLIENTE */}
      <TroopDetailClient 
        troop={troop} 
        availableYouth={availableYouth} 
        financials={financials} 
        inventory={inventory} 
      />
      
    </div>
  );
}