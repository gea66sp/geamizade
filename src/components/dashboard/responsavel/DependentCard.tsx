import Link from "next/link";

import type { DependentSummary } from "@/src/lib/guardian";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Cartão de um dependente. Existe como componente próprio porque a home e a
// lista mostram o mesmo resumo — e neste grupo ter vários filhos é o caso
// normal (há responsável com 3), então a repetição seria certa.
export default function DependentCard({ dependent }: { dependent: DependentSummary }) {
  const hasDebt = dependent.openAmount > 0;

  return (
    <Link
      href={`/responsavel/dependentes/${dependent.id}`}
      className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className="w-14 h-14 rounded-full bg-scout-green/10 text-scout-green flex items-center justify-center font-black text-xl shrink-0 overflow-hidden border border-scout-green/20">
        {dependent.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar vindo de URL externa/blob
          <img src={dependent.image} alt={dependent.name ?? "Dependente"} className="w-full h-full object-cover" />
        ) : (
          (dependent.name?.charAt(0) ?? "?").toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-gray-800 group-hover:text-gray-900 truncate">
          {dependent.name ?? "Sem nome"}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {dependent.troop?.name ?? "Sem tropa"}
          {dependent.patrol?.name ? ` · ${dependent.patrol.name}` : ""}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              hasDebt
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {hasDebt ? `${brl(dependent.openAmount)} em aberto` : "Sem pendência"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
            {dependent.documentCount} documento(s)
          </span>
        </div>
      </div>

      <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-scout-green transition-colors shrink-0"></i>
    </Link>
  );
}
