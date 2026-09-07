import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // O tsconfig mapeia "@/*" para a RAIZ do repositório (não para src/),
      // então "@/src/lib/prisma" resolve para "./src/lib/prisma".
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Os testes não tocam o banco: o Prisma é mockado. Isso é deliberado —
    // o projeto tem uma única base (Supabase de produção) e uma suíte que a
    // usasse seria perigosa e lenta.
    restoreMocks: true,
  },
});
