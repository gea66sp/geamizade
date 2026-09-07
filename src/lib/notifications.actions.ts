"use server";

import { revalidatePath } from "next/cache";

import { AudienceType } from "@/src/lib/notificationAccess";
import {
  ManualNotificationInput,
  PanelFilters,
  approveNotificationRequest,
  createManualNotification,
  deletePanelNotification,
  getInbox,
  getPanelNotifications,
  getUnreadCount,
  getViewerContext,
  listApprovalQueue,
  listOutbox,
  markAllRead,
  markRead,
  rejectNotificationRequest,
} from "@/src/lib/notifications";

// ==========================================
// SEGURANÇA
// Server Actions são endpoints independentes: cada uma revalida a sessão e o
// cargo por conta própria, sem confiar no gating do middleware/layout.
// ==========================================
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requireContext() {
  const ctx = await getViewerContext();
  if (!ctx) throw new Error("Sua sessão expirou. Faça login novamente.");
  return ctx;
}

// Toda notificação nova aparece no sininho de cada área — revalidamos as raízes
// do dashboard para que os Server Components releiam o contador.
function revalidateNotificationSurfaces() {
  revalidatePath("/admin/notificacoes");
  revalidatePath("/chefe/notificacoes");
  revalidatePath("/membro/notificacoes");
  revalidatePath("/responsavel/notificacoes");
}

// ==========================================
// CAIXA DE ENTRADA
// ==========================================
export async function fetchUnreadCountAction() {
  try {
    const ctx = await requireContext();
    const count = await getUnreadCount(ctx.user.id);
    return { success: true as const, count };
  } catch {
    // O sininho faz polling: um erro aqui não deve poluir a tela do usuário.
    return { success: false as const, count: 0 };
  }
}

export async function fetchInboxAction(options?: { limit?: number; onlyUnread?: boolean }) {
  try {
    const ctx = await requireContext();
    const [items, unreadCount] = await Promise.all([
      getInbox(ctx.user.id, options),
      getUnreadCount(ctx.user.id),
    ]);
    return { success: true as const, items, unreadCount };
  } catch (error) {
    return { success: false as const, items: [], unreadCount: 0, error: getErrorMessage(error, "Falha ao carregar suas notificações.") };
  }
}

export async function markReadAction(notificationId: string) {
  try {
    const ctx = await requireContext();
    await markRead(notificationId, ctx.user.id);
    const unreadCount = await getUnreadCount(ctx.user.id);
    return { success: true as const, unreadCount };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao marcar como lida.") };
  }
}

export async function markAllReadAction() {
  try {
    const ctx = await requireContext();
    const count = await markAllRead(ctx.user.id);
    return { success: true as const, count, unreadCount: 0 };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao marcar todas como lidas.") };
  }
}

// ==========================================
// ENVIO MANUAL
// ==========================================
export async function submitNotificationAction(input: {
  title: string;
  message: string;
  audienceType: AudienceType;
  targetUserIds?: string[];
  troopId?: string | null;
  patrolId?: string | null;
  includeGuardians?: boolean;
}) {
  try {
    const ctx = await requireContext();

    if (ctx.kind === "NONE") {
      return { success: false as const, error: "Você não possui permissão para enviar notificações." };
    }

    const result = await createManualNotification(ctx, input as ManualNotificationInput);
    revalidateNotificationSurfaces();

    return { success: true as const, ...result };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao enviar a notificação.") };
  }
}

// ==========================================
// APROVAÇÃO (CHEFE)
// ==========================================
export async function approveRequestAction(requestId: string) {
  try {
    const ctx = await requireContext();
    const result = await approveNotificationRequest(requestId, ctx);
    revalidateNotificationSurfaces();
    return { success: true as const, recipientCount: result.recipientCount };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao aprovar a solicitação.") };
  }
}

export async function rejectRequestAction(requestId: string, reason: string) {
  try {
    const ctx = await requireContext();
    await rejectNotificationRequest(requestId, reason, ctx);
    revalidateNotificationSurfaces();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao rejeitar a solicitação.") };
  }
}

export async function fetchApprovalQueueAction() {
  try {
    const ctx = await requireContext();
    const items = await listApprovalQueue(ctx);
    return { success: true as const, items };
  } catch (error) {
    return { success: false as const, items: [], error: getErrorMessage(error, "Falha ao carregar as aprovações.") };
  }
}

export async function fetchOutboxAction() {
  try {
    const ctx = await requireContext();
    const items = await listOutbox(ctx);
    return { success: true as const, items };
  } catch (error) {
    return { success: false as const, items: [], error: getErrorMessage(error, "Falha ao carregar seus envios.") };
  }
}

// ==========================================
// PAINEL DE GERENCIAMENTO
// ==========================================
export async function fetchPanelAction(filters: PanelFilters = {}) {
  try {
    const ctx = await requireContext();
    const items = await getPanelNotifications(ctx, filters);
    return { success: true as const, items };
  } catch (error) {
    return { success: false as const, items: [], error: getErrorMessage(error, "Falha ao carregar o painel.") };
  }
}

export async function deletePanelNotificationAction(notificationId: string) {
  try {
    const ctx = await requireContext();
    await deletePanelNotification(notificationId, ctx);
    revalidateNotificationSurfaces();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error, "Falha ao excluir a notificação.") };
  }
}
