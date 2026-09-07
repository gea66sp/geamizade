"use server";

import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { getUniqueSlug, normalizeImageUrl, sanitizeRichHtml, stripHtml } from "@/src/lib/blogPost";

// Estas actions são usadas tanto por /admin/blog (org-wide) quanto por
// /chefe/blog (recortado à própria tropa) — CHEFE continua na lista, mas com
// posse por tropa verificada em cada ação (veja isOwnTroop/assertCanActOnPost).
const ALLOWED_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO", "CHEFE"] as const;
const BLOB_HOST_FRAGMENT = "blob.vercel-storage.com";

type PostStatusInput = "DRAFT" | "PUBLISHED";

type BlogPayload = {
  title: string;
  slug?: string;
  content: string;
  imageUrl?: string | null;
  status: PostStatusInput;
  troopId?: string | null;
};

type BlogActionResult = {
  success: boolean;
  error?: string;
};

async function getAuthorizedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, managedTroops: { select: { id: true } } },
  });

  if (!user) {
    throw new Error("Usuário autenticado não foi encontrado no banco.");
  }

  if (!ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
    throw new Error("Acesso negado. Seu perfil não possui permissão de gestão de blog.");
  }

  return user;
}

type AuthorizedUser = Awaited<ReturnType<typeof getAuthorizedUser>>;

// ADMIN/DEVELOPER/FINANCEIRO enxergam e gerenciam o blog do grupo inteiro.
// CHEFE só pode agir sobre posts atribuídos a uma tropa que ele gerencia.
function isOwnTroop(user: AuthorizedUser, troopId: string | null) {
  if (user.role !== "CHEFE") return true;
  return !!troopId && user.managedTroops.some((t) => t.id === troopId);
}

function assertCanActOnPost(user: AuthorizedUser, post: { troopId: string | null }) {
  if (!isOwnTroop(user, post.troopId)) {
    throw new Error("Acesso negado: esta publicação não pertence a uma tropa que você gerencia.");
  }
}

async function assertTroopExists(troopId: string | null | undefined) {
  if (!troopId) return;

  const troop = await prisma.troop.findUnique({
    where: { id: troopId },
    select: { id: true },
  });

  if (!troop) {
    throw new Error("A tropa selecionada não existe ou foi removida.");
  }
}

function validatePayload(user: AuthorizedUser, payload: BlogPayload) {
  if (!payload.title || payload.title.trim().length < 3) {
    throw new Error("O título deve ter pelo menos 3 caracteres.");
  }

  const sanitizedHtml = sanitizeRichHtml(payload.content || "");
  const contentText = stripHtml(sanitizedHtml);
  if (contentText.length < 20) {
    throw new Error("O conteúdo da publicação está muito curto.");
  }

  const troopId = payload.troopId?.trim() ? payload.troopId.trim() : null;

  // CHEFE só publica pela própria tropa — nunca "Geral do Grupo" nem outra tropa.
  if (user.role === "CHEFE" && !isOwnTroop(user, troopId)) {
    throw new Error("Você só pode publicar notícias em uma tropa que você gerencia.");
  }

  return {
    title: payload.title.trim(),
    sanitizedHtml,
    imageUrl: normalizeImageUrl(payload.imageUrl),
    status: payload.status === "PUBLISHED" ? ("PUBLISHED" as const) : ("DRAFT" as const),
    troopId,
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

function revalidateBlogSurfaces(slugs: string[] = []) {
  revalidatePath("/admin/blog");
  revalidatePath("/chefe/blog");
  revalidatePath("/membro/blog");
  revalidatePath("/");
  revalidatePath("/blog");
  for (const slug of slugs) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function createBlogPost(payload: BlogPayload): Promise<BlogActionResult> {
  try {
    const user = await getAuthorizedUser();
    const parsed = validatePayload(user, payload);

    await assertTroopExists(parsed.troopId);

    const slug = await getUniqueSlug(payload.slug?.trim() || parsed.title);

    await prisma.blogPost.create({
      data: {
        title: parsed.title,
        slug,
        content: parsed.sanitizedHtml,
        imageUrl: parsed.imageUrl,
        status: parsed.status,
        troopId: parsed.troopId,
        authorId: user.id,
      },
    });

    revalidateBlogSurfaces([slug]);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar publicação do blog:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha inesperada ao criar a publicação no banco de dados.",
    };
  }
}

export async function updateBlogPost(postId: string, payload: BlogPayload): Promise<BlogActionResult> {
  try {
    const user = await getAuthorizedUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, imageUrl: true, slug: true, troopId: true },
    });

    if (!existingPost) {
      throw new Error("A publicação selecionada não foi encontrada.");
    }

    assertCanActOnPost(user, existingPost);

    const parsed = validatePayload(user, payload);
    await assertTroopExists(parsed.troopId);

    const slug = await getUniqueSlug(payload.slug?.trim() || parsed.title, postId);

    if (existingPost.imageUrl && parsed.imageUrl !== existingPost.imageUrl) {
      await safelyDeleteBlob(existingPost.imageUrl);
    }

    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: parsed.title,
        slug,
        content: parsed.sanitizedHtml,
        imageUrl: parsed.imageUrl,
        status: parsed.status,
        troopId: parsed.troopId,
      },
    });

    revalidateBlogSurfaces([existingPost.slug, slug]);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar publicação do blog:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha inesperada ao atualizar a publicação.",
    };
  }
}

export async function deleteBlogPost(postId: string): Promise<BlogActionResult> {
  try {
    const user = await getAuthorizedUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, imageUrl: true, slug: true, troopId: true },
    });

    if (!existingPost) {
      throw new Error("A publicação já foi removida ou não existe mais.");
    }

    assertCanActOnPost(user, existingPost);

    await safelyDeleteBlob(existingPost.imageUrl);

    await prisma.blogPost.delete({
      where: { id: postId },
    });

    revalidateBlogSurfaces([existingPost.slug]);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir publicação do blog:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha inesperada ao excluir a publicação.",
    };
  }
}

// Alterna Rascunho <-> Publicado num post que já existe (não usado para
// posts PENDING_REVIEW — esses passam por approveBlogPost/rejectBlogPost).
export async function setBlogPostStatus(
  postId: string,
  status: PostStatusInput
): Promise<BlogActionResult> {
  try {
    const user = await getAuthorizedUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { slug: true, troopId: true, status: true },
    });

    if (!existingPost) {
      throw new Error("A publicação selecionada não foi encontrada.");
    }

    assertCanActOnPost(user, existingPost);

    if (existingPost.status === "PENDING_REVIEW") {
      throw new Error("Esta publicação está aguardando aprovação — use Aprovar ou Rejeitar.");
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: { status },
      select: { slug: true },
    });

    revalidateBlogSurfaces([post.slug]);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status de publicação:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha inesperada ao alterar o status da publicação.",
    };
  }
}

export async function approveBlogPost(postId: string): Promise<BlogActionResult> {
  try {
    const user = await getAuthorizedUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { slug: true, troopId: true, status: true },
    });

    if (!existingPost) {
      throw new Error("A publicação selecionada não foi encontrada.");
    }

    assertCanActOnPost(user, existingPost);

    if (existingPost.status !== "PENDING_REVIEW") {
      throw new Error("Esta publicação não está aguardando aprovação.");
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
      select: { slug: true },
    });

    revalidateBlogSurfaces([post.slug]);
    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar publicação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha inesperada ao aprovar a publicação.",
    };
  }
}

export async function rejectBlogPost(postId: string, reason: string): Promise<BlogActionResult> {
  try {
    const user = await getAuthorizedUser();

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new Error("Informe o motivo da rejeição para o autor.");
    }

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { slug: true, troopId: true, status: true },
    });

    if (!existingPost) {
      throw new Error("A publicação selecionada não foi encontrada.");
    }

    assertCanActOnPost(user, existingPost);

    if (existingPost.status !== "PENDING_REVIEW") {
      throw new Error("Esta publicação não está aguardando aprovação.");
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: "REJECTED",
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: trimmedReason,
      },
      select: { slug: true },
    });

    revalidateBlogSurfaces([post.slug]);
    return { success: true };
  } catch (error) {
    console.error("Erro ao rejeitar publicação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha inesperada ao rejeitar a publicação.",
    };
  }
}
