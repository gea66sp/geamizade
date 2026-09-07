import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPrismaMock, type PrismaMock } from "./__mocks__/prismaMock";

const prismaMock: PrismaMock = createPrismaMock();
vi.mock("@/src/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/src/lib/auth", () => ({ getAuthUser: vi.fn(), authOptions: {} }));

const { assertIsGuardianOf, getDependentOverview, getDependentsSummary } = await import("./guardian");

type Ctx = Parameters<typeof assertIsGuardianOf>[0];

function ctx(): Ctx {
  return {
    user: { id: "mae", name: "Mãe", role: "RESPONSAVEL", branch: null, troopId: null, patrolId: null },
    kind: "NONE",
    managedTroopIds: [],
    ledPatrolIds: [],
  } as Ctx;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ==========================================
// A TRAVA — é o que impede um responsável de ver o filho dos outros
// ==========================================
describe("assertIsGuardianOf", () => {
  it("aceita quando existe vínculo familiar", async () => {
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    await expect(assertIsGuardianOf(ctx(), "jovem1")).resolves.toBeUndefined();
  });

  it("recusa quando NÃO existe vínculo", async () => {
    prismaMock.familyTie.findFirst.mockResolvedValue(null);
    await expect(assertIsGuardianOf(ctx(), "filho-alheio")).rejects.toThrow(/não é responsável/i);
  });

  it("consulta o vínculo na direção correta (guardião → dependente)", async () => {
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    await assertIsGuardianOf(ctx(), "jovem1");

    // Inverter guardianId/dependentId deixaria um jovem ver os dados do
    // próprio responsável — a direção importa.
    expect(prismaMock.familyTie.findFirst.mock.calls[0][0].where).toEqual({
      guardianId: "mae",
      dependentId: "jovem1",
    });
  });
});

// ==========================================
// FICHA DO DEPENDENTE
// ==========================================
describe("getDependentOverview", () => {
  function mockOverview() {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "jovem1",
      name: "João",
      email: null,
      image: null,
      branch: "ESCOTEIRO",
      troop: { id: "t1", name: "Tropa A" },
      patrol: null,
    });
    prismaMock.financialTransaction.findMany.mockResolvedValue([
      { id: "f1", title: "Mensalidade", amount: 50, type: "INCOME", status: "PENDING", dueDate: new Date(), paidDate: null },
      { id: "f2", title: "Paga", amount: 30, type: "INCOME", status: "PAID", dueDate: new Date(), paidDate: new Date() },
    ]);
    prismaMock.document.findMany.mockResolvedValue([{ id: "d1", title: "Ficha médica" }]);
  }

  it("recusa dependente sem vínculo ANTES de consultar qualquer dado", async () => {
    prismaMock.familyTie.findFirst.mockResolvedValue(null);

    await expect(getDependentOverview(ctx(), "alheio")).rejects.toThrow(/não é responsável/i);

    // A trava tem que vir primeiro: nada do jovem pode ser lido.
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.financialTransaction.findMany).not.toHaveBeenCalled();
    expect(prismaMock.document.findMany).not.toHaveBeenCalled();
  });

  it("busca apenas os dados do dependente informado", async () => {
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    mockOverview();

    await getDependentOverview(ctx(), "jovem1");

    expect(prismaMock.financialTransaction.findMany.mock.calls[0][0].where).toEqual({ userId: "jovem1" });
    expect(prismaMock.document.findMany.mock.calls[0][0].where).toEqual({ ownerId: "jovem1" });
  });

  it("soma como 'em aberto' só o que é PENDING e a receber", async () => {
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    mockOverview();

    const r = await getDependentOverview(ctx(), "jovem1");

    // 50 pendente entra; 30 já pago não.
    expect(r.openAmount).toBe(50);
  });

  it("converte o Decimal do Prisma para number", async () => {
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    mockOverview();

    const r = await getDependentOverview(ctx(), "jovem1");
    expect(typeof r.financials[0].amount).toBe("number");
  });
});

// ==========================================
// LISTA COM MÚLTIPLOS DEPENDENTES
// (o caso normal neste grupo: há responsável com 3 filhos)
// ==========================================
describe("getDependentsSummary", () => {
  it("devolve lista vazia sem dependentes, sem consultar agregados", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    const r = await getDependentsSummary(ctx());

    expect(r).toEqual([]);
    expect(prismaMock.financialTransaction.groupBy).not.toHaveBeenCalled();
  });

  it("agrega em consultas fixas, não uma por dependente", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "j1", name: "Ana", image: null, troop: null, patrol: null },
      { id: "j2", name: "Bia", image: null, troop: null, patrol: null },
      { id: "j3", name: "Caio", image: null, troop: null, patrol: null },
    ]);
    prismaMock.financialTransaction.groupBy.mockResolvedValue([{ userId: "j1", _sum: { amount: 100 } }]);
    prismaMock.document.groupBy.mockResolvedValue([{ ownerId: "j2", _count: { _all: 2 } }]);

    const r = await getDependentsSummary(ctx());

    expect(r).toHaveLength(3);
    // 3 dependentes, mas só 1 groupBy de cada tipo — nada de N+1.
    expect(prismaMock.financialTransaction.groupBy).toHaveBeenCalledTimes(1);
    expect(prismaMock.document.groupBy).toHaveBeenCalledTimes(1);
  });

  it("associa cada total ao dependente certo e zera quem não tem", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "j1", name: "Ana", image: null, troop: null, patrol: null },
      { id: "j2", name: "Bia", image: null, troop: null, patrol: null },
    ]);
    prismaMock.financialTransaction.groupBy.mockResolvedValue([{ userId: "j2", _sum: { amount: 75 } }]);
    prismaMock.document.groupBy.mockResolvedValue([{ ownerId: "j1", _count: { _all: 3 } }]);

    const r = await getDependentsSummary(ctx());

    const ana = r.find((d) => d.id === "j1")!;
    const bia = r.find((d) => d.id === "j2")!;

    expect(ana.openAmount).toBe(0);
    expect(ana.documentCount).toBe(3);
    expect(bia.openAmount).toBe(75);
    expect(bia.documentCount).toBe(0);
  });

  it("busca só os dependentes de quem está logado", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    await getDependentsSummary(ctx());

    expect(prismaMock.user.findMany.mock.calls[0][0].where).toEqual({
      guardianTies: { some: { guardianId: "mae" } },
    });
  });
});
