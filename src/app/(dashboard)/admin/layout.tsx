import { redirect } from "next/navigation";
import AdminShell from "@/src/components/dashboard/admin/AdminShell";
import type { Metadata } from "next";
import SessionKeeper from "@/src/components/SessionKeeper";
import ForcePasswordChange from "@/src/components/dashboard/ForcePasswordChange";
import { getDashboardSessionState, getHomeRouteForRole } from "@/src/lib/dashboardAccess";

const BASE_URL = 'https://www.geamizade.org.br';

const ALLOWED_ADMIN_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO"];

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
  const sessionState = await getDashboardSessionState();

  if (!sessionState) {
    redirect("/login");
  }

  if (sessionState.needsSessionKeeper) {
    // 🛡️ BARRAGEM: Retornamos APENAS a tela de logout.
    // O painel AdminShell NUNCA é renderizado, evitando o "piscar" de telas.
    return <SessionKeeper />;
  }

  // Conta com senha provisória: nenhuma página renderiza até a troca.
  // Fica aqui, e não numa rota, porque assim não existe URL para contornar.
  if (sessionState.needsPasswordChange) {
    return <ForcePasswordChange userName={sessionState.userName} />;
  }

  const { userName, userRole, userImage } = sessionState;

  if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
    // Cada cargo tem sua própria área hoje (CHEFE -> /chefe, MEMBER -> /membro,
    // RESPONSAVEL -> /responsavel); quem cair aqui por engano é mandado para a
    // área correta em vez de para o site público.
    redirect(getHomeRouteForRole(userRole));
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
