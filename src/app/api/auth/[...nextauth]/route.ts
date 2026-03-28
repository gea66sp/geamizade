//src\app\api\auth\[...nextauth]\route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Ajuste o caminho se seu authOptions estiver em outro lugar

const handler = NextAuth(authOptions);

// Exporta o handler para requisições GET e POST (Padrão obrigatório do App Router)
export { handler as GET, handler as POST };