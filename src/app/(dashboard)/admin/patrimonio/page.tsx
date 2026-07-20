import prisma from "@/src/lib/prisma";
import InventoryManager from "./_components/InventoryManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patrimônio e Almoxarifado | GE Amizade",
  description: "Gerenciamento de materiais, carga e histórico de empréstimos do Grupo Escoteiro.",
};

export default async function PatrimonioPage() {
  
  // 1. Busca os itens COM o empréstimo ATIVO e o Dono (Tropa/Patrulha)
  const items = await prisma.inventoryItem.findMany({
    include: {
      loans: {
        where: { returnedAt: null }, 
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
      troop: { select: { name: true } },
      patrol: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // 2. Busca TODOS os empréstimos (Histórico)
  const allLoans = await prisma.itemLoan.findMany({
    include: {
      item: true,
      user: { select: { name: true, role: true } },
    },
    orderBy: { borrowedAt: "desc" }, 
  });

  // 3. Busca usuários para o select de quem vai retirar o material
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, branch: true },
    orderBy: { name: "asc" },
  });

  // 4. Busca as Tropas e Patrulhas para o Select de "Proprietário" no momento do Cadastro do item
  const troops = await prisma.troop.findMany({
    select: {
      id: true,
      name: true,
      patrols: { select: { id: true, name: true } }
    },
    orderBy: { name: "asc" }
  });

  // Categorias únicas baseadas nos itens cadastrados (Para o filtro funcionar)
  const categories = Array.from(new Set(items.map(i => i.category))).sort();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-down h-full min-h-[calc(100vh-10rem)] pb-12">
      <InventoryManager 
        initialItems={items} 
        allLoans={allLoans} 
        users={users} 
        troops={troops} 
        categories={categories} 
      />
    </div>
  );
}