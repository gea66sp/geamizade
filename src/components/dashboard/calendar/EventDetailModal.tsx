"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { RSVP_META, toAnswer } from "@/src/lib/eventAccess";
import { fetchRsvpContextAction, setRsvpAction } from "@/src/lib/events.actions";

type Subject = {
  userId: string;
  name: string | null;
  status: boolean | null;
  lockedByGuardian: boolean;
};

type RsvpContext = {
  event: {
    id: string;
    title: string;
    description: string;
    startDate: Date | string;
    endDate: Date | string;
    location: string | null;
    isGlobal: boolean;
    rsvpDeadline: Date | string | null;
    troop?: { name: string } | null;
    patrol?: { name: string } | null;
  };
  isOpen: boolean;
  canEdit: boolean;
  canViewAttendance: boolean;
  self: Subject | null;
  dependents: Subject[];
};

function formatRange(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(s);
  const t = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay
    ? `${date}, das ${t(s)} às ${t(e)}`
    : `${date} ${t(s)} até ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(e)} ${t(e)}`;
}

export default function EventDetailModal({
  eventId,
  onClose,
  onEdit,
  onShowAttendance,
}: {
  eventId: string;
  onClose: () => void;
  onEdit?: () => void;
  onShowAttendance?: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<RsvpContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyFor, setBusyFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchRsvpContextAction(eventId);
    if (res.success) setData(res.data as unknown as RsvpContext);
    else setError(res.error);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const answer = async (subject: Subject, status: boolean) => {
    setBusyFor(subject.userId);
    setError(null);
    const res = await setRsvpAction({ eventId, attendeeUserId: subject.userId, status });
    if (!res.success) {
      setError(res.error);
      setBusyFor(null);
      return;
    }
    await load();
    setBusyFor(null);
    router.refresh();
  };

  const renderSubject = (subject: Subject, isSelf: boolean) => {
    const meta = RSVP_META[toAnswer(subject.status)];
    // O jovem fica travado quando o responsável já decidiu — a decisão dele
    // prevalece, e a UI precisa explicar isso em vez de só desabilitar.
    const locked = isSelf && subject.lockedByGuardian;
    const disabled = !data?.isOpen || locked || busyFor === subject.userId;

    return (
      <div
        key={subject.userId}
        className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-sm">
              {isSelf ? "Você" : subject.name || "Dependente"}
            </p>
            {!isSelf && <p className="text-[11px] text-gray-500">Seu dependente</p>}
          </div>
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${meta.className}`}
          >
            <i className={`fa-solid ${meta.icon} mr-1`}></i>
            {meta.label}
          </span>
        </div>

        {locked && (
          <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 font-medium">
            <i className="fa-solid fa-user-shield mr-1.5"></i>
            Seu responsável já decidiu sobre esta atividade. Fale com ele para alterar.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => answer(subject, true)}
            disabled={disabled}
            className={`cursor-pointer py-2.5 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              subject.status === true
                ? "bg-scout-green text-white border-scout-green"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <i className="fa-solid fa-check mr-1.5"></i>
            {isSelf ? "Vou participar" : "Autorizar"}
          </button>
          <button
            onClick={() => answer(subject, false)}
            disabled={disabled}
            className={`cursor-pointer py-2.5 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              subject.status === false
                ? "bg-red-600 text-white border-red-600"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
          >
            <i className="fa-solid fa-xmark mr-1.5"></i>
            {isSelf ? "Não vou" : "Não autorizar"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-calendar-day text-xl"></i>
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight truncate">
                {isLoading ? "Carregando..." : data?.event.title}
              </h2>
              {data && (
                <p className="text-gray-500 text-xs md:text-sm mt-0.5">
                  {data.event.isGlobal
                    ? "Atividade de todo o Grupo"
                    : data.event.patrol?.name || data.event.troop?.name || "Atividade da seção"}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar flex-1 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-200">
              <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
            </div>
          ) : data ? (
            <>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 font-semibold flex items-start gap-2">
                  <i className="fa-regular fa-clock text-gray-400 mt-0.5"></i>
                  {formatRange(data.event.startDate, data.event.endDate)}
                </p>
                {data.event.location && (
                  <p className="text-gray-700 font-semibold flex items-start gap-2">
                    <i className="fa-solid fa-location-dot text-gray-400 mt-0.5"></i>
                    {data.event.location}
                  </p>
                )}
                <p
                  className={`font-semibold flex items-start gap-2 ${
                    data.isOpen ? "text-gray-700" : "text-red-700"
                  }`}
                >
                  <i className="fa-solid fa-hourglass-half text-gray-400 mt-0.5"></i>
                  {data.isOpen
                    ? `Confirme até ${new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(data.event.rsvpDeadline ?? data.event.startDate))}`
                    : "O prazo de confirmação encerrou."}
                </p>
              </div>

              {data.event.description && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {data.event.description}
                  </p>
                </div>
              )}

              {(data.self || data.dependents.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                    <i className="fa-solid fa-hand text-scout-green"></i> Confirmação de presença
                  </h3>

                  {data.self && renderSubject(data.self, true)}
                  {data.dependents.map((d) => renderSubject(d, false))}
                </div>
              )}

              {!data.self && data.dependents.length === 0 && (
                <p className="text-sm text-gray-500 font-medium text-center py-4">
                  Esta atividade não requer confirmação sua.
                </p>
              )}
            </>
          ) : null}
        </div>

        {data && (data.canEdit || data.canViewAttendance) && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2 justify-end shrink-0">
            {data.canViewAttendance && onShowAttendance && (
              <button
                onClick={onShowAttendance}
                className="cursor-pointer px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100"
              >
                <i className="fa-solid fa-list-check mr-1.5"></i> Lista de presença
              </button>
            )}
            {data.canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="cursor-pointer px-5 py-2.5 rounded-xl bg-scout-green text-white font-bold text-sm hover:bg-green-700"
              >
                <i className="fa-solid fa-pen mr-1.5"></i> Editar atividade
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
