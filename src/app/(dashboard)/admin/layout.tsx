import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/src/components/dashboard/admin/AdminShell";
import prisma from "@/src/lib/prisma";
import type { Metadata } from "next";
import SessionKeeper from "@/src/components/SessionKeeper";
import { cookies } from "next/headers"; // 👈 NOVO IMPORT AQUI

const BASE_URL = 'https://www.geamizade.org.br';

const ALLOWED_ADMIN_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO", "CHEFE"];

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s',
    default: 'Área de Membros',
  },
  description: 'Grupo Escoteiro Amizade 66/SP - Promovendo valores, aventuras e amizades duradouras.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // ==========================================
  // LÓGICA DE SEGURANÇA: "LEMBRAR DE MIM" NO SERVIDOR
  // ==========================================
  const cookieStore = await cookies();
  const isBrowserSessionActive = cookieStore.get("scout_active_session");
  const rememberMe = (session.user as any).rememberMe;

  // Se o usuário não quis ser lembrado e o navegador foi fechado (cookie de sessão sumiu)
  if (rememberMe === false && !isBrowserSessionActive) {
    // 🛡️ BARRAGEM: Retornamos APENAS a tela de logout. 
    // O painel AdminShell NUNCA é renderizado, evitando o "piscar" de telas.
    return <SessionKeeper />;
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
      console.error("Erro crítico ao buscar dados atualizados do usuário:", error);
    }
  }

  const userName = freshUser?.name || session.user.name;
  const userRole = freshUser?.role || (session.user as { role?: string }).role;
  const userImage = freshUser?.image || session.user.image || null;

  if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
    redirect("/dashboard/membros?error=unauthorized");
  }

  return (
    <AdminShell 
      userName={userName} 
      userRole={userRole}
      userImage={userImage}
    >
      {children}
    </AdminShell>
  );
}