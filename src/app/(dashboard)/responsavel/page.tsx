import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import DependentCard from "@/src/components/dashboard/responsavel/DependentCard";
import { getDependentsSummary, getViewerContext } from "@/src/lib/guardian";

export const metadata: Metadata = {
  title: "Início",
  description: "Painel do responsável.",
};

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function ResponsavelHomePage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const firstName = ctx.user.name?.split(" ")[0] || "Responsável";
  const dependents = await getDependentsSummary(ctx);
  const totalOpen = dependents.reduce((acc, d) => acc + d.openAmount, 0);

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">Olá, {firstName}!</h1>
        <p className="text-sm text-gray-500 mt-1">
          {dependents.length > 0
            ? `Você acompanha ${dependents.length} dependente(s) no grupo.`
            : "Acompanhe as atividades e os avisos do grupo."}
        </p>
      </div>

      {/* Aviso consolidado: com vários filhos, o total importa mais que o
          detalhe de cada um na primeira olhada. */}
      {totalOpen > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <i className="fa-solid fa-circle-exclamation text-amber-500 mt-0.5"></i>
          <div>
            <p className="font-bold text-amber-900 text-sm">
              {brl(totalOpen)} em aberto no total
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Somando as pendências de todos os seus dependentes. Toque em cada um para ver o detalhe.
            </p>
          </div>
        </div>
      )}

      {dependents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <i className="fa-solid fa-children"></i> Meus dependentes
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dependents.map((d) => (
              <DependentCard key={d.id} dependent={d} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <i className="fa-solid fa-compass"></i> Acesso rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: "/responsavel/calendario",
              icon: "fa-calendar-days",
              cls: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
              title: "Calendário",
              sub: "Autorize a participação nas atividades",
            },
            {
              href: "/responsavel/notificacoes",
              icon: "fa-bell",
              cls: "bg-amber-50 text-amber-600 group-hover:bg-amber-600",
              title: "Notificações",
              sub: "Avisos sobre você e seus dependentes",
            },
            {
              href: "/responsavel/perfil",
              icon: "fa-user",
              cls: "bg-gray-100 text-gray-500 group-hover:bg-gray-700",
              title: "Meu Perfil",
              sub: "Seus dados e documentos",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors group-hover:text-white shrink-0 ${item.cls}`}
              >
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-gray-700 group-hover:text-gray-900 block">{item.title}</span>
                <span className="text-xs text-gray-500">{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
