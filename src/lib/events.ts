// Módulo de servidor do calendário. Sem "use server" porque exporta tipos e
// helpers síncronos além das funções assíncronas — os wrappers chamáveis pelo
// cliente ficam em src/lib/events.actions.ts.
//
// Reaproveita deliberadamente o ViewerContext do módulo de notificações: a
// hierarquia (GLOBAL > CHEFE > MONITOR > NONE + managedTroopIds) é a mesma do
// grupo, e um segundo mecanismo de permissão só criaria divergência.
import prisma from "@/src/lib/prisma";
import {
  ViewerContext,
  dispatchNotifications,
  getViewerContext,
} from "@/src/lib/notifications";
import { canEditEvent, canViewAttendance, isRsvpOpen } from "@/src/lib/eventAccess";

export { getViewerContext };
export type { ViewerContext };

// ==========================================
// VISIBILIDADE
// ==========================================
// Monta o filtro de quais eventos cada pessoa enxerga. O responsável é o caso
// especial: ele não tem tropa própria, enxerga através dos dependentes.
async function buildVisibilityFilter(ctx: ViewerContext) {
  if (ctx.kind === "GLOBAL") return {};

  if (ctx.kind === "CHEFE") {
    return {
      OR: [{ isGlobal: true }, { troopId: { in: ctx.managedTroopIds } }],
    };
  }

  // Responsável: agrega tropas e patrulhas dos dependentes.
  if (ctx.user.role === "RESPONSAVEL") {
    const dependents = await prisma.user.findMany({
      where: { guardianTies: { some: { guardianId: ctx.user.id } } },
      select: { troopId: true, patrolId: true },
    });

    const troopIds = [...new Set(dependents.map((d) => d.troopId).filter((v): v is string => !!v))];
    const patrolIds = [...new Set(dependents.map((d) => d.patrolId).filter((v): v is string => !!v))];

    return {
      OR: [
        { isGlobal: true },
        ...(troopIds.length ? [{ troopId: { in: troopIds } }] : []),
        ...(patrolIds.length ? [{ patrolId: { in: patrolIds } }] : []),
      ],
    };
  }

  // Membro / monitor: o que é do grupo, da sua tropa ou da sua patrulha.
  return {
    OR: [
      { isGlobal: true },
      ...(ctx.user.troopId ? [{ troopId: ctx.user.troopId }] : []),
      ...(ctx.user.patrolId ? [{ patrolId: ctx.user.patrolId }] : []),
    ],
  };
}

export async function getVisibleEvents(ctx: ViewerContext) {
  const where = await buildVisibilityFilter(ctx);

  return prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: {
      troop: { select: { id: true, name: true } },
      patrol: { select: { id: true, name: true } },
      _count: { select: { attendees: true } },
    },
  });
}

async function loadVisibleEvent(eventId: string, ctx: ViewerContext) {
  const visibility = await buildVisibilityFilter(ctx);

  const event = await prisma.event.findFirst({
    where: { AND: [{ id: eventId }, visibility] },
    include: {
      troop: { select: { id: true, name: true } },
      patrol: { select: { id: true, name: true } },
    },
  });

  if (!event) throw new Error("Evento não encontrado ou fora do seu acesso.");
  return event;
}

// ==========================================
// PÚBLICO-ALVO DO EVENTO
// ==========================================
// Quem é "convidado" — usado tanto para a lista de presença quanto para a
// notificação de evento criado.
async function resolveEventAudience(event: {
  isGlobal: boolean;
  troopId: string | null;
  patrolId: string | null;
}): Promise<string[]> {
  if (event.patrolId) {
    const members = await prisma.user.findMany({
      where: { patrolId: event.patrolId },
      select: { id: true },
    });
    return members.map((m) => m.id);
  }

  if (event.troopId) {
    const members = await prisma.user.findMany({
      where: { troopId: event.troopId },
      select: { id: true },
    });
    return members.map((m) => m.id);
  }

  if (event.isGlobal) {
    const all = await prisma.user.findMany({ select: { id: true } });
    return all.map((u) => u.id);
  }

  return [];
}

// ==========================================
// LISTA DE PRESENÇA (ADMIN / CHEFE)
// ==========================================
export async function getEventAttendance(eventId: string, ctx: ViewerContext) {
  const event = await loadVisibleEvent(eventId, ctx);

  if (!canViewAttendance(ctx, event)) {
    throw new Error("Você não tem permissão para ver a lista de presença deste evento.");
  }

  const audienceIds = await resolveEventAudience(event);

  // O chefe só enxerga a própria seção mesmo num evento global.
  let visibleIds = audienceIds;
  if (ctx.kind === "CHEFE") {
    const ownMembers = await prisma.user.findMany({
      where: { id: { in: audienceIds }, troopId: { in: ctx.managedTroopIds } },
      select: { id: true },
    });
    visibleIds = ownMembers.map((m) => m.id);
  }

  const [people, rsvps] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: visibleIds } },
      select: {
        id: true,
        name: true,
        role: true,
        troop: { select: { name: true } },
        patrol: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.eventRSVP.findMany({
      where: { eventId, userId: { in: visibleIds } },
      select: {
        userId: true,
        status: true,
        isGuardianDecision: true,
        updatedAt: true,
        confirmedBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  const rsvpByUser = new Map(rsvps.map((r) => [r.userId, r]));

  return {
    event,
    rows: people.map((p) => {
      const r = rsvpByUser.get(p.id);
      return {
        user: p,
        status: r ? r.status : null,
        isGuardianDecision: r?.isGuardianDecision ?? false,
        confirmedBy: r?.confirmedBy ?? null,
        answeredAt: r?.updatedAt ?? null,
      };
    }),
  };
}

// ==========================================
// CONFIRMAÇÃO DE PRESENÇA — O CORAÇÃO DA REGRA
// ==========================================
export type SetRsvpInput = {
  eventId: string;
  attendeeUserId: string;
  status: boolean;
};

export async function setRsvp(ctx: ViewerContext, input: SetRsvpInput) {
  const event = await loadVisibleEvent(input.eventId, ctx);

  if (!isRsvpOpen(event)) {
    throw new Error("O prazo para confirmar presença neste evento já encerrou.");
  }

  const isForSomeoneElse = input.attendeeUserId !== ctx.user.id;

  // Responder por outra pessoa só é permitido ao responsável legal dela.
  if (isForSomeoneElse) {
    const tie = await prisma.familyTie.findFirst({
      where: { guardianId: ctx.user.id, dependentId: input.attendeeUserId },
      select: { id: true },
    });
    if (!tie) {
      throw new Error("Você só pode confirmar presença para você ou para os seus dependentes.");
    }
  }

  const existing = await prisma.eventRSVP.findUnique({
    where: { eventId_userId: { eventId: input.eventId, userId: input.attendeeUserId } },
    select: { isGuardianDecision: true, status: true },
  });

  // Trava da hierarquia: decidido pelo responsável, o jovem não sobrepõe.
  if (!isForSomeoneElse && existing?.isGuardianDecision) {
    throw new Error(
      "Seu responsável já decidiu sobre a sua participação neste evento. Fale com ele para alterar."
    );
  }

  await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId: input.eventId, userId: input.attendeeUserId } },
    create: {
      eventId: input.eventId,
      userId: input.attendeeUserId,
      status: input.status,
      confirmedById: ctx.user.id,
      isGuardianDecision: isForSomeoneElse,
    },
    update: {
      status: input.status,
      confirmedById: ctx.user.id,
      isGuardianDecision: isForSomeoneElse,
    },
  });

  // O jovem precisa saber que o responsável decidiu por ele.
  if (isForSomeoneElse) {
    await dispatchNotifications({
      recipientUserIds: [input.attendeeUserId],
      title: input.status ? "Presença confirmada pelo seu responsável" : "Participação não autorizada",
      message: input.status
        ? `${ctx.user.name || "Seu responsável"} confirmou a sua presença em "${event.title}".`
        : `${ctx.user.name || "Seu responsável"} informou que você não participará de "${event.title}".`,
      origin: "AUTO",
      senderId: ctx.user.id,
      // Evita devolver a cópia ao próprio responsável que acabou de decidir.
      includeGuardians: false,
    });
  }

  return { success: true };
}

// Estado de RSVP que a tela do usuário precisa: a resposta dele e, se for
// responsável, a de cada dependente convidado para o evento.
export async function getMyRsvpContext(eventId: string, ctx: ViewerContext) {
  const event = await loadVisibleEvent(eventId, ctx);
  const audienceIds = new Set(await resolveEventAudience(event));

  const dependents =
    ctx.user.role === "RESPONSAVEL"
      ? await prisma.user.findMany({
          where: { guardianTies: { some: { guardianId: ctx.user.id } } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  // Só oferece os dependentes que de fato são público deste evento.
  const invitedDependents = dependents.filter((d) => audienceIds.has(d.id));

  const subjectIds = [
    ...(audienceIds.has(ctx.user.id) ? [ctx.user.id] : []),
    ...invitedDependents.map((d) => d.id),
  ];

  const rsvps = await prisma.eventRSVP.findMany({
    where: { eventId, userId: { in: subjectIds } },
    select: { userId: true, status: true, isGuardianDecision: true },
  });
  const byUser = new Map(rsvps.map((r) => [r.userId, r]));

  return {
    event,
    isOpen: isRsvpOpen(event),
    canEdit: canEditEvent(ctx, event),
    canViewAttendance: canViewAttendance(ctx, event),
    self: audienceIds.has(ctx.user.id)
      ? {
          userId: ctx.user.id,
          name: ctx.user.name,
          status: byUser.get(ctx.user.id)?.status ?? null,
          lockedByGuardian: byUser.get(ctx.user.id)?.isGuardianDecision ?? false,
        }
      : null,
    dependents: invitedDependents.map((d) => ({
      userId: d.id,
      name: d.name,
      status: byUser.get(d.id)?.status ?? null,
      lockedByGuardian: byUser.get(d.id)?.isGuardianDecision ?? false,
    })),
  };
}

// ==========================================
// CRUD DE EVENTOS
// ==========================================
export type EventInput = {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string | null;
  isGlobal: boolean;
  troopId?: string | null;
  patrolId?: string | null;
  rsvpDeadline?: string | null;
};

function parseDate(value: string, label: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`A ${label} informada é inválida.`);
  return d;
}

export async function saveEvent(ctx: ViewerContext, data: EventInput) {
  if (!data.title?.trim()) throw new Error("Informe o título da atividade.");
  if (!data.startDate || !data.endDate) throw new Error("Informe as datas de início e término.");

  const startDate = parseDate(data.startDate, "data de início");
  const endDate = parseDate(data.endDate, "data de término");
  if (endDate < startDate) {
    throw new Error("A data de término não pode ser anterior à data de início.");
  }

  const rsvpDeadline = data.rsvpDeadline ? parseDate(data.rsvpDeadline, "data limite") : null;
  if (rsvpDeadline && rsvpDeadline > startDate) {
    throw new Error("O prazo de confirmação não pode ser depois do início do evento.");
  }

  // Escopo: global zera os vínculos; patrulha implica a tropa dela.
  const isGlobal = data.isGlobal;
  const patrolId = isGlobal ? null : data.patrolId || null;
  let troopId = isGlobal ? null : data.troopId || null;

  if (patrolId) {
    const patrol = await prisma.patrol.findUnique({
      where: { id: patrolId },
      select: { troopId: true },
    });
    if (!patrol) throw new Error("Patrulha não encontrada.");
    troopId = patrol.troopId;
  }

  // O chefe não cria evento do grupo inteiro e não escapa da própria tropa.
  if (ctx.kind === "CHEFE") {
    if (isGlobal) {
      throw new Error("Apenas a Diretoria pode criar eventos para todo o grupo.");
    }
    if (!troopId || !ctx.managedTroopIds.includes(troopId)) {
      throw new Error("Você só pode criar atividades para uma tropa que gerencia.");
    }
  } else if (ctx.kind !== "GLOBAL") {
    throw new Error("Você não tem permissão para gerenciar o calendário.");
  }

  const payload = {
    title: data.title.trim(),
    description: data.description ?? "",
    startDate,
    endDate,
    location: data.location?.trim() || null,
    isGlobal,
    troopId,
    patrolId,
    rsvpDeadline,
  };

  if (data.id) {
    const existing = await prisma.event.findUnique({
      where: { id: data.id },
      select: { isGlobal: true, troopId: true },
    });
    if (!existing) throw new Error("Evento não encontrado.");

    // Precisa poder editar o evento como ele está HOJE e como ficará —
    // senão um chefe moveria um evento de outra tropa para a dele.
    if (!canEditEvent(ctx, existing) || !canEditEvent(ctx, payload)) {
      throw new Error("Você não tem permissão para editar esta atividade.");
    }

    await prisma.event.update({ where: { id: data.id }, data: payload });
    return { id: data.id, created: false };
  }

  const created = await prisma.event.create({ data: payload, select: { id: true } });

  // Avisa o público-alvo. A cópia aos responsáveis sai automaticamente da
  // regra do dispatch, então não há nada a fazer aqui para isso.
  const audience = await resolveEventAudience(payload);
  const when = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(startDate);

  await dispatchNotifications({
    recipientUserIds: audience.filter((id) => id !== ctx.user.id),
    title: `Nova atividade: ${payload.title}`,
    message: `${when}${payload.location ? ` · ${payload.location}` : ""}. Confirme sua presença no calendário.`,
    origin: "AUTO",
    senderId: ctx.user.id,
  });

  return { id: created.id, created: true };
}

// ==========================================
// LEMBRETE AUTOMÁTICO (JOB DE CRON)
// ==========================================
// Sem ViewerContext: é um job de sistema, não há usuário logado.
//
// A Vercel entrega cron em "best effort" — pode PULAR uma execução ou invocar
// a mesma DUAS VEZES, e não faz retry. Por isso o desenho é por reconciliação
// (varre uma janela, em vez de confiar num instante exato) e idempotente
// (carimba `rsvpReminderSentAt`, então reprocessar não duplica notificação).
export async function sendRsvpReminders(options?: { windowHours?: number }) {
  const windowHours = options?.windowHours ?? 48;
  const now = new Date();
  const horizon = new Date(now.getTime() + windowHours * 3600 * 1000);

  // O Prisma não expressa COALESCE(rsvpDeadline, startDate) num `where`, então
  // os dois casos ficam explícitos. A janela larga é o que absorve tanto uma
  // execução perdida quanto a imprecisão de horário do plano Hobby.
  const events = await prisma.event.findMany({
    where: {
      rsvpReminderSentAt: null,
      OR: [
        { rsvpDeadline: { gte: now, lte: horizon } },
        { rsvpDeadline: null, startDate: { gte: now, lte: horizon } },
      ],
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      location: true,
      rsvpDeadline: true,
      isGlobal: true,
      troopId: true,
      patrolId: true,
    },
    orderBy: { startDate: "asc" },
  });

  let eventsProcessed = 0;
  let notificationsSent = 0;

  for (const event of events) {
    // Compare-and-set atômico: a condição `rsvpReminderSentAt: null` no where
    // é a trava. Se duas invocações simultâneas competirem, só uma reivindica.
    // Reivindicar ANTES de despachar troca o risco de "notificar duas vezes"
    // pelo de "não notificar" numa falha rara — a escolha certa para um envio
    // em massa.
    const claim = await prisma.event.updateMany({
      where: { id: event.id, rsvpReminderSentAt: null },
      data: { rsvpReminderSentAt: new Date() },
    });
    if (claim.count === 0) continue;

    eventsProcessed += 1;

    try {
      const audience = await resolveEventAudience(event);
      if (audience.length === 0) continue;

      // Lembrar quem já respondeu é ruído — só os pendentes.
      const answered = await prisma.eventRSVP.findMany({
        where: { eventId: event.id, userId: { in: audience } },
        select: { userId: true },
      });
      const answeredIds = new Set(answered.map((a) => a.userId));
      const pending = audience.filter((id) => !answeredIds.has(id));

      if (pending.length === 0) continue;

      const deadline = new Date(event.rsvpDeadline ?? event.startDate);
      const fmt = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      });

      // includeGuardians fica no padrão (true): é o responsável quem autoriza
      // a participação do jovem, então ele precisa receber a cópia.
      const sent = await dispatchNotifications({
        recipientUserIds: pending,
        title: `Confirme sua presença: ${event.title}`,
        message: `A atividade acontece em ${fmt.format(new Date(event.startDate))}${
          event.location ? ` · ${event.location}` : ""
        }. Confirme sua participação até ${fmt.format(deadline)}.`,
        origin: "AUTO",
      });

      notificationsSent += sent;
    } catch (error) {
      // Um evento problemático não pode derrubar o job inteiro; os demais
      // continuam. O evento fica carimbado e sai do escaneamento de amanhã.
      console.error(`Falha ao enviar lembrete do evento ${event.id}:`, error);
    }
  }

  return { eventsProcessed, notificationsSent };
}

export async function deleteEvent(ctx: ViewerContext, eventId: string) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { isGlobal: true, troopId: true },
  });
  if (!existing) throw new Error("Evento não encontrado.");

  if (!canEditEvent(ctx, existing)) {
    throw new Error("Você não tem permissão para excluir esta atividade.");
  }

  // As confirmações de presença caem junto (onDelete: Cascade no schema).
  await prisma.event.delete({ where: { id: eventId } });
  return { success: true };
}
