import type { Metadata } from "next";
import LoginClient from "./_component/LoginClient"; // Ajuste o caminho do seu LoginClient se necessário
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho para o seu auth.ts
import { redirect } from "next/navigation";

// Metadados da página
export const metadata: Metadata = {
  title: "Login | GE Amizade",
  description: "Acesso ao portal interno do Grupo Escoteiro Amizade 66° SP",
};

export default async function LoginPage() {
  // 1. Verifica no servidor se o usuário já tem uma sessão ativa
  const session = await getServerSession(authOptions);

  // 2. Se a sessão existir, redireciona direto para o painel administrativo
  if (session?.user) {
    redirect("/admin");
  }

  // 3. Se não tiver sessão, carrega o formulário de login normalmente
  return <LoginClient />;
}