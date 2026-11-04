// Convenção `proxy` do Next.js 16 (substituiu `middleware`). O import abaixo é
// do NextAuth e mantém o nome "middleware" — é o caminho do pacote, não a
// convenção de arquivo do Next.
//
// Aqui só validamos que existe sessão. A checagem de CARGO fica no layout.tsx
// de cada área do dashboard e, de novo, dentro de cada Server Action.
import { NextFetchEvent, NextResponse } from "next/server";
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";

const authMiddleware = withAuth({
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

export default function proxy(request: NextRequestWithAuth, event: NextFetchEvent) {
  const { pathname, searchParams } = request.nextUrl;
  const isKnownSpamQuery =
    pathname === "/" &&
    searchParams.has("e") &&
    searchParams.has("channel") &&
    searchParams.has("from");

  if (isKnownSpamQuery) {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  return authMiddleware(request, event);
}

export const config = {
  matcher: [
    "/",
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