import { PrismaClient } from '@prisma/client'

function getDevelopmentDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || process.env.NODE_ENV === "production") return undefined;

  const separator = databaseUrl.includes("?") ? "&" : "?";
  return `${databaseUrl}${separator}connection_limit=1&pool_timeout=20`;
}

const prismaClientSingleton = () => {
  const developmentDatabaseUrl = getDevelopmentDatabaseUrl();

  return new PrismaClient(
    developmentDatabaseUrl
      ? { datasources: { db: { url: developmentDatabaseUrl } } }
      : undefined,
  )
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