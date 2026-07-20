import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
// Importe o prisma de acordo com o seu projeto. O padrão geralmente é:
import prisma from "@/src/lib/prisma"; 
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Conecta o NextAuth ao Prisma
  adapter: PrismaAdapter(prisma),
  
  // Obrigatório ser 'jwt' ao usar CredentialsProvider
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Sessão máxima de 30 dias (o padrão se marcar "Lembrar")
  },
  
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "contato@exemplo.com" },
        password: { label: "Senha", type: "password" },
        captchaToken: { label: "Captcha", type: "text" },
        remember: { label: "Lembrar de mim", type: "text" } 
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("E-mail e senha são obrigatórios.");
        }

        if (!credentials?.captchaToken) {
          throw new Error("Validação de segurança pendente.");
        }

        // ==========================================
        // VALIDAÇÃO DO RECAPTCHA NO GOOGLE
        // ==========================================
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${credentials.captchaToken}`;
        
        try {
          const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
          const recaptchaData = await recaptchaRes.json();

          if (!recaptchaData.success) {
            console.error("Erro no reCAPTCHA:", recaptchaData["error-codes"]);
            throw new Error("Falha na verificação de segurança. Tente novamente.");
          }
        } catch (error) {
          throw new Error("Não foi possível validar o reCAPTCHA.");
        }

        // ==========================================
        // VALIDAÇÃO DO USUÁRIO NO BANCO
        // ==========================================
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("E-mail não cadastrado ou credenciais inválidas.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Senha incorreta.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branch: user.branch,
          // Convertendo a string para boolean com segurança
          rememberMe: credentials.remember === "true", 
        } as any; // Cast para any para que o NextAuth aceite campos extras
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      // 'user' só existe na primeira vez que a função roda (no momento do login)
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.branch = (user as any).branch;
        // Garantimos que a flag vá para o token de forma segura (forçando ser booleano)
        token.rememberMe = (user as any).rememberMe === true; 
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).branch = token.branch;
        // Disponibilizamos a escolha na sessão do Front-end
        (session.user as any).rememberMe = token.rememberMe === true; 
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      
      return `${baseUrl}/admin`;
    }
  },

  pages: {
    signIn: "/login",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Função utilitária para obter o usuário logado com dados atualizados do banco.
 * Ideal para uso em Server Components e Server Actions.
 */
export async function getAuthUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}