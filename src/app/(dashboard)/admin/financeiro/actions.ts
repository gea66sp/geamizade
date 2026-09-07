"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { dispatchNotifications } from "@/src/lib/notifications";
import { canManageTransaction, getViewerContext, type TransactionScope } from "@/src/lib/finance";

// ==========================================
// NOTIFICAÇÃO AUTOMÁTICA
// Todo lançamento vinculado a uma pessoa avisa essa pessoa (e, se for jovem,
// o responsável legal recebe a cópia — regra aplicada dentro de
// dispatchNotifications, que nunca lança para não derrubar o lançamento).
// ==========================================
const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(date);

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

function buildTransactionSummary(tx: {
  title: string;
  amount: number;
  type: string;
  status: string;
  dueDate: Date;
}) {
  const kind = tx.type === "INCOME" ? "A pagar ao grupo" : "Despesa";
  return `${tx.title} — ${BRL(tx.amount)} (${kind}). Vencimento em ${formatDate(tx.dueDate)}. Situação: ${STATUS_LABEL[tx.status] ?? tx.status}.`;
}

async function notifyTransactionTarget(
  userId: string,
  title: string,
  tx: { title: string; amount: number; type: string; status: string; dueDate: Date }
) {
  await dispatchNotifications({
    recipientUserIds: [userId],
    title,
    message: buildTransactionSummary(tx),
    linkUrl: null,
    origin: "AUTO",
  });
}

// ==========================================
// SEGURANÇA
// A autorização depende do ESCOPO do lançamento, não só do cargo: a Diretoria
// mexe em tudo (inclusive no caixa geral), e o CHEFE apenas no que estiver
// amarrado a uma tropa que ele gerencia. Ver src/lib/finance.ts.
// ==========================================
async function requireContext() {
  const ctx = await getViewerContext();
  if (!ctx) {
    throw new Error("Sua sessão expirou. Faça login novamente para continuar.");
  }
  return ctx;
}

async function assertCanManage(scope: TransactionScope) {
  const ctx = await requireContext();
  if (!(await canManageTransaction(ctx, scope))) {
    throw new Error(
      "Acesso negado: você só pode lançar movimentações da sua própria seção."
    );
  }
  return ctx;
}

export async function createTransaction(formData: FormData) {
  const title = formData.get("title") as string;
  const amountStr = formData.get("amount") as string;
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const status = formData.get("status") as "PENDING" | "PAID" | "CANCELLED";
  const dueDateStr = formData.get("dueDate") as string;
  
  // Vínculos
  const userId = formData.get("userId") as string | null;
  const troopId = formData.get("troopId") as string | null;   // <-- NOVO
  const patrolId = formData.get("patrolId") as string | null; // <-- NOVO

  // A permissão depende do escopo, então só dá para checar depois de lê-lo.
  await assertCanManage({ troopId, patrolId });

  if (!title || !amountStr || !type || !dueDateStr) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  // Permite que o usuário digite "150,50" ou "150.50" e o banco entenda
  const amount = parseFloat(amountStr.replace(",", "."));
  if (isNaN(amount)) throw new Error("Valor inválido.");

  // Se o status for PAGO, pegamos a data de pagamento (ou usamos hoje por padrão)
  let paidDate = null;
  if (status === "PAID") {
    const paidDateStr = formData.get("paidDate") as string;
    paidDate = paidDateStr ? new Date(paidDateStr + "T12:00:00") : new Date(); // Evita fuso horário adiantado
  }

  const created = await prisma.financialTransaction.create({
    data: {
      title: title.trim(),
      amount,
      type,
      status,
      dueDate: new Date(dueDateStr + "T12:00:00"), // Evita fuso horário
      paidDate,
      userId: userId || null,
      troopId: troopId || null,   // <-- NOVO: Se for caixa da tropa
      patrolId: patrolId || null, // <-- NOVO: Se for caixa da patrulha
    }
  });

  if (created.userId) {
    await notifyTransactionTarget(created.userId, "Novo lançamento financeiro", {
      title: created.title,
      amount: Number(created.amount),
      type: created.type,
      status: created.status,
      dueDate: created.dueDate,
    });
  }

  revalidatePath("/admin/financeiro");
}

export async function updateTransaction(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const amountStr = formData.get("amount") as string;
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const status = formData.get("status") as "PENDING" | "PAID" | "CANCELLED";
  const dueDateStr = formData.get("dueDate") as string;
  
  // Vínculos
  const userId = formData.get("userId") as string | null;
  const troopId = formData.get("troopId") as string | null;   // <-- NOVO
  const patrolId = formData.get("patrolId") as string | null; // <-- NOVO

  // Guarda o estado anterior para saber o que de fato mudou e para avisar
  // também quem deixou de ser o vinculado do lançamento.
  const previous = await prisma.financialTransaction.findUnique({
    where: { id },
    select: { userId: true, amount: true, type: true, status: true, dueDate: true, title: true, troopId: true, patrolId: true },
  });
  if (!previous) throw new Error("Lançamento não encontrado.");

  // AS DUAS PONTAS: como o lançamento está HOJE e como ele ficará. Sem checar
  // a origem, um chefe traria um lançamento do caixa geral para dentro da sua
  // tropa; sem checar o destino, empurraria um da tropa para o caixa geral.
  await assertCanManage({ troopId: previous.troopId, patrolId: previous.patrolId });
  await assertCanManage({ troopId, patrolId });

  if (!title || !amountStr || !type || !dueDateStr) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  const amount = parseFloat(amountStr.replace(",", "."));
  if (isNaN(amount)) throw new Error("Valor inválido.");

  let paidDate = null;
  if (status === "PAID") {
    const paidDateStr = formData.get("paidDate") as string;
    paidDate = paidDateStr ? new Date(paidDateStr + "T12:00:00") : new Date();
  }

  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: {
      title: title.trim(),
      amount,
      type,
      status,
      dueDate: new Date(dueDateStr + "T12:00:00"),
      paidDate,
      userId: userId || null,
      troopId: troopId || null,   // <-- NOVO
      patrolId: patrolId || null, // <-- NOVO
    }
  });

  const summary = {
    title: updated.title,
    amount: Number(updated.amount),
    type: updated.type,
    status: updated.status,
    dueDate: updated.dueDate,
  };

  const changedRelevantField =
    !previous ||
    previous.title !== updated.title ||
    Number(previous.amount) !== Number(updated.amount) ||
    previous.type !== updated.type ||
    previous.status !== updated.status ||
    previous.dueDate.getTime() !== updated.dueDate.getTime();

  if (updated.userId && (changedRelevantField || previous?.userId !== updated.userId)) {
    const title =
      updated.status === "PAID" && previous?.status !== "PAID"
        ? "Pagamento confirmado"
        : "Lançamento financeiro atualizado";
    await notifyTransactionTarget(updated.userId, title, summary);
  }

  // O lançamento saiu do nome de alguém: essa pessoa precisa saber.
  if (previous?.userId && previous.userId !== updated.userId) {
    await notifyTransactionTarget(previous.userId, "Lançamento financeiro desvinculado de você", {
      title: previous.title,
      amount: Number(previous.amount),
      type: previous.type,
      status: previous.status,
      dueDate: previous.dueDate,
    });
  }

  revalidatePath("/admin/financeiro");
}

export async function deleteTransaction(id: string) {
  const previous = await prisma.financialTransaction.findUnique({
    where: { id },
    select: { userId: true, title: true, amount: true, type: true, status: true, dueDate: true, troopId: true, patrolId: true },
  });
  if (!previous) throw new Error("Lançamento não encontrado.");

  await assertCanManage({ troopId: previous.troopId, patrolId: previous.patrolId });

  await prisma.financialTransaction.delete({
    where: { id }
  });

  if (previous?.userId) {
    await notifyTransactionTarget(previous.userId, "Lançamento financeiro cancelado", {
      title: previous.title,
      amount: Number(previous.amount),
      type: previous.type,
      status: previous.status,
      dueDate: previous.dueDate,
    });
  }

  revalidatePath("/admin/financeiro");
}