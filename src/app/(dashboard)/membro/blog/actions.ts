"use server";

import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { getUniqueSlug, normalizeImageUrl, sanitizeRichHtml, stripHtml } from "@/src/lib/blogPost";

const BLOB_HOST_FRAGMENT = "blob.vercel-storage.com";

type MemberPostPayload = {
  title: string;
  content: string;
  imageUrl?: string | null;
};

type BlogActionResult = {
  success: boolean;
  error?: string;
};

async function getMemberUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, troopId: true },
  });

  if (!user) {
    throw new Error("Usuário autenticado não foi encontrado no banco.");
  }

  if (user.role !== "MEMBER") {
    throw new Error("Acesso negado. Apenas membros podem enviar publicações por aqui.");
  }

  if (!user.troopId) {
    throw new Error("Você precisa estar vinculado a uma tropa para publicar notícias. Fale com seu chefe ou a Diretoria.");
  }

  return user as { id: string; role: string; troopId: string };
}

function validatePayload(payload: MemberPostPayload) {
  if (!payload.title || payload.title.trim().length < 3) {
    throw new Error("O título deve ter pelo menos 3 caracteres.");
  }

  const sanitizedHtml = sanitizeRichHtml(payload.content || "");
  const contentText = stripHtml(sanitizedHtml);
  if (contentText.length < 20) {
    throw new Error("Escreva um pouco mais sobre a notícia antes de enviar.");
  }

  return {
    title: payload.title.trim(),
    sanitizedHtml,
    imageUrl: normalizeImageUrl(payload.imageUrl),
  };
}

async function safelyDeleteBlob(url: string | null) {
  if (!url || !url.includes(BLOB_HOST_FRAGMENT)) return;
  try {
    await del(url);
  } catch (error) {
    console.warn("Falha ao remover imagem antiga no Vercel Blob. Prosseguindo com a operação.", error);
  }
}

function revalidateBlogSurfaces(slug?: string) {
  revalidatePath("/membro/blog");
  revalidatePath("/chefe/blog");
  revalidatePath("/admin/blog");
  revalidatePath("/");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function submitMemberPost(payload: MemberPostPayload): Promise<BlogActionResult> {
  try {
    const user = await getMemberUser();
    const parsed = validatePayload(payload);

    const slug = await getUniqueSlug(parsed.title);

    await prisma.blogPost.create({
      data: {
        title: parsed.title,
        slug,
        content: parsed.sanitizedHtml,
        imageUrl: parsed.imageUrl,
        status: "PENDING_REVIEW",
        troopId: user.troopId,
        authorId: user.id,
      },
    });

    revalidateBlogSurfaces(slug);
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar publicação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha inesperada ao enviar a publicação.",
    };
  }
}

export async function updateMemberPost(postId: string, payload: MemberPostPayload): Promise<BlogActionResult> {
  try {
    const user = await getMemberUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, imageUrl: true, slug: true, status: true },
    });

    if (!existingPost || existingPost.authorId !== user.id) {
      throw new Error("Publicação não encontrada.");
    }

    if (existingPost.status !== "PENDING_REVIEW" && existingPost.status !== "REJECTED") {
      throw new Error("Só é possível editar publicações pendentes ou rejeitadas.");
    }

    const parsed = validatePayload(payload);

    if (existingPost.imageUrl && parsed.imageUrl !== existingPost.imageUrl) {
      await safelyDeleteBlob(existingPost.imageUrl);
    }

    // Editar uma publicação rejeitada reenvia para aprovação.
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: parsed.title,
        content: parsed.sanitizedHtml,
        imageUrl: parsed.imageUrl,
        status: "PENDING_REVIEW",
        reviewedById: null,
        reviewedAt: null,
        rejectionReason: null,
      },
    });

    revalidateBlogSurfaces(existingPost.slug);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar publicação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha inesperada ao atualizar a publicação.",
    };
  }
}

export async function deleteMemberPost(postId: string): Promise<BlogActionResult> {
  try {
    const user = await getMemberUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, imageUrl: true, slug: true, status: true },
    });

    if (!existingPost || existingPost.authorId !== user.id) {
      throw new Error("Publicação não encontrada.");
    }

    if (existingPost.status !== "PENDING_REVIEW" && existingPost.status !== "REJECTED") {
      throw new Error("Só é possível excluir publicações pendentes ou rejeitadas.");
    }

    await safelyDeleteBlob(existingPost.imageUrl);

    await prisma.blogPost.delete({ where: { id: postId } });

    revalidateBlogSurfaces(existingPost.slug);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir publicação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha inesperada ao excluir a publicação.",
    };
  }
}
