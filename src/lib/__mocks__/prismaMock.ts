import { vi } from "vitest";

// Mock do Prisma compartilhado pelos testes de regra de negócio.
//
// Os testes NÃO tocam o banco de propósito: o projeto tem uma única base
// (Supabase de produção) e uma suíte que a usasse seria perigosa, lenta e
// dependente de dados que mudam. O que precisa ser testado aqui são as REGRAS
// (hierarquia, travas, idempotência), não o Prisma.
export function createPrismaMock() {
  return {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    familyTie: { findMany: vi.fn(), findFirst: vi.fn() },
    financialTransaction: { findMany: vi.fn(), groupBy: vi.fn() },
    document: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), groupBy: vi.fn() },
    troop: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    inventoryItem: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    itemLoan: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    patrol: { findMany: vi.fn(), findUnique: vi.fn() },
    notification: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    notificationRequest: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    event: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn() },
    eventRSVP: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn() },
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
