import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPrismaMock, type PrismaMock } from "./__mocks__/prismaMock";

const prismaMock: PrismaMock = createPrismaMock();
vi.mock("@/src/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/src/lib/auth", () => ({ getAuthUser: vi.fn(), authOptions: {} }));

const { setRsvp, sendRsvpReminders, saveEvent } = await import("./events");

const H = 3600_000;
const future = new Date(Date.now() + 72 * H);

type Ctx = Parameters<typeof setRsvp>[0];
type EventShape = Record<string, unknown>;

function ctx(overrides: Partial<Ctx> = {}): Ctx {
  return {
    user: { id: "me", name: "Eu", role: "MEMBER", branch: null, troopId: "t1", patrolId: null },
    kind: "NONE",
    managedTroopIds: [],
    ledPatrolIds: [],
    ...overrides,
  } as Ctx;
}

const visibleEvent = (extra: EventShape = {}) => ({
  id: "ev1",
  title: "Acampamento",
  startDate: future,
  endDate: future,
  location: null,
  isGlobal: false,
  troopId: "t1",
  patrolId: null,
  rsvpDeadline: null,
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.notification.createMany.mockResolvedValue({ count: 0 });
  prismaMock.user.findMany.mockResolvedValue([]);
  prismaMock.familyTie.findMany.mockResolvedValue([]);
});

// ==========================================
// A REGRA DO RESPONSÁVEL QUE PREVALECE
// ==========================================
describe("setRsvp — hierarquia de confirmação", () => {
  it("jovem registra a própria intenção sem travar nada", async () => {
    prismaMock.event.findFirst.mockResolvedValue(visibleEvent());
    prismaMock.eventRSVP.findUnique.mockResolvedValue(null);

    await setRsvp(ctx(), { eventId: "ev1", attendeeUserId: "me", status: true });

    const call = prismaMock.eventRSVP.upsert.mock.calls[0][0];
    expect(call.create.status).toBe(true);
    expect(call.create.confirmedById).toBe("me");
    expect(call.create.isGuardianDecision).toBe(false);
  });

  it("responsável decide pelo dependente e marca a trava", async () => {
    prismaMock.event.findFirst.mockResolvedValue(visibleEvent());
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    prismaMock.eventRSVP.findUnique.mockResolvedValue({ isGuardianDecision: false, status: true });

    const guardian = ctx({ user: { id: "mae", name: "Mãe", role: "RESPONSAVEL", branch: null, troopId: null, patrolId: null } });
    await setRsvp(guardian, { eventId: "ev1", attendeeUserId: "jovem", status: false });

    const call = prismaMock.eventRSVP.upsert.mock.calls[0][0];
    expect(call.update.status).toBe(false);
    expect(call.update.confirmedById).toBe("mae");
    expect(call.update.isGuardianDecision).toBe(true);
  });

  it("jovem NÃO consegue reverter a decisão do responsável", async () => {
    prismaMock.event.findFirst.mockResolvedValue(visibleEvent());
    prismaMock.eventRSVP.findUnique.mockResolvedValue({ isGuardianDecision: true, status: false });

    await expect(
      setRsvp(ctx(), { eventId: "ev1", attendeeUserId: "me", status: true })
    ).rejects.toThrow(/responsável já decidiu/i);

    expect(prismaMock.eventRSVP.upsert).not.toHaveBeenCalled();
  });

  it("responsável PODE mudar a própria decisão", async () => {
    prismaMock.event.findFirst.mockResolvedValue(visibleEvent());
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    prismaMock.eventRSVP.findUnique.mockResolvedValue({ isGuardianDecision: true, status: false });

    const guardian = ctx({ user: { id: "mae", name: "Mãe", role: "RESPONSAVEL", branch: null, troopId: null, patrolId: null } });
    await setRsvp(guardian, { eventId: "ev1", attendeeUserId: "jovem", status: true });

    expect(prismaMock.eventRSVP.upsert).toHaveBeenCalled();
  });

  it("exige vínculo familiar para responder por outra pessoa", async () => {
    prismaMock.event.findFirst.mockResolvedValue(visibleEvent());
    prismaMock.familyTie.findFirst.mockResolvedValue(null); // sem vínculo

    await expect(
      setRsvp(ctx(), { eventId: "ev1", attendeeUserId: "estranho", status: true })
    ).rejects.toThrow(/seus dependentes/i);

    expect(prismaMock.eventRSVP.upsert).not.toHaveBeenCalled();
  });

  it("recusa depois do prazo", async () => {
    prismaMock.event.findFirst.mockResolvedValue(
      visibleEvent({ rsvpDeadline: new Date(Date.now() - H) })
    );

    await expect(
      setRsvp(ctx(), { eventId: "ev1", attendeeUserId: "me", status: true })
    ).rejects.toThrow(/prazo/i);
  });

  it("recusa evento invisível para o usuário", async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      setRsvp(ctx(), { eventId: "ev1", attendeeUserId: "me", status: true })
    ).rejects.toThrow(/não encontrado|fora do seu acesso/i);
  });

  it("notifica o jovem quando o responsável decide por ele", async () => {
    prismaMock.event.findFirst.mockResolvedValue(visibleEvent());
    prismaMock.familyTie.findFirst.mockResolvedValue({ id: "tie1" });
    prismaMock.eventRSVP.findUnique.mockResolvedValue(null);
    prismaMock.user.findMany.mockResolvedValue([
      { id: "jovem", name: "João", role: "MEMBER", troopId: "t1" },
    ]);

    const guardian = ctx({ user: { id: "mae", name: "Mãe", role: "RESPONSAVEL", branch: null, troopId: null, patrolId: null } });
    await setRsvp(guardian, { eventId: "ev1", attendeeUserId: "jovem", status: false });

    const rows = prismaMock.notification.createMany.mock.calls[0][0].data;
    expect(rows[0].userId).toBe("jovem");
    expect(rows[0].title).toMatch(/não autorizada/i);
    // Sem cópia de volta para o responsável que acabou de decidir.
    expect(rows).toHaveLength(1);
  });

  it("NÃO notifica quando a pessoa responde por si mesma", async () => {
    prismaMock.event.findFirst.mockResolvedValue(visibleEvent());
    prismaMock.eventRSVP.findUnique.mockResolvedValue(null);

    await setRsvp(ctx(), { eventId: "ev1", attendeeUserId: "me", status: true });

    expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
  });
});

// ==========================================
// AUTORIZAÇÃO DE CRIAÇÃO/EDIÇÃO
// ==========================================
describe("saveEvent — quem pode criar o quê", () => {
  const base = {
    title: "Atividade",
    description: "d",
    startDate: future.toISOString(),
    endDate: new Date(future.getTime() + H).toISOString(),
    isGlobal: false,
  };

  it("chefe NÃO cria evento global", async () => {
    const chefe = ctx({ kind: "CHEFE", managedTroopIds: ["t1"] });
    await expect(saveEvent(chefe, { ...base, isGlobal: true })).rejects.toThrow(/Diretoria/i);
  });

  it("chefe NÃO cria evento para tropa que não gerencia", async () => {
    const chefe = ctx({ kind: "CHEFE", managedTroopIds: ["t1"] });
    await expect(saveEvent(chefe, { ...base, troopId: "outra" })).rejects.toThrow(/tropa que gerencia/i);
  });

  it("membro comum não cria nada", async () => {
    await expect(saveEvent(ctx(), { ...base, troopId: "t1" })).rejects.toThrow(/permissão/i);
  });

  it("recusa término anterior ao início", async () => {
    const admin = ctx({ kind: "GLOBAL" });
    await expect(
      saveEvent(admin, { ...base, isGlobal: true, endDate: new Date(future.getTime() - H).toISOString() })
    ).rejects.toThrow(/anterior/i);
  });

  it("recusa prazo de confirmação depois do início", async () => {
    const admin = ctx({ kind: "GLOBAL" });
    await expect(
      saveEvent(admin, {
        ...base,
        isGlobal: true,
        rsvpDeadline: new Date(future.getTime() + 10 * H).toISOString(),
      })
    ).rejects.toThrow(/depois do início/i);
  });
});

// ==========================================
// IDEMPOTÊNCIA DO LEMBRETE (CRON)
// ==========================================
describe("sendRsvpReminders — idempotência", () => {
  it("reivindica o evento antes de notificar (compare-and-set)", async () => {
    prismaMock.event.findMany.mockResolvedValue([visibleEvent()]);
    prismaMock.event.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findMany.mockResolvedValue([{ id: "j1", name: "J", role: "MEMBER", troopId: "t1" }]);
    prismaMock.eventRSVP.findMany.mockResolvedValue([]);

    await sendRsvpReminders();

    // A trava: a condição `rsvpReminderSentAt: null` tem que estar no where.
    const claim = prismaMock.event.updateMany.mock.calls[0][0];
    expect(claim.where).toEqual({ id: "ev1", rsvpReminderSentAt: null });
    expect(claim.data.rsvpReminderSentAt).toBeInstanceOf(Date);
  });

  it("desiste do evento quando outra invocação já o reivindicou", async () => {
    prismaMock.event.findMany.mockResolvedValue([visibleEvent()]);
    prismaMock.event.updateMany.mockResolvedValue({ count: 0 }); // perdeu a corrida

    const r = await sendRsvpReminders();

    expect(r.eventsProcessed).toBe(0);
    expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
  });

  it("lembra só quem ainda não respondeu", async () => {
    prismaMock.event.findMany.mockResolvedValue([visibleEvent()]);
    prismaMock.event.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findMany
      .mockResolvedValueOnce([{ id: "j1" }, { id: "j2" }, { id: "j3" }]) // público
      .mockResolvedValueOnce([{ id: "j2", name: "B", role: "MEMBER", troopId: "t1" }, { id: "j3", name: "C", role: "MEMBER", troopId: "t1" }]);
    prismaMock.eventRSVP.findMany.mockResolvedValue([{ userId: "j1" }]); // j1 já respondeu

    await sendRsvpReminders();

    const notified = prismaMock.user.findMany.mock.calls[1][0].where.id.in;
    expect(notified).toEqual(["j2", "j3"]);
    expect(notified).not.toContain("j1");
  });

  it("carimba mesmo sem ninguém pendente, para não reprocessar amanhã", async () => {
    prismaMock.event.findMany.mockResolvedValue([visibleEvent()]);
    prismaMock.event.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findMany.mockResolvedValue([{ id: "j1" }]);
    prismaMock.eventRSVP.findMany.mockResolvedValue([{ userId: "j1" }]);

    const r = await sendRsvpReminders();

    expect(prismaMock.event.updateMany).toHaveBeenCalled();
    expect(r.eventsProcessed).toBe(1);
    expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
  });

  it("filtra por janela, contemplando evento sem prazo explícito", async () => {
    prismaMock.event.findMany.mockResolvedValue([]);

    await sendRsvpReminders({ windowHours: 48 });

    const where = prismaMock.event.findMany.mock.calls[0][0].where;
    expect(where.rsvpReminderSentAt).toBeNull();
    // Os dois casos: com rsvpDeadline, e sem (aí a janela usa startDate).
    expect(where.OR).toHaveLength(2);
    expect(where.OR[1]).toMatchObject({ rsvpDeadline: null });
  });

  it("um evento com falha não derruba os demais", async () => {
    prismaMock.event.findMany.mockResolvedValue([
      visibleEvent({ id: "ev1" }),
      visibleEvent({ id: "ev2" }),
    ]);
    prismaMock.event.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findMany
      .mockRejectedValueOnce(new Error("falha no evento 1"))
      .mockResolvedValue([{ id: "j1" }]);
    prismaMock.eventRSVP.findMany.mockResolvedValue([]);

    const r = await sendRsvpReminders();

    // Os dois foram reivindicados; o erro do primeiro foi contido.
    expect(r.eventsProcessed).toBe(2);
  });
});
