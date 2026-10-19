"use server";

import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

const ALLOWED_ROLES = new Set(["ADMIN", "DEVELOPER", "FINANCEIRO"]);
const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";

async function assertAuthorized() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Sua sessão expirou. Faça login novamente.");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || !ALLOWED_ROLES.has(user.role)) {
    throw new Error("Acesso negado. Você não pode gerenciar empresas parceiras.");
  }
}

function requiredText(formData: FormData, field: string, label: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`${label} é obrigatório.`);
  if (value.length > maxLength) throw new Error(`${label} excede o limite permitido.`);
  return value;
}

function optionalUrl(formData: FormData, field: string, label: string) {
  const raw = String(formData.get(field) ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} deve ser um link HTTP ou HTTPS válido.`);
  }
}

function optionalBlobUrl(formData: FormData) {
  const raw = String(formData.get("logoUrl") ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.endsWith(BLOB_HOST_SUFFIX)) throw new Error();
    return url.toString();
  } catch {
    throw new Error("O logotipo precisa ser um arquivo válido do Vercel Blob.");
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createPartnerCategory(formData: FormData) {
  await assertAuthorized();
  const name = requiredText(formData, "name", "O nome da categoria", 80);
  const slug = slugify(name);
  if (!slug) throw new Error("Informe um nome de categoria válido.");

  await prisma.partnerCategory.create({ data: { name, slug } });
  revalidatePath("/admin/empresas-parceiras");
  revalidatePath("/empresas-parceiras");
}

export async function deletePartnerCategory(id: string) {
  await assertAuthorized();
  const category = await prisma.partnerCategory.findUnique({
    where: { id },
    include: { _count: { select: { companies: true } } },
  });
  if (!category) throw new Error("Categoria não encontrada.");
  if (category._count.companies > 0) {
    throw new Error("Remova ou altere as empresas desta categoria antes de excluí-la.");
  }

  await prisma.partnerCategory.delete({ where: { id } });
  revalidatePath("/admin/empresas-parceiras");
  revalidatePath("/empresas-parceiras");
}

function partnerData(formData: FormData) {
  return {
    name: requiredText(formData, "name", "O nome da empresa", 120),
    description: requiredText(formData, "description", "A descrição", 500),
    websiteUrl: optionalUrl(formData, "websiteUrl", "O site"),
    instagramUrl: optionalUrl(formData, "instagramUrl", "O Instagram"),
    categoryId: requiredText(formData, "categoryId", "A categoria", 100),
    logoUrl: optionalBlobUrl(formData),
  };
}

export async function createPartnerCompany(formData: FormData) {
  await assertAuthorized();
  const data = partnerData(formData);
  const category = await prisma.partnerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new Error("A categoria selecionada não existe.");

  await prisma.partnerCompany.create({ data });
  revalidatePath("/admin/empresas-parceiras");
  revalidatePath("/empresas-parceiras");
}

export async function updatePartnerCompany(id: string, formData: FormData) {
  await assertAuthorized();
  const current = await prisma.partnerCompany.findUnique({ where: { id } });
  if (!current) throw new Error("Empresa parceira não encontrada.");

  const data = partnerData(formData);
  const category = await prisma.partnerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new Error("A categoria selecionada não existe.");

  await prisma.partnerCompany.update({ where: { id }, data });
  if (current.logoUrl && current.logoUrl !== data.logoUrl && current.logoUrl.includes(BLOB_HOST_SUFFIX)) {
    await del(current.logoUrl);
  }

  revalidatePath("/admin/empresas-parceiras");
  revalidatePath("/empresas-parceiras");
}

export async function deletePartnerCompany(id: string) {
  await assertAuthorized();
  const company = await prisma.partnerCompany.findUnique({ where: { id } });
  if (!company) throw new Error("Empresa parceira não encontrada.");

  await prisma.partnerCompany.delete({ where: { id } });
  if (company.logoUrl?.includes(BLOB_HOST_SUFFIX)) await del(company.logoUrl);

  revalidatePath("/admin/empresas-parceiras");
  revalidatePath("/empresas-parceiras");
}
