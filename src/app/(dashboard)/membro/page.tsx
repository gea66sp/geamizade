import type { Metadata } from "next";
import Link from "next/link";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export const metadata: Metadata = {
  title: "Início",
  description: "Painel do membro.",
};

export default async function MembroHomePage() {
  const user = await getAuthUser();
  const firstName = user?.name?.split(" ")[0] || "Escoteiro";

  const troop = user?.troopId
    ? await prisma.troop.findUnique({ where: { id: user.troopId }, select: { name: true } })
    : null;

  const myPostsCount = user ? await prisma.blogPost.count({ where: { authorId: user.id } }) : 0;

  return (
    <div className="w-full animate-fade-in-down">
      <div className="mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">Olá, {firstName}!</h1>
        <p className="text-sm text-gray-500 mt-1">
          {troop ? `Você faz parte da ${troop.name}.` : "Bem-vindo(a) ao portal do GE Amizade."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/membro/blog"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <i className="fa-solid fa-newspaper"></i>
          </div>
          <div>
            <span className="font-bold text-gray-700 group-hover:text-gray-900 block">Minhas Publicações</span>
            <span className="text-xs text-gray-500">{myPostsCount} publicação(ões) enviada(s)</span>
          </div>
        </Link>

        <Link
          href="/membro/perfil"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-100 text-gray-500 group-hover:bg-gray-700 group-hover:text-white transition-colors">
            <i className="fa-solid fa-user"></i>
          </div>
          <span className="font-bold text-gray-700 group-hover:text-gray-900">Meu Perfil</span>
        </Link>
      </div>
    </div>
  );
}
