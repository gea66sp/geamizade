// Helpers de erro compartilhados. Existem para que os `catch` das Server
// Actions não precisem tipar o erro como `any` só para ler `.message` —
// em TypeScript o valor capturado é `unknown`, e pode não ser um Error.

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Código de erro conhecido do Prisma (P2002 = violação de unicidade,
 * P2003 = violação de chave estrangeira, etc). Evita `(error as any).code`.
 */
export function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

/**
 * O Next sinaliza `redirect()` lançando um erro especial. Ele NÃO é falha:
 * capturá-lo e mostrar um alerta ao usuário esconderia um redirecionamento
 * bem-sucedido atrás de uma mensagem de erro.
 */
export function isNextRedirectError(error: unknown): boolean {
  if (getErrorMessage(error, "") === "NEXT_REDIRECT") return true;
  if (typeof error === "object" && error !== null && "digest" in error) {
    const digest = (error as { digest: unknown }).digest;
    return typeof digest === "string" && digest.includes("NEXT_REDIRECT");
  }
  return false;
}
