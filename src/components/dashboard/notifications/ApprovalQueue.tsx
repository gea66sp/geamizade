"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { approveRequestAction, rejectRequestAction } from "@/src/lib/notifications.actions";

export type PendingRequest = {
  id: string;
  title: string;
  message: string;
  status: string;
  audienceType: string;
  createdAt: Date | string;
  sender: { id: string; name: string | null; role: string } | null;
  patrol: { id: string; name: string; troop: { id: string; name: string } | null } | null;
};

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );
}

export default function ApprovalQueue({ initialItems }: { initialItems: PendingRequest[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PendingRequest[]>(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleApprove = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const result = await approveRequestAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (reason.trim().length < 3) {
      setError("Explique o motivo da rejeição para o monitor.");
      return;
    }

    setBusyId(id);
    setError(null);
    try {
      const result = await rejectRequestAction(id, reason);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setRejectingId(null);
      setReason("");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
        <i className="fa-solid fa-clipboard-check text-4xl text-gray-200 mb-3"></i>
        <p className="text-gray-500 font-bold">Nenhuma solicitação aguardando aprovação.</p>
        <p className="text-xs text-gray-400 mt-1">
          Os avisos criados pelos Monitores das suas patrulhas aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-200">
          <i className="fa-solid fa-triangle-exclamation"></i> {error}
        </div>
      )}

      {items.map((item) => (
        <article key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold text-gray-900 leading-tight">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Por <strong>{item.sender?.name || "Monitor"}</strong>
                {item.patrol ? ` · ${item.patrol.name}` : ""}
                {item.patrol?.troop ? ` · ${item.patrol.troop.name}` : ""} · {formatDateTime(item.createdAt)}
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              <i className="fa-solid fa-hourglass-half mr-1"></i> Aguardando
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-xl p-3">
            {item.message}
          </p>

          {rejectingId === item.id ? (
            <div className="mt-4 space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Explique ao monitor por que o aviso não foi aprovado..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none text-sm text-gray-800 resize-none"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleReject(item.id)}
                  disabled={busyId === item.id}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-60"
                >
                  Confirmar rejeição
                </button>
                <button
                  onClick={() => {
                    setRejectingId(null);
                    setReason("");
                    setError(null);
                  }}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleApprove(item.id)}
                disabled={busyId === item.id}
                className="cursor-pointer px-5 py-2.5 rounded-xl bg-scout-green text-white font-bold text-sm hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
              >
                {busyId === item.id ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Processando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i> Aprovar e enviar
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRejectingId(item.id);
                  setError(null);
                }}
                disabled={busyId === item.id}
                className="cursor-pointer px-5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-sm hover:bg-red-100 disabled:opacity-60"
              >
                <i className="fa-solid fa-xmark mr-1.5"></i> Rejeitar
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
