"use server";

import { revalidatePath } from "next/cache";

import {
  EventInput,
  deleteEvent,
  getEventAttendance,
  getMyRsvpContext,
  getViewerContext,
  saveEvent,
  setRsvp,
} from "@/src/lib/events";

// ==========================================
// SEGURANÇA
// Server Actions são endpoints independentes: cada uma revalida a sessão e a
// posição hierárquica por conta própria.
// ==========================================
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requireContext() {
  const ctx = await getViewerContext();
  if (!ctx) throw new Error("Sua sessão expirou. Faça login novamente.");
  return ctx;
}

function revalidateCalendarSurfaces() {
  revalidatePath("/admin/calendario");
  revalidatePath("/chefe/calendario");
  revalidatePath("/membro/calendario");
  revalidatePath("/responsavel/calendario");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setRsvpAction(input: {
  eventId: string;
  attendeeUserId: string;
  status: boolean;
}) {
  try {
    const ctx = await requireContext();
    await setRsvp(ctx, input);
    revalidateCalendarSurfaces();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao registrar a presença.") };
  }
}

export async function fetchRsvpContextAction(eventId: string) {
  try {
    const ctx = await requireContext();
    const data = await getMyRsvpContext(eventId, ctx);
    return { success: true as const, data };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao carregar o evento.") };
  }
}

export async function fetchAttendanceAction(eventId: string) {
  try {
    const ctx = await requireContext();
    const data = await getEventAttendance(eventId, ctx);
    return { success: true as const, rows: data.rows };
  } catch (error) {
    return {
      success: false as const,
      rows: [],
      error: getErrorMessage(error, "Falha ao carregar a lista de presença."),
    };
  }
}

export async function saveEventAction(data: EventInput) {
  try {
    const ctx = await requireContext();
    const result = await saveEvent(ctx, data);
    revalidateCalendarSurfaces();
    return { success: true as const, ...result };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao salvar a atividade.") };
  }
}

export async function deleteEventAction(eventId: string) {
  try {
    const ctx = await requireContext();
    await deleteEvent(ctx, eventId);
    revalidateCalendarSurfaces();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao excluir a atividade.") };
  }
}
