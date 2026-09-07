import { DefaultSession, DefaultUser } from "next-auth";
import { Branch, Role } from "@prisma/client";

// Instruímos o TypeScript a fundir essas novas informações com as tipagens
// originais do NextAuth. Manter esta augmentação COMPLETA é o que evita os
// `as any` espalhados por src/lib/auth.ts — sempre que um campo novo passar a
// trafegar na sessão, ele precisa ser declarado aqui também.
declare module "next-auth" {
  // Estende a sessão (o que você recebe no getServerSession)
  interface Session {
    user: {
      id: string;
      role: Role;
      branch?: Branch | null;
      /** Escolha do "lembrar de mim" no login; combinada com o cookie
       *  scout_active_session para forçar logout ao fechar o navegador. */
      rememberMe?: boolean;
    } & DefaultSession["user"];
  }

  // Estende o Usuário (o que você recebe do banco na hora do login)
  interface User extends DefaultUser {
    role: Role;
    branch?: Branch | null;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  // Estende o Token JWT para segurar a Role, o ID e o resto do estado
  interface JWT {
    id: string;
    role: Role;
    branch?: Branch | null;
    rememberMe?: boolean;
  }
}
