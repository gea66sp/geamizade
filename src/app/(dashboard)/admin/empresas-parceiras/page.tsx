import type { Metadata } from "next";
import { getAuthUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import PartnerManager from "./_components/PartnerManager";

export const metadata: Metadata = {
  title: "Empresas parceiras",
  description: "Gerencie as empresas parceiras exibidas no site público.",
};

export default async function AdminPartnersPage() {
  const user = await getAuthUser();
  if (!user || !["ADMIN", "DEVELOPER", "FINANCEIRO"].includes(user.role)) redirect("/");

  const [companies, categories] = await Promise.all([
    prisma.partnerCompany.findMany({
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.partnerCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <PartnerManager
      initialCompanies={companies}
      initialCategories={categories}
    />
  );
}
