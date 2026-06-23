"use server";

import { del } from "@vercel/blob";
import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

// ==========================================
// CONFIGURAÇÕES E GRUPOS DE ACESSO
// ==========================================

// Papéis que possuem permissão geral de gestão (quando o item não for restrito)
const PERMITTED_MANAGEMENT_ROLES = ["ADMIN", "DEVELOPER", "FINANCEIRO", "CHEFE"];

// ==========================================
// FUNÇÕES AUXILIARES DE SEGURANÇA E DADOS
// ==========================================

async function getAuthUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Sua sessão expirou ou você não está autenticado. Por favor, faça login novamente para continuar.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("Usuário não encontrado no sistema. Entre em contato com o administrador.");
  }

  return user;
}

async function verifyEditPermission(
  user: { id: string; role: string },
  isRestrictedEdit: boolean,
  allowedEditorsIds: string[] = []
) {
  // Administradores e Desenvolvedores têm bypass total por segurança de infraestrutura
  if (user.role === "ADMIN" || user.role === "DEVELOPER") return;

  if (isRestrictedEdit) {
    const isAllowed = allowedEditorsIds.includes(user.id);
    if (!isAllowed) {
      throw new Error("Acesso negado: Este item possui restrições de edição e você não está na lista de editores autorizados.");
    }
  } else {
    if (!PERMITTED_MANAGEMENT_ROLES.includes(user.role)) {
      throw new Error("Acesso negado: Seu perfil atual não possui permissão administrativa para gerenciar arquivos do portal da transparência.");
    }
  }
}

const getSelectedUsers = (formData: FormData, fieldName: string) => {
  const ids = formData.getAll(fieldName) as string[];
  return ids.map((id) => ({ id }));
};

// ==========================================
// GERENCIAMENTO DE PASTAS (FOLDERS)
// ==========================================

export async function createFolder(formData: FormData) {
  const user = await getAuthUser();
  
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const parentId = formData.get("parentId") as string | null;
  
  const isPublic = formData.get("isPublic") === "true";
  const isRestrictedView = formData.get("isRestrictedView") === "true";
  const isRestrictedEdit = formData.get("isRestrictedEdit") === "true";

  if (!name || !name.trim()) {
    throw new Error("O nome da pasta é obrigatório e não pode conter apenas espaços.");
  }

  // VALIDAÇÃO: Impede pastas com nomes iguais no mesmo nível
  const existingFolder = await prisma.folder.findFirst({
    where: { name: name.trim(), parentId: parentId || null }
  });
  if (existingFolder) {
    throw new Error(`Conflito de nome: Já existe uma pasta chamada "${name.trim()}" neste local. Escolha um nome diferente.`);
  }

  if (parentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentId },
      include: { allowedEditors: { select: { id: true } } }
    });
    
    if (parentFolder) {
      await verifyEditPermission(
        user, 
        parentFolder.isRestrictedEdit, 
        parentFolder.allowedEditors.map(e => e.id)
      );
    }
  } else {
    if (user.role !== "ADMIN" && user.role !== "DEVELOPER" && user.role !== "FINANCEIRO") {
      throw new Error("Acesso negado: Apenas a diretoria executiva ou administradores podem criar pastas na raiz do portal.");
    }
  }

  await prisma.folder.create({
    data: {
      name: name.trim(),
      description,
      parentId: parentId || null,
      isPublic,
      isRestrictedView,
      isRestrictedEdit,
      allowedViewers: isRestrictedView ? { connect: getSelectedUsers(formData, "allowedViewers") } : undefined,
      allowedEditors: isRestrictedEdit ? { connect: getSelectedUsers(formData, "allowedEditors") } : undefined,
    },
  });

  revalidatePath("/admin/transparencia");
}

export async function createFolderInline(formData: FormData) {
  const user = await getAuthUser();
  
  const name = formData.get("name") as string;
  const parentId = formData.get("parentId") as string | null;

  if (!name || !name.trim()) {
    throw new Error("O nome da pasta é obrigatório.");
  }

  const existingFolder = await prisma.folder.findFirst({
    where: { name: name.trim(), parentId: parentId || null }
  });
  if (existingFolder) {
    throw new Error(`Conflito de nome: Já existe uma pasta chamada "${name.trim()}" neste local.`);
  }

  if (parentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentId },
      include: { allowedEditors: { select: { id: true } } }
    });
    
    if (parentFolder) {
      await verifyEditPermission(
        user, 
        parentFolder.isRestrictedEdit, 
        parentFolder.allowedEditors.map(e => e.id)
      );
    }
  } else {
    if (user.role !== "ADMIN" && user.role !== "DEVELOPER" && user.role !== "FINANCEIRO") {
      throw new Error("Acesso negado: Apenas a diretoria executiva ou administradores podem criar pastas na raiz do portal.");
    }
  }

  const newFolder = await prisma.folder.create({
    data: {
      name: name.trim(),
      parentId: parentId || null,
      isPublic: true,
    },
  });

  revalidatePath("/admin/transparencia");
  return { id: newFolder.id, name: newFolder.name };
}

export async function updateFolder(id: string, formData: FormData) {
  const user = await getAuthUser();

  const folder = await prisma.folder.findUnique({
    where: { id },
    include: { allowedEditors: { select: { id: true } } }
  });

  if (!folder) throw new Error("A pasta que você está tentando atualizar não foi encontrada.");

  await verifyEditPermission(user, folder.isRestrictedEdit, folder.allowedEditors.map(e => e.id));

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const parentId = formData.get("parentId") as string | null;
  
  const isPublic = formData.get("isPublic") === "true";
  const isRestrictedView = formData.get("isRestrictedView") === "true";
  const isRestrictedEdit = formData.get("isRestrictedEdit") === "true";

  if (!name || !name.trim()) throw new Error("O nome da pasta não pode ficar vazio.");

  const existingFolder = await prisma.folder.findFirst({
    where: { 
      name: name.trim(), 
      parentId: parentId || null,
      id: { not: id }
    }
  });
  if (existingFolder) {
    throw new Error(`Operação cancelada: Já existe outra pasta chamada "${name.trim()}" neste mesmo nível.`);
  }

  await prisma.$transaction([
    prisma.folder.update({
      where: { id },
      data: { allowedViewers: { set: [] }, allowedEditors: { set: [] } }
    }),
    prisma.folder.update({
      where: { id },
      data: {
        name: name.trim(),
        description,
        parentId: parentId || null,
        isPublic,
        isRestrictedView,
        isRestrictedEdit,
        allowedViewers: isRestrictedView ? { connect: getSelectedUsers(formData, "allowedViewers") } : undefined,
        allowedEditors: isRestrictedEdit ? { connect: getSelectedUsers(formData, "allowedEditors") } : undefined,
      },
    })
  ]);

  revalidatePath("/admin/transparencia");
}

export async function deleteFolder(id: string) {
  const user = await getAuthUser();

  const folder = await prisma.folder.findUnique({
    where: { id },
    include: { allowedEditors: { select: { id: true } } }
  });

  if (!folder) throw new Error("A pasta selecionada para exclusão não foi encontrada ou já foi removida.");

  await verifyEditPermission(user, folder.isRestrictedEdit, folder.allowedEditors.map(e => e.id));

  // Coleta recursiva de subpastas para limpar arquivos físicos no Vercel Blob
  const allFolders = await prisma.folder.findMany({ select: { id: true, parentId: true } });
  const foldersToDelete = new Set([id]);
  let added = true;
  
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && foldersToDelete.has(f.parentId) && !foldersToDelete.has(f.id)) {
        foldersToDelete.add(f.id);
        added = true;
      }
    }
  }

  const documentsToDelete = await prisma.document.findMany({
    where: { folderId: { in: Array.from(foldersToDelete) } },
    select: { fileUrl: true }
  });

  // Remove os arquivos físicos vinculados à árvore de diretórios
  const urlsToDelete = documentsToDelete.map(doc => doc.fileUrl);
  if (urlsToDelete.length > 0) {
    try {
      await del(urlsToDelete);
    } catch (e) {
      console.error("Aviso: Falha ao remover alguns arquivos físicos do Vercel Blob. Prosseguindo com o banco...", e);
    }
  }

  // O onDelete: Cascade do Prisma cuidará da remoção lógica de subpastas e registros de documentos
  await prisma.folder.delete({
    where: { id },
  });

  revalidatePath("/admin/transparencia");
}

// ==========================================
// GERENCIAMENTO DE DOCUMENTOS (CLIENT UPLOAD)
// ==========================================

export async function createDocument(formData: FormData) {
  const user = await getAuthUser();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const folderId = formData.get("folderId") as string | null;
  
  const fileUrl = formData.get("fileUrl") as string;
  const fileSize = Number(formData.get("fileSize") || 0);

  const isPublic = formData.get("isPublic") === "true";
  const isRestrictedView = formData.get("isRestrictedView") === "true";
  const isRestrictedEdit = formData.get("isRestrictedEdit") === "true";

  if (!title || !title.trim() || !fileUrl) {
    throw new Error("Informações incompletas: É obrigatório preencher o título e efetuar o upload do documento.");
  }

  if (folderId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { allowedEditors: { select: { id: true } } }
    });
    if (parentFolder) {
      await verifyEditPermission(user, parentFolder.isRestrictedEdit, parentFolder.allowedEditors.map(e => e.id));
    }
  } else if (user.role !== "ADMIN" && user.role !== "DEVELOPER") {
    throw new Error("Acesso negado: Apenas administradores do sistema podem publicar arquivos soltos na raiz.");
  }

  await prisma.document.create({
    data: { 
      title: title.trim(), 
      description,
      folderId: folderId || null, 
      fileUrl: fileUrl,
      size: fileSize,
      isPublic,
      isRestrictedView,
      isRestrictedEdit,
      allowedViewers: isRestrictedView ? { connect: getSelectedUsers(formData, "allowedViewers") } : undefined,
      allowedEditors: isRestrictedEdit ? { connect: getSelectedUsers(formData, "allowedEditors") } : undefined,
    },
  });

  revalidatePath("/admin/transparencia");
}

export async function updateDocument(id: string, oldFileUrl: string, formData: FormData) {
  const user = await getAuthUser();

  const document = await prisma.document.findUnique({
    where: { id },
    include: { allowedEditors: { select: { id: true } } }
  });

  if (!document) throw new Error("O documento que você deseja editar não existe ou foi removido.");

  await verifyEditPermission(user, document.isRestrictedEdit, document.allowedEditors.map(e => e.id));

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const folderId = formData.get("folderId") as string | null;
  
  const newFileUrl = formData.get("newFileUrl") as string | null;
  const newFileSize = Number(formData.get("newFileSize") || 0);

  const isPublic = formData.get("isPublic") === "true";
  const isRestrictedView = formData.get("isRestrictedView") === "true";
  const isRestrictedEdit = formData.get("isRestrictedEdit") === "true";

  if (!title || !title.trim()) throw new Error("O título do documento não pode ficar em branco.");

  let finalFileUrl = oldFileUrl;
  let finalSize = document.size;

  // Substituição física do arquivo se um novo upload foi realizado no cliente
  if (newFileUrl && newFileUrl !== oldFileUrl) {
    try {
      await del(oldFileUrl);
    } catch (e) {
      console.warn("Arquivo antigo não localizado no servidor de armazenamento, aplicando o novo link...", e);
    }
    
    finalFileUrl = newFileUrl;
    finalSize = newFileSize;
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: { allowedViewers: { set: [] }, allowedEditors: { set: [] } }
    }),
    prisma.document.update({
      where: { id },
      data: { 
        title: title.trim(), 
        description,
        folderId: folderId || null, 
        fileUrl: finalFileUrl,
        size: finalSize,
        isPublic,
        isRestrictedView,
        isRestrictedEdit,
        allowedViewers: isRestrictedView ? { connect: getSelectedUsers(formData, "allowedViewers") } : undefined,
        allowedEditors: isRestrictedEdit ? { connect: getSelectedUsers(formData, "allowedEditors") } : undefined,
      },
    })
  ]);

  revalidatePath("/admin/transparencia");
}

export async function deleteDocument(id: string, fileUrl: string) {
  const user = await getAuthUser();

  const document = await prisma.document.findUnique({
    where: { id },
    include: { allowedEditors: { select: { id: true } } }
  });

  if (!document) throw new Error("O documento selecionado não foi encontrado.");

  await verifyEditPermission(user, document.isRestrictedEdit, document.allowedEditors.map(e => e.id));

  try {
    await del(fileUrl);
  } catch (e) {
    console.error("Erro ao remover o arquivo físico do Vercel Blob:", e);
  }
  
  await prisma.document.delete({
    where: { id },
  });

  revalidatePath("/admin/transparencia");
}

// ==========================================
// FUNÇÕES DE MOVIMENTAÇÃO (EXPLORER)
// ==========================================

export async function moveItem(id: string, type: "folder" | "document", newParentId: string | null) {
  const user = await getAuthUser();

  if (type === "folder") {
    if (id === newParentId) {
      throw new Error("Movimentação inválida: Não é possível mover uma pasta para dentro dela mesma.");
    }
    
    // EVITA LOOP INFINITO: Valida se o destino escolhido não é uma subpasta da própria pasta movida
    let currentParentId = newParentId;
    while (currentParentId) {
      if (currentParentId === id) {
        throw new Error("Movimentação inválida: Você não pode mover uma pasta pai para dentro de uma de suas subpastas.");
      }
      const parent = await prisma.folder.findUnique({
        where: { id: currentParentId },
        select: { parentId: true }
      });
      currentParentId = parent?.parentId || null;
    }
    
    const currentFolder = await prisma.folder.findUnique({ 
      where: { id },
      include: { allowedEditors: { select: { id: true } } }
    });
    if (!currentFolder) throw new Error("A pasta selecionada não foi encontrada.");
    
    // Valida a permissão de quem está movendo a pasta
    await verifyEditPermission(user, currentFolder.isRestrictedEdit, currentFolder.allowedEditors.map(e => e.id));

    // Valida se há conflito de nome no destino
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: currentFolder.name,
        parentId: newParentId,
        id: { not: id }
      }
    });

    if (existingFolder) {
      throw new Error(`Conflito de movimentação: Já existe uma pasta chamada "${currentFolder.name}" no diretório de destino.`);
    }

    await prisma.folder.update({
      where: { id },
      data: { parentId: newParentId }
    });
    
  } else {
    const currentDoc = await prisma.document.findUnique({ 
      where: { id },
      include: { allowedEditors: { select: { id: true } } }
    });
    if (!currentDoc) throw new Error("O documento selecionado não foi encontrado.");

    await verifyEditPermission(user, currentDoc.isRestrictedEdit, currentDoc.allowedEditors.map(e => e.id));

    const existingDoc = await prisma.document.findFirst({
      where: {
        title: currentDoc.title,
        folderId: newParentId,
        id: { not: id }
      }
    });

    if (existingDoc) {
      throw new Error(`Conflito de movimentação: Já existe um arquivo chamado "${currentDoc.title}" no diretório de destino.`);
    }

    await prisma.document.update({
      where: { id },
      data: { folderId: newParentId }
    });
  }

  revalidatePath("/admin/transparencia");
}

export async function renameFolderInline(id: string, newName: string) {
  const user = await getAuthUser();
  
  if (!newName || !newName.trim()) throw new Error("O novo nome da pasta não pode ser vazio.");

  const folder = await prisma.folder.findUnique({ 
    where: { id }, 
    include: { allowedEditors: { select: { id: true } } } 
  });
  
  if (!folder) throw new Error("A pasta solicitada não foi localizada.");
  await verifyEditPermission(user, folder.isRestrictedEdit, folder.allowedEditors.map(e => e.id));

  const existingFolder = await prisma.folder.findFirst({
    where: { name: newName.trim(), parentId: folder.parentId, id: { not: id } }
  });
  
  if (existingFolder) {
    throw new Error(`Não foi possível renomear: O nome "${newName.trim()}" já está em uso neste nível.`);
  }

  await prisma.folder.update({
    where: { id },
    data: { name: newName.trim() }
  });

  revalidatePath("/admin/transparencia");
}