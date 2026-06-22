import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; 
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma"; 
import UserTable from "./_components/UserTable";
import { Role } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gerenciar Usuários | GE Amizade",
  description: "Painel de administração de membros e responsáveis do Grupo Escoteiro.",
};

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Controle de Acesso Seguro (Admin e Diretoria)
  const userRole = session.user.role as Role;
  const allowedAccess: Role[] = ["ADMIN"]; 
  
  if (!allowedAccess.includes(userRole)) {
    return (
      <div className="p-8 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
           <i className="fa-solid fa-ban"></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
        <p className="mt-2 text-gray-500 font-medium">O seu cargo não possui privilégios para visualizar a lista completa de usuários.</p>
      </div>
    );
  }

  // Busca hiper-rápida (apenas dados essenciais para o Grid/Table inicial)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branch: true,
      image: true,
      troop: { select: { name: true } } // Pegamos o nome da Tropa para exibir na lista geral
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 animate-fade-in-down">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-scout-green tracking-tight">Efetivo do Grupo</h1>
          <p className="text-gray-500 text-sm md:text-base mt-1">Gestão de chefes, jovens e seus responsáveis legais.</p>
        </div>
      </div>

      {/* Componente Cliente (Tabela, Filtros e Modais) */}
      <UserTable users={users} currentUserRole={session.user.role} />
      
    </div>
  );
}