// Regras de permissão do módulo de notificações em funções puras (sem imports
// de servidor), para que possam ser usadas tanto em Server Components/Actions
// quanto em Client Components — mesmo padrão de src/lib/roleRouting.ts.

// Quem enxerga o sistema inteiro: envia para qualquer pessoa e gerencia todas
// as notificações trafegadas. É o mesmo conjunto que já entra na área /admin,
// acrescido de quem for da Diretoria por ramo.
export const GLOBAL_NOTIFIER_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO"] as const;

export type NotifierKind = "GLOBAL" | "CHEFE" | "MONITOR" | "NONE";

export type AudienceType = "ALL" | "USERS" | "TROOP" | "PATROL";

export function isGlobalNotifier(user: { role?: string | null; branch?: string | null } | null | undefined): boolean {
  if (!user) return false;
  if (user.branch === "DIRETORIA") return true;
  return GLOBAL_NOTIFIER_ROLES.includes(user.role as (typeof GLOBAL_NOTIFIER_ROLES)[number]);
}

// Só quem tem algum nível de envio/gestão vê o Painel de Gerenciamento.
// O destinatário comum enxerga apenas a própria caixa de entrada.
export function canManageNotifications(kind: NotifierKind): boolean {
  return kind === "GLOBAL" || kind === "CHEFE";
}

export function canSendNotifications(kind: NotifierKind): boolean {
  return kind !== "NONE";
}

// Monitor/Submonitor cria a notificação, mas ela só é entregue depois que o
// chefe responsável aprova.
export function requiresApproval(kind: NotifierKind): boolean {
  return kind === "MONITOR";
}

export const NOTIFIER_KIND_META: Record<NotifierKind, { label: string; description: string }> = {
  GLOBAL: {
    label: "Diretoria",
    description: "Você pode enviar avisos para todo o grupo ou escolher membros específicos.",
  },
  CHEFE: {
    label: "Chefia de Seção",
    description: "Você pode enviar avisos para os jovens da sua tropa e os responsáveis deles.",
  },
  MONITOR: {
    label: "Monitoria",
    description: "Você pode criar avisos para a sua patrulha. Eles são entregues após a aprovação do seu chefe.",
  },
  NONE: {
    label: "Membro",
    description: "Você recebe os avisos do grupo por aqui.",
  },
};

export const REQUEST_STATUS_META: Record<
  "PENDING_APPROVAL" | "APPROVED" | "REJECTED",
  { label: string; className: string; icon: string }
> = {
  PENDING_APPROVAL: {
    label: "Aguardando Aprovação",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: "fa-hourglass-half",
  },
  APPROVED: {
    label: "Aprovada e Enviada",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: "fa-circle-check",
  },
  REJECTED: {
    label: "Rejeitada",
    className: "bg-red-50 text-red-700 border border-red-200",
    icon: "fa-circle-xmark",
  },
};

export const ORIGIN_META: Record<"AUTO" | "MANUAL", { label: string; className: string; icon: string }> = {
  AUTO: {
    label: "Automática",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
    icon: "fa-robot",
  },
  MANUAL: {
    label: "Enviada por alguém",
    className: "bg-scout-green/10 text-scout-green border border-scout-green/20",
    icon: "fa-paper-plane",
  },
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  ALL: "Todos do grupo",
  USERS: "Membros selecionados",
  TROOP: "Tropa inteira",
  PATROL: "Minha patrulha",
};

// Prefixo usado nas cópias entregues ao responsável legal, para que ele saiba
// de imediato que o aviso é sobre o jovem e não sobre ele mesmo.
export function buildGuardianCopyTitle(youthName: string | null, originalTitle: string): string {
  const name = youthName?.trim() || "seu dependente";
  return `Notificação para ${name}: ${originalTitle}`;
}
