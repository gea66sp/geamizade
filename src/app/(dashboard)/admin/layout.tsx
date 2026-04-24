import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho se necessário
import { redirect } from "next/navigation";
import AdminShell from "@/src/components/dashboard/admin/AdminShell"; // Importe o novo componente
import prisma from "@/src/lib/prisma"; // IMPORTAMOS O PRISMA AQUI
import type { Metadata } from "next";
import SessionKeeper from "@/src/components/SessionKeeper";

const BASE_URL = 'https://www.geamizade.org.br';

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
  // Busca a sessão no servidor de forma ultra-rápida
  const session = await getServerSession(authOptions);

  // Segurança extra de rota: se não houver sessão, manda pro login
  if (!session) {
    redirect("/login");
  }

  // ==========================================
  // O TRUQUE DE ATUALIZAÇÃO EM TEMPO REAL
  // ==========================================
  // Buscamos o usuário no banco de dados com base no ID da sessão atual.
  // Isso garante que, mesmo que o cookie do NextAuth esteja desatualizado,
  // nós sempre vamos buscar a foto e o nome mais recentes do banco!
  let freshUser = null;
  if (session.user?.id) {
    try {
      freshUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, role: true, image: true } // Pegamos a imagem!
      });
    } catch (error) {
      console.error("Erro ao buscar dados atualizados do usuário:", error);
    }
  }

  // Se a busca no banco falhar, usamos o que está no cache da sessão como backup
  const userName = freshUser?.name || session.user?.name;
  const userRole = freshUser?.role || (session.user as any)?.role;
  const userImage = freshUser?.image || null; // Pegamos a imagem novinha!

  return (
    <>
      {/* O SessionKeeper fica invisível aqui, apenas "vigiando".
        Se o usuário fechou o navegador e não tinha marcado "Lembrar de Mim", 
        este componente vai derrubar a sessão automaticamente.
      */}
      <SessionKeeper /> 
      
      <AdminShell 
        userName={userName} 
        userRole={userRole}
        userImage={userImage} // Passamos a imagem para o AdminShell
      >
        {children}
      </AdminShell>
    </>
  );
}