import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DependentCard from "@/src/components/dashboard/responsavel/DependentCard";
import { getDependentsSummary, getViewerContext } from "@/src/lib/guardian";

export const metadata: Metadata = {
  title: "Meus Dependentes",
  description: "Financeiro e documentos dos seus dependentes.",
};

export default async function DependentesPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const dependents = await getDependentsSummary(ctx);

  // Com um único dependente, uma lista de um item só é atrito: vai direto.
  if (dependents.length === 1) {
    redirect(`/responsavel/dependentes/${dependents[0].id}`);
  }

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-children"></i>
          </span>
          Meus Dependentes
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Acompanhe as mensalidades e os documentos de cada um.
        </p>
      </div>

      {dependents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <i className="fa-solid fa-user-slash text-4xl text-gray-200 mb-3"></i>
          <p className="text-gray-500 font-bold">Nenhum dependente vinculado a você.</p>
          <p className="text-xs text-gray-400 mt-1">
            Fale com a Diretoria para vincular o seu filho ou filha ao seu cadastro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dependents.map((d) => (
            <DependentCard key={d.id} dependent={d} />
          ))}
        </div>
      )}
    </div>
  );
}
