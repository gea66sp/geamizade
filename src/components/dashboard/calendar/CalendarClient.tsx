"use client";

import { useState } from "react";

import AttendanceList from "./AttendanceList";
import CalendarGrid, { CalendarEvent } from "./CalendarGrid";
import EventDetailModal from "./EventDetailModal";
import EventFormModal, { EventFormValues, TroopWithPatrols } from "./EventFormModal";

// O grid só precisa do necessário para desenhar, mas o formulário de edição
// precisa do evento inteiro — e as páginas já entregam o registro completo do
// Prisma. Tipar a união aqui evita abrir o formulário sem descrição/término.
export type CalendarClientEvent = CalendarEvent & EventFormValues;

// Composição única do calendário, usada pelas 4 áreas. O que muda entre elas é
// apenas o que o servidor autoriza (canCreate/allowGlobal) — as regras de
// verdade continuam nas Server Actions, isto aqui é só a montagem da tela.
interface CalendarClientProps {
  events: CalendarClientEvent[];
  /** Tropas que este usuário pode usar ao criar/editar (vazio = não cria). */
  troops?: TroopWithPatrols[];
  canCreate?: boolean;
  /** Falso para o Chefe: eventos globais são exclusivos da Diretoria. */
  allowGlobal?: boolean;
}

export default function CalendarClient({
  events,
  troops = [],
  canCreate = false,
  allowGlobal = true,
}: CalendarClientProps) {
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [attendanceFor, setAttendanceFor] = useState<CalendarClientEvent | null>(null);
  const [formEvent, setFormEvent] = useState<CalendarClientEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const openDetail = (event: CalendarEvent) => setDetailEventId(event.id);

  const currentEvent = events.find((e) => e.id === detailEventId) ?? null;

  return (
    <>
      <CalendarGrid
        events={events}
        onEventClick={openDetail}
        actionSlot={
          canCreate ? (
            <button
              onClick={() => {
                setFormEvent(null);
                setIsFormOpen(true);
              }}
              className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 bg-scout-green hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 shrink-0"
            >
              <i className="fa-solid fa-calendar-plus"></i>
              Nova Atividade
            </button>
          ) : null
        }
      />

      {detailEventId && (
        <EventDetailModal
          eventId={detailEventId}
          onClose={() => setDetailEventId(null)}
          onEdit={
            canCreate
              ? () => {
                  setFormEvent(events.find((e) => e.id === detailEventId) ?? null);
                  setDetailEventId(null);
                  setIsFormOpen(true);
                }
              : undefined
          }
          onShowAttendance={() => {
            setAttendanceFor(currentEvent);
            setDetailEventId(null);
          }}
        />
      )}

      {attendanceFor && (
        <AttendanceList
          eventId={attendanceFor.id}
          eventTitle={attendanceFor.title}
          onClose={() => setAttendanceFor(null)}
        />
      )}

      {isFormOpen && (
        <EventFormModal
          event={formEvent}
          troops={troops}
          allowGlobal={allowGlobal}
          onClose={() => {
            setIsFormOpen(false);
            setFormEvent(null);
          }}
        />
      )}
    </>
  );
}
