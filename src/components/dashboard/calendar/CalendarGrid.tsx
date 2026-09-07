"use client";

import { useMemo, useState } from "react";

// Grid mensal + agenda mobile, puramente apresentacional. Extraído do
// CalendarManager do admin, que era o único lugar com essa lógica e a mantinha
// acoplada ao modal de edição. Aqui o componente não sabe se quem clica pode
// editar — quem monta decide o que fazer no onEventClick.

export type CalendarEvent = {
  id: string;
  title: string;
  startDate: Date | string;
  location?: string | null;
  isGlobal: boolean;
  troop?: { name: string } | null;
  patrol?: { name: string } | null;
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEK_DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEK_DAYS_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function scopeStyles(event: CalendarEvent) {
  if (event.isGlobal) {
    return {
      chip: "bg-purple-100 text-purple-700",
      card: "bg-purple-50 border-purple-500 hover:bg-purple-100",
      cardSoft: "bg-purple-50/50 border-purple-500 hover:bg-purple-50",
      title: "text-purple-900",
      meta: "text-purple-600",
    };
  }
  return {
    chip: "bg-emerald-100 text-emerald-700",
    card: "bg-emerald-50 border-emerald-500 hover:bg-emerald-100",
    cardSoft: "bg-emerald-50/50 border-emerald-500 hover:bg-emerald-50",
    title: "text-emerald-900",
    meta: "text-emerald-600",
  };
}

function scopeLabel(event: CalendarEvent) {
  if (event.isGlobal) return "Grupo";
  return event.patrol?.name || event.troop?.name || "Seção";
}

function timeOf(value: Date | string) {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface CalendarGridProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  /** Botão de ação no topo (ex: "Nova Atividade"), quando quem vê pode criar. */
  actionSlot?: React.ReactNode;
}

export default function CalendarGrid({ events, onEventClick, actionSlot }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const eventsByDay = useMemo(() => {
    const grouped: Record<number, CalendarEvent[]> = {};
    events.forEach((event) => {
      const d = new Date(event.startDate);
      if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
        const day = d.getDate();
        (grouped[day] ||= []).push(event);
      }
    });
    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    );
    return grouped;
  }, [events, currentDate]);

  const getDayOfWeek = (day: number) =>
    new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();

  return (
    <div className="space-y-6">
      {/* CONTROLES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <button
            onClick={goToToday}
            className="cursor-pointer px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition-colors border border-gray-200 text-sm"
          >
            Hoje
          </button>

          <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-100 p-1">
            <button
              onClick={prevMonth}
              aria-label="Mês anterior"
              className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg hover:shadow-sm text-gray-500 transition-all"
            >
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
            <h2 className="text-sm md:text-base font-bold text-gray-800 w-28 md:w-36 text-center capitalize select-none">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              aria-label="Próximo mês"
              className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg hover:shadow-sm text-gray-500 transition-all"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
          </div>
        </div>

        {actionSlot}
      </div>

      {/* MOBILE: AGENDA */}
      <div className="md:hidden space-y-4">
        {Object.keys(eventsByDay).length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center text-3xl mb-3">
              <i className="fa-regular fa-calendar-xmark"></i>
            </div>
            <p className="text-gray-500 font-medium">Nenhuma atividade neste mês.</p>
          </div>
        ) : (
          Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = eventsByDay[day];
            const isToday = isCurrentMonth && today.getDate() === day;
            if (!dayEvents && !isToday) return null;

            return (
              <div
                key={`mob-${day}`}
                className={`bg-white rounded-2xl border ${
                  isToday ? "border-scout-green shadow-md" : "border-gray-200 shadow-sm"
                } overflow-hidden`}
              >
                <div
                  className={`px-4 py-3 flex items-center gap-3 border-b ${
                    isToday ? "bg-scout-green/10 border-scout-green/20" : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                      isToday
                        ? "bg-scout-green text-white shadow-sm"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {day}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${
                        isToday ? "text-scout-green" : "text-gray-400"
                      }`}
                    >
                      {WEEK_DAYS_FULL[getDayOfWeek(day)]}
                    </p>
                    {isToday && (
                      <p className="text-[10px] font-bold text-scout-green/70 uppercase">Hoje</p>
                    )}
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {!dayEvents || dayEvents.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                      Sem atividades hoje
                    </p>
                  ) : (
                    dayEvents.map((event) => {
                      const s = scopeStyles(event);
                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`w-full text-left cursor-pointer p-3 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all ${s.cardSoft}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`font-bold text-sm leading-tight ${s.title}`}>
                              {event.title}
                            </h4>
                            <span
                              className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md ${s.chip}`}
                            >
                              {timeOf(event.startDate)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            {event.location && (
                              <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                                <i className="fa-solid fa-location-dot"></i> {event.location}
                              </p>
                            )}
                            <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                              <i className="fa-solid fa-tent"></i> {scopeLabel(event)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP: GRID MENSAL */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
          {WEEK_DAYS_SHORT.map((day) => (
            <div
              key={day}
              className="py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="min-h-35 bg-gray-50/50 border-b border-r border-gray-100 p-2"
            ></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const isToday = isCurrentMonth && today.getDate() === day;
            const dayEvents = eventsByDay[day] || [];

            return (
              <div
                key={day}
                className={`min-h-35 p-2 xl:p-3 border-b border-r border-gray-100 transition-colors hover:bg-gray-50 relative group ${
                  isToday ? "bg-scout-green/5" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                      isToday
                        ? "bg-scout-green text-white shadow-sm"
                        : "text-gray-500 group-hover:text-scout-green group-hover:bg-scout-green/10"
                    }`}
                  >
                    {day}
                  </span>
                </div>

                <div className="space-y-1.5 custom-scrollbar max-h-25 overflow-y-auto pr-1">
                  {dayEvents.map((event) => {
                    const s = scopeStyles(event);
                    return (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`w-full text-left cursor-pointer px-2.5 py-1.5 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${s.card}`}
                        title={`${event.title}${event.location ? `\nLocal: ${event.location}` : ""}`}
                      >
                        <div className={`font-bold text-xs truncate ${s.title}`}>{event.title}</div>
                        <div className={`flex items-center justify-between mt-1 ${s.meta}`}>
                          <span className="text-[10px] font-semibold">{timeOf(event.startDate)}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-15">
                            {scopeLabel(event)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
