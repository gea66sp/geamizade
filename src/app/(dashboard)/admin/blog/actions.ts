"use server";

import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO", "CHEFE"] as const;
const BLOB_HOST_FRAGMENT = "blob.vercel-storage.com";

type BlogPayload = {
  title: string;
  slug?: string;
  content: string;
  imageUrl?: string | null;
  published: boolean;
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
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("Usuário autenticado não foi encontrado no banco.");
  }

  if (!ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
    throw new Error("Acesso negado. Seu perfil não possui permissão de gestão de blog.");
  }

  return user;
}

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeRichHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function normalizeImageUrl(urlValue: string | null | undefined) {
  if (!urlValue) return null;

  const trimmed = urlValue.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("A URL da imagem de capa é inválida.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("A URL da imagem deve começar com http:// ou https://.");
  }

  return trimmed;
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

async function getUniqueSlug(baseValue: string, postIdToIgnore?: string) {
  const seed = toSlug(baseValue);
  const baseSlug = seed.length > 0 ? seed : "publicacao";

  let candidate = baseSlug;
  let index = 1;

  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === postIdToIgnore) {
      return candidate;
    }

    index += 1;
    candidate = `${baseSlug}-${index}`;
  }
}

function validatePayload(payload: BlogPayload) {
  if (!payload.title || payload.title.trim().length < 3) {
    throw new Error("O título deve ter pelo menos 3 caracteres.");
  }

  const sanitizedHtml = sanitizeRichHtml(payload.content || "");
  const contentText = stripHtml(sanitizedHtml);
  if (contentText.length < 20) {
    throw new Error("O conteúdo da publicação está muito curto.");
  }

  return {
    title: payload.title.trim(),
    sanitizedHtml,
    imageUrl: normalizeImageUrl(payload.imageUrl),
    published: payload.published === true,
    troopId: payload.troopId?.trim() ? payload.troopId.trim() : null,
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
  revalidatePath("/");
  revalidatePath("/blog");
  for (const slug of slugs) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function createBlogPost(payload: BlogPayload): Promise<BlogActionResult> {
  try {
    const user = await getAuthorizedUser();
    const parsed = validatePayload(payload);

    await assertTroopExists(parsed.troopId);

    const slug = await getUniqueSlug(payload.slug?.trim() || parsed.title);

    await prisma.blogPost.create({
      data: {
        title: parsed.title,
        slug,
        content: parsed.sanitizedHtml,
        imageUrl: parsed.imageUrl,
        published: parsed.published,
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
    await getAuthorizedUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, imageUrl: true, slug: true },
    });

    if (!existingPost) {
      throw new Error("A publicação selecionada não foi encontrada.");
    }

    const parsed = validatePayload(payload);
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
        published: parsed.published,
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
    await getAuthorizedUser();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, imageUrl: true, slug: true },
    });

    if (!existingPost) {
      throw new Error("A publicação já foi removida ou não existe mais.");
    }

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

export async function setBlogPostPublication(
  postId: string,
  published: boolean
): Promise<BlogActionResult> {
  try {
    await getAuthorizedUser();

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: { published },
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
