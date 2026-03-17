import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Conecta o NextAuth ao Prisma (útil se for adicionar Google/Facebook depois)
  adapter: PrismaAdapter(prisma),
  
  // Obrigatório ser 'jwt' ao usar CredentialsProvider
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Sessão dura 30 dias
  },
  
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "contato@exemplo.com" },
        password: { label: "Senha", type: "password" },
        captchaToken: { label: "Captcha", type: "text" } 
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

        // Verifica se o usuário existe e possui senha
        if (!user || !user.password) {
          throw new Error("E-mail não cadastrado ou credenciais inválidas.");
        }

        // Compara a senha digitada com o hash salvo
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Senha incorreta.");
        }

        // Retorna o objeto alinhado com o seu Schema Prisma
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,     // Ex: ADMIN, CHEFE, MEMBER
          branch: user.branch, // Ex: LOBINHO, ESCOTEIRO, SENIOR
        };
      }
    })
  ],
  
  callbacks: {
    // 1. O retorno do authorize passa por aqui para gerar o Token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.branch = (user as any).branch;
      }
      return token;
    },
    
    // 2. O Token passa por aqui para gerar a Sessão visível no Client/Server
    async session({ session, token }) {
      if (session.user) {
        // Colocamos o (session.user as any) no ID também para o TypeScript não chorar
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).branch = token.branch;
      }
      return session;
    },

    // 3. Controla para onde o usuário vai após ações de login/logout
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