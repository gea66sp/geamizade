"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ORIGIN_META } from "@/src/lib/notificationAccess";
import { deletePanelNotificationAction } from "@/src/lib/notifications.actions";

export type PanelItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | string | null;
  origin: "AUTO" | "MANUAL";
  createdAt: Date | string;
  forDependentId: string | null;
  user: { id: string; name: string | null; role: string };
  sender: { id: string; name: string | null } | null;
  forDependent: { id: string; name: string | null } | null;
  troop: { id: string; name: string } | null;
};

export type TroopFilterOption = { id: string; name: string };

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );
}

export default function NotificationManagerTable({
  initialItems,
  troops,
  scopeLabel,
}: {
  initialItems: PanelItem[];
  troops: TroopFilterOption[];
  scopeLabel: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<PanelItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<"ALL" | "AUTO" | "MANUAL">("ALL");
  const [readFilter, setReadFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");
  const [troopFilter, setTroopFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.title} ${item.message} ${item.user.name ?? ""} ${item.sender?.name ?? ""}`.toLowerCase();
      const matchesSearch = query.length === 0 || haystack.includes(query);
      const matchesOrigin = originFilter === "ALL" || item.origin === originFilter;
      const matchesRead =
        readFilter === "ALL" || (readFilter === "READ" ? item.isRead : !item.isRead);
      const matchesTroop =
        troopFilter === "ALL" ||
        (troopFilter === "NONE" ? !item.troop : item.troop?.id === troopFilter);

      return matchesSearch && matchesOrigin && matchesRead && matchesTroop;
    });
  }, [items, search, originFilter, readFilter, troopFilter]);

  const handleDelete = async (item: PanelItem) => {
    const confirmed = window.confirm(
      `Excluir a notificação "${item.title}" entregue a ${item.user.name || "este usuário"}? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setError(null);
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    const result = await deletePanelNotificationAction(item.id);
    if (!result.success) {
      setItems(previous); // desfaz a remoção otimista
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
        <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Escopo da sua visão</h4>
          <p className="text-xs text-blue-700 mt-1">{scopeLabel}</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-200">
          <i className="fa-solid fa-triangle-exclamation"></i> {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, mensagem ou pessoa..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none text-sm font-medium"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as typeof originFilter)}
            className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-scout-green/20"
          >
            <option value="ALL">Toda origem</option>
            <option value="AUTO">Automáticas</option>
            <option value="MANUAL">Manuais</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as typeof readFilter)}
            className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-scout-green/20"
          >
            <option value="ALL">Lidas e não lidas</option>
            <option value="UNREAD">Só não lidas</option>
            <option value="READ">Só lidas</option>
          </select>

          {troops.length > 0 && (
            <select
              value={troopFilter}
              onChange={(e) => setTroopFilter(e.target.value)}
              className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-scout-green/20"
            >
              <option value="ALL">Todas as tropas</option>
              <option value="NONE">Sem tropa</option>
              {troops.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 font-bold px-1">
        {filtered.length} notificação(ões) encontrada(s).
      </p>

      {/* MOBILE: cartões */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-gray-200">
            <i className="fa-solid fa-inbox text-4xl text-gray-200 mb-3"></i>
            <p className="text-gray-500 font-bold">Nenhuma notificação encontrada.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-800 leading-tight text-sm">{item.title}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    item.isRead
                      ? "bg-gray-100 text-gray-500 border border-gray-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {item.isRead ? "Lida" : "Não lida"}
                </span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-3">{item.message}</p>

              <div className="text-[11px] text-gray-500 space-y-0.5">
                <p>
                  <strong>Para:</strong> {item.user.name || "—"} ({item.user.role})
                </p>
                {item.troop && (
                  <p>
                    <strong>Tropa:</strong> {item.troop.name}
                  </p>
                )}
                <p>{formatDateTime(item.createdAt)}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ORIGIN_META[item.origin].className}`}
                >
                  {ORIGIN_META[item.origin].label}
                </span>
                {item.forDependent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    Cópia · {item.forDependent.name}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDelete(item)}
                className="cursor-pointer w-full mt-2 py-2 rounded-xl text-xs font-bold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
              >
                <i className="fa-solid fa-trash mr-1.5"></i> Excluir
              </button>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP: tabela */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[60rem] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-200">
              <th className="p-4">Notificação</th>
              <th className="p-4 w-52">Destinatário</th>
              <th className="p-4 w-36">Origem</th>
              <th className="p-4 w-28">Status</th>
              <th className="p-4 w-40">Data</th>
              <th className="p-4 text-right w-28">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500 font-bold">
                  Nenhuma notificação encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50/80 ${item.isRead ? "" : "bg-scout-yellow/5"}`}>
                  <td className="p-4 align-top">
                    <p className={`leading-tight ${item.isRead ? "font-semibold text-gray-700" : "font-bold text-gray-900"}`}>
                      {item.title}
                    </p>
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="cursor-pointer text-xs text-gray-500 hover:text-scout-green mt-1 text-left"
                    >
                      {expandedId === item.id ? (
                        <span className="whitespace-pre-wrap block max-w-md">{item.message}</span>
                      ) : (
                        <span className="line-clamp-2 max-w-md">{item.message}</span>
                      )}
                    </button>
                    {item.sender?.name && (
                      <p className="text-[11px] text-gray-400 mt-1">Enviado por {item.sender.name}</p>
                    )}
                  </td>

                  <td className="p-4 align-top">
                    <p className="text-sm font-bold text-gray-800">{item.user.name || "—"}</p>
                    <p className="text-[11px] text-gray-500">{item.user.role}</p>
                    {item.troop && <p className="text-[11px] text-gray-500">{item.troop.name}</p>}
                    {item.forDependent && (
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        Cópia · {item.forDependent.name}
                      </span>
                    )}
                  </td>

                  <td className="p-4 align-top">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${ORIGIN_META[item.origin].className}`}
                    >
                      <i className={`fa-solid ${ORIGIN_META[item.origin].icon} mr-1`}></i>
                      {ORIGIN_META[item.origin].label}
                    </span>
                  </td>

                  <td className="p-4 align-top">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                        item.isRead
                          ? "bg-gray-100 text-gray-500 border border-gray-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {item.isRead ? "Lida" : "Não lida"}
                    </span>
                  </td>

                  <td className="p-4 align-top text-xs text-gray-500 font-medium">
                    {formatDateTime(item.createdAt)}
                  </td>

                  <td className="p-4 align-top text-right">
                    <button
                      onClick={() => handleDelete(item)}
                      title="Excluir notificação"
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
