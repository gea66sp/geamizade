import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", 
  },
  callbacks: {
    authorized: ({ req, token }) => {
      
      // console.log("Middleware checando a rota:", req.nextUrl.pathname);
      // console.log("Token encontrado:", token ? "Sim" : "Não");
      
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