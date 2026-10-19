import type { Metadata } from "next";
import ParceirasCatalog from "./_components/ParceirasCatalog";

export const metadata: Metadata = {
  title: "Empresas Parceiras | Grupo Escoteiro Amizade 66/SP",
  description:
    "Conheça as empresas que apoiam o Grupo Escoteiro Amizade 66/SP e descubra como fazer parte dessa rede.",
};

export default function EmpresasParceirasPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <ParceirasCatalog />
    </main>
  );
}
