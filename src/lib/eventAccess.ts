// Regras do calendário em funções puras (sem imports de servidor), para uso
// tanto em Server Components/Actions quanto em Client Components — mesmo padrão
// de src/lib/roleRouting.ts e src/lib/notificationAccess.ts.
import { NotifierKind } from "@/src/lib/notificationAccess";

export type RsvpAnswer = "GOING" | "NOT_GOING" | "PENDING";

export type EventEditableShape = {
  isGlobal: boolean;
  troopId: string | null;
};

export type RsvpWindowShape = {
  startDate: Date | string;
  rsvpDeadline?: Date | string | null;
};

// Prazo para confirmar presença. Sem prazo explícito, vale até o evento começar.
export function getRsvpDeadline(event: RsvpWindowShape): Date {
  return new Date(event.rsvpDeadline ?? event.startDate);
}

export function isRsvpOpen(event: RsvpWindowShape, now: Date = new Date()): boolean {
  return now.getTime() < getRsvpDeadline(event).getTime();
}

// Quem pode criar/editar/excluir um evento.
// A Diretoria mexe em tudo; o chefe só nos eventos da própria tropa — e nunca
// em eventos globais, que são comunicação do grupo inteiro.
export function canEditEvent(
  ctx: { kind: NotifierKind; managedTroopIds: string[] },
  event: EventEditableShape
): boolean {
  if (ctx.kind === "GLOBAL") return true;
  if (ctx.kind !== "CHEFE") return false;
  if (event.isGlobal) return false;
  return !!event.troopId && ctx.managedTroopIds.includes(event.troopId);
}

// Quem pode ver a lista de presença completa de um evento.
export function canViewAttendance(
  ctx: { kind: NotifierKind; managedTroopIds: string[] },
  event: EventEditableShape
): boolean {
  if (ctx.kind === "GLOBAL") return true;
  if (ctx.kind !== "CHEFE") return false;
  // O chefe vê a presença dos eventos da sua tropa e também dos globais,
  // porque precisa saber quem da seção dele vai a um evento do grupo.
  return event.isGlobal || (!!event.troopId && ctx.managedTroopIds.includes(event.troopId));
}

export const RSVP_META: Record<RsvpAnswer, { label: string; className: string; icon: string }> = {
  GOING: {
    label: "Vai participar",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: "fa-circle-check",
  },
  NOT_GOING: {
    label: "Não vai",
    className: "bg-red-50 text-red-700 border border-red-200",
    icon: "fa-circle-xmark",
  },
  PENDING: {
    label: "Não respondeu",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
    icon: "fa-circle-question",
  },
};

export function toAnswer(status: boolean | null | undefined): RsvpAnswer {
  if (status === true) return "GOING";
  if (status === false) return "NOT_GOING";
  return "PENDING";
}
