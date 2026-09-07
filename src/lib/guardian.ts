// Módulo de servidor da área do responsável. Segue o padrão de events.ts /
// notifications.ts: sem "use server" (exporta tipos), com os wrappers
// chamáveis pelo cliente em guardian.actions.ts.
//
// A regra central: TUDO aqui passa por assertIsGuardianOf. Um responsável só
// alcança quem tem FamilyTie com ele — a mesma trava que setRsvp usa para a
// confirmação de presença.
import prisma from "@/src/lib/prisma";
import { ViewerContext, getViewerContext } from "@/src/lib/notifications";

export { getViewerContext };
export type { ViewerContext };

export type DependentSummary = {
  id: string;
  name: string | null;
  image: string | null;
  troop: { id: string; name: string } | null;
  patrol: { id: string; name: string } | null;
  /** Soma dos lançamentos PENDING a receber — o que a família deve ao grupo. */
  openAmount: number;
  documentCount: number;
};

// ==========================================
// A TRAVA
// ==========================================
export async function assertIsGuardianOf(ctx: ViewerContext, dependentId: string) {
  const tie = await prisma.familyTie.findFirst({
    where: { guardianId: ctx.user.id, dependentId },
    select: { id: true },
  });

  if (!tie) {
    throw new Error("Você não é responsável por este membro.");
  }
}

// ==========================================
// LISTAGEM
// ==========================================
export async function getMyDependents(ctx: ViewerContext) {
  return prisma.user.findMany({
    where: { guardianTies: { some: { guardianId: ctx.user.id } } },
    select: {
      id: true,
      name: true,
      image: true,
      troop: { select: { id: true, name: true } },
      patrol: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

// Resumo para os cartões da home. Agrega em 3 consultas no total,
// independentemente do número de dependentes — não uma por filho.
export async function getDependentsSummary(ctx: ViewerContext): Promise<DependentSummary[]> {
  const dependents = await getMyDependents(ctx);
  if (dependents.length === 0) return [];

  const ids = dependents.map((d) => d.id);

  const [openByUser, docsByUser] = await Promise.all([
    prisma.financialTransaction.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: "PENDING", type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.document.groupBy({
      by: ["ownerId"],
      where: { ownerId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const openMap = new Map(openByUser.map((r) => [r.userId, Number(r._sum.amount ?? 0)]));
  const docMap = new Map(docsByUser.map((r) => [r.ownerId, r._count._all]));

  return dependents.map((d) => ({
    ...d,
    openAmount: openMap.get(d.id) ?? 0,
    documentCount: docMap.get(d.id) ?? 0,
  }));
}

// ==========================================
// FICHA DE UM DEPENDENTE
// ==========================================
export async function getDependentOverview(ctx: ViewerContext, dependentId: string) {
  await assertIsGuardianOf(ctx, dependentId);

  const [dependent, rawFinancials, documents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: dependentId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        branch: true,
        troop: { select: { id: true, name: true } },
        patrol: { select: { id: true, name: true } },
      },
    }),
    prisma.financialTransaction.findMany({
      where: { userId: dependentId },
      orderBy: { dueDate: "desc" },
      select: {
        id: true,
        title: true,
        amount: true,
        type: true,
        status: true,
        dueDate: true,
        paidDate: true,
      },
    }),
    prisma.document.findMany({
      where: { ownerId: dependentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, size: true, createdAt: true, fileUrl: true },
    }),
  ]);

  if (!dependent) throw new Error("Membro não encontrado.");

  // O Prisma devolve Decimal; as telas trabalham com number (mesmo tratamento
  // das demais páginas financeiras).
  const financials = rawFinancials.map((t) => ({ ...t, amount: Number(t.amount) }));

  const openAmount = financials
    .filter((t) => t.status === "PENDING" && t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  return { dependent, financials, documents, openAmount };
}
