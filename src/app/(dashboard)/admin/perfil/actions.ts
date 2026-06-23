"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

// ==========================================
// FUNÇÃO AUXILIAR DE SEGURANÇA
// ==========================================
async function getSecureUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Não autorizado. Sessão expirou.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, image: true, role: true }
  });

  if (!user) throw new Error("Usuário não encontrado.");
  return user;
}

// ==========================================
// AÇÕES DE PERFIL
// ==========================================

export async function updateProfile(formData: FormData, id: any) {
  try {
    // 1. Identificação Segura (Ignora qualquer ID vindo do frontend)
    const currentUser = await getSecureUser();
    const userId = currentUser.id;

    // 2. Extração de Dados Pessoais
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const newPassword = formData.get("newPassword") as string;
    const imageFile = formData.get("image") as File | null;

    // Objeto inicial de atualização
    const userUpdateData: any = {
      name,
      phone,
    };

    // ==========================================
    // UPLOAD DE FOTO E LIMPEZA DA ANTIGA
    // ==========================================
    if (imageFile && imageFile.size > 0) {
      // Trava de segurança para evitar crash da Vercel (limite de 4.5MB na rede)
      if (imageFile.size > 3 * 1024 * 1024) {
        return { success: false, error: "A imagem de perfil deve ter no máximo 3MB." };
      }

      // Exclui a imagem antiga do Blob para não gerar custo de armazenamento fantasma
      if (currentUser.image && currentUser.image.includes('public.blob.vercel-storage.com')) {
        try { await del(currentUser.image); } catch (e) { console.warn("Erro ao apagar avatar antigo:", e); }
      }

      const filename = `avatars/${userId}-${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const blob = await put(filename, imageFile, { access: 'public' });
      userUpdateData.image = blob.url;
    }

    // ==========================================
    // ATUALIZAÇÃO DE SENHA
    // ==========================================
    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userUpdateData.password = hashedPassword;
    }

    // 3. Salva no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: error.message || "Falha ao processar a atualização do perfil." };
  }
}

// ==========================================
// AÇÕES DE DOCUMENTOS PESSOAIS
// ==========================================

export async function uploadPersonalDocument(formData: FormData) {
  try {
    const currentUser = await getSecureUser();
    const userId = currentUser.id;

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file || file.size === 0) {
      return { success: false, error: "Nenhum arquivo selecionado." };
    }

    if (!title || title.trim() === "") {
      return { success: false, error: "O título do documento é obrigatório." };
    }

    // Trava de 4MB para evitar crash do payload na Vercel (Serverless Limit)
    // Se precisar de arquivos maiores, este método deve ser migrado para Client Upload
    if (file.size > 4 * 1024 * 1024) {
      return { success: false, error: "O documento excede o limite de 4MB. Comprima o arquivo e tente novamente." };
    }

    const filename = `documentos_pessoais/${userId}-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    
    const blob = await put(filename, file, { access: 'public' });

    await prisma.document.create({
      data: {
        title: title.trim(),
        fileUrl: blob.url,
        size: file.size,
        ownerId: userId,
        isPublic: false,         
        isRestrictedView: true,  
      }
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error: any) {
    console.error("Erro no upload do documento:", error);
    return { success: false, error: error.message || "Falha ao enviar o documento. Tente novamente." };
  }
}

export async function renamePersonalDocument(documentId: string, newTitle: string) {
  try {
    const currentUser = await getSecureUser();

    if (!newTitle || newTitle.trim() === "") {
      return { success: false, error: "O título não pode ficar vazio." };
    }

    // VERIFICAÇÃO DE PROPRIEDADE: Garante que o documento existe e pertence à pessoa
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) return { success: false, error: "Documento não encontrado." };
    if (document.ownerId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { success: false, error: "Acesso negado: Você não tem permissão para alterar este documento." };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { title: newTitle.trim() },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao renomear documento:", error);
    return { success: false, error: error.message || "Falha ao renomear o documento." };
  }
}

export async function deletePersonalDocument(documentId: string, fileUrl: string) {
  try {
    const currentUser = await getSecureUser();

    // VERIFICAÇÃO DE PROPRIEDADE
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) return { success: false, error: "Documento não encontrado." };
    if (document.ownerId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { success: false, error: "Acesso negado: Você não pode excluir um documento que não é seu." };
    }

    if (fileUrl) {
      try { await del(fileUrl); } catch (e) { console.warn("Arquivo já não existia no Vercel Blob.", e); }
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao eliminar documento:", error);
    return { success: false, error: error.message || "Falha ao eliminar o documento." };
  }
}