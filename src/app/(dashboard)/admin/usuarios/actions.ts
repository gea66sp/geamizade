"use server";

import prisma from "@/src/lib/prisma"; 
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { Prisma, Role, Branch } from "@prisma/client";
import { del } from "@vercel/blob"; // Importação vital para a limpeza
import { getPrismaErrorCode } from "@/src/lib/errors";
import { canGrantRole } from "@/src/lib/userAccess";
import { assertPasswordPolicy, describeMissingRequirements, isPasswordValid } from "@/src/lib/passwordPolicy";
import { dispatchNotifications } from "@/src/lib/notifications";

// ==========================================
// CONFIGURAÇÕES DE SEGURANÇA
// Quem entra nesta área do admin. O CHEFE tem o próprio caminho de cadastro
// em /chefe/tropa, restrito a jovens da seção dele — ver src/lib/troopMembers.
//
// Qual CARGO cada um pode conceder é decidido por `canGrantRole`
// (src/lib/userAccess.ts), que é uma lista de permissão, não de negação.
// ==========================================
const ALLOWED_MANAGERS = ["ADMIN", "DEVELOPER", "FINANCEIRO"];

// ==========================================
// CRIAR USUÁRIO
// ==========================================
export async function createNewUser(formData: {
  name: string;
  email: string;
  password?: string;
  role: Role;
  branch?: Branch;
  familyTieIds?: string[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Sessão expirada. Por favor, faça login novamente." };
    }

    const currentUserRole = session.user.role as string;
    
    // 1ª TRAVA: Apenas gestão pode criar contas
    if (!ALLOWED_MANAGERS.includes(currentUserRole)) {
      return { success: false, error: "Acesso negado: Apenas a chefia e diretoria podem cadastrar novos membros." };
    }

    // 2ª TRAVA: o cargo pedido precisa estar na lista de permissão de quem pede
    if (!canGrantRole(currentUserRole, formData.role)) {
      return { success: false, error: `Acesso negado: Você não tem permissão para conceder o cargo de ${formData.role}.` };
    }

    if (formData.email) {
      const existingUser = await prisma.user.findFirst({ where: { email: { equals: formData.email.trim(), mode: "insensitive" } } });
      if (existingUser) return { success: false, error: "Já existe uma conta registrada com este e-mail no grupo." };
    }

    let hashedPassword = null;
    if (formData.password) {
      // Política única do sistema — ver src/lib/passwordPolicy.ts
      assertPasswordPolicy(formData.password);
      hashedPassword = await hash(formData.password, 12);
    }

    let guardianTiesConfig = {};
    let dependentTiesConfig = {};

    if (formData.familyTieIds && formData.familyTieIds.length > 0) {
      if (formData.role === "MEMBER") {
        guardianTiesConfig = {
          create: formData.familyTieIds.map((id) => ({ guardian: { connect: { id } } }))
        };
      } else if (formData.role === "RESPONSAVEL") {
        dependentTiesConfig = {
          create: formData.familyTieIds.map((id) => ({ dependent: { connect: { id } } }))
        };
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: hashedPassword,
        role: formData.role,
        branch: formData.branch || null,
        guardianTies: guardianTiesConfig,
        dependentTies: dependentTiesConfig,
      },
    });

    return { success: true, user: newUser };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return { success: false, error: "Ocorreu um erro interno ao salvar o registro no banco de dados." };
  }
}

// ==========================================
// BUSCAR DETALHES DO USUÁRIO
// ==========================================
export async function getUserFullDetails(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Sessão expirada." };

    // Apenas a própria pessoa ou a gestão pode ver os detalhes completos (como ficha médica)
    if (session.user.id !== userId && !ALLOWED_MANAGERS.includes(session.user.role as string)) {
      return { success: false, error: "Você não tem permissão para acessar o prontuário deste membro." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        guardianTies: { include: { guardian: true } },
        dependentTies: { include: { dependent: true } },
        personalDocs: { orderBy: { createdAt: 'desc' } },
        financials: { orderBy: { dueDate: 'desc' }, take: 5 },
        troop: true,
        managedTroops: true,
      },
    });

    if (!user) return { success: false, error: "A ficha do usuário não foi encontrada." };

    const sanitizedUser = {
      ...user,
      financials: user.financials.map(f => ({ ...f, amount: Number(f.amount) }))
    };

    return { success: true, user: sanitizedUser };
  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    return { success: false, error: "Erro interno de comunicação com o servidor." };
  }
}

// ==========================================
// ATUALIZAR USUÁRIO
// ==========================================
export async function updateUser(userId: string, formData: {
  name: string;
  email: string;
  password?: string;
  role: Role;
  branch?: Branch;
  familyTieIds?: string[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Sessão expirada." };

    const currentUserRole = session.user.role as string;
    
    if (!ALLOWED_MANAGERS.includes(currentUserRole)) {
      return { success: false, error: "Apenas a gestão do grupo pode alterar os dados de outros membros." };
    }

    if (!canGrantRole(currentUserRole, formData.role)) {
      return { success: false, error: `Você não possui autoridade para definir o cargo de ${formData.role}.` };
    }

    if (formData.email) {
      const existingUser = await prisma.user.findFirst({ where: { email: { equals: formData.email.trim(), mode: "insensitive" } } });
      if (existingUser && existingUser.id !== userId) {
        return { success: false, error: "Este e-mail já está sendo utilizado por outro membro." };
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      branch: formData.branch || null,
    };

    if (formData.password && formData.password.trim().length > 0) {
      assertPasswordPolicy(formData.password);
      updateData.password = await hash(formData.password, 12);
    }

    await prisma.$transaction(async (tx) => {
      await tx.familyTie.deleteMany({
        where: { OR: [{ guardianId: userId }, { dependentId: userId }] }
      });

      if (formData.familyTieIds && formData.familyTieIds.length > 0) {
        if (formData.role === "MEMBER") {
          await tx.familyTie.createMany({
            data: formData.familyTieIds.map(id => ({ guardianId: id, dependentId: userId }))
          });
        } else if (formData.role === "RESPONSAVEL") {
          await tx.familyTie.createMany({
            data: formData.familyTieIds.map(id => ({ guardianId: userId, dependentId: id }))
          });
        }
      }

      return tx.user.update({ where: { id: userId }, data: updateData });
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return { success: false, error: "Falha ao processar as atualizações no banco de dados." };
  }
}

// ==========================================
// DELETAR USUÁRIO (COM LIMPEZA DE NUVEM)
// ==========================================
export async function deleteUser(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Sessão expirada." };
    
    if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
      return { success: false, error: "Acesso restrito: Apenas a Diretoria pode excluir cadastros." };
    }
    
    if (session.user.id === userId) {
      return { success: false, error: "Por segurança, você não pode excluir sua própria conta diretiva." };
    }

    // 1. Busca os dados vinculados à nuvem antes de apagar o banco
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true, personalDocs: { select: { fileUrl: true } } }
    });

    if (!userToDelete) {
      return { success: false, error: "Usuário não localizado." };
    }

    // 2. Limpeza Física (Vercel Blob)
    try {
      if (userToDelete.image && userToDelete.image.includes('blob.vercel-storage')) {
        await del(userToDelete.image);
      }
      
      const docUrls = userToDelete.personalDocs.map(doc => doc.fileUrl);
      if (docUrls.length > 0) {
        await del(docUrls);
      }
    } catch (blobError) {
      console.warn("Falha ao apagar arquivos da nuvem. Prosseguindo com deleção do banco...", blobError);
    }

    // 3. Exclusão do Banco
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    
    // Tratamento específico de erro de Chave Estrangeira do Prisma (P2003)
    if (getPrismaErrorCode(error) === 'P2003') {
      return { 
        success: false, 
        error: "Bloqueio do Sistema: Este membro possui mensalidades, recibos ou materiais do almoxarifado atrelados ao nome dele. Remova esses vínculos ou repasse-os para outro responsável antes de excluir o cadastro." 
      };
    }
    
    return { success: false, error: "Erro crítico ao tentar remover o usuário." };
  }
}
// ==========================================
// REDEFINIR SENHA DE OUTRO USUÁRIO (DIRETORIA)
// ==========================================
// Restrito a ADMIN/DEVELOPER ou membros da Diretoria — é a operação que dá
// acesso à conta de outra pessoa, então não acompanha `ALLOWED_MANAGERS`
// (que inclui FINANCEIRO).
//
// A conta redefinida fica com `mustChangePassword: true`: quem redefiniu
// entrega uma senha provisória e o próprio dono escolhe a definitiva no
// primeiro acesso. Assim ninguém da Diretoria fica conhecendo a senha de uso.
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Sessão expirada. Faça login novamente." };
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, branch: true },
    });

    const isDiretoria =
      actor?.role === "ADMIN" || actor?.role === "DEVELOPER" || actor?.branch === "DIRETORIA";

    if (!isDiretoria) {
      return {
        success: false,
        error: "Acesso negado: apenas a Diretoria pode redefinir a senha de outro usuário.",
      };
    }

    // A validação da tela é conveniência; esta aqui é a barreira.
    if (!isPasswordValid(newPassword)) {
      return { success: false, error: describeMissingRequirements(newPassword) };
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    if (!target) return { success: false, error: "Usuário não encontrado." };

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: await hash(newPassword, 12),
        mustChangePassword: true,
      },
    });

    // A pessoa precisa saber que a senha dela mudou — se não foi ela quem
    // pediu, é sinal de que algo está errado e ela deve procurar a Diretoria.
    await dispatchNotifications({
      recipientUserIds: [userId],
      title: "Sua senha foi redefinida",
      message: `A Diretoria definiu uma nova senha provisória para a sua conta. No próximo acesso você precisará criar uma senha própria. Se não solicitou isso, procure a Diretoria.`,
      origin: "AUTO",
      senderId: actor.id,
      includeGuardians: false,
    });

    return { success: true, userName: target.name };
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return { success: false, error: "Falha ao redefinir a senha." };
  }
}
