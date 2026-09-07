import type { Metadata } from "next";
import { redirect } from "next/navigation";

import prisma from "@/src/lib/prisma";
import { getVisibleEvents, getViewerContext } from "@/src/lib/events";
import CalendarClient from "@/src/components/dashboard/calendar/CalendarClient";

export const metadata: Metadata = {
  title: "Calendário de Atividades | GE Amizade",
  description: "Gerenciamento de eventos, atividades e presenças do grupo escoteiro.",
};

export default async function CalendarioPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const [events, troops] = await Promise.all([
    getVisibleEvents(ctx),
    prisma.troop.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        patrols: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      },
    }),
  ]);

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-calendar-days"></i>
          </span>
          Calendário de Atividades
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Crie atividades, acompanhe as confirmações de presença e avise o grupo.
        </p>
      </div>

      <CalendarClient events={events} troops={troops} canCreate allowGlobal />
    </div>
  );
}
