"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { Branch } from "@prisma/client";
import { getAuthUser } from "@/src/lib/auth";

// ==========================================
// CONTROLE DE ACESSO
// Criar/editar/excluir a Tropa inteira é gestão estrutural (ADMIN/Diretoria).
// Diferente de "gerenciar membros e patrulhas de uma tropa que já existe"
// (isso o CHEFE pode, veja tropas/[id]/actions.ts).
// ==========================================
async function ensureTroopManager() {
  const user = await getAuthUser();
  const isAuthorized = !!user && (user.role === "ADMIN" || user.branch === "DIRETORIA");
  return isAuthorized ? user : null;
}

// ==========================================
// GESTÃO DE TROPAS (RAMOS)
// ==========================================
export async function saveTroop(data: {
  id?: string;
  name: string;
  branch: Branch;
  description: string;
  managerId: string | null;
}) {
  try {
    const authUser = await ensureTroopManager();
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para gerenciar tropas." };
    }

    const managerId = data.managerId && data.managerId.trim() !== "" ? data.managerId : null;

    if (data.id) {
      await prisma.troop.update({
        where: { id: data.id },
        data: {
          name: data.name,
          branch: data.branch,
          description: data.description,
          managerId: managerId,
        },
      });
    } else {
      await prisma.troop.create({
        data: {
          name: data.name,
          branch: data.branch,
          description: data.description,
          managerId: managerId,
        },
      });
    }

    revalidatePath("/admin/tropas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar tropa:", error);
    return { success: false, error: "Erro ao salvar a tropa no banco de dados." };
  }
}

export async function deleteTroop(id: string) {
  try {
    const authUser = await ensureTroopManager();
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para excluir tropas." };
    }

    await prisma.troop.delete({ where: { id } });
    revalidatePath("/admin/tropas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir tropa:", error);
    return { success: false, error: "Erro ao excluir a tropa. Verifique se há vínculos pendentes." };
  }
}

// ==========================================
// GESTÃO DE PATRULHAS / MATILHAS
// ==========================================
export async function savePatrol(data: { id?: string; name: string; troopId: string }) {
  try {
    const authUser = await ensureTroopManager();
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para gerenciar patrulhas." };
    }

    if (data.id) {
      await prisma.patrol.update({
        where: { id: data.id },
        data: { name: data.name },
      });
    } else {
      await prisma.patrol.create({
        data: { name: data.name, troopId: data.troopId },
      });
    }
    revalidatePath(`/admin/tropas/${data.troopId}`);
    revalidatePath("/admin/tropas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar patrulha:", error);
    return { success: false, error: "Falha ao salvar patrulha." };
  }
}

export async function deletePatrol(id: string, troopId: string) {
  try {
    const authUser = await ensureTroopManager();
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para excluir patrulhas." };
    }

    await prisma.patrol.delete({ where: { id } });
    revalidatePath(`/admin/tropas/${troopId}`);
    revalidatePath("/admin/tropas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir patrulha:", error);
    return { success: false, error: "Erro ao excluir patrulha." };
  }
}