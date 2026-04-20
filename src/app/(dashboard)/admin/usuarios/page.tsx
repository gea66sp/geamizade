import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho se necessário
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma"; // Ajuste o caminho do seu Prisma Client
import UserTable from "./_components/UserTable";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Gerenciar Usuários | GE Amizade",
};

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Controle de Acesso: Apenas cargos específicos podem ver a lista completa
  const userRole = session.user.role as Role;
  const allowedAccess: Role[] = ["ADMIN"];
  
  if (!allowedAccess.includes(userRole)) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="mt-2 text-gray-600">Você não tem permissão para visualizar o quadro de usuários.</p>
      </div>
    );
  }

  // Busca todos os usuários no banco, ordenados por nome
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branch: true,
      image: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Componente Cliente que renderiza a tabela com os filtros */}
      <UserTable users={users} currentUserRole={session.user.role} />
    </div>
  );
}