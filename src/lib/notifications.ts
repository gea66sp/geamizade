// Módulo de servidor: concentra as regras do sistema de notificações. Não leva
// "use server" porque exporta tipos e funções síncronas além das assíncronas —
// os wrappers chamáveis pelo cliente ficam em src/lib/notifications.actions.ts.
import { NotificationOrigin, Role } from "@prisma/client";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { getHomeRouteForRole } from "@/src/lib/roleRouting";
import {
  AudienceType,
  NotifierKind,
  buildGuardianCopyTitle,
  isGlobalNotifier,
} from "@/src/lib/notificationAccess";

// ==========================================
// CONTEXTO DE QUEM ESTÁ OPERANDO
// ==========================================
// Toda regra hierárquica do módulo parte daqui. O `kind` é resolvido por
// precedência (Diretoria > Chefe > Monitor) porque um mesmo usuário pode
// acumular papéis — por exemplo, um chefe que também é da Diretoria.
export type ViewerContext = {
  user: {
    id: string;
    name: string | null;
    role: Role;
    branch: string | null;
    troopId: string | null;
    patrolId: string | null;
  };
  kind: NotifierKind;
  managedTroopIds: string[];
  ledPatrolIds: string[];
};

export async function getViewerContext(): Promise<ViewerContext | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const [managedTroops, ledPatrols] = await Promise.all([
    prisma.troop.findMany({ where: { managerId: user.id }, select: { id: true } }),
    prisma.patrol.findMany({
      where: { OR: [{ leaderId: user.id }, { subLeaderId: user.id }] },
      select: { id: true },
    }),
  ]);

  const managedTroopIds = managedTroops.map((t) => t.id);
  const ledPatrolIds = ledPatrols.map((p) => p.id);

  let kind: NotifierKind = "NONE";
  if (isGlobalNotifier(user)) {
    kind = "GLOBAL";
  } else if (managedTroopIds.length > 0) {
    kind = "CHEFE";
  } else if (ledPatrolIds.length > 0) {
    kind = "MONITOR";
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      branch: user.branch,
      troopId: user.troopId,
      patrolId: user.patrolId,
    },
    kind,
    managedTroopIds,
    ledPatrolIds,
  };
}

// ==========================================
// DESPACHO (O CORAÇÃO DO MÓDULO)
// ==========================================
export type DispatchInput = {
  recipientUserIds: string[];
  title: string;
  message: string;
  linkUrl?: string | null;
  origin: NotificationOrigin;
  senderId?: string | null;
  requestId?: string | null;
  /** Regra do grupo: todo aviso a um jovem também vai para o responsável legal. */
  includeGuardians?: boolean;
};

// Monta as linhas de Notification para os destinatários informados e, para cada
// jovem (MEMBER), acrescenta uma CÓPIA para cada responsável legal vinculado.
//
// Nunca lança: os gatilhos automáticos chamam esta função depois de já terem
// gravado o lançamento financeiro / patrimonial, e uma falha de notificação não
// pode desfazer nem quebrar a operação principal que o usuário acabou de fazer.
export async function dispatchNotifications(input: DispatchInput): Promise<number> {
  try {
    const uniqueIds = Array.from(new Set(input.recipientUserIds.filter(Boolean)));
    if (uniqueIds.length === 0) return 0;

    const includeGuardians = input.includeGuardians ?? true;

    const recipients = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true, role: true, troopId: true },
    });

    if (recipients.length === 0) return 0;

    type Row = {
      userId: string;
      title: string;
      message: string;
      linkUrl: string | null;
      origin: NotificationOrigin;
      senderId: string | null;
      requestId: string | null;
      forDependentId: string | null;
      troopId: string | null;
    };

    const rows: Row[] = recipients.map((recipient) => ({
      userId: recipient.id,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl ?? null,
      origin: input.origin,
      senderId: input.senderId ?? null,
      requestId: input.requestId ?? null,
      forDependentId: null,
      troopId: recipient.troopId,
    }));

    // ---- Cópia obrigatória para os responsáveis dos jovens ----
    const youths = recipients.filter((r) => r.role === "MEMBER");
    if (includeGuardians && youths.length > 0) {
      const ties = await prisma.familyTie.findMany({
        where: { dependentId: { in: youths.map((y) => y.id) } },
        select: { guardianId: true, dependentId: true },
      });

      const youthById = new Map(youths.map((y) => [y.id, y]));

      for (const tie of ties) {
        const youth = youthById.get(tie.dependentId);
        if (!youth) continue;
        // Se o próprio responsável já estava na lista original de destinatários,
        // ele recebe as duas linhas de propósito: a dele e a cópia do jovem.
        rows.push({
          userId: tie.guardianId,
          title: buildGuardianCopyTitle(youth.name, input.title),
          message: input.message,
          linkUrl: input.linkUrl ?? null,
          origin: input.origin,
          senderId: input.senderId ?? null,
          requestId: input.requestId ?? null,
          forDependentId: youth.id,
          troopId: youth.troopId,
        });
      }
    }

    // Dedupe exato (mesmo destinatário + mesmo título + mesmo jovem de origem),
    // evita linha repetida quando o mesmo responsável cuida de dois jovens que
    // receberam o mesmo aviso ou quando um id vem duplicado da audiência.
    const seen = new Set<string>();
    const deduped = rows.filter((row) => {
      const key = `${row.userId}|${row.title}|${row.forDependentId ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length === 0) return 0;

    const result = await prisma.notification.createMany({ data: deduped });
    return result.count;
  } catch (error) {
    console.error("Falha ao despachar notificações (operação principal preservada):", error);
    return 0;
  }
}

// ==========================================
// RESOLUÇÃO DE AUDIÊNCIA (COM TRAVA HIERÁRQUICA)
// ==========================================
export type AudienceInput = {
  audienceType: AudienceType;
  targetUserIds?: string[];
  troopId?: string | null;
  patrolId?: string | null;
};

// Devolve a lista final de destinatários já validada contra o que o remetente
// tem direito de alcançar. Qualquer tentativa de sair do próprio escopo lança —
// Server Actions são endpoints públicos, então a trava precisa viver aqui e não
// apenas na interface que monta o formulário.
export async function resolveAudience(ctx: ViewerContext, input: AudienceInput): Promise<string[]> {
  const { audienceType } = input;

  if (ctx.kind === "NONE") {
    throw new Error("Você não possui permissão para enviar notificações.");
  }

  // ---------- DIRETORIA / ADMIN: alcance global ----------
  if (ctx.kind === "GLOBAL") {
    if (audienceType === "ALL") {
      const all = await prisma.user.findMany({
        where: { id: { not: ctx.user.id } },
        select: { id: true },
      });
      return all.map((u) => u.id);
    }

    if (audienceType === "USERS") {
      const ids = input.targetUserIds ?? [];
      if (ids.length === 0) throw new Error("Selecione ao menos um destinatário.");
      const found = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
      return found.map((u) => u.id);
    }

    if (audienceType === "TROOP") {
      if (!input.troopId) throw new Error("Selecione uma tropa.");
      const members = await prisma.user.findMany({
        where: { troopId: input.troopId },
        select: { id: true },
      });
      return members.map((u) => u.id);
    }

    if (audienceType === "PATROL") {
      if (!input.patrolId) throw new Error("Selecione uma patrulha.");
      const members = await prisma.user.findMany({
        where: { patrolId: input.patrolId },
        select: { id: true },
      });
      return members.map((u) => u.id);
    }

    throw new Error("Público inválido.");
  }

  // ---------- CHEFE: apenas os jovens das tropas que gerencia ----------
  if (ctx.kind === "CHEFE") {
    if (ctx.managedTroopIds.length === 0) {
      throw new Error("Você ainda não é responsável por nenhuma tropa.");
    }

    if (audienceType === "TROOP") {
      const troopIds = input.troopId
        ? ctx.managedTroopIds.filter((id) => id === input.troopId)
        : ctx.managedTroopIds;

      if (troopIds.length === 0) {
        throw new Error("Você não é responsável por esta tropa.");
      }

      const members = await prisma.user.findMany({
        where: { troopId: { in: troopIds }, role: "MEMBER" },
        select: { id: true },
      });
      return members.map((u) => u.id);
    }

    if (audienceType === "PATROL") {
      if (!input.patrolId) throw new Error("Selecione uma patrulha.");
      const patrol = await prisma.patrol.findUnique({
        where: { id: input.patrolId },
        select: { troopId: true },
      });
      if (!patrol || !ctx.managedTroopIds.includes(patrol.troopId)) {
        throw new Error("Esta patrulha não pertence a uma tropa sua.");
      }
      const members = await prisma.user.findMany({
        where: { patrolId: input.patrolId, role: "MEMBER" },
        select: { id: true },
      });
      return members.map((u) => u.id);
    }

    if (audienceType === "USERS") {
      const ids = input.targetUserIds ?? [];
      if (ids.length === 0) throw new Error("Selecione ao menos um destinatário.");

      // Cada id precisa ser um jovem de uma tropa gerenciada por este chefe.
      const allowed = await prisma.user.findMany({
        where: { id: { in: ids }, role: "MEMBER", troopId: { in: ctx.managedTroopIds } },
        select: { id: true },
      });

      if (allowed.length !== ids.length) {
        throw new Error("Você só pode notificar os jovens da sua própria tropa.");
      }
      return allowed.map((u) => u.id);
    }

    throw new Error("Você não tem permissão para enviar avisos para todo o grupo.");
  }

  // ---------- MONITOR / SUBMONITOR: apenas a própria patrulha ----------
  if (audienceType === "PATROL" || audienceType === "USERS") {
    const patrolId = input.patrolId ?? ctx.ledPatrolIds[0];
    if (!patrolId || !ctx.ledPatrolIds.includes(patrolId)) {
      throw new Error("Você só pode notificar a patrulha que lidera.");
    }

    const patrolMembers = await prisma.user.findMany({
      where: { patrolId, role: "MEMBER" },
      select: { id: true },
    });
    const memberIds = patrolMembers.map((u) => u.id);

    if (audienceType === "PATROL") return memberIds;

    const ids = input.targetUserIds ?? [];
    if (ids.length === 0) throw new Error("Selecione ao menos um destinatário.");
    const memberIdSet = new Set(memberIds);
    if (!ids.every((id) => memberIdSet.has(id))) {
      throw new Error("Você só pode notificar os membros da sua própria patrulha.");
    }
    return ids;
  }

  throw new Error("Você só pode enviar avisos para a sua patrulha.");
}

// ==========================================
// ENVIO MANUAL
// ==========================================
export type ManualNotificationInput = {
  title: string;
  message: string;
  audienceType: AudienceType;
  targetUserIds?: string[];
  troopId?: string | null;
  patrolId?: string | null;
  includeGuardians?: boolean;
};

export type ManualNotificationResult = {
  status: "SENT" | "PENDING_APPROVAL";
  requestId: string;
  recipientCount: number;
};

function validateManualPayload(input: ManualNotificationInput) {
  const title = input.title?.trim() ?? "";
  const message = input.message?.trim() ?? "";

  if (title.length < 3) {
    throw new Error("O título deve ter pelo menos 3 caracteres.");
  }
  if (message.length < 5) {
    throw new Error("Escreva o corpo da mensagem antes de enviar.");
  }

  return { title, message };
}

export async function createManualNotification(
  ctx: ViewerContext,
  input: ManualNotificationInput
): Promise<ManualNotificationResult> {
  const { title, message } = validateManualPayload(input);

  // Resolve a audiência ANTES de gravar qualquer coisa: se o remetente estiver
  // fora do escopo, nada é criado.
  const recipientUserIds = await resolveAudience(ctx, input);

  if (recipientUserIds.length === 0) {
    throw new Error("Nenhum destinatário foi encontrado para este público.");
  }

  const includeGuardians = input.includeGuardians ?? true;
  const needsApproval = ctx.kind === "MONITOR";
  const patrolId = input.patrolId ?? (ctx.kind === "MONITOR" ? ctx.ledPatrolIds[0] : null);

  const request = await prisma.notificationRequest.create({
    data: {
      title,
      message,
      senderId: ctx.user.id,
      status: needsApproval ? "PENDING_APPROVAL" : "APPROVED",
      audienceType: input.audienceType,
      troopId: input.troopId ?? null,
      patrolId: patrolId ?? null,
      targetUserIds: input.targetUserIds ?? [],
      includeGuardians,
      approverId: needsApproval ? null : ctx.user.id,
      reviewedAt: needsApproval ? null : new Date(),
    },
    select: { id: true },
  });

  if (needsApproval) {
    await notifyApprovers(ctx, request.id, title);
    return { status: "PENDING_APPROVAL", requestId: request.id, recipientCount: recipientUserIds.length };
  }

  const count = await dispatchNotifications({
    recipientUserIds,
    title,
    message,
    origin: "MANUAL",
    senderId: ctx.user.id,
    requestId: request.id,
    includeGuardians,
  });

  return { status: "SENT", requestId: request.id, recipientCount: count };
}

// Avisa o(s) chefe(s) responsável(is) pelas tropas das patrulhas que o monitor
// lidera. Sem chefe cadastrado, cai para a Diretoria para o pedido não ficar
// órfão esperando aprovação de ninguém.
async function notifyApprovers(ctx: ViewerContext, requestId: string, title: string) {
  const patrols = await prisma.patrol.findMany({
    where: { id: { in: ctx.ledPatrolIds } },
    select: { name: true, troop: { select: { managerId: true } } },
  });

  const managerIds = Array.from(
    new Set(patrols.map((p) => p.troop?.managerId).filter((id): id is string => Boolean(id)))
  );

  const patrolName = patrols[0]?.name ?? "sua patrulha";

  let approverIds = managerIds;
  let linkUrl = "/chefe/notificacoes";

  if (approverIds.length === 0) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "DEVELOPER"] } },
      select: { id: true },
    });
    approverIds = admins.map((a) => a.id);
    linkUrl = "/admin/notificacoes";
  }

  await dispatchNotifications({
    recipientUserIds: approverIds,
    title: "Nova notificação aguardando sua aprovação",
    message: `${ctx.user.name || "Um monitor"} (${patrolName}) enviou o aviso "${title}" para aprovação. Acesse o painel de notificações para aprovar ou rejeitar.`,
    linkUrl,
    origin: "AUTO",
    requestId,
    includeGuardians: false,
  });
}

// ==========================================
// APROVAÇÃO / REJEIÇÃO
// ==========================================
async function loadReviewableRequest(requestId: string, ctx: ViewerContext) {
  const request = await prisma.notificationRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      patrol: { select: { id: true, name: true, troopId: true } },
    },
  });

  if (!request) throw new Error("Solicitação não encontrada.");
  if (request.status !== "PENDING_APPROVAL") {
    throw new Error("Esta solicitação já foi revisada.");
  }

  const isOwnTroop = request.patrol && ctx.managedTroopIds.includes(request.patrol.troopId);
  if (ctx.kind !== "GLOBAL" && !isOwnTroop) {
    throw new Error("Você não é o chefe responsável por esta patrulha.");
  }

  return request;
}

export async function approveNotificationRequest(requestId: string, ctx: ViewerContext) {
  const request = await loadReviewableRequest(requestId, ctx);

  // Re-resolve a audiência no momento da aprovação: a composição da patrulha
  // pode ter mudado entre o pedido e a revisão do chefe.
  const senderCtx: ViewerContext = {
    user: { ...ctx.user, id: request.senderId },
    kind: "MONITOR",
    managedTroopIds: [],
    ledPatrolIds: request.patrolId ? [request.patrolId] : [],
  };

  const recipientUserIds = await resolveAudience(senderCtx, {
    audienceType: request.audienceType as AudienceType,
    targetUserIds: request.targetUserIds,
    patrolId: request.patrolId,
  });

  if (recipientUserIds.length === 0) {
    throw new Error("Esta patrulha não possui mais membros para receber o aviso.");
  }

  const count = await dispatchNotifications({
    recipientUserIds,
    title: request.title,
    message: request.message,
    origin: "MANUAL",
    senderId: request.senderId,
    requestId: request.id,
    includeGuardians: request.includeGuardians,
  });

  await prisma.notificationRequest.update({
    where: { id: request.id },
    data: { status: "APPROVED", approverId: ctx.user.id, reviewedAt: new Date(), rejectionReason: null },
  });

  await dispatchNotifications({
    recipientUserIds: [request.senderId],
    title: "Sua notificação foi aprovada",
    message: `O aviso "${request.title}" foi aprovado por ${ctx.user.name || "seu chefe"} e entregue à patrulha.`,
    linkUrl: `${getHomeRouteForRole(request.sender?.role)}/notificacoes`,
    origin: "AUTO",
    includeGuardians: false,
  });

  return { recipientCount: count };
}

export async function rejectNotificationRequest(requestId: string, reason: string, ctx: ViewerContext) {
  const request = await loadReviewableRequest(requestId, ctx);

  const trimmedReason = reason?.trim() ?? "";
  if (trimmedReason.length < 3) {
    throw new Error("Explique o motivo da rejeição para o monitor.");
  }

  await prisma.notificationRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      approverId: ctx.user.id,
      reviewedAt: new Date(),
      rejectionReason: trimmedReason,
    },
  });

  await dispatchNotifications({
    recipientUserIds: [request.senderId],
    title: "Sua notificação foi rejeitada",
    message: `O aviso "${request.title}" não foi aprovado. Motivo: ${trimmedReason}`,
    linkUrl: `${getHomeRouteForRole(request.sender?.role)}/notificacoes`,
    origin: "AUTO",
    includeGuardians: false,
  });

  return { success: true };
}

// ==========================================
// CAIXA DE ENTRADA (DESTINATÁRIO)
// ==========================================
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function getInbox(userId: string, options?: { limit?: number; onlyUnread?: boolean }) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(options?.onlyUnread ? { isRead: false } : {}),
    },
    select: {
      id: true,
      title: true,
      message: true,
      isRead: true,
      readAt: true,
      linkUrl: true,
      origin: true,
      forDependentId: true,
      createdAt: true,
      sender: { select: { id: true, name: true } },
      forDependent: { select: { id: true, name: true } },
    },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: options?.limit ?? 50,
  });
}

export async function markRead(notificationId: string, userId: string) {
  // O filtro por userId no updateMany impede que alguém marque a notificação
  // de outra pessoa como lida passando um id arbitrário.
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
}

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
}

// ==========================================
// PAINEL DE GERENCIAMENTO (HIERÁRQUICO)
// ==========================================
export type PanelFilters = {
  search?: string;
  origin?: "ALL" | "AUTO" | "MANUAL";
  readState?: "ALL" | "READ" | "UNREAD";
  troopId?: string | null;
  limit?: number;
};

// Admin/Diretoria enxerga tudo; o chefe enxerga apenas o que foi entregue a
// alguém da própria tropa (o campo troopId é gravado no momento do envio).
function buildPanelScope(ctx: ViewerContext) {
  if (ctx.kind === "GLOBAL") return {};
  if (ctx.kind === "CHEFE") return { troopId: { in: ctx.managedTroopIds } };
  throw new Error("Você não tem acesso ao painel de gerenciamento de notificações.");
}

export async function getPanelNotifications(ctx: ViewerContext, filters: PanelFilters = {}) {
  const scope = buildPanelScope(ctx);

  const where: Record<string, unknown> = { ...scope };

  if (filters.origin && filters.origin !== "ALL") {
    where.origin = filters.origin;
  }
  if (filters.readState === "READ") where.isRead = true;
  if (filters.readState === "UNREAD") where.isRead = false;

  if (filters.troopId) {
    // Um chefe só consegue estreitar dentro do que já lhe é permitido.
    if (ctx.kind === "CHEFE" && !ctx.managedTroopIds.includes(filters.troopId)) {
      throw new Error("Você não é responsável por esta tropa.");
    }
    where.troopId = filters.troopId;
  }

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  return prisma.notification.findMany({
    where,
    select: {
      id: true,
      title: true,
      message: true,
      isRead: true,
      readAt: true,
      origin: true,
      createdAt: true,
      forDependentId: true,
      user: { select: { id: true, name: true, role: true } },
      sender: { select: { id: true, name: true } },
      forDependent: { select: { id: true, name: true } },
      troop: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 200,
  });
}

export async function deletePanelNotification(notificationId: string, ctx: ViewerContext) {
  const scope = buildPanelScope(ctx);

  // deleteMany + escopo garante que o chefe não apague nada fora da tropa dele,
  // mesmo enviando um id válido de outra seção.
  const result = await prisma.notification.deleteMany({
    where: { id: notificationId, ...scope },
  });

  if (result.count === 0) {
    throw new Error("Notificação não encontrada ou fora do seu escopo de gestão.");
  }

  return { success: true };
}

// ==========================================
// FILA DE APROVAÇÃO E CAIXA DE SAÍDA
// ==========================================
export async function listApprovalQueue(ctx: ViewerContext) {
  if (ctx.kind !== "GLOBAL" && ctx.kind !== "CHEFE") return [];

  const where =
    ctx.kind === "GLOBAL"
      ? { status: "PENDING_APPROVAL" as const }
      : {
          status: "PENDING_APPROVAL" as const,
          patrol: { troopId: { in: ctx.managedTroopIds } },
        };

  return prisma.notificationRequest.findMany({
    where,
    select: {
      id: true,
      title: true,
      message: true,
      status: true,
      audienceType: true,
      createdAt: true,
      sender: { select: { id: true, name: true, role: true } },
      patrol: { select: { id: true, name: true, troop: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listOutbox(ctx: ViewerContext, limit = 50) {
  return prisma.notificationRequest.findMany({
    where: { senderId: ctx.user.id },
    select: {
      id: true,
      title: true,
      message: true,
      status: true,
      audienceType: true,
      rejectionReason: true,
      reviewedAt: true,
      createdAt: true,
      approver: { select: { id: true, name: true } },
      patrol: { select: { id: true, name: true } },
      _count: { select: { notifications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
