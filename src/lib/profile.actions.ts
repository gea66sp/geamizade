"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/src/lib/auth";
import { getErrorMessage } from "@/src/lib/errors";
import { BLOB_ACCESS } from "@/src/lib/blobAccess";
import { assertPasswordPolicy, describeMissingRequirements, isPasswordValid } from "@/src/lib/passwordPolicy";

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

// Não recebe id: o usuário é sempre derivado da sessão. Um parâmetro de id
// aqui seria uma armadilha — pareceria autoritativo sem nunca ser usado.
export async function updateProfile(formData: FormData) {
  try {
    const currentUser = await getSecureUser();
    const userId = currentUser.id;

    // 2. Extração de Dados Pessoais
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const newPassword = formData.get("newPassword") as string;
    const imageFile = formData.get("image") as File | null;

    // Objeto inicial de atualização
    const userUpdateData: Prisma.UserUpdateInput = {
      name,
      phone,
    };

    // ==========================================
    // UPLOAD DE FOTO E LIMPEZA DA ANTIGA
    // ==========================================
    // Guarda a referência antiga para só apagá-la depois que a troca for
    // confirmada no banco (evitar ficar com uma URL quebrada caso o update falhe).
    let oldImageToDelete: string | null = null;

    if (imageFile && imageFile.size > 0) {
      // Trava de segurança para evitar crash da Vercel (limite de 4.5MB na rede)
      if (imageFile.size > 3 * 1024 * 1024) {
        return { success: false, error: "A imagem de perfil deve ter no máximo 3MB." };
      }

      const filename = `avatars/${userId}-${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const blob = await put(filename, imageFile, { access: 'public' });
      userUpdateData.image = blob.url;

      if (currentUser.image && currentUser.image.includes('public.blob.vercel-storage.com')) {
        oldImageToDelete = currentUser.image;
      }
    }

    // ==========================================
    // ATUALIZAÇÃO DE SENHA
    // ==========================================
    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword !== (formData.get("confirmNewPassword") as string)) {
        return { success: false, error: "As senhas não conferem." };
      }
      assertPasswordPolicy(newPassword);
      // 12 rounds, alinhado com os demais pontos que gravam senha.
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      userUpdateData.password = hashedPassword;
    }

    // 3. Salva no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    // Só agora, com a troca confirmada no banco, apaga a imagem antiga do Blob
    // para não gerar custo de armazenamento fantasma nem deixar referência quebrada.
    if (oldImageToDelete) {
      try { await del(oldImageToDelete); } catch (e) { console.warn("Erro ao apagar avatar antigo:", e); }
    }

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao processar a atualização do perfil.") };
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

    // Aqui entram fichas médicas, autorizações e carteirinhas. O download
    // passa por /api/documentos/[id], que confere dono, responsável legal ou
    // gestão. BLOB_ACCESS vira "private" assim que o store privado existir —
    // ver src/lib/blobAccess.ts.
    const blob = await put(filename, file, { access: BLOB_ACCESS });

    try {
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
    } catch (dbError) {
      // Se o registro não pôde ser criado, remove o arquivo já enviado para não
      // deixá-lo órfão (consumindo armazenamento sem nenhum vínculo no banco).
      try { await del(blob.url); } catch (e) { console.warn("Erro ao limpar arquivo órfão após falha no banco:", e); }
      throw dbError;
    }

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Erro no upload do documento:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao enviar o documento. Tente novamente.") };
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
  } catch (error) {
    console.error("Erro ao renomear documento:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao renomear o documento.") };
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
  } catch (error) {
    console.error("Erro ao eliminar documento:", error);
    return { success: false, error: getErrorMessage(error, "Falha ao eliminar o documento.") };
  }
}
// ==========================================
// TROCA DE SENHA OBRIGATÓRIA
// ==========================================
// Usada pela barreira ForcePasswordChange, para contas criadas por terceiros
// (ex: o chefe cadastrando um jovem) que nascem com senha provisória.
export async function changeOwnPasswordAction(password: string, confirm: string) {
  try {
    const currentUser = await getSecureUser();

    if (!isPasswordValid(password)) {
      return { success: false as const, error: describeMissingRequirements(password) };
    }
    if (password !== confirm) {
      return { success: false as const, error: "As senhas não conferem." };
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        password: await bcrypt.hash(password, 12),
        // Derruba a barreira. É lida do banco a cada requisição, então o
        // acesso é liberado no próximo carregamento — sem renovar a sessão.
        mustChangePassword: false,
      },
    });

    return { success: true as const };
  } catch (error) {
    console.error("Erro ao trocar a senha:", error);
    return { success: false as const, error: getErrorMessage(error, "Falha ao salvar a nova senha.") };
  }
}
