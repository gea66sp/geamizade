import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import DependentTabs from "@/src/components/dashboard/responsavel/DependentTabs";
import { getDependentOverview, getMyDependents, getViewerContext } from "@/src/lib/guardian";

export const metadata: Metadata = {
  title: "Dependente",
  description: "Financeiro e documentos do seu dependente.",
};

export default async function DependentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  // getDependentOverview lança se não houver FamilyTie — nunca confie no id da
  // URL. Redirecionamos em vez de vazar a existência do membro.
  let data;
  try {
    data = await getDependentOverview(ctx, id);
  } catch {
    redirect("/responsavel/dependentes");
  }

  // Seletor para trocar de filho sem voltar: aqui há responsável com 3.
  const siblings = await getMyDependents(ctx);

  const { dependent, financials, documents, openAmount } = data;
  const name = dependent.name ?? "Dependente";

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-4">
        <Link
          href="/responsavel/dependentes"
          className="text-sm font-bold text-gray-400 hover:text-scout-green transition-colors flex items-center gap-2 w-fit"
        >
          <i className="fa-solid fa-arrow-left"></i> Meus dependentes
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-scout-green/10 text-scout-green flex items-center justify-center font-black text-xl shrink-0 border border-scout-green/20">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {dependent.troop?.name ?? "Sem tropa"}
              {dependent.patrol?.name ? ` · ${dependent.patrol.name}` : ""}
            </p>
          </div>
        </div>

        {siblings.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/responsavel/dependentes/${s.id}`}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  s.id === id
                    ? "bg-scout-green text-white border-scout-green"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {s.name?.split(" ")[0] ?? "Dependente"}
              </Link>
            ))}
          </div>
        )}
      </div>

      <DependentTabs
        dependentId={dependent.id}
        dependentName={name.split(" ")[0]}
        financials={financials}
        documents={documents}
        openAmount={openAmount}
      />
    </div>
  );
}
