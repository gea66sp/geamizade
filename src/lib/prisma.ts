import { PrismaClient } from '@prisma/client'

// Cria uma função que retorna uma nova instância do PrismaClient
const prismaClientSingleton = () => {
  return new PrismaClient()
}

// Declara o prismaGlobal no escopo global para que o TypeScript reconheça
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Usa a instância global existente ou cria uma nova se não existir
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

// Em ambiente de desenvolvimento, salva a instância no objeto globalThis.
// Isso previne o Next.js de criar uma nova conexão com o banco a cada hot-reload.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}