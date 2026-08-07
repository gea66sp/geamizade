import type { Metadata } from "next";

import prisma from "@/src/lib/prisma";

import BlogCatalog from "./_components/BlogCatalog";

export const metadata: Metadata = {
  title: "Blog e Notícias | GE Amizade 66/SP",
  description:
    "Acompanhe notícias, atividades, conquistas e comunicados oficiais do Grupo Escoteiro Amizade 66/SP.",
};

export default async function BlogPublicPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    include: {
      author: {
        select: { name: true },
      },
      troop: {
        select: { id: true, name: true, branch: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const troops = await prisma.troop.findMany({
    select: { id: true, name: true, branch: true },
    orderBy: [{ branch: "asc" }, { name: "asc" }],
  });

  return (
    <main className="bg-white w-full animate-fade-in">
      <section className="bg-scout-dark text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-scout-yellow font-bold tracking-widest uppercase text-xs md:text-sm mb-3 block">
            Notícias Oficiais
          </span>
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-4">Blog do GE Amizade</h1>
          <p className="text-gray-200 text-base md:text-lg max-w-3xl leading-relaxed">
            Conteúdo oficial com atividades, avisos, eventos e histórias das tropas.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <BlogCatalog posts={posts} troops={troops} />
      </section>
    </main>
  );
}

