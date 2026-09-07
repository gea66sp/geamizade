import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPrismaMock, type PrismaMock } from "./__mocks__/prismaMock";

const prismaMock: PrismaMock = createPrismaMock();
vi.mock("@/src/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/src/lib/auth", () => ({ getAuthUser: vi.fn(), authOptions: {} }));

const { canLendItem, canLendToUser, canManageTransaction, summarizeFinancials } =
  await import("./finance");

const MINHA = "tropa-minha";
const OUTRA = "tropa-outra";

type Ctx = Parameters<typeof canManageTransaction>[0];

function ctx(kind: "GLOBAL" | "CHEFE" | "MONITOR" | "NONE", managed: string[] = []): Ctx {
  return {
    user: { id: "eu", name: "Eu", role: "CHEFE", branch: null, troopId: null, patrolId: null },
    kind,
    managedTroopIds: managed,
    ledPatrolIds: [],
  } as Ctx;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ==========================================
// A TRAVA DO CAIXA
// ==========================================
describe("canManageTransaction", () => {
  it("chefe gerencia lançamento da própria tropa", async () => {
    await expect(canManageTransaction(ctx("CHEFE", [MINHA]), { troopId: MINHA })).resolves.toBe(true);
  });

  it("chefe NÃO gerencia lançamento de outra tropa", async () => {
    await expect(canManageTransaction(ctx("CHEFE", [MINHA]), { troopId: OUTRA })).resolves.toBe(false);
  });

  it("chefe NÃO gerencia o caixa geral (lançamento sem escopo)", async () => {
    // É o ponto mais importante: sem tropa nem patrulha, o dinheiro é do grupo.
    await expect(canManageTransaction(ctx("CHEFE", [MINHA]), {})).resolves.toBe(false);
    await expect(
      canManageTransaction(ctx("CHEFE", [MINHA]), { troopId: null, patrolId: null })
    ).resolves.toBe(false);
  });

  it("chefe gerencia lançamento de uma patrulha da sua tropa", async () => {
    prismaMock.patrol.findUnique.mockResolvedValue({ troopId: MINHA });

    await expect(
      canManageTransaction(ctx("CHEFE", [MINHA]), { patrolId: "patrulha-1" })
    ).resolves.toBe(true);
  });

  it("resolve a patrulha até a tropa, ignorando o troopId enviado pelo cliente", async () => {
    // Ataque: mandar a patrulha de OUTRA tropa junto com o troopId da minha.
    // A patrulha manda, então tem que recusar.
    prismaMock.patrol.findUnique.mockResolvedValue({ troopId: OUTRA });

    await expect(
      canManageTransaction(ctx("CHEFE", [MINHA]), { troopId: MINHA, patrolId: "patrulha-alheia" })
    ).resolves.toBe(false);
  });

  it("recusa patrulha inexistente", async () => {
    prismaMock.patrol.findUnique.mockResolvedValue(null);
    await expect(
      canManageTransaction(ctx("CHEFE", [MINHA]), { patrolId: "nao-existe" })
    ).resolves.toBe(false);
  });

  it("Diretoria gerencia qualquer escopo, inclusive o caixa geral", async () => {
    await expect(canManageTransaction(ctx("GLOBAL"), {})).resolves.toBe(true);
    await expect(canManageTransaction(ctx("GLOBAL"), { troopId: OUTRA })).resolves.toBe(true);
  });

  it("monitor e membro comum não gerenciam nada", async () => {
    await expect(canManageTransaction(ctx("MONITOR"), { troopId: MINHA })).resolves.toBe(false);
    await expect(canManageTransaction(ctx("NONE"), { troopId: MINHA })).resolves.toBe(false);
  });

  it("chefe com várias tropas alcança todas elas", async () => {
    const c = ctx("CHEFE", [MINHA, "tropa-2"]);
    await expect(canManageTransaction(c, { troopId: "tropa-2" })).resolves.toBe(true);
    await expect(canManageTransaction(c, { troopId: OUTRA })).resolves.toBe(false);
  });
});

// ==========================================
// PATRIMÔNIO
// ==========================================
describe("canLendItem", () => {
  it("chefe empresta item da própria tropa", async () => {
    prismaMock.inventoryItem.findUnique.mockResolvedValue({ troopId: MINHA, patrol: null });
    await expect(canLendItem(ctx("CHEFE", [MINHA]), "item-1")).resolves.toBe(true);
  });

  it("chefe empresta item de uma patrulha da sua tropa", async () => {
    prismaMock.inventoryItem.findUnique.mockResolvedValue({
      troopId: null,
      patrol: { troopId: MINHA },
    });
    await expect(canLendItem(ctx("CHEFE", [MINHA]), "item-1")).resolves.toBe(true);
  });

  it("chefe NÃO empresta item de outra tropa", async () => {
    prismaMock.inventoryItem.findUnique.mockResolvedValue({ troopId: OUTRA, patrol: null });
    await expect(canLendItem(ctx("CHEFE", [MINHA]), "item-1")).resolves.toBe(false);
  });

  it("chefe NÃO empresta item do almoxarifado central (sem tropa)", async () => {
    prismaMock.inventoryItem.findUnique.mockResolvedValue({ troopId: null, patrol: null });
    await expect(canLendItem(ctx("CHEFE", [MINHA]), "item-1")).resolves.toBe(false);
  });

  it("a patrulha prevalece sobre o troopId do item", async () => {
    prismaMock.inventoryItem.findUnique.mockResolvedValue({
      troopId: MINHA,
      patrol: { troopId: OUTRA },
    });
    await expect(canLendItem(ctx("CHEFE", [MINHA]), "item-1")).resolves.toBe(false);
  });
});

describe("canLendToUser", () => {
  it("chefe empresta para membro da própria tropa", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ troopId: MINHA });
    await expect(canLendToUser(ctx("CHEFE", [MINHA]), "jovem")).resolves.toBe(true);
  });

  it("chefe NÃO empresta para quem é de outra tropa", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ troopId: OUTRA });
    await expect(canLendToUser(ctx("CHEFE", [MINHA]), "estranho")).resolves.toBe(false);
  });

  it("chefe NÃO empresta para quem não tem tropa", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ troopId: null });
    await expect(canLendToUser(ctx("CHEFE", [MINHA]), "sem-tropa")).resolves.toBe(false);
  });

  it("Diretoria empresta para qualquer um", async () => {
    await expect(canLendToUser(ctx("GLOBAL"), "qualquer")).resolves.toBe(true);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});

// ==========================================
// SALDO
// ==========================================
describe("summarizeFinancials", () => {
  const rows = [
    { type: "INCOME", status: "PAID", amount: 300 },
    { type: "EXPENSE", status: "PAID", amount: 100 },
    { type: "INCOME", status: "PENDING", amount: 50 },
    { type: "EXPENSE", status: "PENDING", amount: 20 },
    { type: "INCOME", status: "CANCELLED", amount: 999 },
  ];

  it("saldo conta apenas o que foi efetivamente pago", () => {
    expect(summarizeFinancials(rows).saldo).toBe(200);
  });

  it("separa a receber e a pagar entre os pendentes", () => {
    const s = summarizeFinancials(rows);
    expect(s.aReceber).toBe(50);
    expect(s.aPagar).toBe(20);
  });

  it("ignora cancelados em todos os totais", () => {
    const s = summarizeFinancials(rows);
    expect(s.saldo + s.aReceber + s.aPagar).toBe(270); // 999 fora
  });

  it("zera com lista vazia", () => {
    expect(summarizeFinancials([])).toEqual({ saldo: 0, aReceber: 0, aPagar: 0 });
  });
});
