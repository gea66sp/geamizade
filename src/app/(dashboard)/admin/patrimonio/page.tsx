import prisma from "@/src/lib/prisma";
import InventoryManager from "./_components/InventoryManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patrimônio e Almoxarifado | Admin",
  description: "Gerenciamento de materiais, carga e histórico de empréstimos do Grupo Escoteiro.",
};

export default async function PatrimonioPage() {
  // Busca os itens COM o empréstimo ATIVO (se houver)
  const items = await prisma.inventoryItem.findMany({
    include: {
      loans: {
        where: { returnedAt: null }, // Pega só o empréstimo que ainda não foi devolvido
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Busca TODOS os empréstimos para a aba de histórico
  const allLoans = await prisma.itemLoan.findMany({
    include: {
      item: true,
      user: { select: { name: true, role: true } },
    },
    orderBy: { borrowedAt: "desc" }, // Mais recentes primeiro
  });

  // Busca usuários para o select de empréstimo
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, branch: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <InventoryManager initialItems={items} allLoans={allLoans} users={users} />
    </div>
  );
}