import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho
import { redirect } from "next/navigation";
import AdminShell from "@/src/components/AdminShell"; // Importe o novo componente
import type { Metadata } from "next";

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

  // Segurança extra de rota
  if (!session) {
    redirect("/login");
  }

  return (
    <AdminShell 
      userName={session.user?.name} 
      userRole={(session.user as any)?.role}
    >
      {children}
    </AdminShell>
  );
}