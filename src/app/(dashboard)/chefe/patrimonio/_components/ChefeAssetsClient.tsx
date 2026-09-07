"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import CheckoutModal from "@/src/app/(dashboard)/admin/patrimonio/_components/CheckoutModal";
import { returnItem } from "@/src/app/(dashboard)/admin/patrimonio/actions";
import type { InventoryRow, UserOption } from "@/src/types/dashboard";

const CONDITION_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "Novo", className: "bg-blue-50 text-blue-600 border-blue-100" },
  GOOD: { label: "Bom", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  FAIR: { label: "Regular", className: "bg-amber-50 text-amber-600 border-amber-100" },
  DAMAGED: { label: "Danificado", className: "bg-red-50 text-red-600 border-red-100" },
};

export default function ChefeAssetsClient({
  items,
  users,
}: {
  items: InventoryRow[];
  users: UserOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [onlyLent, setOnlyLent] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<InventoryRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matches = !q || `${i.name} ${i.chargeNumber}`.toLowerCase().includes(q);
      const lent = i.loans.length > 0;
      return matches && (!onlyLent || lent);
    });
  }, [items, search, onlyLent]);

  const handleReturn = async (item: InventoryRow) => {
    if (!window.confirm(`Registrar a devolução de "${item.name}"?`)) return;
    setBusyId(item.id);
    setError(null);
    const res = await returnItem(item.id);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-200">
          <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar material ou nº de carga..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none text-sm"
        />
        <button
          onClick={() => setOnlyLent(!onlyLent)}
          className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
            onlyLent
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          <i className="fa-regular fa-clock mr-1.5"></i>
          Só emprestados
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <i className="fa-solid fa-boxes-stacked text-4xl text-gray-200 mb-3"></i>
          <p className="text-gray-500 font-bold">Nenhum material alocado à sua seção.</p>
          <p className="text-xs text-gray-400 mt-1">
            O cadastro de material é feito pelo Almoxarifado do grupo.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {visible.map((item) => {
            const loan = item.loans[0];
            const cond = CONDITION_META[item.condition] ?? CONDITION_META.GOOD;

            return (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{item.chargeNumber}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        item.patrol
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-scout-green/10 text-scout-green border-scout-green/20"
                      }`}
                    >
                      <i className={`fa-solid ${item.patrol ? "fa-paw" : "fa-tent"} mr-1`}></i>
                      {item.patrol?.name ?? item.troop?.name ?? "Seção"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${cond.className}`}>
                      {cond.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      {item.quantity} un.
                    </span>
                  </div>

                  {loan && (
                    <p className="text-[11px] text-amber-700 font-bold mt-1.5">
                      <i className="fa-regular fa-clock mr-1"></i>
                      Com {loan.user?.name ?? "alguém"}
                      {loan.expectedReturn
                        ? ` · devolver até ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(loan.expectedReturn))}`
                        : ""}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {loan ? (
                    <button
                      onClick={() => handleReturn(item)}
                      disabled={busyId === item.id}
                      className="cursor-pointer px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <i className="fa-solid fa-rotate-left mr-1.5"></i>
                      Registrar devolução
                    </button>
                  ) : (
                    <button
                      onClick={() => setCheckoutItem(item)}
                      disabled={!item.isActive}
                      className="cursor-pointer px-4 py-2 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={item.isActive ? "Emprestar" : "Material baixado"}
                    >
                      <i className="fa-solid fa-hand-holding mr-1.5"></i>
                      Emprestar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Só os membros da seção aparecem na lista — e o servidor revalida. */}
      <CheckoutModal
        isOpen={!!checkoutItem}
        onClose={() => setCheckoutItem(null)}
        item={checkoutItem}
        users={users}
      />
    </>
  );
}
