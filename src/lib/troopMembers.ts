import { hash } from "bcryptjs";

import prisma from "@/src/lib/prisma";
import { ViewerContext, getViewerContext } from "@/src/lib/notifications";
import { assertPasswordPolicy } from "@/src/lib/passwordPolicy";

export { getViewerContext };
export type { ViewerContext };

// ==========================================
// CADASTRO DE JOVENS PELO CHEFE
// ==========================================
// Módulo separado de admin/usuarios/actions.ts de propósito.
//
// Aquele `updateUser` reescreve cargo, ramo e vínculos familiares. Parametrizá-lo
// para o chefe criaria justamente o tipo de caminho que alguém amplia depois sem
// perceber a consequência. Aqui, o cargo NÃO É PARÂMETRO — é constante. Não há
// campo para manipular, nem validação para esquecer.

async function assertManagesTroop(ctx: ViewerContext, troopId: string) {
  if (ctx.kind !== "CHEFE" && ctx.kind !== "GLOBAL") {
    throw new Error("Acesso negado: apenas a chefia pode cadastrar jovens na seção.");
  }
  if (ctx.kind === "CHEFE" && !ctx.managedTroopIds.includes(troopId)) {
    throw new Error("Você não é responsável por esta tropa.");
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type CreateTroopMemberInput = {
  name: string;
  email: string;
  password: string;
  troopId: string;
};

export async function createTroopMember(ctx: ViewerContext, input: CreateTroopMemberInput) {
  const name = input.name?.trim();
  const email = normalizeEmail(input.email ?? "");

  if (!name || name.length < 3) throw new Error("Informe o nome completo do jovem.");
  if (!email || !email.includes("@")) throw new Error("Informe um e-mail válido.");
  assertPasswordPolicy(input.password);

  await assertManagesTroop(ctx, input.troopId);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Já existe uma conta com este e-mail no grupo.");
  }

  const created = await prisma.user.create({
    data: {
      name,
      email,
      password: await hash(input.password, 12),
      // Constante, não parâmetro: o chefe cadastra jovens, e só.
      role: "MEMBER",
      troopId: input.troopId,
      // A senha foi definida por outra pessoa — a própria troca no 1º acesso.
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true },
  });

  return created;
}

export type UpdateTroopMemberInput = {
  name: string;
  email: string;
  phone?: string | null;
};

export async function updateTroopMemberBasics(
  ctx: ViewerContext,
  userId: string,
  input: UpdateTroopMemberInput
) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, troopId: true },
  });
  if (!target) throw new Error("Membro não encontrado.");

  // Um chefe edita jovens — não outro chefe, nem um responsável.
  if (target.role !== "MEMBER") {
    throw new Error("Você só pode editar os dados dos jovens da sua seção.");
  }
  if (!target.troopId) throw new Error("Este membro não está em nenhuma tropa.");

  await assertManagesTroop(ctx, target.troopId);

  const name = input.name?.trim();
  const email = normalizeEmail(input.email ?? "");
  if (!name || name.length < 3) throw new Error("Informe o nome completo do jovem.");
  if (!email || !email.includes("@")) throw new Error("Informe um e-mail válido.");

  const duplicate = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, id: { not: userId } },
    select: { id: true },
  });
  if (duplicate) throw new Error("Este e-mail já está sendo usado por outro membro.");

  // SOMENTE estes três campos. `role`, `branch`, `troopId` e os vínculos
  // familiares não aparecem aqui — não é questão de validar, é de não existir.
  await prisma.user.update({
    where: { id: userId },
    data: { name, email, phone: input.phone?.trim() || null },
  });

  return { success: true };
}
