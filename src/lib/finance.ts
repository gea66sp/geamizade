// Módulo de servidor do financeiro e patrimônio POR SEÇÃO. Segue o padrão de
// events.ts / guardian.ts, reaproveitando o ViewerContext.
//
// A regra que importa: o CAIXA GERAL do grupo (lançamento sem tropa nem
// patrulha) é da Diretoria. O chefe só alcança o que estiver amarrado a uma
// tropa que ele gerencia — ou a uma patrulha dessa tropa.
import prisma from "@/src/lib/prisma";
import { ViewerContext, getViewerContext } from "@/src/lib/notifications";

export { getViewerContext };
export type { ViewerContext };

export type TransactionScope = {
  troopId?: string | null;
  patrolId?: string | null;
};

// Resolve a tropa efetiva de um escopo: uma patrulha implica a tropa dela.
async function resolveScopeTroopId(scope: TransactionScope): Promise<string | null> {
  if (scope.patrolId) {
    const patrol = await prisma.patrol.findUnique({
      where: { id: scope.patrolId },
      select: { troopId: true },
    });
    return patrol?.troopId ?? null;
  }
  return scope.troopId ?? null;
}

/**
 * Quem pode criar/editar/excluir um lançamento com este escopo.
 *
 * Assíncrona de propósito: uma patrulha precisa ser resolvida até a tropa dela
 * antes de qualquer comparação. Confiar no `troopId` que veio do cliente
 * permitiria enviar `patrolId` de outra tropa com o `troopId` da própria.
 */
export async function canManageTransaction(
  ctx: ViewerContext,
  scope: TransactionScope
): Promise<boolean> {
  if (ctx.kind === "GLOBAL") return true;
  if (ctx.kind !== "CHEFE") return false;

  const troopId = await resolveScopeTroopId(scope);

  // Sem escopo = caixa geral do grupo. Exclusivo da Diretoria.
  if (!troopId) return false;

  return ctx.managedTroopIds.includes(troopId);
}

/**
 * Idem para o patrimônio: o chefe alcança material da própria seção.
 * O cadastro e a baixa continuam restritos ao Almoxarifado — isto aqui vale
 * para empréstimo e devolução.
 */
export async function canLendItem(ctx: ViewerContext, itemId: string): Promise<boolean> {
  if (ctx.kind === "GLOBAL") return true;
  if (ctx.kind !== "CHEFE") return false;

  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    select: { troopId: true, patrol: { select: { troopId: true } } },
  });
  if (!item) return false;

  const troopId = item.patrol?.troopId ?? item.troopId;
  return !!troopId && ctx.managedTroopIds.includes(troopId);
}

/**
 * O chefe só empresta material para quem é da seção dele. Sem isto, ele
 * conseguiria entregar o material da tropa para qualquer pessoa do grupo.
 */
export async function canLendToUser(ctx: ViewerContext, userId: string): Promise<boolean> {
  if (ctx.kind === "GLOBAL") return true;
  if (ctx.kind !== "CHEFE") return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { troopId: true },
  });
  return !!user?.troopId && ctx.managedTroopIds.includes(user.troopId);
}

// ==========================================
// CONSULTAS DA SEÇÃO
// ==========================================
// Mesma cláusula que admin/tropas/[id] já usa: o caixa da seção inclui o que
// está na tropa E o que está nas patrulhas dela.
function troopScopeFilter(troopIds: string[]) {
  return {
    OR: [{ troopId: { in: troopIds } }, { patrol: { troopId: { in: troopIds } } }],
  };
}

export async function getTroopFinancials(troopIds: string[]) {
  if (troopIds.length === 0) return [];

  const raw = await prisma.financialTransaction.findMany({
    where: troopScopeFilter(troopIds),
    orderBy: { dueDate: "desc" },
    include: {
      user: { select: { name: true } },
      troop: { select: { name: true } },
      patrol: { select: { name: true } },
    },
  });

  // O Prisma devolve Decimal; as telas trabalham com number.
  return raw.map((t) => ({ ...t, amount: Number(t.amount) }));
}

export async function getTroopInventory(troopIds: string[]) {
  if (troopIds.length === 0) return [];

  return prisma.inventoryItem.findMany({
    where: troopScopeFilter(troopIds),
    orderBy: { name: "asc" },
    include: {
      troop: { select: { name: true } },
      patrol: { select: { name: true } },
      assignedUser: { select: { id: true, name: true } },
      loans: {
        where: { returnedAt: null },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  });
}

/** Saldo da seção: só o que já foi efetivamente pago entra no caixa. */
export function summarizeFinancials(financials: { type: string; status: string; amount: number }[]) {
  const paid = (type: string) =>
    financials
      .filter((t) => t.type === type && t.status === "PAID")
      .reduce((acc, t) => acc + t.amount, 0);

  const pending = (type: string) =>
    financials
      .filter((t) => t.type === type && t.status === "PENDING")
      .reduce((acc, t) => acc + t.amount, 0);

  return {
    saldo: paid("INCOME") - paid("EXPENSE"),
    aReceber: pending("INCOME"),
    aPagar: pending("EXPENSE"),
  };
}
