// Helpers de blog compartilhados entre admin/blog/actions.ts e
// membro/blog/actions.ts. Não pode viver num arquivo "use server" porque
// esses arquivos só podem exportar Server Actions (funções async), e
// toSlug/stripHtml/sanitizeRichHtml são funções síncronas.
import prisma from "@/src/lib/prisma";

export function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function sanitizeRichHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function normalizeImageUrl(urlValue: string | null | undefined) {
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

export async function getUniqueSlug(baseValue: string, postIdToIgnore?: string) {
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
