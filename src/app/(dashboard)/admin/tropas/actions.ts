"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// GESTÃO DE TROPAS (RAMOS)
// ==========================================
export async function saveTroop(data: {
  id?: string;
  name: string;
  branch: string;
  description: string;
  managerId: string | null;
}) {
  try {
    const managerId = data.managerId && data.managerId.trim() !== "" ? data.managerId : null;

    if (data.id) {
      await prisma.troop.update({
        where: { id: data.id },
        data: {
          name: data.name,
          branch: data.branch as any,
          description: data.description,
          managerId: managerId,
        },
      });
    } else {
      await prisma.troop.create({
        data: {
          name: data.name,
          branch: data.branch as any,
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
  } catch (error: any) {
    return { success: false, error: "Falha ao salvar patrulha." };
  }
}

export async function deletePatrol(id: string, troopId: string) {
  try {
    await prisma.patrol.delete({ where: { id } });
    revalidatePath(`/admin/tropas/${troopId}`);
    revalidatePath("/admin/tropas");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir patrulha." };
  }
}