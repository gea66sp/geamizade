// ==========================================
// POLÍTICA DE SENHA
// ==========================================
// Módulo PURO (sem imports de servidor): a mesma função alimenta o indicador
// visual no navegador e a validação na Server Action. Ter uma só fonte evita o
// cenário clássico em que a tela exige uma coisa e o servidor aceita outra.
//
// Vale para TODOS os pontos que definem senha — cadastro pelo admin, cadastro
// de jovem pelo chefe, troca no perfil, troca obrigatória e redefinição pela
// Diretoria. Uma política que não cobre todos os caminhos é decidida pelo mais
// fraco deles.

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    // \p{Lu} em vez de [A-Z]: "Ângela" tem maiúscula, e um usuário brasileiro
    // não deveria ser informado de que "Á" não conta como letra maiúscula.
    id: "upper",
    label: "Uma letra maiúscula",
    test: (p) => /\p{Lu}/u.test(p),
  },
  {
    id: "lower",
    label: "Uma letra minúscula",
    test: (p) => /\p{Ll}/u.test(p),
  },
  {
    id: "digit",
    label: "Um número",
    test: (p) => /\p{Nd}/u.test(p),
  },
  {
    // Qualquer coisa que não seja letra nem número — exceto espaço, senão
    // "minha senha" passaria como se tivesse símbolo.
    id: "symbol",
    label: "Um símbolo (!@#$%…)",
    test: (p) => /[^\p{L}\p{N}\s]/u.test(p),
  },
];

export type PasswordCheck = {
  requirements: { id: string; label: string; met: boolean }[];
  metCount: number;
  isValid: boolean;
};

export function checkPassword(password: string): PasswordCheck {
  const requirements = PASSWORD_REQUIREMENTS.map((r) => ({
    id: r.id,
    label: r.label,
    met: r.test(password ?? ""),
  }));

  const metCount = requirements.filter((r) => r.met).length;

  return {
    requirements,
    metCount,
    isValid: metCount === requirements.length,
  };
}

export function isPasswordValid(password: string): boolean {
  return checkPassword(password).isValid;
}

/** Mensagem única listando o que falta — usada nas respostas do servidor. */
export function describeMissingRequirements(password: string): string {
  const faltando = checkPassword(password)
    .requirements.filter((r) => !r.met)
    .map((r) => r.label.toLowerCase());

  if (faltando.length === 0) return "";
  return `A senha precisa ter: ${faltando.join(", ")}.`;
}

/**
 * Validação para o servidor. Lança com a lista do que falta.
 * Toda Server Action que grave senha deve chamar isto — a validação da tela
 * é conveniência para o usuário, não barreira de segurança.
 */
export function assertPasswordPolicy(password: string): void {
  if (!isPasswordValid(password)) {
    throw new Error(describeMissingRequirements(password));
  }
}
