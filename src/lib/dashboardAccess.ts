import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export { getHomeRouteForRole } from "@/src/lib/roleRouting";

// ==========================================
// ESTADO DE SESSÃO COMPARTILHADO PELOS LAYOUTS DO DASHBOARD
// ==========================================
// Centraliza a lógica hoje duplicada em cada layout.tsx: valida a sessão,
// aplica a barreira de "lembrar de mim" e busca os dados atualizados do
// usuário (nome/role/imagem) direto do banco, evitando cache velho de sessão.
export type DashboardSessionState = {
  needsSessionKeeper: boolean;
  /** Conta criada por terceiro com senha provisória: nenhuma página do
   *  dashboard renderiza até a pessoa trocar a senha. */
  needsPasswordChange: boolean;
  userId: string | null;
  userName: string | null;
  userRole: Role | null;
  userImage: string | null;
};

export async function getDashboardSessionState(): Promise<DashboardSessionState | null> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  const cookieStore = await cookies();
  const isBrowserSessionActive = cookieStore.get("scout_active_session");
  const rememberMe = (session.user as { rememberMe?: boolean }).rememberMe;

  if (rememberMe === false && !isBrowserSessionActive) {
    return {
      needsSessionKeeper: true,
      needsPasswordChange: false,
      userId: null,
      userName: null,
      userRole: null,
      userImage: null,
    };
  }

  let freshUser:
    | { name: string | null; role: Role; image: string | null; mustChangePassword: boolean }
    | null = null;

  if (session.user.id) {
    try {
      freshUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, role: true, image: true, mustChangePassword: true },
      });
    } catch (error) {
      console.error("Erro crítico ao buscar dados atualizados do usuário:", error);
    }
  }

  return {
    needsSessionKeeper: false,
    // Lido do banco a cada requisição, não do JWT: assim a barreira cai no
    // instante em que a senha é trocada, sem precisar renovar a sessão.
    needsPasswordChange: freshUser?.mustChangePassword === true,
    userId: session.user.id,
    userName: freshUser?.name ?? session.user.name ?? null,
    userRole: freshUser?.role ?? (session.user as { role?: Role }).role ?? null,
    userImage: freshUser?.image ?? session.user.image ?? null,
  };
}
