import type { Metadata } from "next";
import { redirect } from "next/navigation";

import prisma from "@/src/lib/prisma";
import { getVisibleEvents, getViewerContext } from "@/src/lib/events";
import CalendarClient from "@/src/components/dashboard/calendar/CalendarClient";

export const metadata: Metadata = {
  title: "Calendário",
  description: "Atividades da sua seção e confirmações de presença.",
};

export default async function ChefeCalendarioPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const events = await getVisibleEvents(ctx);

  // O chefe só cria atividade para uma tropa que gerencia — e a Server Action
  // revalida isso, esta lista é apenas o que a tela oferece.
  const troops = await prisma.troop.findMany({
    where: { id: { in: ctx.managedTroopIds } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      patrols: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });

  const canCreate = ctx.kind === "CHEFE" || ctx.kind === "GLOBAL";

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-calendar-days"></i>
          </span>
          Calendário da Seção
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Atividades do grupo e da sua tropa. Crie atividades da seção e veja quem confirmou presença.
        </p>
      </div>

      <CalendarClient events={events} troops={troops} canCreate={canCreate} allowGlobal={false} />
    </div>
  );
}
