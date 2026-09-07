import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

import MyPostsManager from "./_components/MyPostsManager";

export const metadata: Metadata = {
  title: "Minhas Publicações",
  description: "Envie notícias da sua tropa e acompanhe a aprovação.",
};

export default async function MembroBlogPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  if (!user.troopId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 px-4 text-center">
        <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 shadow-sm">
          <i className="fa-solid fa-users-slash text-gray-400 text-3xl" />
        </div>
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-800 mb-2">Você ainda não está em uma tropa</h1>
        <p className="text-sm md:text-base text-gray-500 max-w-md">
          Fale com seu chefe ou com a Diretoria para ser vinculado a uma tropa antes de publicar notícias.
        </p>
      </div>
    );
  }

  const posts = await prisma.blogPost.findMany({
    where: { authorId: user.id },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      imageUrl: true,
      status: true,
      rejectionReason: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="w-full animate-fade-in-down">
      <MyPostsManager initialPosts={posts} />
    </div>
  );
}
