"use server";

import prisma from "@/src/lib/prisma"; 
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { Role, Branch } from "@prisma/client";

export async function createNewUser(formData: {
  name: string;
  email: string;
  password?: string;
  role: Role;
  branch?: Branch;
  familyTieIds?: string[]; // Array de IDs para vincular responsáveis/jovens
}) {
  try {
    // 1. Verificação de Segurança (Sessão)
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Não autorizado. Faça login." };
    }

    const currentUserRole = session.user.role as Role;

    // 2. Validação de Regras de Negócio
    const restrictedRoles: Role[] = ["ADMIN", "DEVELOPER", "FINANCEIRO"];
    if (currentUserRole !== "ADMIN" && restrictedRoles.includes(formData.role)) {
      return { 
        success: false, 
        error: "Você não tem permissão para criar usuários com este cargo." 
      };
    }

    // 3. Verifica se o e-mail já existe
    if (formData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: formData.email },
      });
      if (existingUser) {
        return { success: false, error: "Este e-mail já está em uso." };
      }
    }

    // 4. Criptografia da Senha
    let hashedPassword = null;
    if (formData.password) {
      hashedPassword = await hash(formData.password, 12);
    }

    // 5. Prepara a lógica da Tabela Intermediária (FamilyTies)
    let guardianTiesConfig = {};
    let dependentTiesConfig = {};

    if (formData.familyTieIds && formData.familyTieIds.length > 0) {
      if (formData.role === "MEMBER") {
        // Se o novo usuário é um JOVEM, os IDs que vieram são dos seus RESPONSÁVEIS
        guardianTiesConfig = {
          create: formData.familyTieIds.map((id) => ({
            guardian: { connect: { id } }
          }))
        };
      } else if (formData.role === "RESPONSAVEL") {
        // Se o novo usuário é um RESPONSÁVEL, os IDs que vieram são dos JOVENS dele
        dependentTiesConfig = {
          create: formData.familyTieIds.map((id) => ({
            dependent: { connect: { id } }
          }))
        };
      }
    }

    // 6. Salva no Banco de Dados (Tudo em uma única transação)
    const newUser = await prisma.user.create({
      data: {
        name: formData.name,
        email: formData.email,
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
    return { success: false, error: "Ocorreu um erro interno ao criar o usuário." };
  }
}

// Adicione isso no seu arquivo actions.ts

export async function getUserFullDetails(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Não autorizado." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Traz os vínculos familiares (Pais/Filhos)
        guardianTies: { include: { guardian: true } },
        dependentTies: { include: { dependent: true } },
        // Traz informações dos módulos
        medicalRecord: true,
        progressions: { orderBy: { earnedDate: 'desc' } },
        financials: { orderBy: { dueDate: 'desc' }, take: 5 }, // Últimas 5 transações
        troop: true,
        managedTroops: true,
      },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado." };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    return { success: false, error: "Erro interno ao buscar ficha do usuário." };
  }
}

// Adicione no final do seu actions.ts

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
    if (!session || !session.user) return { success: false, error: "Não autorizado." };

    const currentUserRole = session.user.role as Role;
    const restrictedRoles: Role[] = ["ADMIN", "DEVELOPER", "FINANCEIRO"];
    if (currentUserRole !== "ADMIN" && restrictedRoles.includes(formData.role)) {
      return { success: false, error: "Você não tem permissão para atribuir este cargo." };
    }

    // Verifica se o e-mail já existe em OUTRO usuário
    if (formData.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: formData.email } });
      if (existingUser && existingUser.id !== userId) {
        return { success: false, error: "Este e-mail já está em uso por outra pessoa." };
      }
    }

    let updateData: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      branch: formData.branch || null,
    };

    if (formData.password) {
      updateData.password = await hash(formData.password, 12);
    }

    // Usamos uma Transação para garantir que os vínculos familiares sejam atualizados perfeitamente
    await prisma.$transaction(async (tx) => {
      // 1. Apaga todos os vínculos antigos desse usuário (para evitar duplicatas ou erros ao mudar de cargo)
      await tx.familyTie.deleteMany({
        where: { OR: [{ guardianId: userId }, { dependentId: userId }] }
      });

      // 2. Cria os novos vínculos
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

      // 3. Atualiza os dados principais
      return tx.user.update({ where: { id: userId }, data: updateData });
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return { success: false, error: "Ocorreu um erro interno ao atualizar o usuário." };
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Não autorizado." };
    if (session.user.role !== "ADMIN") return { success: false, error: "Apenas a Diretoria pode excluir usuários." };
    if (session.user.id === userId) return { success: false, error: "Você não pode excluir sua própria conta." };

    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return { success: false, error: "Erro ao excluir. Verifique se o usuário não possui pendências financeiras ou registros bloqueantes." };
  }
}