import prisma from "@/src/lib/prisma";
import { CalendarManager } from "./_components/CalendarManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendário de Atividades | GE Amizade",
  description: "Gerenciamento de eventos e atividades do grupo escoteiro.",
};

export default async function CalendarioPage() {
  // Busca as tropas para o select do formulário
  const troops = await prisma.troop.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, branch: true },
  });

  // Busca os próximos eventos (ordenados pela data de início)
  const events = await prisma.event.findMany({
    orderBy: { startDate: "asc" },
    include: {
      troop: { select: { name: true } },
      _count: { select: { attendees: true } }, // Conta quantos confirmaram presença
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Componente Cliente que gerencia o estado (modal, listagem interativa) */}
      <CalendarManager initialEvents={events} troops={troops} />
    </div>
  );
}