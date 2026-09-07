"use client";

import { useEffect, useMemo, useState } from "react";

import { RSVP_META, toAnswer } from "@/src/lib/eventAccess";
import { fetchAttendanceAction } from "@/src/lib/events.actions";

type AttendanceRow = {
  user: {
    id: string;
    name: string | null;
    role: string;
    troop?: { name: string } | null;
    patrol?: { name: string } | null;
  };
  status: boolean | null;
  isGuardianDecision: boolean;
  confirmedBy: { id: string; name: string | null } | null;
  answeredAt: Date | string | null;
};

export default function AttendanceList({
  eventId,
  eventTitle,
  onClose,
}: {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "GOING" | "NOT_GOING" | "PENDING">("ALL");

  useEffect(() => {
    fetchAttendanceAction(eventId).then((res) => {
      if (res.success) setRows(res.rows as unknown as AttendanceRow[]);
      else setError(res.error ?? "Falha ao carregar.");
      setIsLoading(false);
    });
  }, [eventId]);

  const counts = useMemo(
    () => ({
      going: rows.filter((r) => r.status === true).length,
      notGoing: rows.filter((r) => r.status === false).length,
      pending: rows.filter((r) => r.status === null).length,
    }),
    [rows]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q || `${r.user.name ?? ""} ${r.user.troop?.name ?? ""} ${r.user.patrol?.name ?? ""}`.toLowerCase().includes(q);
      const matchesFilter = filter === "ALL" || toAnswer(r.status) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight truncate">
              Lista de Presença
            </h2>
            <p className="text-gray-500 text-sm mt-0.5 truncate">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 pb-3 shrink-0 space-y-4">
          {/* Três colunas cabem no celular, mas só com rótulo curto: dentro do
              modal sobra ~70px por coluna, e "Confirmados" com tracking-widest
              quebrava em duas linhas. O número é o conteúdo principal. */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Vão", value: counts.going, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { label: "Não vão", value: counts.notGoing, cls: "bg-red-50 text-red-700 border-red-200" },
              { label: "Pendentes", value: counts.pending, cls: "bg-gray-50 text-gray-600 border-gray-200" },
            ].map((c) => (
              <div key={c.label} className={`p-2 sm:p-3 rounded-2xl border text-center ${c.cls}`}>
                <p className="text-xl sm:text-2xl font-black leading-none">{c.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide sm:tracking-widest mt-1 leading-tight">
                  {c.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pessoa..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none text-sm"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none"
            >
              <option value="ALL">Todos</option>
              <option value="GOING">Confirmados</option>
              <option value="NOT_GOING">Não vão</option>
              <option value="PENDING">Pendentes</option>
            </select>
          </div>
        </div>

        <div className="overflow-y-auto px-6 pb-6 custom-scrollbar flex-1">
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-200">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
            </div>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center">
              <i className="fa-solid fa-user-group text-4xl text-gray-200 mb-3"></i>
              <p className="text-gray-500 font-bold">Ninguém encontrado com esse filtro.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
              {visible.map((r) => {
                const meta = RSVP_META[toAnswer(r.status)];
                return (
                  <div key={r.user.id} className="p-3 flex items-center justify-between gap-3 bg-white">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">
                        {r.user.name || "Sem nome"}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {r.user.role}
                        {r.user.troop?.name ? ` · ${r.user.troop.name}` : ""}
                        {r.user.patrol?.name ? ` · ${r.user.patrol.name}` : ""}
                      </p>
                      {r.isGuardianDecision && r.confirmedBy && (
                        <p className="text-[10px] text-blue-700 font-bold mt-0.5">
                          <i className="fa-solid fa-user-shield mr-1"></i>
                          Decidido por {r.confirmedBy.name || "responsável"}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${meta.className}`}
                    >
                      <i className={`fa-solid ${meta.icon} mr-1`}></i>
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
