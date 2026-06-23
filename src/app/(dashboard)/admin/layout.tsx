import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/src/components/dashboard/admin/AdminShell";
import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";
import SessionKeeper from "@/src/components/SessionKeeper";

const BASE_URL = 'https://www.geamizade.org.br';

// Definição dos papéis permitidos no painel gestor
const ALLOWED_ADMIN_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO", "CHEFE"];

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s',
    default: 'Área de Membros',
  },
  description: 'Grupo Escoteiro Amizade 66/SP - Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos em Taubaté!',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Busca a sessão no servidor de forma eficiente
  const session = await getServerSession(authOptions);

  // Segurança de Autenticação: se não houver sessão ativa, redireciona para o login
  if (!session || !session.user) {
    redirect("/login");
  }

  // ==========================================
  // BUSCA DE DADOS EM TEMPO REAL (ANTI-CACHE)
  // ==========================================
  let freshUser = null;
  
  if (session.user.id) {
    try {
      freshUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, role: true, image: true }
      });
    } catch (error) {
      console.error("Erro crítico ao buscar dados atualizados do usuário no layout administrativo:", error);
    }
  }

  // Define os dados finais utilizando o banco como prioridade e a sessão como contingência
  const userName = freshUser?.name || session.user.name;
  const userRole = freshUser?.role || (session.user as { role?: string }).role;
  const userImage = freshUser?.image || session.user.image || null;

  // Segurança de Autorização: Se o usuário estiver autenticado, mas seu papel não for administrativo,
  // barra o acesso imediatamente antes de renderizar qualquer parte do painel do gestor.
  if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
    // Redireciona o membro comum para a área geral ou home do site
    redirect("/dashboard/membros?error=unauthorized");
  }

  return (
    <>
      {/* Monitoramento silencioso da expiração de sessão do navegador */}
      <SessionKeeper /> 
      
      <AdminShell 
        userName={userName} 
        userRole={userRole}
        userImage={userImage}
      >
        {children}
      </AdminShell>
    </>
  );
}