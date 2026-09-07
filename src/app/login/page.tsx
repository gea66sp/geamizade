import type { Metadata } from "next";
import LoginClient from "./_component/LoginClient"; // Ajuste o caminho do seu LoginClient se necessário
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho para o seu auth.ts
import { redirect } from "next/navigation";
import { getHomeRouteForRole } from "@/src/lib/dashboardAccess";

// Metadados da página
export const metadata: Metadata = {
  title: "Login | GE Amizade",
  description: "Acesso ao portal interno do Grupo Escoteiro Amizade 66° SP",
};

export default async function LoginPage() {
  // 1. Verifica no servidor se o usuário já tem uma sessão ativa
  const session = await getServerSession(authOptions);

  // 2. Se a sessão existir, redireciona direto para a área do cargo do usuário
  if (session?.user) {
    redirect(getHomeRouteForRole(session.user.role));
  }

  // 3. Se não tiver sessão, carrega o formulário de login normalmente
  return <LoginClient />;
}