import { describe, expect, it } from "vitest";

import { allRoles, canGrantRole, grantableRoles } from "./userAccess";

describe("grantableRoles — lista de permissão", () => {
  it("ADMIN e DEVELOPER concedem qualquer cargo", () => {
    for (const role of allRoles()) {
      expect(canGrantRole("ADMIN", role)).toBe(true);
      expect(canGrantRole("DEVELOPER", role)).toBe(true);
    }
  });

  it("CHEFE concede APENAS o cargo de jovem", () => {
    expect(grantableRoles("CHEFE")).toEqual(["MEMBER"]);
  });

  it("CHEFE NÃO concede o cargo de CHEFE", () => {
    // Esta é a escalada de privilégio que a antiga lista de NEGAÇÃO permitia:
    // como CHEFE não estava em `restrictedRoles`, dar ao chefe acesso ao
    // cadastro o deixaria criar outro chefe e distribuir a conta.
    expect(canGrantRole("CHEFE", "CHEFE")).toBe(false);
  });

  it("CHEFE NÃO concede cargos administrativos", () => {
    expect(canGrantRole("CHEFE", "ADMIN")).toBe(false);
    expect(canGrantRole("CHEFE", "DEVELOPER")).toBe(false);
    expect(canGrantRole("CHEFE", "FINANCEIRO")).toBe(false);
  });

  it("CHEFE NÃO concede RESPONSAVEL", () => {
    // Ficou de fora do escopo: vincular um responsável a um jovem dá acesso
    // aos dados dele, então essa decisão continua com a Diretoria.
    expect(canGrantRole("CHEFE", "RESPONSAVEL")).toBe(false);
  });

  it("FINANCEIRO não concede cargos administrativos", () => {
    expect(canGrantRole("FINANCEIRO", "ADMIN")).toBe(false);
    expect(canGrantRole("FINANCEIRO", "DEVELOPER")).toBe(false);
    expect(canGrantRole("FINANCEIRO", "FINANCEIRO")).toBe(false);
  });

  it("MEMBER e RESPONSAVEL não concedem nada", () => {
    expect(grantableRoles("MEMBER")).toEqual([]);
    expect(grantableRoles("RESPONSAVEL")).toEqual([]);
  });

  it("cargo desconhecido, nulo ou ausente não concede nada", () => {
    expect(grantableRoles(null)).toEqual([]);
    expect(grantableRoles(undefined)).toEqual([]);
    expect(grantableRoles("CARGO_INVENTADO")).toEqual([]);
  });

  it("nenhum cargo é concedível por quem não deveria — varredura completa", () => {
    // Percorre a matriz inteira em vez de casos escolhidos a dedo: se alguém
    // ampliar uma lista sem querer, isto acusa.
    const esperado: Record<string, string[]> = {
      ADMIN: allRoles(),
      DEVELOPER: allRoles(),
      FINANCEIRO: ["CHEFE", "RESPONSAVEL", "MEMBER"],
      CHEFE: ["MEMBER"],
      RESPONSAVEL: [],
      MEMBER: [],
    };

    for (const [ator, permitidos] of Object.entries(esperado)) {
      for (const alvo of allRoles()) {
        expect(canGrantRole(ator, alvo)).toBe(permitidos.includes(alvo));
      }
    }
  });

  it("todo cargo do enum tem uma decisão explícita de quem o concede", () => {
    // Se alguém adicionar um Role novo e esquecer de decidir quem o concede,
    // ele fica concedível por ninguém — o que é o padrão seguro — mas este
    // teste falha para forçar a decisão consciente.
    const concedíveis = new Set(
      allRoles().flatMap((ator) => grantableRoles(ator))
    );
    for (const role of allRoles()) {
      expect(concedíveis.has(role)).toBe(true);
    }
  });
});
