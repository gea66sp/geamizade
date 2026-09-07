import { describe, expect, it } from "vitest";

import { canEditEvent, canViewAttendance, getRsvpDeadline, isRsvpOpen, toAnswer } from "./eventAccess";

const TROOP_A = "troop-a";
const TROOP_B = "troop-b";

const admin = { kind: "GLOBAL" as const, managedTroopIds: [] };
const chefe = { kind: "CHEFE" as const, managedTroopIds: [TROOP_A] };
const monitor = { kind: "MONITOR" as const, managedTroopIds: [] };
const membro = { kind: "NONE" as const, managedTroopIds: [] };

describe("canEditEvent", () => {
  it("Diretoria edita qualquer evento", () => {
    expect(canEditEvent(admin, { isGlobal: true, troopId: null })).toBe(true);
    expect(canEditEvent(admin, { isGlobal: false, troopId: TROOP_B })).toBe(true);
  });

  it("chefe edita evento da tropa que gerencia", () => {
    expect(canEditEvent(chefe, { isGlobal: false, troopId: TROOP_A })).toBe(true);
  });

  it("chefe NÃO edita evento de outra tropa", () => {
    expect(canEditEvent(chefe, { isGlobal: false, troopId: TROOP_B })).toBe(false);
  });

  it("chefe NÃO edita evento global, mesmo com tropa definida", () => {
    // Evento global é comunicação do grupo inteiro: exclusivo da Diretoria.
    expect(canEditEvent(chefe, { isGlobal: true, troopId: TROOP_A })).toBe(false);
  });

  it("chefe NÃO edita evento sem tropa", () => {
    expect(canEditEvent(chefe, { isGlobal: false, troopId: null })).toBe(false);
  });

  it("monitor e membro comum não editam nada", () => {
    expect(canEditEvent(monitor, { isGlobal: false, troopId: TROOP_A })).toBe(false);
    expect(canEditEvent(membro, { isGlobal: false, troopId: TROOP_A })).toBe(false);
  });
});

describe("canViewAttendance", () => {
  it("chefe vê a presença da própria tropa", () => {
    expect(canViewAttendance(chefe, { isGlobal: false, troopId: TROOP_A })).toBe(true);
  });

  it("chefe vê a presença de evento global", () => {
    // Precisa saber quem da seção dele vai a um evento do grupo — o recorte
    // por tropa é aplicado depois, em getEventAttendance.
    expect(canViewAttendance(chefe, { isGlobal: true, troopId: null })).toBe(true);
  });

  it("chefe NÃO vê a presença de outra tropa", () => {
    expect(canViewAttendance(chefe, { isGlobal: false, troopId: TROOP_B })).toBe(false);
  });

  it("membro comum não vê lista de presença", () => {
    expect(canViewAttendance(membro, { isGlobal: true, troopId: null })).toBe(false);
  });
});

describe("isRsvpOpen / getRsvpDeadline", () => {
  const future = new Date(Date.now() + 86_400_000);
  const past = new Date(Date.now() - 86_400_000);

  it("sem prazo explícito, vale até o início do evento", () => {
    expect(getRsvpDeadline({ startDate: future, rsvpDeadline: null })).toEqual(future);
    expect(isRsvpOpen({ startDate: future, rsvpDeadline: null })).toBe(true);
    expect(isRsvpOpen({ startDate: past, rsvpDeadline: null })).toBe(false);
  });

  it("prazo explícito antecipa o fechamento", () => {
    expect(isRsvpOpen({ startDate: future, rsvpDeadline: past })).toBe(false);
  });

  it("aceita datas em string (como chegam serializadas do servidor)", () => {
    expect(isRsvpOpen({ startDate: future.toISOString(), rsvpDeadline: null })).toBe(true);
  });
});

describe("toAnswer", () => {
  it("mapeia os três estados, com ausência de resposta = PENDING", () => {
    expect(toAnswer(true)).toBe("GOING");
    expect(toAnswer(false)).toBe("NOT_GOING");
    expect(toAnswer(null)).toBe("PENDING");
    expect(toAnswer(undefined)).toBe("PENDING");
  });
});
