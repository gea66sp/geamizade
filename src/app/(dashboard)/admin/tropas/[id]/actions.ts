"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. ADICIONAR OU REMOVER JOVEM DA TROPA
// ==========================================
export async function toggleTroopMember(userId: string, troopId: string | null) {
  try {
    // Se o jovem for removido da tropa, ele perde o vínculo da patrulha automaticamente
    await prisma.user.update({
      where: { id: userId },
      data: {
        troopId: troopId,
        patrolId: null, 
      },
    });

    if (troopId) revalidatePath(`/admin/tropas/${troopId}`);
    revalidatePath("/admin/tropas");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar membro da tropa:", error);
    return { success: false, error: "Erro ao atualizar o membro." };
  }
}

// ==========================================
// 2. MOVER JOVEM DE PATRULHA (DRAG & DROP)
// ==========================================
export async function moveMemberToPatrol(userId: string, patrolId: string | null, troopId: string) {
  try {
    // Trava de segurança: Se mudar de patrulha, perde cargo de liderança da antiga
    const ledPatrols = await prisma.patrol.findMany({ where: { leaderId: userId } });
    for (const p of ledPatrols) {
        await prisma.patrol.update({ where: { id: p.id }, data: { leaderId: null } });
    }
    const subLedPatrols = await prisma.patrol.findMany({ where: { subLeaderId: userId } });
    for (const p of subLedPatrols) {
        await prisma.patrol.update({ where: { id: p.id }, data: { subLeaderId: null } });
    }

    // Aloca o jovem na nova patrulha
    await prisma.user.update({
      where: { id: userId },
      data: { patrolId },
    });

    revalidatePath(`/admin/tropas/${troopId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao mover membro:", error);
    return { success: false, error: "Erro ao mover o membro para a patrulha." };
  }
}

// ==========================================
// 3. DEFINIR MONITOR E SUBMONITOR
// ==========================================
export async function setPatrolLeadership(patrolId: string, leaderId: string | null, subLeaderId: string | null, troopId: string) {
  try {
    if (leaderId && leaderId === subLeaderId) {
      return { success: false, error: "O mesmo jovem não pode ser Monitor e Submonitor ao mesmo tempo." };
    }

    await prisma.patrol.update({
      where: { id: patrolId },
      data: {
        leaderId,
        subLeaderId,
      },
    });

    revalidatePath(`/admin/tropas/${troopId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao definir liderança:", error);
    return { success: false, error: "Erro ao atualizar a liderança da patrulha." };
  }
}

// ==========================================
// 4. CRUD DE PATRULHAS (DENTRO DA TROPA)
// ==========================================
export async function savePatrolInternal(data: { id?: string; name: string; troopId: string }) {
  try {
    if (data.id) {
      await prisma.patrol.update({
        where: { id: data.id },
        data: { name: data.name },
      });
    } else {
      await prisma.patrol.create({
        data: {
          name: data.name,
          troopId: data.troopId,
        },
      });
    }

    revalidatePath(`/admin/tropas/${data.troopId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar patrulha:", error);
    return { success: false, error: "Erro ao salvar a patrulha." };
  }
}

export async function deletePatrolInternal(id: string, troopId: string) {
  try {
    await prisma.patrol.delete({
      where: { id },
    });

    revalidatePath(`/admin/tropas/${troopId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir patrulha:", error);
    return { success: false, error: "Erro ao excluir patrulha. Certifique-se de que não há jovens nela." };
  }
}