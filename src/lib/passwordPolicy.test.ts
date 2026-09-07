import { describe, expect, it } from "vitest";

import {
  PASSWORD_MIN_LENGTH,
  assertPasswordPolicy,
  checkPassword,
  describeMissingRequirements,
  isPasswordValid,
} from "./passwordPolicy";

const VALIDA = "Escoteiro1!";

function metIds(password: string) {
  return checkPassword(password)
    .requirements.filter((r) => r.met)
    .map((r) => r.id)
    .sort();
}

describe("checkPassword — requisitos individuais", () => {
  it("aceita uma senha que cumpre tudo", () => {
    expect(isPasswordValid(VALIDA)).toBe(true);
    expect(checkPassword(VALIDA).metCount).toBe(5);
  });

  it("exige o comprimento mínimo", () => {
    expect(metIds("Ab1!")).not.toContain("length");
    expect(metIds("Ab1!aaaa")).toContain("length");
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it("reprova senha só de minúsculas", () => {
    expect(metIds("escoteiro")).toEqual(["length", "lower"]);
  });

  it("reprova senha longa porém sem símbolo", () => {
    expect(isPasswordValid("Escoteiro123")).toBe(false);
    expect(metIds("Escoteiro123")).not.toContain("symbol");
  });

  it("reprova senha sem número", () => {
    expect(isPasswordValid("Escoteiro!!")).toBe(false);
  });

  it("reprova senha sem maiúscula", () => {
    expect(isPasswordValid("escoteiro1!")).toBe(false);
  });

  it("trata string vazia sem quebrar", () => {
    expect(checkPassword("").metCount).toBe(0);
    expect(isPasswordValid("")).toBe(false);
  });

  it("aceita acentuadas como letras — 'Â' é maiúscula", () => {
    // [A-Z] diria que "Ângela1!" não tem maiúscula, o que seria absurdo
    // para um usuário brasileiro. Por isso usamos \p{Lu}.
    expect(metIds("Ângela1!")).toContain("upper");
    expect(isPasswordValid("Ângela1!")).toBe(true);
  });

  it("acentuada minúscula conta como minúscula", () => {
    expect(metIds("JOAO1!ção")).toContain("lower");
  });

  it("espaço NÃO conta como símbolo", () => {
    // Sem isto, "Minha Senha1" passaria como se tivesse símbolo.
    expect(metIds("Minha Senha1")).not.toContain("symbol");
    expect(isPasswordValid("Minha Senha1")).toBe(false);
  });

  it("aceita símbolos variados", () => {
    for (const s of ["!", "@", "#", "$", "%", "*", "-", "_", "?", "."]) {
      expect(isPasswordValid(`Escoteiro1${s}`)).toBe(true);
    }
  });
});

describe("describeMissingRequirements", () => {
  it("devolve string vazia quando a senha é válida", () => {
    expect(describeMissingRequirements(VALIDA)).toBe("");
  });

  it("lista o que falta", () => {
    const msg = describeMissingRequirements("abc");
    expect(msg).toContain("8 caracteres");
    expect(msg).toContain("maiúscula");
    expect(msg).toContain("número");
    expect(msg).toContain("símbolo");
  });
});

describe("assertPasswordPolicy — a barreira do servidor", () => {
  it("passa com senha válida", () => {
    expect(() => assertPasswordPolicy(VALIDA)).not.toThrow();
  });

  it("lança para senha fraca", () => {
    expect(() => assertPasswordPolicy("123456")).toThrow(/senha precisa ter/i);
  });

  it("lança para a antiga senha de 6 caracteres que o sistema aceitava", () => {
    // Regressão: o mínimo era 6 e sem exigência nenhuma de composição.
    expect(() => assertPasswordPolicy("abc123")).toThrow();
  });
});
