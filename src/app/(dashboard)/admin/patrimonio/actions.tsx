"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { ItemCondition } from "@prisma/client";

export type InventoryFormData = {
  id?: string;
  chargeNumber?: string;
  name: string;
  category: string;
  quantity: number;
  condition: ItemCondition;
  notes?: string;
};

export async function saveInventoryItem(data: InventoryFormData) {
  try {
    // Se não informou o Número de Carga, gera um automático (Ex: MC-849201)
    let finalChargeNumber = data.chargeNumber?.trim();
    if (!finalChargeNumber && !data.id) {
      let isUnique = false;
      while (!isUnique) {
        finalChargeNumber = `MC-${Math.floor(100000 + Math.random() * 900000)}`;
        const exists = await prisma.inventoryItem.findUnique({ where: { chargeNumber: finalChargeNumber } });
        if (!exists) isUnique = true;
      }
    }

    if (data.id) {
      await prisma.inventoryItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          condition: data.condition,
          notes: data.notes,
          // Não atualizamos o chargeNumber aqui, pois ele é imutável após criado!
        },
      });
    } else {
      await prisma.inventoryItem.create({
        data: {
          chargeNumber: finalChargeNumber as string,
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          condition: data.condition,
          notes: data.notes,
        },
      });
    }
    revalidatePath("/admin/patrimonio");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { error: "Este Número de Carga já está em uso!" };
    return { error: "Erro ao salvar o item." };
  }
}

// NOVA FUNÇÃO DE "EXCLUSÃO LÓGICA" (Dar Baixa)
export async function dischargeInventoryItem(id: string, reason: string) {
  try {
    // Verifica se o item está emprestado no momento. Se estiver, não pode ser descarregado.
    const activeLoan = await prisma.itemLoan.findFirst({ where: { itemId: id, returnedAt: null } });
    if (activeLoan) return { error: "Não é possível dar baixa em um item que está emprestado. Devolva-o primeiro." };

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        isActive: false,
        dischargeReason: reason,
        dischargedAt: new Date(),
      },
    });
    revalidatePath("/admin/patrimonio");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao dar baixa no item." };
  }
}

export async function checkoutItem(itemId: string, userId: string, expectedReturn?: Date) {
  try {
    await prisma.itemLoan.create({
      data: {
        itemId,
        userId,
        expectedReturn: expectedReturn || null,
      },
    });
    revalidatePath("/admin/patrimonio");
    return { success: true };
  } catch (error) {
    console.error("Erro ao emprestar item:", error);
    return { error: "Erro ao registrar empréstimo." };
  }
}

export async function returnItem(itemId: string) {
  try {
    const activeLoan = await prisma.itemLoan.findFirst({
      where: { 
        itemId: itemId,
        returnedAt: null 
      },
    });

    if (!activeLoan) {
      return { error: "Nenhum empréstimo ativo encontrado para este item." };
    }

    await prisma.itemLoan.update({
      where: { id: activeLoan.id },
      data: {
        returnedAt: new Date(),
      },
    });

    revalidatePath("/admin/patrimonio");
    return { success: true };
  } catch (error) {
    console.error("Erro ao devolver item:", error);
    return { error: "Erro ao registrar devolução." };
  }
}

// ==========================================
// FUNÇÕES DE RELATÓRIO (PDF)
// ==========================================

export async function getInventoryReportData() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
      include: {
        loans: {
          where: { returnedAt: null },
          include: { user: { select: { name: true } } }
        }
      }
    });
    return { success: true, data: items };
  } catch (error) {
    return { error: "Erro ao buscar dados do inventário." };
  }
}

export async function getLoansReportData(startDate?: string, endDate?: string) {
  try {
    const whereClause: any = {};
    
    // Se o usuário selecionou datas, filtra pela data de retirada (borrowedAt)
    if (startDate && endDate) {
      whereClause.borrowedAt = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    const loans = await prisma.itemLoan.findMany({
      where: whereClause,
      orderBy: { borrowedAt: "desc" },
      include: {
        item: { select: { name: true, chargeNumber: true } },
        user: { select: { name: true } }
      }
    });
    return { success: true, data: loans };
  } catch (error) {
    return { error: "Erro ao buscar dados de empréstimos." };
  }
}