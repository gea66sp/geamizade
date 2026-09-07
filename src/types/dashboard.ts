import type {
  Branch,
  ItemCondition,
  Role,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

// ==========================================
// FORMAS COMPARTILHADAS PELAS TELAS DO DASHBOARD
// ==========================================
// Vários componentes recebem os mesmos recortes de dados do Prisma (a lista de
// usuários para um select, a árvore de tropas/patrulhas, uma linha da tabela
// financeira). Declarar isso uma vez aqui evita repetir a mesma forma em cada
// arquivo — e faz o compilador acusar quando a consulta na page deixa de trazer
// um campo que a tela usa.

export type UserOption = {
  id: string;
  name: string | null;
  role?: Role;
  branch?: string | null;
};

export type PatrolOption = {
  id: string;
  name: string;
};

export type TroopOption = {
  id: string;
  name: string;
  branch?: string;
  patrols?: PatrolOption[];
};

export type TransactionRow = {
  id: string;
  title: string;
  /** Já convertido de Decimal para number na page (o Prisma devolve Decimal). */
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  dueDate: Date | string;
  paidDate?: Date | string | null;
  receiptUrl?: string | null;
  userId: string | null;
  troopId: string | null;
  patrolId: string | null;
  user?: { name: string | null } | null;
  troop?: { name: string } | null;
  patrol?: { name: string } | null;
};

export type InventoryRow = {
  id: string;
  chargeNumber: string;
  name: string;
  category: string;
  quantity: number;
  condition: ItemCondition;
  notes?: string | null;
  isActive: boolean;
  dischargeReason?: string | null;
  dischargedAt?: Date | string | null;
  troopId: string | null;
  patrolId: string | null;
  assignedUserId?: string | null;
  troop?: { name: string } | null;
  patrol?: { name: string } | null;
  assignedUser?: { id: string; name: string | null } | null;
  /** Empréstimos ATIVOS deste item (sem `item`, que é o próprio pai). */
  loans: ItemLoanRow[];
};

// Empréstimo aninhado dentro de um InventoryItem: não repete o `item`.
export type ItemLoanRow = {
  id: string;
  itemId: string;
  userId: string;
  borrowedAt: Date | string;
  expectedReturn?: Date | string | null;
  returnedAt?: Date | string | null;
  user: { id?: string; name: string | null; role?: Role };
};

// Linha do histórico de empréstimos: aí sim o item vem junto.
export type LoanRow = ItemLoanRow & {
  item: { name: string; chargeNumber: string };
};

// ==========================================
// FORMULÁRIOS DO CMS (admin/personalizar)
// ==========================================
// Espelham HomePageSettings / Faq / InstitutionalPage, mas com os campos
// opcionais: o formulário é preenchido progressivamente e o registro pode nem
// existir ainda na primeira vez que a tela é aberta.

export type StatItem = { value?: string; label?: string };

export type HomeSettingsForm = {
  id?: string;
  heroTitle?: string;
  heroShortText?: string;
  heroImage?: string | null;
  aboutText?: string;
  aboutImage?: string | null;
  impactedYouthCount?: number;
};

export type FaqForm = {
  id?: string;
  question?: string;
  answer?: string;
  order?: number;
  isActive?: boolean;
};

export type BoardMemberForm = {
  id?: string;
  name?: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
};

export type TestimonialForm = {
  id?: string;
  authorName?: string;
  authorRole?: string;
  quote?: string;
  rating?: number;
};

export type InstitutionalForm = {
  id?: string;
  stats?: StatItem[];
  historyImage?: string;
  historyBadgeYear?: string;
  historyBadgeLabel?: string;
  historySubtitle?: string;
  historyTitle?: string;
  historyParagraphs?: string[];
  compassTitle?: string;
  compassSubtitle?: string;
  missionText?: string;
  visionText?: string;
  valuesList?: string[];
  boardMembers?: BoardMemberForm[];
  testimonials?: TestimonialForm[];
};

// ==========================================
// PERFIL E VÍNCULOS FAMILIARES
// ==========================================
export type PersonalDoc = {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  size: number;
  createdAt: Date | string;
};

export type TiedPerson = {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  image?: string | null;
  role?: Role;
  branch?: string | null;
};

// Os dois lados do vínculo são consultados separadamente: `guardianTies`
// inclui só o guardião, `dependentTies` inclui só o dependente. Por isso são
// dois tipos, e não um com ambos opcionais.
export type GuardianTieRow = {
  id: string;
  guardianId: string;
  dependentId: string;
  relationship?: string | null;
  guardian: TiedPerson;
};

export type DependentTieRow = {
  id: string;
  guardianId: string;
  dependentId: string;
  relationship?: string | null;
  dependent: TiedPerson;
};

export type ProfileData = {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  image?: string | null;
  role: Role;
  branch?: string | null;
  troop?: { id: string; name: string } | null;
  patrol?: { id: string; name: string } | null;
  personalDocs: PersonalDoc[];
};

// Dados agregados do gráfico da home do admin
export type MemberChartPoint = { name: string; membros: number };
export type FinanceChartPoint = { name: string; receitas: number; despesas: number };

// Linha da listagem de tropas (admin/tropas)
export type TroopListRow = {
  id: string;
  name: string;
  branch: Branch;
  description: string | null;
  managerId: string | null;
  manager?: { id: string; name: string | null; image?: string | null } | null;
  _count: { members: number; patrols: number };
};

// ==========================================
// PORTAL DA TRANSPARÊNCIA (CMS de pastas e arquivos)
// ==========================================
// Este módulo tem controle de acesso próprio (allowedViewers/allowedEditors),
// separado das checagens por Role usadas no resto do sistema.
export type AdminUserOption = { id: string; name: string | null; role: string };

export type FolderDetailed = {
  id: string;
  name: string;
  description?: string | null;
  parentId: string | null;
  isPublic: boolean;
  isRestrictedView: boolean;
  isRestrictedEdit: boolean;
  allowedViewers: { id: string }[];
  allowedEditors: { id: string }[];
};

export type DocumentDetailed = {
  id: string;
  title: string;
  description?: string | null;
  folderId: string | null;
  fileUrl: string;
  createdAt: Date | string;
  isPublic: boolean;
  isRestrictedView: boolean;
  isRestrictedEdit: boolean;
  allowedViewers: { id: string }[];
  allowedEditors: { id: string }[];
};
