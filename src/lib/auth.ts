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
        
        let recaptchaData: { success?: boolean; "error-codes"?: string[] };
        try {
          const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
          recaptchaData = await recaptchaRes.json();
        } catch (error) {
          // Só falha de REDE cai aqui. Antes, o try envolvia também a checagem
          // abaixo, então um captcha reprovado era relatado como erro de rede.
          console.error("Erro de rede ao validar o reCAPTCHA:", error);
          throw new Error("Não foi possível validar o reCAPTCHA.");
        }

        if (!recaptchaData.success) {
          console.error("Erro no reCAPTCHA:", recaptchaData["error-codes"]);
          throw new Error("Falha na verificação de segurança. Tente novamente.");
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

        // Os campos extras (role, branch, rememberMe) são reconhecidos porque
        // src/types/next-auth.d.ts estende o tipo User do NextAuth.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branch: user.branch,
          // Convertendo a string para boolean com segurança
          rememberMe: credentials.remember === "true",
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      // 'user' só existe na primeira vez que a função roda (no momento do login)
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branch = user.branch;
        // Garantimos que a flag vá para o token de forma segura (forçando ser booleano)
        token.rememberMe = user.rememberMe === true;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.branch = token.branch;
        // Disponibilizamos a escolha na sessão do Front-end
        session.user.rememberMe = token.rememberMe === true;
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