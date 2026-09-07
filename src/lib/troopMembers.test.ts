import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPrismaMock, type PrismaMock } from "./__mocks__/prismaMock";

const prismaMock: PrismaMock = createPrismaMock();
vi.mock("@/src/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/src/lib/auth", () => ({ getAuthUser: vi.fn(), authOptions: {} }));
vi.mock("bcryptjs", () => ({ hash: vi.fn(async (v: string) => `hashed:${v}`) }));

const { createTroopMember, updateTroopMemberBasics } = await import("./troopMembers");

const MINHA = "tropa-minha";
const OUTRA = "tropa-outra";

type Ctx = Parameters<typeof createTroopMember>[0];

function ctx(kind: "GLOBAL" | "CHEFE" | "NONE" = "CHEFE", managed = [MINHA]): Ctx {
  return {
    user: { id: "chefe", name: "Chefe", role: "CHEFE", branch: null, troopId: null, patrolId: null },
    kind,
    managedTroopIds: managed,
    ledPatrolIds: [],
  } as Ctx;
}

// Precisa cumprir a política: 8+, maiúscula, minúscula, número e símbolo.
const SENHA_OK = "Escoteiro1!";
const valido = { name: "João da Silva", email: "Joao@Exemplo.com", password: SENHA_OK, troopId: MINHA };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findFirst.mockResolvedValue(null);
  prismaMock.user.create.mockResolvedValue({ id: "novo", name: "João da Silva", email: "joao@exemplo.com" });
});

describe("createTroopMember", () => {
  it("cria o jovem na tropa gerida", async () => {
    await createTroopMember(ctx(), valido);

    const data = prismaMock.user.create.mock.calls[0][0].data;
    expect(data.name).toBe("João da Silva");
    expect(data.troopId).toBe(MINHA);
  });

  it("SEMPRE grava role MEMBER — o cargo não é parâmetro", async () => {
    // Mesmo que alguém acrescente um campo `role` na chamada, ele não existe
    // na assinatura e não chega ao banco.
    await createTroopMember(ctx(), { ...valido, role: "ADMIN" } as never);

    expect(prismaMock.user.create.mock.calls[0][0].data.role).toBe("MEMBER");
  });

  it("marca a troca de senha obrigatória", async () => {
    await createTroopMember(ctx(), valido);
    expect(prismaMock.user.create.mock.calls[0][0].data.mustChangePassword).toBe(true);
  });

  it("grava a senha com hash, nunca em texto puro", async () => {
    await createTroopMember(ctx(), valido);

    const data = prismaMock.user.create.mock.calls[0][0].data;
    expect(data.password).toBe(`hashed:${SENHA_OK}`);
    expect(data.password).not.toBe(SENHA_OK);
  });

  it("normaliza o e-mail para minúsculas", async () => {
    await createTroopMember(ctx(), valido);
    expect(prismaMock.user.create.mock.calls[0][0].data.email).toBe("joao@exemplo.com");
  });

  it("recusa tropa que o chefe não gerencia", async () => {
    await expect(createTroopMember(ctx(), { ...valido, troopId: OUTRA })).rejects.toThrow(
      /não é responsável/i
    );
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("recusa quem não é chefe nem Diretoria", async () => {
    await expect(createTroopMember(ctx("NONE", []), valido)).rejects.toThrow(/Acesso negado/i);
  });

  it("Diretoria cria em qualquer tropa", async () => {
    await createTroopMember(ctx("GLOBAL", []), { ...valido, troopId: OUTRA });
    expect(prismaMock.user.create).toHaveBeenCalled();
  });

  it("recusa e-mail já cadastrado", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "existente" });
    await expect(createTroopMember(ctx(), valido)).rejects.toThrow(/já existe/i);
  });

  it("recusa senha que não cumpre a política", async () => {
    await expect(createTroopMember(ctx(), { ...valido, password: "123" })).rejects.toThrow(
      /senha precisa ter/i
    );
    // A antiga senha de 6 caracteres também não passa mais.
    await expect(createTroopMember(ctx(), { ...valido, password: "abc123" })).rejects.toThrow(
      /senha precisa ter/i
    );
  });

  it("recusa nome e e-mail inválidos", async () => {
    await expect(createTroopMember(ctx(), { ...valido, name: "Jo" })).rejects.toThrow(/nome completo/i);
    await expect(createTroopMember(ctx(), { ...valido, email: "sem-arroba" })).rejects.toThrow(/e-mail válido/i);
  });

  it("valida ANTES de tocar o banco", async () => {
    await expect(createTroopMember(ctx(), { ...valido, name: "" })).rejects.toThrow();
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe("updateTroopMemberBasics", () => {
  const dados = { name: "João Silva Junior", email: "joao2@exemplo.com", phone: "11999999999" };

  it("atualiza jovem da própria tropa", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "j1", role: "MEMBER", troopId: MINHA });

    await updateTroopMemberBasics(ctx(), "j1", dados);

    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it("grava SOMENTE nome, e-mail e telefone", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "j1", role: "MEMBER", troopId: MINHA });

    await updateTroopMemberBasics(ctx(), "j1", dados);

    const data = prismaMock.user.update.mock.calls[0][0].data;
    expect(Object.keys(data).sort()).toEqual(["email", "name", "phone"]);
    // Cargo e tropa não podem sair daqui de jeito nenhum.
    expect(data).not.toHaveProperty("role");
    expect(data).not.toHaveProperty("troopId");
    expect(data).not.toHaveProperty("branch");
  });

  it("recusa jovem de outra tropa", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "j1", role: "MEMBER", troopId: OUTRA });

    await expect(updateTroopMemberBasics(ctx(), "j1", dados)).rejects.toThrow(/não é responsável/i);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("recusa alvo que não seja jovem — um chefe não edita outro chefe", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "c2", role: "CHEFE", troopId: MINHA });

    await expect(updateTroopMemberBasics(ctx(), "c2", dados)).rejects.toThrow(/jovens da sua seção/i);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("recusa alvo inexistente", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(updateTroopMemberBasics(ctx(), "nao-existe", dados)).rejects.toThrow(/não encontrado/i);
  });

  it("recusa e-mail já usado por outra pessoa", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "j1", role: "MEMBER", troopId: MINHA });
    prismaMock.user.findFirst.mockResolvedValue({ id: "outro" });

    await expect(updateTroopMemberBasics(ctx(), "j1", dados)).rejects.toThrow(/já está sendo usado/i);
  });

  it("telefone vazio vira null em vez de string vazia", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "j1", role: "MEMBER", troopId: MINHA });

    await updateTroopMemberBasics(ctx(), "j1", { ...dados, phone: "   " });

    expect(prismaMock.user.update.mock.calls[0][0].data.phone).toBeNull();
  });
});
