import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/src/lib/auth";
import PersonalizarForm from "./_components/PersonalizarForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalizar Site",
  description: "Configure a página inicial do site, edite as perguntas frequentes e gerencie as informações que os visitantes veem ao acessar o site do Grupo Escoteiro Amizade 66/SP.",
};

export default async function PersonalizarPage() {
  const user = await getAuthUser();

  // Apenas Administradores têm acesso a esta rota
  if (!user || user.role !== "ADMIN") {
    redirect("/"); 
  }

  // Busca a configuração atual. Se não existir, manda um objeto vazio (fallback) para o front end preencher
  const homeSettings = await prisma.homePageSettings.findFirst() || {
    heroTitle: "Sempre Alerta para Servir!",
    heroShortText: "Bem-vindo ao Grupo Escoteiro Amizade.",
    heroImage: null,
    aboutText: "Nossa história começou em...",
    aboutImage: null,
    impactedYouthCount: 150,
  };

  const faqs = await prisma.faq.findMany({
    orderBy: { order: "asc" }
  });

  return (
    // Wrapper limpo: Apenas define o limite de largura, centraliza e adiciona a animação.
    // Toda a lógica de "card" e altura (height) agora está sendo gerenciada pelo próprio componente PersonalizarForm.
    <div className="max-w-7xl mx-auto w-full animate-fade-in-down">
      <PersonalizarForm initialHome={homeSettings} initialFaqs={faqs} />
    </div>
  );
}