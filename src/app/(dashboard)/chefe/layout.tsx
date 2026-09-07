import { redirect } from "next/navigation";
import type { Metadata } from "next";

import ChefeShell from "@/src/components/dashboard/chefe/ChefeShell";
import SessionKeeper from "@/src/components/SessionKeeper";
import ForcePasswordChange from "@/src/components/dashboard/ForcePasswordChange";
import prisma from "@/src/lib/prisma";
import { getDashboardSessionState, getHomeRouteForRole } from "@/src/lib/dashboardAccess";

const BASE_URL = 'https://www.geamizade.org.br';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s',
    default: 'Área do Chefe',
  },
  description: 'Grupo Escoteiro Amizade 66/SP - Painel do chefe responsável pela tropa.',
};

export default async function ChefeLayout({
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

  const { userName, userRole, userImage, userId } = sessionState;

  if (userRole !== "CHEFE") {
    redirect(getHomeRouteForRole(userRole));
  }

  // Confere se este chefe já gerencia alguma tropa — se não, as páginas
  // internas mostram um estado vazio em vez de tentar carregar dados.
  const managedTroopsCount = userId
    ? await prisma.troop.count({ where: { managerId: userId } })
    : 0;

  return (
    <ChefeShell userName={userName} userRole={userRole} userImage={userImage}>
      {managedTroopsCount === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 shadow-sm">
            <i className="fa-solid fa-users-slash text-gray-400 text-3xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-800 mb-2">
            Nenhuma tropa atribuída
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-md">
            Você ainda não é responsável por nenhuma tropa. Fale com a Diretoria para ser vinculado a uma.
          </p>
        </div>
      ) : (
        children
      )}
    </ChefeShell>
  );
}
