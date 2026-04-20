import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", 
  },
  callbacks: {
    authorized: ({ req, token }) => {
      // DEBUG: Isso vai aparecer no seu terminal do VS Code
      console.log("Middleware checando a rota:", req.nextUrl.pathname);
      console.log("Token encontrado:", token ? "Sim" : "Não");
      
      // Retorna true se estiver logado (deixa passar), false se não (chuta pro login)
      return !!token; 
    },
  },
});

export const config = {
  matcher: [
    "/admin",        // Protege a porta de entrada exata do admin
    "/admin/:path*", // Protege todos os caminhos lá dentro
  ],
};