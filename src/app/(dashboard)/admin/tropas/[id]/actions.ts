"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/src/lib/auth";

// ==========================================
// CONTROLE DE ACESSO
// ADMIN e usuários da Diretoria gerenciam qualquer tropa. CHEFE só pode agir
// sobre uma tropa da qual é de fato `managerId` — antes disso não existia
// nenhum recorte aqui, qualquer chefe conseguia mexer em qualquer tropa.
// ==========================================
async function ensureTroopManager(troopId: string | null) {
  const user = await getAuthUser();
  if (!user) return null;

  if (user.role === "ADMIN" || user.branch === "DIRETORIA") {
    return user;
  }

  if (user.role === "CHEFE" && troopId) {
    const troop = await prisma.troop.findUnique({
      where: { id: troopId },
      select: { managerId: true },
    });
    if (troop?.managerId === user.id) {
      return user;
    }
  }

  return null;
}

// ==========================================
// 1. ADICIONAR OU REMOVER JOVEM DA TROPA
// ==========================================
export async function toggleTroopMember(userId: string, troopId: string | null) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { troopId: true },
    });
    if (!targetUser) {
      return { success: false, error: "Jovem não encontrado." };
    }

    // Ao adicionar, valida a tropa de destino; ao remover, valida a tropa atual do jovem
    const troopToAuthorize = troopId ?? targetUser.troopId;
    const authUser = await ensureTroopManager(troopToAuthorize);
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para gerenciar membros de tropas." };
    }

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
    revalidatePath("/chefe/tropa");

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
    const authUser = await ensureTroopManager(troopId);
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para mover membros entre patrulhas." };
    }

    // Trava de integridade: o jovem precisa já pertencer a esta mesma tropa
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { troopId: true } });
    if (!targetUser || targetUser.troopId !== troopId) {
      return { success: false, error: "Este jovem não pertence à tropa informada." };
    }

    // Trava de integridade: a patrulha de destino precisa pertencer a esta mesma tropa
    if (patrolId) {
      const targetPatrol = await prisma.patrol.findUnique({ where: { id: patrolId }, select: { troopId: true } });
      if (!targetPatrol || targetPatrol.troopId !== troopId) {
        return { success: false, error: "Esta patrulha não pertence à tropa informada." };
      }
    }

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
    revalidatePath("/chefe/tropa");
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

    const patrol = await prisma.patrol.findUnique({
      where: { id: patrolId },
      select: { troopId: true, members: { select: { id: true } } },
    });
    if (!patrol) {
      return { success: false, error: "Patrulha não encontrada." };
    }
    // Trava de integridade: a patrulha informada precisa pertencer à tropa informada
    if (patrol.troopId !== troopId) {
      return { success: false, error: "Esta patrulha não pertence à tropa informada." };
    }

    const authUser = await ensureTroopManager(patrol.troopId);
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para definir a liderança da patrulha." };
    }

    // Trava de integridade: Monitor/Submonitor só podem ser jovens que já pertencem a esta patrulha
    if (leaderId || subLeaderId) {
      const memberIds = new Set(patrol.members.map((m) => m.id));
      if (leaderId && !memberIds.has(leaderId)) {
        return { success: false, error: "O Monitor selecionado não pertence a esta patrulha." };
      }
      if (subLeaderId && !memberIds.has(subLeaderId)) {
        return { success: false, error: "O Submonitor selecionado não pertence a esta patrulha." };
      }
    }

    await prisma.patrol.update({
      where: { id: patrolId },
      data: {
        leaderId,
        subLeaderId,
      },
    });

    revalidatePath(`/admin/tropas/${troopId}`);
    revalidatePath("/chefe/tropa");
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
      const existingPatrol = await prisma.patrol.findUnique({
        where: { id: data.id },
        select: { troopId: true },
      });
      if (!existingPatrol) {
        return { success: false, error: "Patrulha não encontrada." };
      }
      if (existingPatrol.troopId !== data.troopId) {
        return { success: false, error: "Esta patrulha não pertence à tropa informada." };
      }

      const authUser = await ensureTroopManager(existingPatrol.troopId);
      if (!authUser) {
        return { success: false, error: "Acesso negado: você não tem permissão para gerenciar patrulhas." };
      }

      await prisma.patrol.update({
        where: { id: data.id },
        data: { name: data.name },
      });
    } else {
      const authUser = await ensureTroopManager(data.troopId);
      if (!authUser) {
        return { success: false, error: "Acesso negado: você não tem permissão para gerenciar patrulhas." };
      }

      await prisma.patrol.create({
        data: {
          name: data.name,
          troopId: data.troopId,
        },
      });
    }

    revalidatePath(`/admin/tropas/${data.troopId}`);
    revalidatePath("/chefe/tropa");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar patrulha:", error);
    return { success: false, error: "Erro ao salvar a patrulha." };
  }
}

export async function deletePatrolInternal(id: string, troopId: string) {
  try {
    const patrol = await prisma.patrol.findUnique({
      where: { id },
      select: { troopId: true },
    });
    if (!patrol) {
      return { success: false, error: "Patrulha não encontrada." };
    }
    if (patrol.troopId !== troopId) {
      return { success: false, error: "Esta patrulha não pertence à tropa informada." };
    }

    const authUser = await ensureTroopManager(patrol.troopId);
    if (!authUser) {
      return { success: false, error: "Acesso negado: você não tem permissão para excluir patrulhas." };
    }

    await prisma.patrol.delete({
      where: { id },
    });

    revalidatePath(`/admin/tropas/${troopId}`);
    revalidatePath("/chefe/tropa");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir patrulha:", error);
    return { success: false, error: "Erro ao excluir patrulha. Certifique-se de que não há jovens nela." };
  }
}
