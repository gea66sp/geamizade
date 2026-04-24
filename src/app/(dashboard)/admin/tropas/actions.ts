"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveTroop(data: {
  id?: string;
  name: string;
  branch: string;
  description: string;
  managerId: string | null;
  memberIds: string[];
}) {
  try {
    // Tratamento para não enviar strings vazias como ID
    const managerId = data.managerId && data.managerId.trim() !== "" ? data.managerId : null;

    if (data.id) {
      // Editar
      await prisma.troop.update({
        where: { id: data.id },
        data: {
          name: data.name,
          branch: data.branch as any,
          description: data.description,
          managerId: managerId,
          // 'set' sobrescreve a lista antiga com a nova
          members: {
            set: data.memberIds.map((id) => ({ id })),
          },
        },
      });
    } else {
      // Criar Novo
      await prisma.troop.create({
        data: {
          name: data.name,
          branch: data.branch as any,
          description: data.description,
          managerId: managerId,
          // 'connect' liga os usuários existentes à tropa
          members: {
            connect: data.memberIds.map((id) => ({ id })),
          },
        },
      });
    }

    // Atualiza o cache da página
    revalidatePath("/admin/tropas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar tropa:", error);
    return { success: false, error: "Erro ao salvar a tropa no banco de dados." };
  }
}

export async function deleteTroop(id: string) {
  try {
    await prisma.troop.delete({
      where: { id },
    });
    revalidatePath("/admin/tropas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir tropa:", error);
    return { success: false, error: "Erro ao excluir a tropa." };
  }
}