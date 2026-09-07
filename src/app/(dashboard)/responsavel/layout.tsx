import { redirect } from "next/navigation";
import type { Metadata } from "next";

import SimpleShell from "@/src/components/dashboard/SimpleShell";
import SessionKeeper from "@/src/components/SessionKeeper";
import ForcePasswordChange from "@/src/components/dashboard/ForcePasswordChange";
import { getDashboardSessionState, getHomeRouteForRole } from "@/src/lib/dashboardAccess";

const BASE_URL = 'https://www.geamizade.org.br';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s',
    default: 'Área do Responsável',
  },
  description: 'Grupo Escoteiro Amizade 66/SP - Painel do responsável.',
};

const NAV_ITEMS = [
  { href: "/responsavel", label: "Início", icon: "fa-house", exact: true },
  { href: "/responsavel/dependentes", label: "Meus Dependentes", icon: "fa-children" },
  { href: "/responsavel/calendario", label: "Calendário", icon: "fa-calendar-days" },
  { href: "/responsavel/notificacoes", label: "Notificações", icon: "fa-bell" },
  { href: "/responsavel/perfil", label: "Meu Perfil", icon: "fa-user" },
];

export default async function ResponsavelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionState = await getDashboardSessionState();

  if (!sessionState) {
    redirect("/login");
  }

  if (sessionState.needsSessionKeeper) {
    return <SessionKeeper />;
  }

  // Conta com senha provisória: nenhuma página renderiza até a troca.
  // Fica aqui, e não numa rota, porque assim não existe URL para contornar.
  if (sessionState.needsPasswordChange) {
    return <ForcePasswordChange userName={sessionState.userName} />;
  }

  const { userName, userRole, userImage } = sessionState;

  if (userRole !== "RESPONSAVEL") {
    redirect(getHomeRouteForRole(userRole));
  }

  return (
    <SimpleShell title="GE Amizade" homeHref="/responsavel" navItems={NAV_ITEMS} userName={userName} userRole={userRole} userImage={userImage}>
      {children}
    </SimpleShell>
  );
}
