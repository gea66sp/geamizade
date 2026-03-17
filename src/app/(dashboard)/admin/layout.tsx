import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho
import { redirect } from "next/navigation";
import AdminShell from "@/src/components/AdminShell"; // Importe o novo componente

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