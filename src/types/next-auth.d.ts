import { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@prisma/client";

// Instruímos o TypeScript a fundir essas novas informações com as tipagens originais do NextAuth
declare module "next-auth" {
  // Estende a sessão (o que você recebe no getServerSession)
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  // Estende o Usuário (o que você recebe do banco de dados na hora do login)
  interface User extends DefaultUser {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  // Estende o Token JWT para segurar a Role e o ID
  interface JWT {
    id: string;
    role: Role;
  }
}