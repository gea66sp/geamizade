"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { getErrorMessage } from "@/src/lib/errors";
import { assertIsGuardianOf, getViewerContext } from "@/src/lib/guardian";
import prisma from "@/src/lib/prisma";
import { BLOB_ACCESS } from "@/src/lib/blobAccess";

// Server Actions da área do responsável. Cada uma revalida a sessão e chama
// assertIsGuardianOf ANTES de tocar o banco — actions são endpoints próprios e
// não herdam nenhuma proteção do layout.

const MAX_FILE_SIZE = 4 * 1024 * 1024; // Limite de payload da Vercel

async function requireContext() {
  const ctx = await getViewerContext();
  if (!ctx) throw new Error("Sua sessão expirou. Faça login novamente.");
  return ctx;
}

function revalidateDependent(dependentId: string) {
  revalidatePath("/responsavel");
  revalidatePath("/responsavel/dependentes");
  revalidatePath(`/responsavel/dependentes/${dependentId}`);
}

export async function uploadDependentDocumentAction(dependentId: string, formData: FormData) {
  try {
    const ctx = await requireContext();
    await assertIsGuardianOf(ctx, dependentId);

    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null)?.trim();

    if (!file || file.size === 0) {
      return { success: false as const, error: "Nenhum arquivo selecionado." };
    }
    if (!title) {
      return { success: false as const, error: "O título do documento é obrigatório." };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false as const,
        error: "O documento excede o limite de 4MB. Comprima o arquivo e tente novamente.",
      };
    }

    const filename = `documentos_pessoais/${dependentId}-${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    // Leitura pela rota autenticada /api/documentos/[id].
    const blob = await put(filename, file, { access: BLOB_ACCESS });

    try {
      await prisma.document.create({
        data: {
          title,
          // O dono é o JOVEM — o documento é dele, não de quem enviou. Registrar
          // o remetente mantém a rastreabilidade sem trocar a titularidade.
          ownerId: dependentId,
          description: `Enviado por ${ctx.user.name || "responsável"}`,
          fileUrl: blob.url,
          size: file.size,
          isPublic: false,
          isRestrictedView: true,
        },
      });
    } catch (dbError) {
      // Sem registro no banco o arquivo ficaria órfão, consumindo storage sem
      // nenhum vínculo — remove antes de propagar.
      try {
        await del(blob.url);
      } catch (e) {
        console.warn("Falha ao limpar arquivo órfão após erro no banco:", e);
      }
      throw dbError;
    }

    revalidateDependent(dependentId);
    return { success: true as const };
  } catch (error) {
    console.error("Erro ao enviar documento do dependente:", error);
    return { success: false as const, error: getErrorMessage(error, "Falha ao enviar o documento.") };
  }
}

export async function renameDependentDocumentAction(documentId: string, newTitle: string) {
  try {
    const ctx = await requireContext();

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { ownerId: true },
    });
    if (!document?.ownerId) {
      return { success: false as const, error: "Documento não encontrado." };
    }

    await assertIsGuardianOf(ctx, document.ownerId);

    const title = newTitle?.trim();
    if (!title) {
      return { success: false as const, error: "O título não pode ficar vazio." };
    }

    await prisma.document.update({ where: { id: documentId }, data: { title } });

    revalidateDependent(document.ownerId);
    return { success: true as const };
  } catch (error) {
    console.error("Erro ao renomear documento do dependente:", error);
    return { success: false as const, error: getErrorMessage(error, "Falha ao renomear o documento.") };
  }
}

export async function deleteDependentDocumentAction(documentId: string) {
  try {
    const ctx = await requireContext();

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { ownerId: true, fileUrl: true },
    });
    if (!document?.ownerId) {
      return { success: false as const, error: "Documento não encontrado." };
    }

    await assertIsGuardianOf(ctx, document.ownerId);

    if (document.fileUrl) {
      try {
        await del(document.fileUrl);
      } catch (e) {
        console.warn("Arquivo já não existia no Vercel Blob.", e);
      }
    }

    await prisma.document.delete({ where: { id: documentId } });

    revalidateDependent(document.ownerId);
    return { success: true as const };
  } catch (error) {
    console.error("Erro ao excluir documento do dependente:", error);
    return { success: false as const, error: getErrorMessage(error, "Falha ao excluir o documento.") };
  }
}
