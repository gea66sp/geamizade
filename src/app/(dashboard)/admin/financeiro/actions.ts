"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

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

  await prisma.financialTransaction.create({
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

  await prisma.financialTransaction.update({
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

  revalidatePath("/admin/financeiro");
}

export async function deleteTransaction(id: string) {
  await prisma.financialTransaction.delete({
    where: { id }
  });
  revalidatePath("/admin/financeiro");
}