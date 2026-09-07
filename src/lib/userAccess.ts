import type { Role } from "@prisma/client";

// ==========================================
// QUEM PODE CONCEDER QUAL CARGO
// ==========================================
// Isto é uma LISTA DE PERMISSÃO, e a escolha é deliberada.
//
// Antes a regra era uma lista de NEGAÇÃO (`restrictedRoles`), e ela tinha uma
// falha estrutural: um `Role` novo no enum nascia concedível por todo mundo.
// Foi exatamente por isso que `CHEFE` acabou concedível por `FINANCEIRO` — e
// teria permitido que um chefe criasse outro chefe assim que ganhasse acesso
// ao cadastro.
//
// Com lista de permissão, um cargo novo nasce concedível por NINGUÉM até
// alguém tomar a decisão explícita de incluí-lo aqui.
const ALL_ROLES: Role[] = ["ADMIN", "DEVELOPER", "FINANCEIRO", "CHEFE", "RESPONSAVEL", "MEMBER"];

export function grantableRoles(actorRole: Role | string | null | undefined): Role[] {
  switch (actorRole) {
    case "ADMIN":
    case "DEVELOPER":
      return ALL_ROLES;

    // Mantido como estava antes desta mudança. Não é óbvio que a Tesouraria
    // deva criar chefes — vale revisar, mas alterar em silêncio seria mudar
    // o comportamento do sistema sem ninguém pedir.
    case "FINANCEIRO":
      return ["CHEFE", "RESPONSAVEL", "MEMBER"];

    // O chefe cadastra os jovens da própria seção, e nada além disso.
    case "CHEFE":
      return ["MEMBER"];

    default:
      return [];
  }
}

export function canGrantRole(actorRole: Role | string | null | undefined, target: Role): boolean {
  return grantableRoles(actorRole).includes(target);
}

/** Todos os cargos existentes — usado pelos testes para garantir que nenhum
 *  cargo novo fique sem uma decisão explícita de quem pode concedê-lo. */
export function allRoles(): Role[] {
  return [...ALL_ROLES];
}
