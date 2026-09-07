"use server";

import { revalidatePath } from "next/cache";

import { getErrorMessage } from "@/src/lib/errors";
import {
  createTroopMember,
  getViewerContext,
  updateTroopMemberBasics,
} from "@/src/lib/troopMembers";

async function requireContext() {
  const ctx = await getViewerContext();
  if (!ctx) throw new Error("Sua sessão expirou. Faça login novamente.");
  return ctx;
}

function revalidateTroopSurfaces() {
  revalidatePath("/chefe/tropa");
  revalidatePath("/chefe");
  revalidatePath("/admin/usuarios");
}

export async function createTroopMemberAction(input: {
  name: string;
  email: string;
  password: string;
  troopId: string;
}) {
  try {
    const ctx = await requireContext();
    const created = await createTroopMember(ctx, input);
    revalidateTroopSurfaces();
    return { success: true as const, user: created };
  } catch (error) {
    console.error("Erro ao cadastrar jovem na tropa:", error);
    return { success: false as const, error: getErrorMessage(error, "Falha ao cadastrar o jovem.") };
  }
}

export async function updateTroopMemberAction(
  userId: string,
  input: { name: string; email: string; phone?: string | null }
) {
  try {
    const ctx = await requireContext();
    await updateTroopMemberBasics(ctx, userId, input);
    revalidateTroopSurfaces();
    return { success: true as const };
  } catch (error) {
    console.error("Erro ao atualizar dados do jovem:", error);
    return { success: false as const, error: getErrorMessage(error, "Falha ao salvar os dados.") };
  }
}
