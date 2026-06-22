"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { put, del } from "@vercel/blob";

export async function updateProfile(formData: FormData, userId: string) {
  try {
    // 1. Extração de Dados Pessoais
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const newPassword = formData.get("newPassword") as string;
    
    // Extração do arquivo de Imagem (Avatar)
    const imageFile = formData.get("image") as File | null;

    // 2. Objeto inicial de atualização do Usuário
    const userUpdateData: any = {
      name,
      phone,
    };

    // ==========================================
    // UPLOAD DE FOTO (Vercel Blob)
    // ==========================================
    // Só faz upload se o usuário selecionou uma nova imagem (size > 0)
    if (imageFile && imageFile.size > 0) {
      // Gera um nome único para não sobrescrever arquivos com mesmo nome
      const filename = `avatars/${userId}-${Date.now()}-${imageFile.name}`;
      
      const blob = await put(filename, imageFile, {
        access: 'public', // Permite que a imagem seja vista publicamente no site
      });

      // Adiciona a URL retornada pelo Vercel Blob ao objeto que vai para o banco
      userUpdateData.image = blob.url;
    }

    // ==========================================
    // ATUALIZAÇÃO DE SENHA
    // ==========================================
    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userUpdateData.password = hashedPassword;
    }

    // 3. Salva no banco de dados (Apenas o Usuário)
    await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    // 4. Revalida o cache da página de perfil
    revalidatePath("/perfil");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Falha de comunicação com o banco de dados ou erro no upload." };
  }
}

// Adicione no final do seu actions.ts

export async function uploadPersonalDocument(formData: FormData, userId: string) {
  try {
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file || file.size === 0) {
      return { success: false, error: "Nenhum arquivo selecionado." };
    }

    // 1. Gera um nome único e organizado para a pasta do Vercel Blob
    const filename = `documentos_pessoais/${userId}-${Date.now()}-${file.name}`;
    
    // 2. Faz o upload para o Vercel Blob
    const blob = await put(filename, file, {
      access: 'public', // O link será gerado, mas só mostraremos para quem tem acesso
    });

    // 3. Registra o documento no banco de dados vinculado ao usuário
    await prisma.document.create({
      data: {
        title: title,
        fileUrl: blob.url,
        size: file.size,
        ownerId: userId,
        isPublic: false,         // Proteção: não aparece no CMS público
        isRestrictedView: true,  // Proteção: apenas chefia/diretoria e o dono veem
      }
    });

    // 4. Atualiza a tela instantaneamente
    revalidatePath("/perfil");
    
    return { success: true };
  } catch (error) {
    console.error("Erro no upload do documento:", error);
    return { success: false, error: "Falha ao enviar o documento. Tente novamente." };
  }
}

export async function renamePersonalDocument(documentId: string, newTitle: string) {
  try {
    if (!newTitle || newTitle.trim() === "") {
      return { success: false, error: "O título não pode estar vazio." };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { title: newTitle },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Erro ao renomear documento:", error);
    return { success: false, error: "Falha ao renomear o documento." };
  }
}

export async function deletePersonalDocument(documentId: string, fileUrl: string) {
  try {
    // 1. Elimina o ficheiro fisicamente da nuvem do Vercel Blob
    if (fileUrl) {
      await del(fileUrl);
    }

    // 2. Elimina o registo da base de dados
    await prisma.document.delete({
      where: { id: documentId },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Erro ao eliminar documento:", error);
    return { success: false, error: "Falha ao eliminar o documento." };
  }
}