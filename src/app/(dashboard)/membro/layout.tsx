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
    default: 'Área do Membro',
  },
  description: 'Grupo Escoteiro Amizade 66/SP - Painel do membro.',
};

const NAV_ITEMS = [
  { href: "/membro", label: "Início", icon: "fa-house", exact: true },
  { href: "/membro/calendario", label: "Calendário", icon: "fa-calendar-days" },
  { href: "/membro/notificacoes", label: "Notificações", icon: "fa-bell" },
  { href: "/membro/blog", label: "Minhas Publicações", icon: "fa-newspaper" },
  { href: "/membro/perfil", label: "Meu Perfil", icon: "fa-user" },
];

export default async function MembroLayout({
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

  if (userRole !== "MEMBER") {
    redirect(getHomeRouteForRole(userRole));
  }

  return (
    <SimpleShell title="GE Amizade" homeHref="/membro" navItems={NAV_ITEMS} userName={userName} userRole={userRole} userImage={userImage}>
      {children}
    </SimpleShell>
  );
}
