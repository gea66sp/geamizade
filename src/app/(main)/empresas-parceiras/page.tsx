import type { Metadata } from "next";
import prisma from "@/src/lib/prisma";
import ParceirasCatalog from "./_components/ParceirasCatalog";

export const metadata: Metadata = {
  title: "Empresas Parceiras | Grupo Escoteiro Amizade 66/SP",
  description:
    "Conheça as empresas que apoiam o Grupo Escoteiro Amizade 66/SP e descubra como fazer parte dessa rede.",
};

export const dynamic = "force-dynamic";

export default async function EmpresasParceirasPage() {
  const partners = await prisma.partnerCompany.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <ParceirasCatalog partners={partners} />
    </main>
  );
}
