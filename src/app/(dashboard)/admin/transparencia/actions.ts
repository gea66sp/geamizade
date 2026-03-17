"use server";

import { put, del } from "@vercel/blob";
import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ==========================================
// 1. CRIAR (Create)
// ==========================================
export async function createDocument(formData: FormData) {
  const title = formData.get("title") as string;
  const folder = formData.get("folder") as string;
  const file = formData.get("file") as File;

  if (!title || !folder || !file || file.size === 0) {
    throw new Error("Todos os campos são obrigatórios.");
  }

  const blob = await put(`transparencia/${folder}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true, 
  });

  await prisma.document.create({
    data: { title, folder, fileUrl: blob.url },
  });

  revalidatePath("/admin/transparencia");
  redirect("/admin/transparencia");
}

// ==========================================
// 2. ATUALIZAR (Update)
// ==========================================
export async function updateDocument(id: string, oldFileUrl: string, formData: FormData) {
  const title = formData.get("title") as string;
  const folder = formData.get("folder") as string;
  const file = formData.get("file") as File | null;

  let newFileUrl = oldFileUrl;

  // Se o usuário enviou um NOVO arquivo, deletamos o antigo e subimos o novo
  if (file && file.size > 0) {
    // Apaga o antigo do Vercel Blob
    await del(oldFileUrl);
    
    // Sobe o novo
    const blob = await put(`transparencia/${folder}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    newFileUrl = blob.url;
  }

  // Atualiza no banco de dados
  await prisma.document.update({
    where: { id },
    data: { title, folder, fileUrl: newFileUrl },
  });

  revalidatePath("/admin/transparencia");
  redirect("/admin/transparencia");
}

// ==========================================
// 3. EXCLUIR (Delete)
// ==========================================
export async function deleteDocument(id: string, fileUrl: string) {
  // 1. Apaga o arquivo físico do Vercel Blob
  await del(fileUrl);
  
  // 2. Apaga o registro do banco de dados
  await prisma.document.delete({
    where: { id },
  });

  // 3. Atualiza a página para refletir a exclusão
  revalidatePath("/admin/transparencia");
}