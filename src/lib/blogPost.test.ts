import { describe, expect, it } from "vitest";

import { normalizeImageUrl, sanitizeRichHtml, stripHtml, toSlug } from "./blogPost";

describe("toSlug", () => {
  it("remove acentos e normaliza espaços", () => {
    expect(toSlug("Acampamento de Ação Sênior")).toBe("acampamento-de-acao-senior");
  });

  it("colapsa hífens repetidos e apara as pontas", () => {
    expect(toSlug("  --Olá   Mundo--  ")).toBe("ola-mundo");
  });

  it("devolve string vazia quando não sobra nada utilizável", () => {
    // getUniqueSlug depende disso para cair no fallback "publicacao".
    expect(toSlug("!!!@@@###")).toBe("");
  });
});

describe("stripHtml", () => {
  it("remove tags e colapsa o espaço em branco", () => {
    expect(stripHtml("<p>Olá <strong>mundo</strong></p>")).toBe("Olá mundo");
  });
});

describe("sanitizeRichHtml", () => {
  // Este conteúdo é renderizado com dangerouslySetInnerHTML na página pública
  // do blog, e membros comuns conseguem submetê-lo. É a superfície de XSS do
  // sistema — cada caso abaixo é um vetor real.
  it("remove blocos <script>", () => {
    const out = sanitizeRichHtml('<p>oi</p><script>alert("xss")</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert");
    expect(out).toContain("<p>oi</p>");
  });

  it("remove <style> e <iframe>", () => {
    const out = sanitizeRichHtml('<style>body{display:none}</style><iframe src="http://mau.com"></iframe>ok');
    expect(out).not.toContain("<style");
    expect(out).not.toContain("<iframe");
    expect(out).toContain("ok");
  });

  it("remove handlers inline com aspas duplas e simples", () => {
    expect(sanitizeRichHtml('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
    expect(sanitizeRichHtml("<img src='x' onclick='alert(1)'>")).not.toContain("onclick");
  });

  it("neutraliza URLs javascript:", () => {
    expect(sanitizeRichHtml('<a href="javascript:alert(1)">clique</a>')).not.toContain("javascript:");
  });

  it("preserva a formatação legítima do editor", () => {
    const html = '<p><strong>Negrito</strong> e <a href="https://escoteiros.org.br">link</a></p>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });
});

describe("normalizeImageUrl", () => {
  it("aceita http e https", () => {
    expect(normalizeImageUrl("https://exemplo.com/a.png")).toBe("https://exemplo.com/a.png");
    expect(normalizeImageUrl("http://exemplo.com/a.png")).toBe("http://exemplo.com/a.png");
  });

  it("trata vazio e nulo como ausência de imagem", () => {
    expect(normalizeImageUrl(null)).toBeNull();
    expect(normalizeImageUrl("   ")).toBeNull();
  });

  it("rejeita URL malformada", () => {
    expect(() => normalizeImageUrl("nao-e-url")).toThrow(/inválida/);
  });

  it("rejeita protocolos perigosos", () => {
    // javascript: e data: num src de imagem também são vetor de XSS.
    expect(() => normalizeImageUrl("javascript:alert(1)")).toThrow(/http/);
    expect(() => normalizeImageUrl("data:text/html;base64,PHNjcmlwdD4=")).toThrow(/http/);
  });
});
