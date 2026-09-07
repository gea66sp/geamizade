import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getVisibleEvents, getViewerContext } from "@/src/lib/events";
import CalendarClient from "@/src/components/dashboard/calendar/CalendarClient";

export const metadata: Metadata = {
  title: "Calendário",
  description: "Atividades do grupo, da sua tropa e da sua patrulha.",
};

export default async function MembroCalendarioPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const events = await getVisibleEvents(ctx);

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-calendar-days"></i>
          </span>
          Calendário
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Clique numa atividade para ver os detalhes e confirmar sua presença.
        </p>
      </div>

      <CalendarClient events={events} />
    </div>
  );
}
