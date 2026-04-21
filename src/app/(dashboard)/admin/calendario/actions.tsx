"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export type EventFormData = {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  isGlobal: boolean;
  troopId?: string | null;
};

export async function saveEvent(data: EventFormData) {
  try {
    // Validação básica
    if (!data.title || !data.startDate || !data.endDate) {
      return { success: false, message: "Título e datas são obrigatórios." };
    }

    const eventData = {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      location: data.location || null,
      isGlobal: data.isGlobal,
      // Se for global, limpa o troopId. Caso contrário, atribui o id selecionado.
      troopId: data.isGlobal ? null : (data.troopId || null),
    };

    if (data.id) {
      // Atualizar evento existente
      await prisma.event.update({
        where: { id: data.id },
        data: eventData,
      });
    } else {
      // Criar novo evento
      await prisma.event.create({
        data: eventData,
      });
    }

    // Atualiza a página para refletir as mudanças
    revalidatePath("/admin/calendario");
    return { success: true, message: "Evento salvo com sucesso!" };
    
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    return { success: false, message: "Erro interno ao salvar o evento. Tente novamente." };
  }
}

export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({
      where: { id },
    });
    
    revalidatePath("/admin/calendario");
    return { success: true, message: "Evento excluído com sucesso!" };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return { success: false, message: "Erro ao excluir o evento. Ele pode ter vínculos existentes." };
  }
}