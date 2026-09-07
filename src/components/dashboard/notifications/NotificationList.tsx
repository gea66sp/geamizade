"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ORIGIN_META } from "@/src/lib/notificationAccess";
import { markAllReadAction, markReadAction } from "@/src/lib/notifications.actions";

export type InboxItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | string | null;
  linkUrl: string | null;
  origin: "AUTO" | "MANUAL";
  forDependentId: string | null;
  createdAt: Date | string;
  sender: { id: string; name: string | null } | null;
  forDependent: { id: string; name: string | null } | null;
};

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );
}

export default function NotificationList({ initialItems }: { initialItems: InboxItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>(initialItems);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");

  const unreadCount = useMemo(() => items.filter((i) => !i.isRead).length, [items]);

  const visibleItems = useMemo(() => {
    if (filter === "UNREAD") return items.filter((i) => !i.isRead);
    if (filter === "READ") return items.filter((i) => i.isRead);
    return items;
  }, [items, filter]);

  const handleMarkRead = async (item: InboxItem) => {
    if (item.isRead) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
    await markReadAction(item.id);
    router.refresh();
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    await markAllReadAction();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "ALL", label: `Todas (${items.length})` },
              { key: "UNREAD", label: `Não lidas (${unreadCount})` },
              { key: "READ", label: "Lidas" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                filter === tab.key
                  ? "bg-scout-green text-white border-scout-green"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="cursor-pointer text-sm font-bold text-scout-green hover:text-green-700 transition-colors"
          >
            <i className="fa-solid fa-check-double mr-1.5"></i>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <i className="fa-regular fa-bell-slash text-4xl text-gray-200 mb-3"></i>
          <p className="text-gray-500 font-bold">Nenhuma notificação por aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const originMeta = ORIGIN_META[item.origin];
            return (
              <article
                key={item.id}
                onClick={() => handleMarkRead(item)}
                className={`p-4 md:p-5 rounded-2xl border shadow-sm transition-all ${
                  item.isRead
                    ? "bg-white border-gray-200"
                    : "bg-scout-yellow/10 border-scout-yellow/40 cursor-pointer hover:bg-scout-yellow/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${
                      item.isRead ? "bg-gray-200" : "bg-red-500"
                    }`}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3
                        className={`font-heading text-base md:text-lg leading-tight ${
                          item.isRead ? "font-semibold text-gray-700" : "font-bold text-gray-900"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-semibold shrink-0">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${originMeta.className}`}
                      >
                        <i className={`fa-solid ${originMeta.icon} mr-1`}></i>
                        {originMeta.label}
                      </span>

                      {item.forDependent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          <i className="fa-solid fa-user-shield mr-1"></i>
                          Cópia sobre {item.forDependent.name || "seu dependente"}
                        </span>
                      )}

                      {item.sender?.name && (
                        <span className="text-[11px] text-gray-500 font-medium">
                          Enviado por {item.sender.name}
                        </span>
                      )}

                      {!item.isRead && (
                        <span className="text-[11px] text-scout-green font-bold ml-auto">
                          Clique para marcar como lida
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
