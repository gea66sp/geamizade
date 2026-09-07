// Convenção `proxy` do Next.js 16 (substituiu `middleware`). O import abaixo é
// do NextAuth e mantém o nome "middleware" — é o caminho do pacote, não a
// convenção de arquivo do Next.
//
// Aqui só validamos que existe sessão. A checagem de CARGO fica no layout.tsx
// de cada área do dashboard e, de novo, dentro de cada Server Action.
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      // Retorna true se estiver logado (deixa passar), false se não (chuta pro login)
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/admin",        
    "/admin/:path*",
    "/chefe",
    "/chefe/:path*",
    "/membro",
    "/membro/:path*",
    "/responsavel",
    "/responsavel/:path*",
    "/perfil",
    "/perfil/:path*" 
  ],
};