"use server";

import { put, del } from "@vercel/blob";
import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

// ==========================================
// FUNÇÕES AUXILIARES DE SEGURANÇA E DADOS
// ==========================================

async function getAuthUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Usuário não autenticado. Faça login para continuar.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("Usuário não encontrado no banco de dados.");
  }

  return user;
}

async function verifyEditPermission(
  user: { id: string; role: string },
  isRestrictedEdit: boolean,
  allowedEditorsIds: string[] = []
) {
  if (isRestrictedEdit) {
    const isAllowed = allowedEditorsIds.includes(user.id);
    if (!isAllowed) {
      throw new Error("Acesso negado: Você não tem permissão específica para gerenciar este item.");
    }
  } else {
    if (user.role !== "ADMIN") {
      throw new Error("Acesso negado: Apenas administradores podem gerenciar o portal da transparência.");
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

  if (!name) throw new Error("O nome da pasta é obrigatório.");

  // VALIDAÇÃO: Impede pastas com nomes iguais no mesmo nível
  const existingFolder = await prisma.folder.findFirst({
    where: { name: name.trim(), parentId: parentId || null }
  });
  if (existingFolder) throw new Error(`Já existe uma pasta chamada "${name.trim()}" neste local.`);

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
    if (user.role !== "ADMIN") throw new Error("Apenas administradores podem criar pastas na raiz.");
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

  if (!name) throw new Error("O nome da pasta é obrigatório.");

  // VALIDAÇÃO: Impede pastas com nomes iguais no mesmo nível
  const existingFolder = await prisma.folder.findFirst({
    where: { name: name.trim(), parentId: parentId || null }
  });
  if (existingFolder) throw new Error(`Já existe uma pasta chamada "${name.trim()}" neste local.`);

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
    if (user.role !== "ADMIN") throw new Error("Apenas administradores podem criar pastas na raiz.");
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

  if (!folder) throw new Error("Pasta não encontrada.");

  await verifyEditPermission(user, folder.isRestrictedEdit, folder.allowedEditors.map(e => e.id));

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const parentId = formData.get("parentId") as string | null;
  
  const isPublic = formData.get("isPublic") === "true";
  const isRestrictedView = formData.get("isRestrictedView") === "true";
  const isRestrictedEdit = formData.get("isRestrictedEdit") === "true";

  // VALIDAÇÃO: Impede renomear para um nome que já existe no mesmo nível (ignorando a própria pasta)
  const existingFolder = await prisma.folder.findFirst({
    where: { 
      name: name.trim(), 
      parentId: parentId || null,
      id: { not: id } // Ignora a pasta atual na busca
    }
  });
  if (existingFolder) throw new Error(`Já existe uma pasta chamada "${name.trim()}" neste local.`);

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

  if (!folder) throw new Error("Pasta não encontrada.");

  await verifyEditPermission(user, folder.isRestrictedEdit, folder.allowedEditors.map(e => e.id));

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

  const urlsToDelete = documentsToDelete.map(doc => doc.fileUrl);
  if (urlsToDelete.length > 0) {
    await del(urlsToDelete);
  }

  await prisma.folder.delete({
    where: { id },
  });

  revalidatePath("/admin/transparencia");
}

// ==========================================
// GERENCIAMENTO DE DOCUMENTOS
// ==========================================

export async function createDocument(formData: FormData) {
  const user = await getAuthUser();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const folderId = formData.get("folderId") as string | null;
  const file = formData.get("file") as File;

  const isPublic = formData.get("isPublic") === "true";
  const isRestrictedView = formData.get("isRestrictedView") === "true";
  const isRestrictedEdit = formData.get("isRestrictedEdit") === "true";

  if (!title || !file || file.size === 0) {
    throw new Error("Título e Arquivo são obrigatórios.");
  }

  if (folderId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { allowedEditors: { select: { id: true } } }
    });
    if (parentFolder) {
      await verifyEditPermission(user, parentFolder.isRestrictedEdit, parentFolder.allowedEditors.map(e => e.id));
    }
  } else if (user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem fazer upload na raiz.");
  }

  const blob = await put(`transparencia/arquivos/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true, 
  });

  await prisma.document.create({
    data: { 
      title, 
      description,
      folderId: folderId || null, 
      fileUrl: blob.url,
      size: file.size,
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

  if (!document) throw new Error("Documento não encontrado.");

  await verifyEditPermission(user, document.isRestrictedEdit, document.allowedEditors.map(e => e.id));

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const folderId = formData.get("folderId") as string | null;
  const file = formData.get("file") as File | null;

  const isPublic = formData.get("isPublic") === "true";
  const isRestrictedView = formData.get("isRestrictedView") === "true";
  const isRestrictedEdit = formData.get("isRestrictedEdit") === "true";

  let newFileUrl = oldFileUrl;

  if (file && file.size > 0) {
    try {
      await del(oldFileUrl);
    } catch (e) {
      console.warn("Arquivo antigo não encontrado no Blob, prosseguindo com o upload...", e);
    }
    
    const blob = await put(`transparencia/arquivos/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    newFileUrl = blob.url;
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: { allowedViewers: { set: [] }, allowedEditors: { set: [] } }
    }),
    prisma.document.update({
      where: { id },
      data: { 
        title, 
        description,
        folderId: folderId || null, 
        fileUrl: newFileUrl,
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

  if (!document) throw new Error("Documento não encontrado.");

  await verifyEditPermission(user, document.isRestrictedEdit, document.allowedEditors.map(e => e.id));

  try {
    await del(fileUrl);
  } catch (e) {
    console.error("Erro ao deletar do Vercel Blob:", e);
  }
  
  await prisma.document.delete({
    where: { id },
  });

  revalidatePath("/admin/transparencia");
}

// ==========================================
// FUNÇÕES DE MOVER (EXPLORER)
// ==========================================

export async function moveItem(id: string, type: "folder" | "document", newParentId: string | null) {
  const user = await getAuthUser();
  // Idealmente, você chamaria a verifyEditPermission aqui para o item sendo movido.

  if (type === "folder") {
    // Regra para evitar que uma pasta seja movida para dentro dela mesma
    if (id === newParentId) throw new Error("A pasta não pode ser movida para dentro dela mesma.");
    
    // 1. Pega o nome da pasta que está sendo movida
    const currentFolder = await prisma.folder.findUnique({ where: { id } });
    if (!currentFolder) throw new Error("Pasta não encontrada.");

    // 2. Verifica se já existe uma pasta com o mesmo nome no local de destino
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: currentFolder.name,
        parentId: newParentId,
        id: { not: id } // Evita barrar se o usuário tentar mover pro exato mesmo lugar onde já está
      }
    });

    if (existingFolder) {
      throw new Error(`Já existe uma pasta chamada "${currentFolder.name}" neste local.`);
    }

    // 3. Efetua a mudança
    await prisma.folder.update({
      where: { id },
      data: { parentId: newParentId }
    });
    
  } else {
    // Mesma lógica de validação para Documentos
    const currentDoc = await prisma.document.findUnique({ where: { id } });
    if (!currentDoc) throw new Error("Documento não encontrado.");

    const existingDoc = await prisma.document.findFirst({
      where: {
        title: currentDoc.title,
        folderId: newParentId,
        id: { not: id }
      }
    });

    if (existingDoc) {
      throw new Error(`Já existe um arquivo chamado "${currentDoc.title}" neste local.`);
    }

    await prisma.document.update({
      where: { id },
      data: { folderId: newParentId }
    });
  }

  revalidatePath("/admin/transparencia");
}

// Adicione isso no final do seu actions.ts
export async function renameFolderInline(id: string, newName: string) {
  const user = await getAuthUser();
  const folder = await prisma.folder.findUnique({ 
    where: { id }, include: { allowedEditors: { select: { id: true } } } 
  });
  
  if (!folder) throw new Error("Pasta não encontrada.");
  await verifyEditPermission(user, folder.isRestrictedEdit, folder.allowedEditors.map(e => e.id));

  const existingFolder = await prisma.folder.findFirst({
    where: { name: newName.trim(), parentId: folder.parentId, id: { not: id } }
  });
  
  if (existingFolder) throw new Error(`Já existe uma pasta chamada "${newName.trim()}" neste local.`);

  await prisma.folder.update({
    where: { id },
    data: { name: newName.trim() }
  });

  revalidatePath("/admin/transparencia");
}