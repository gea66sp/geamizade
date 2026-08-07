import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

import BlogManager from "./_components/BlogManager";

const ALLOWED_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO", "CHEFE"] as const;

export const metadata: Metadata = {
  title: "Blog | GE Amizade",
  description:
    "Gerencie notícias e publicações oficiais do Grupo Escoteiro Amizade com fluxo completo de criação, edição, revisão e publicação.",
};

export default async function AdminBlogPage() {
  const user = await getAuthUser();

  if (!user || !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
    redirect("/");
  }

  const [posts, troops] = await Promise.all([
    prisma.blogPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        troop: {
          select: {
            id: true,
            name: true,
            branch: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.troop.findMany({
      select: {
        id: true,
        name: true,
        branch: true,
      },
      orderBy: [{ branch: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-down h-full min-h-[calc(100vh-10rem)] pb-12">
      <BlogManager
        initialPosts={posts}
        troops={troops}
        currentUser={{
          id: user.id,
          name: user.name,
          role: user.role,
        }}
      />
    </div>
  );
}

