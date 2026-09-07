"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AudienceType, NotifierKind, requiresApproval } from "@/src/lib/notificationAccess";
import { submitNotificationAction } from "@/src/lib/notifications.actions";

export type RecipientOption = {
  id: string;
  name: string | null;
  role: string;
  troopName?: string | null;
  patrolName?: string | null;
};

export type TroopOption = { id: string; name: string };

interface ComposeNotificationProps {
  kind: NotifierKind;
  /** Universo de destinatários que este remetente pode escolher individualmente. */
  recipients: RecipientOption[];
  troops?: TroopOption[];
  onSent?: () => void;
}

type Feedback = { type: "success" | "error"; message: string } | null;

export default function ComposeNotification({
  kind,
  recipients,
  troops = [],
  onSent,
}: ComposeNotificationProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>(
    kind === "GLOBAL" ? "ALL" : kind === "CHEFE" ? "TROOP" : "PATROL"
  );
  const [troopId, setTroopId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [includeGuardians, setIncludeGuardians] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const needsApproval = requiresApproval(kind);

  // Opções de público conforme a posição do remetente na hierarquia.
  const audienceOptions = useMemo(() => {
    if (kind === "GLOBAL") {
      return [
        { value: "ALL" as const, label: "Todos os usuários do sistema", icon: "fa-globe" },
        { value: "TROOP" as const, label: "Uma tropa inteira", icon: "fa-tent" },
        { value: "USERS" as const, label: "Membros específicos", icon: "fa-user-check" },
      ];
    }
    if (kind === "CHEFE") {
      return [
        { value: "TROOP" as const, label: "Todos os jovens da minha tropa", icon: "fa-tent" },
        { value: "USERS" as const, label: "Jovens específicos da minha tropa", icon: "fa-user-check" },
      ];
    }
    return [
      { value: "PATROL" as const, label: "Toda a minha patrulha", icon: "fa-users" },
      { value: "USERS" as const, label: "Membros específicos da patrulha", icon: "fa-user-check" },
    ];
  }, [kind]);

  const filteredRecipients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipients;
    return recipients.filter((r) =>
      `${r.name ?? ""} ${r.troopName ?? ""} ${r.patrolName ?? ""}`.toLowerCase().includes(query)
    );
  }, [recipients, search]);

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setSelectedIds([]);
    setSearch("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setIsSending(true);

    try {
      const result = await submitNotificationAction({
        title,
        message,
        audienceType,
        targetUserIds: audienceType === "USERS" ? selectedIds : undefined,
        troopId: audienceType === "TROOP" && troopId ? troopId : null,
        includeGuardians,
      });

      if (!result.success) {
        setFeedback({ type: "error", message: result.error });
        return;
      }

      setFeedback({
        type: "success",
        message:
          result.status === "PENDING_APPROVAL"
            ? "Notificação enviada para aprovação do seu chefe. Você será avisado quando ela for revisada."
            : `Notificação entregue para ${result.recipientCount} destinatário(s), incluindo as cópias para responsáveis.`,
      });

      resetForm();
      onSent?.();
      router.refresh();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {needsApproval && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
          <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Este aviso passa por aprovação</h4>
            <p className="text-xs text-blue-700 mt-1">
              Como Monitor(a), sua notificação é enviada ao chefe responsável pela seção. Ela só chega
              à patrulha depois que ele aprovar.
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <i
            className={`fa-solid ${
              feedback.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"
            } mt-0.5`}
          ></i>
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Ex: Reunião extraordinária no sábado"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">
            Mensagem <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Escreva o corpo do aviso..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm text-gray-800 resize-none custom-scrollbar"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 space-y-5">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <i className="fa-solid fa-bullseye text-scout-green"></i> Para quem enviar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {audienceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAudienceType(option.value)}
              className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                audienceType === option.value
                  ? "bg-scout-green/10 border-scout-green text-scout-green"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <i className={`fa-solid ${option.icon} text-lg mb-2 block`}></i>
              <span className="text-sm font-bold leading-tight block">{option.label}</span>
            </button>
          ))}
        </div>

        {audienceType === "TROOP" && kind === "GLOBAL" && (
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Selecione a tropa</label>
            <select
              value={troopId}
              onChange={(e) => setTroopId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none text-sm font-bold text-gray-800 cursor-pointer"
            >
              <option value="">Escolha uma tropa...</option>
              {troops.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {audienceType === "USERS" && (
          <div className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pessoa..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none text-sm"
            />

            <div className="max-h-72 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl divide-y divide-gray-100">
              {filteredRecipients.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500 font-medium">
                  Nenhuma pessoa disponível.
                </p>
              ) : (
                filteredRecipients.map((person) => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(person.id)}
                      onChange={() => toggleRecipient(person.id)}
                      className="w-4 h-4 rounded border-gray-300 text-scout-green focus:ring-scout-green cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {person.name || "Sem nome"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {person.role}
                        {person.troopName ? ` · ${person.troopName}` : ""}
                        {person.patrolName ? ` · ${person.patrolName}` : ""}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <p className="text-xs text-gray-500 font-medium">
              {selectedIds.length} pessoa(s) selecionada(s).
            </p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer border-t border-gray-100 pt-4">
          <input
            type="checkbox"
            checked={includeGuardians}
            onChange={(e) => setIncludeGuardians(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-scout-green focus:ring-scout-green cursor-pointer"
          />
          <div>
            <p className="text-sm font-bold text-gray-700">Enviar cópia aos responsáveis legais</p>
            <p className="text-xs text-gray-500">
              Recomendado. Todo aviso enviado a um jovem também chega ao responsável, identificado
              como cópia.
            </p>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSending}
        className="cursor-pointer w-full sm:w-auto px-8 py-3.5 bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
      >
        {isSending ? (
          <>
            <i className="fa-solid fa-circle-notch fa-spin"></i> Enviando...
          </>
        ) : (
          <>
            <i className="fa-solid fa-paper-plane"></i>
            {needsApproval ? "Enviar para aprovação" : "Enviar notificação"}
          </>
        )}
      </button>
    </form>
  );
}
