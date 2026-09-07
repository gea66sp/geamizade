"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  fetchInboxAction,
  fetchUnreadCountAction,
  markAllReadAction,
  markReadAction,
} from "@/src/lib/notifications.actions";

type InboxItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl: string | null;
  origin: "AUTO" | "MANUAL";
  forDependentId: string | null;
  createdAt: Date | string;
  sender: { id: string; name: string | null } | null;
  forDependent: { id: string; name: string | null } | null;
};

interface NotificationBellProps {
  /** Raiz da área do usuário: /admin, /chefe, /membro ou /responsavel. */
  basePath: string;
  /** Estilo do ícone conforme o fundo onde o sininho é montado. */
  tone?: "dark" | "light";
  onNavigate?: () => void;
}

const POLL_INTERVAL_MS = 60_000;

function formatRelative(value: Date | string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

export default function NotificationBell({ basePath, tone = "dark", onNavigate }: NotificationBellProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    const result = await fetchUnreadCountAction();
    if (result.success) setUnreadCount(result.count);
  }, []);

  // Contador: carrega no mount, refaz a cada minuto e quando a aba volta ao
  // foco (evita badge velho depois de o usuário ficar horas com a aba aberta).
  useEffect(() => {
    refreshCount();

    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshCount();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshCount]);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const loadInbox = async () => {
    setIsLoading(true);
    try {
      const result = await fetchInboxAction({ limit: 8 });
      if (result.success) {
        setItems(result.items as InboxItem[]);
        setUnreadCount(result.unreadCount);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) await loadInbox();
  };

  const handleItemClick = async (item: InboxItem) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const result = await markReadAction(item.id);
      if (result.success) setUnreadCount(result.unreadCount);
    }

    setIsOpen(false);
    onNavigate?.();

    if (item.linkUrl) {
      router.push(item.linkUrl);
    } else {
      router.push(`${basePath}/notificacoes`);
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnreadCount(0);
    await markAllReadAction();
    router.refresh();
  };

  const buttonTone =
    tone === "dark"
      ? "text-gray-300 hover:text-scout-yellow hover:bg-white/10"
      : "text-gray-500 hover:text-scout-green hover:bg-gray-100";

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={toggleOpen}
        aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : "Notificações"}
        aria-expanded={isOpen}
        title="Notificações"
        className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${buttonTone}`}
      >
        <i className="fa-solid fa-bell text-lg"></i>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black border-2 border-scout-dark">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* w-80 fixo estourava a borda esquerda em telas de ~320-360px: o dropdown
          é ancorado pela direita, então crescia para fora da tela. A largura
          agora acompanha a viewport, com teto no desktop. */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 sm:max-w-none max-h-[70vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h3 className="font-heading font-bold text-gray-800 text-sm">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-2 text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  {unreadCount} nova(s)
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="cursor-pointer text-[11px] font-bold text-scout-green hover:text-green-700 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">
                <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fa-regular fa-bell-slash text-3xl text-gray-200 mb-2"></i>
                <p className="text-xs text-gray-500 font-medium">Você não tem notificações.</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors cursor-pointer ${
                    item.isRead ? "bg-white hover:bg-gray-50" : "bg-scout-yellow/10 hover:bg-scout-yellow/20"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        item.isRead ? "bg-transparent" : "bg-red-500"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          item.isRead ? "font-medium text-gray-600" : "font-bold text-gray-900"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.message}</p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {item.forDependentId && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                            Cópia · responsável
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {formatRelative(item.createdAt)}
                          {item.sender?.name ? ` · ${item.sender.name}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <Link
            href={`${basePath}/notificacoes`}
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
            className="shrink-0 text-center text-xs font-bold text-gray-500 hover:text-scout-green py-3 border-t border-gray-100 bg-gray-50 transition-colors"
          >
            Ver todas as notificações <i className="fa-solid fa-arrow-right ml-1"></i>
          </Link>
        </div>
      )}
    </div>
  );
}
