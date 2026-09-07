import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPrismaMock, type PrismaMock } from "./__mocks__/prismaMock";

// O mock precisa ser instalado ANTES do import do módulo sob teste.
const prismaMock: PrismaMock = createPrismaMock();
vi.mock("@/src/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/src/lib/auth", () => ({ getAuthUser: vi.fn(), authOptions: {} }));

const { dispatchNotifications, resolveAudience } = await import("./notifications");

type Ctx = Parameters<typeof resolveAudience>[0];

// Linha de Notification como o código monta antes do createMany.
type NotificationRow = {
  userId: string;
  title: string;
  troopId: string | null;
  forDependentId: string | null;
};

function createdRows(): NotificationRow[] {
  return prismaMock.notification.createMany.mock.calls[0][0].data;
}

function ctx(overrides: Partial<Ctx> = {}): Ctx {
  return {
    user: { id: "me", name: "Eu", role: "ADMIN", branch: null, troopId: null, patrolId: null },
    kind: "GLOBAL",
    managedTroopIds: [],
    ledPatrolIds: [],
    ...overrides,
  } as Ctx;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.notification.createMany.mockResolvedValue({ count: 0 });
});

// ==========================================
// A REGRA DA CÓPIA AO RESPONSÁVEL
// ==========================================
describe("dispatchNotifications — cópia obrigatória ao responsável", () => {
  it("cria uma cópia por responsável, com título prefixado e forDependentId", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "jovem1", name: "João", role: "MEMBER", troopId: "tropa1" },
    ]);
    prismaMock.familyTie.findMany.mockResolvedValue([
      { guardianId: "mae", dependentId: "jovem1" },
      { guardianId: "pai", dependentId: "jovem1" },
    ]);
    prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

    await dispatchNotifications({
      recipientUserIds: ["jovem1"],
      title: "Novo lançamento",
      message: "corpo",
      origin: "AUTO",
    });

    const rows = createdRows();
    expect(rows).toHaveLength(3); // o jovem + 2 responsáveis

    const jovem = rows.find((r) => r.userId === "jovem1");
    expect(jovem?.title).toBe("Novo lançamento");
    expect(jovem?.forDependentId).toBeNull();

    const copias = rows.filter((r) => r.forDependentId === "jovem1");
    expect(copias).toHaveLength(2);
    for (const c of copias) {
      expect(c.title).toBe("Notificação para João: Novo lançamento");
      // A cópia herda a tropa DO JOVEM — é o que faz o painel do chefe achá-la.
      expect(c.troopId).toBe("tropa1");
    }
  });

  it("NÃO cria cópia para destinatário adulto", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "chefe1", name: "Chefe", role: "CHEFE", troopId: "tropa1" },
    ]);

    await dispatchNotifications({
      recipientUserIds: ["chefe1"],
      title: "Aviso",
      message: "corpo",
      origin: "AUTO",
    });

    expect(prismaMock.familyTie.findMany).not.toHaveBeenCalled();
    expect(prismaMock.notification.createMany.mock.calls[0][0].data).toHaveLength(1);
  });

  it("respeita includeGuardians: false", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "jovem1", name: "João", role: "MEMBER", troopId: "tropa1" },
    ]);

    await dispatchNotifications({
      recipientUserIds: ["jovem1"],
      title: "Aviso",
      message: "corpo",
      origin: "AUTO",
      includeGuardians: false,
    });

    expect(prismaMock.familyTie.findMany).not.toHaveBeenCalled();
    expect(prismaMock.notification.createMany.mock.calls[0][0].data).toHaveLength(1);
  });

  it("deduplica: um responsável de dois jovens com o mesmo aviso recebe as duas cópias distintas", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "j1", name: "Ana", role: "MEMBER", troopId: "t1" },
      { id: "j2", name: "Bia", role: "MEMBER", troopId: "t1" },
    ]);
    prismaMock.familyTie.findMany.mockResolvedValue([
      { guardianId: "mae", dependentId: "j1" },
      { guardianId: "mae", dependentId: "j2" },
    ]);

    await dispatchNotifications({
      recipientUserIds: ["j1", "j2"],
      title: "Reunião",
      message: "corpo",
      origin: "AUTO",
    });

    const rows = createdRows();
    // 2 jovens + 2 cópias: são avisos sobre pessoas diferentes, não duplicata.
    expect(rows).toHaveLength(4);
    expect(rows.filter((r) => r.userId === "mae")).toHaveLength(2);
  });

  it("ignora ids repetidos na entrada", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", name: "X", role: "CHEFE", troopId: null },
    ]);

    await dispatchNotifications({
      recipientUserIds: ["u1", "u1", "u1"],
      title: "Aviso",
      message: "corpo",
      origin: "MANUAL",
    });

    expect(prismaMock.notification.createMany.mock.calls[0][0].data).toHaveLength(1);
  });

  it("NUNCA propaga erro — um gatilho automático não pode derrubar a operação principal", async () => {
    prismaMock.user.findMany.mockRejectedValue(new Error("banco fora do ar"));

    await expect(
      dispatchNotifications({
        recipientUserIds: ["u1"],
        title: "Aviso",
        message: "corpo",
        origin: "AUTO",
      })
    ).resolves.toBe(0);
  });

  it("não faz nada com lista vazia", async () => {
    await expect(
      dispatchNotifications({ recipientUserIds: [], title: "t", message: "m", origin: "AUTO" })
    ).resolves.toBe(0);
    expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
  });
});

// ==========================================
// A TRAVA HIERÁRQUICA DE ENVIO
// ==========================================
describe("resolveAudience — hierarquia de envio", () => {
  it("membro comum não envia para ninguém", async () => {
    await expect(resolveAudience(ctx({ kind: "NONE" }), { audienceType: "ALL" })).rejects.toThrow(
      /não possui permissão/i
    );
  });

  it("Diretoria alcança todos, menos ela mesma", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);

    const ids = await resolveAudience(ctx({ kind: "GLOBAL" }), { audienceType: "ALL" });

    expect(ids).toEqual(["a", "b"]);
    expect(prismaMock.user.findMany.mock.calls[0][0].where).toEqual({ id: { not: "me" } });
  });

  it("chefe NÃO consegue enviar para todo o grupo", async () => {
    const c = ctx({ kind: "CHEFE", managedTroopIds: ["t1"] });
    await expect(resolveAudience(c, { audienceType: "ALL" })).rejects.toThrow(/todo o grupo/i);
  });

  it("chefe alcança só os jovens das tropas que gerencia", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "j1" }]);
    const c = ctx({ kind: "CHEFE", managedTroopIds: ["t1", "t2"] });

    await resolveAudience(c, { audienceType: "TROOP" });

    expect(prismaMock.user.findMany.mock.calls[0][0].where).toEqual({
      troopId: { in: ["t1", "t2"] },
      role: "MEMBER",
    });
  });

  it("chefe NÃO alcança tropa que não gerencia", async () => {
    const c = ctx({ kind: "CHEFE", managedTroopIds: ["t1"] });
    await expect(resolveAudience(c, { audienceType: "TROOP", troopId: "outra" })).rejects.toThrow(
      /não é responsável/i
    );
  });

  it("chefe NÃO consegue selecionar um jovem de fora da sua tropa", async () => {
    // A trava: pediu 2 ids, mas só 1 pertence ao escopo dele.
    prismaMock.user.findMany.mockResolvedValue([{ id: "meu" }]);
    const c = ctx({ kind: "CHEFE", managedTroopIds: ["t1"] });

    await expect(
      resolveAudience(c, { audienceType: "USERS", targetUserIds: ["meu", "de-fora"] })
    ).rejects.toThrow(/própria tropa/i);
  });

  it("monitor alcança apenas a patrulha que lidera", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
    const c = ctx({ kind: "MONITOR", ledPatrolIds: ["patrulha1"] });

    const ids = await resolveAudience(c, { audienceType: "PATROL" });

    expect(ids).toEqual(["p1", "p2"]);
    expect(prismaMock.user.findMany.mock.calls[0][0].where).toEqual({
      patrolId: "patrulha1",
      role: "MEMBER",
    });
  });

  it("monitor NÃO alcança outra patrulha", async () => {
    const c = ctx({ kind: "MONITOR", ledPatrolIds: ["minha"] });
    await expect(resolveAudience(c, { audienceType: "PATROL", patrolId: "alheia" })).rejects.toThrow(
      /patrulha que lidera/i
    );
  });

  it("monitor NÃO consegue enviar para a tropa inteira", async () => {
    const c = ctx({ kind: "MONITOR", ledPatrolIds: ["minha"] });
    await expect(resolveAudience(c, { audienceType: "TROOP" })).rejects.toThrow(/sua patrulha/i);
  });

  it("monitor NÃO consegue selecionar alguém de fora da própria patrulha", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "dentro" }]);
    const c = ctx({ kind: "MONITOR", ledPatrolIds: ["minha"] });

    await expect(
      resolveAudience(c, { audienceType: "USERS", targetUserIds: ["dentro", "fora"] })
    ).rejects.toThrow(/própria patrulha/i);
  });
});
