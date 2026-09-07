"use client";

import { useState } from "react";

import ModalEditarTransacao from "@/src/app/(dashboard)/admin/financeiro/_components/ModalEditarTransacao";
import ModalNovaTransacao from "@/src/app/(dashboard)/admin/financeiro/_components/ModalNovaTransacao";
import type { TransactionRow, TroopOption, UserOption } from "@/src/types/dashboard";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const shortDate = (d: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));

const STATUS_META = {
  PENDING: { label: "Pendente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Pago", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelado", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function ChefeFinanceClient({
  transactions,
  troops,
  users,
}: {
  transactions: TransactionRow[];
  troops: TroopOption[];
  users: UserOption[];
}) {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRow | null>(null);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <p className="text-xs text-gray-500 font-medium">
          {transactions.length} lançamento(s) na sua seção
        </p>
        <button
          onClick={() => setIsNewOpen(true)}
          className="cursor-pointer w-full sm:w-auto bg-scout-green hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          Novo Lançamento
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <i className="fa-solid fa-receipt text-4xl text-gray-200 mb-3"></i>
          <p className="text-gray-500 font-bold">Nenhuma movimentação registrada na sua seção.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {transactions.map((t) => {
            const meta = STATUS_META[t.status];
            return (
              <button
                key={t.id}
                onClick={() => setEditing(t)}
                className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{t.title}</p>
                  <p className="text-[11px] text-gray-500">
                    Vencimento {shortDate(t.dueDate)}
                    {t.user?.name ? ` · ${t.user.name}` : ""}
                  </p>
                  <span
                    className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded font-bold ${
                      t.patrol
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-scout-green/10 text-scout-green border border-scout-green/20"
                    }`}
                  >
                    <i className={`fa-solid ${t.patrol ? "fa-paw" : "fa-tent"} mr-1`}></i>
                    {t.patrol?.name ?? t.troop?.name ?? "Seção"}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-black ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "INCOME" ? "+" : "-"}
                    {brl(t.amount)}
                  </p>
                  <span
                    className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Os modais são os mesmos do admin. Recebem apenas as tropas geridas, e
          o caixa geral fica indisponível — o servidor revalida de qualquer forma. */}
      <ModalNovaTransacao
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        users={users}
        troops={troops}
        allowGlobalScope={false}
      />

      <ModalEditarTransacao
        transaction={editing}
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        users={users}
        troops={troops}
      />
    </>
  );
}
