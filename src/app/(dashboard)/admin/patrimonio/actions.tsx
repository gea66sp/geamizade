"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { ItemCondition, Prisma } from "@prisma/client";
import { getAuthUser } from "@/src/lib/auth";
import { dispatchNotifications } from "@/src/lib/notifications";
import { getPrismaErrorCode } from "@/src/lib/errors";
import { canLendItem, canLendToUser, getViewerContext } from "@/src/lib/finance";

// ==========================================
// SEGURANÇA: cadastro, edição e baixa de material são do Almoxarifado.
// O CHEFE tem a própria tela em /chefe/patrimonio, mas só empresta e recebe
// de volta — ver canLendItem/canLendToUser em src/lib/finance.ts.
// ==========================================
const ALLOWED_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO"];

async function getAuthorizedUser() {
  const user = await getAuthUser();

  if (!user) {
    throw new Error("Sua sessão expirou. Faça login novamente para continuar.");
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Acesso negado: seu perfil não possui permissão para gerenciar o patrimônio.");
  }

  return user;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export type InventoryFormData = {
  id?: string;
  chargeNumber?: string;
  name: string;
  category: string;
  quantity: number;
  condition: ItemCondition;
  notes?: string;
  // Campos de Propriedade/Centro de Custo
  troopId?: string | null;
  patrolId?: string | null;
  assignedUserId?: string | null; // Membro responsável pela carga individual
};

// ==========================================
// NOTIFICAÇÃO AUTOMÁTICA DE PATRIMÔNIO
// Individual -> avisa o membro. Coletivo -> avisa o chefe da seção e, quando o
// material é de uma patrulha, também o Monitor e o Submonitor dela.
// ==========================================
function describeItem(item: { name: string; chargeNumber: string }) {
  return `${item.name} (nº de carga ${item.chargeNumber})`;
}

async function notifyIndividualAssignment(
  assignedUserId: string,
  item: { name: string; chargeNumber: string }
) {
  await dispatchNotifications({
    recipientUserIds: [assignedUserId],
    title: "Material sob sua responsabilidade",
    message: `O material ${describeItem(item)} foi vinculado ao seu nome. Zele por ele e procure a chefia em caso de dano ou perda.`,
    origin: "AUTO",
  });
}

async function notifyTroopAssignment(troopId: string, item: { name: string; chargeNumber: string }) {
  const troop = await prisma.troop.findUnique({
    where: { id: troopId },
    select: { name: true, managerId: true },
  });

  if (!troop?.managerId) return;

  await dispatchNotifications({
    recipientUserIds: [troop.managerId],
    title: "Novo material vinculado à sua tropa",
    message: `O material ${describeItem(item)} agora pertence à ${troop.name}.`,
    origin: "AUTO",
  });
}

async function notifyPatrolAssignment(patrolId: string, item: { name: string; chargeNumber: string }) {
  const patrol = await prisma.patrol.findUnique({
    where: { id: patrolId },
    select: {
      name: true,
      leaderId: true,
      subLeaderId: true,
      troop: { select: { managerId: true } },
    },
  });

  if (!patrol) return;

  // Chefe da seção + Monitor + Submonitor da patrulha envolvida.
  const recipients = [patrol.troop?.managerId, patrol.leaderId, patrol.subLeaderId].filter(
    (id): id is string => Boolean(id)
  );

  if (recipients.length === 0) return;

  await dispatchNotifications({
    recipientUserIds: recipients,
    title: `Novo material vinculado à ${patrol.name}`,
    message: `O material ${describeItem(item)} foi alocado para a ${patrol.name}.`,
    origin: "AUTO",
  });
}

export async function saveInventoryItem(data: InventoryFormData) {
  try {
    await getAuthorizedUser();
  } catch (error) {
    return { error: getErrorMessage(error, "Acesso negado.") };
  }

  try {
    const troopId = data.troopId && data.troopId.trim() !== "" ? data.troopId : null;
    const patrolId = data.patrolId && data.patrolId.trim() !== "" ? data.patrolId : null;
    const assignedUserId =
      data.assignedUserId && data.assignedUserId.trim() !== "" ? data.assignedUserId : null;

    let finalChargeNumber = data.chargeNumber?.trim();
    if (!finalChargeNumber && !data.id) {
      let isUnique = false;
      while (!isUnique) {
        finalChargeNumber = `MC-${Math.floor(100000 + Math.random() * 900000)}`;
        const exists = await prisma.inventoryItem.findUnique({ where: { chargeNumber: finalChargeNumber } });
        if (!exists) isUnique = true;
      }
    }

    // Estado anterior: só notificamos os vínculos que realmente mudaram, para
    // que uma edição de nome/quantidade não dispare avisos repetidos.
    const previous = data.id
      ? await prisma.inventoryItem.findUnique({
          where: { id: data.id },
          select: { troopId: true, patrolId: true, assignedUserId: true },
        })
      : null;

    let saved: { name: string; chargeNumber: string };

    if (data.id) {
      saved = await prisma.inventoryItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          condition: data.condition,
          notes: data.notes,
          troopId: troopId,
          patrolId: patrolId,
          assignedUserId: assignedUserId,
        },
        select: { name: true, chargeNumber: true },
      });
    } else {
      saved = await prisma.inventoryItem.create({
        data: {
          chargeNumber: finalChargeNumber as string,
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          condition: data.condition,
          notes: data.notes,
          troopId: troopId,
          patrolId: patrolId,
          assignedUserId: assignedUserId,
        },
        select: { name: true, chargeNumber: true },
      });
    }

    if (assignedUserId && assignedUserId !== previous?.assignedUserId) {
      await notifyIndividualAssignment(assignedUserId, saved);
    }
    if (patrolId && patrolId !== previous?.patrolId) {
      await notifyPatrolAssignment(patrolId, saved);
    } else if (troopId && troopId !== previous?.troopId) {
      // Material da tropa sem patrulha definida: avisa só o chefe da seção
      // (quando há patrulha, o aviso dela já inclui o chefe).
      await notifyTroopAssignment(troopId, saved);
    }

    // Atualiza a página geral de patrimônio e as páginas individuais das tropas
    revalidatePath("/admin/patrimonio");
    if (troopId) revalidatePath(`/admin/tropas/${troopId}`);

    return { success: true };
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') return { error: "Este Número de Carga já está em uso!" };
    return { error: "Erro ao salvar o item." };
  }
}

export async function dischargeInventoryItem(id: string, reason: string) {
  try {
    await getAuthorizedUser();
  } catch (error) {
    return { error: getErrorMessage(error, "Acesso negado.") };
  }

  try {
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

// Empréstimo e devolução são o dia a dia do chefe, então aqui a trava não é a
// lista de cargos do almoxarifado: o CHEFE também passa, desde que o material
// seja da seção dele E quem recebe também. Cadastro e baixa continuam restritos.
export async function checkoutItem(itemId: string, userId: string, expectedReturn?: Date) {
  try {
    const ctx = await getViewerContext();
    if (!ctx) return { error: "Sua sessão expirou. Faça login novamente." };

    if (!(await canLendItem(ctx, itemId))) {
      return { error: "Acesso negado: este material não pertence à sua seção." };
    }
    if (!(await canLendToUser(ctx, userId))) {
      return { error: "Você só pode emprestar material para membros da sua seção." };
    }
  } catch (error) {
    return { error: getErrorMessage(error, "Acesso negado.") };
  }

  try {
    // Impede empréstimo duplicado: um item só pode ter um empréstimo ativo por vez.
    const activeLoan = await prisma.itemLoan.findFirst({ where: { itemId, returnedAt: null } });
    if (activeLoan) {
      return { error: "Este item já está emprestado. Registre a devolução antes de emprestá-lo novamente." };
    }

    await prisma.itemLoan.create({
      data: {
        itemId,
        userId,
        expectedReturn: expectedReturn || null,
      },
    });

    // Empréstimo também é um vínculo individual: quem retirou precisa saber.
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: { name: true, chargeNumber: true },
    });

    if (item) {
      const returnNote = expectedReturn
        ? ` Devolução prevista para ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(expectedReturn))}.`
        : "";

      await dispatchNotifications({
        recipientUserIds: [userId],
        title: "Empréstimo de material registrado",
        message: `Você retirou o material ${describeItem(item)}.${returnNote}`,
        origin: "AUTO",
      });
    }

    revalidatePath("/admin/patrimonio");
    return { success: true };
  } catch (error) {
    console.error("Erro ao emprestar item:", error);
    return { error: "Erro ao registrar empréstimo." };
  }
}

export async function returnItem(itemId: string) {
  try {
    const ctx = await getViewerContext();
    if (!ctx) return { error: "Sua sessão expirou. Faça login novamente." };

    if (!(await canLendItem(ctx, itemId))) {
      return { error: "Acesso negado: este material não pertence à sua seção." };
    }
  } catch (error) {
    return { error: getErrorMessage(error, "Acesso negado.") };
  }

  try {
    const activeLoan = await prisma.itemLoan.findFirst({
      where: { itemId: itemId, returnedAt: null },
    });

    if (!activeLoan) return { error: "Nenhum empréstimo ativo encontrado para este item." };

    await prisma.itemLoan.update({
      where: { id: activeLoan.id },
      data: { returnedAt: new Date() },
    });

    revalidatePath("/admin/patrimonio");
    return { success: true };
  } catch (error) {
    console.error("Erro ao devolver item:", error);
    return { error: "Erro ao registrar devolução." };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await getAuthorizedUser();
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Acesso negado.") };
  }

  try {
    await prisma.inventoryItem.delete({ where: { id } });
    revalidatePath("/admin/patrimonio");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir material:", error);
    return { success: false, error: "Erro ao excluir o material. Verifique se existem empréstimos ativos." };
  }
}

// Relatórios
export async function getInventoryReportData() {
  try {
    await getAuthorizedUser();
  } catch (error) {
    return { error: getErrorMessage(error, "Acesso negado.") };
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
      include: {
        loans: {
          where: { returnedAt: null },
          include: { user: { select: { name: true } } }
        },
        troop: { select: { name: true } },
        patrol: { select: { name: true } }
      }
    });
    return { success: true, data: items };
  } catch (error) {
    return { error: "Erro ao buscar dados do inventário." };
  }
}

export async function getLoansReportData(startDate?: string, endDate?: string) {
  try {
    await getAuthorizedUser();
  } catch (error) {
    return { error: getErrorMessage(error, "Acesso negado.") };
  }

  try {
    const whereClause: Prisma.ItemLoanWhereInput = {};
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