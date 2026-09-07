import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

import ChefeBlogManager from "./_components/ChefeBlogManager";

export const metadata: Metadata = {
  title: "Blog da Tropa",
  description: "Publique notícias da sua tropa e revise o que os membros enviaram.",
};

export default async function ChefeBlogPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const managedTroops = await prisma.troop.findMany({
    where: { managerId: user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // O layout já bloqueia chefes sem nenhuma tropa; isso é só uma garantia extra.
  if (managedTroops.length === 0) redirect("/chefe");

  const troopIds = managedTroops.map((t) => t.id);

  const posts = await prisma.blogPost.findMany({
    where: { troopId: { in: troopIds } },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="w-full animate-fade-in-down pb-16">
      <ChefeBlogManager
        initialPosts={posts}
        troops={managedTroops}
        currentUser={{ id: user.id, name: user.name, role: user.role }}
      />
    </div>
  );
}
