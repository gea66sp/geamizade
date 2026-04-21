"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob"; // Importação do Vercel Blob

export async function updateProfile(formData: FormData, userId: string) {
  try {
    // 1. Extração de Dados Pessoais
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const newPassword = formData.get("newPassword") as string;
    
    // Extração do arquivo de Imagem
    const imageFile = formData.get("image") as File | null;

    // 2. Extração de Dados da Ficha Médica
    const bloodType = formData.get("bloodType") as string;
    const healthInsurance = formData.get("healthInsurance") as string;
    const emergencyContact = formData.get("emergencyContact") as string;
    const allergies = formData.get("allergies") as string;
    const continuousMeds = formData.get("continuousMeds") as string;
    const dietaryRestrictions = formData.get("dietaryRestrictions") as string;

    // 3. Objeto inicial de atualização do Usuário
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

    // 4. Salva no banco de dados (Transação)
    await prisma.$transaction(async (tx) => {
      // Atualiza Usuário
      await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
      });

      // Upsert Ficha Médica: Atualiza se existir, Cria se não existir
      await tx.medicalRecord.upsert({
        where: { userId: userId },
        update: {
          bloodType,
          healthInsurance,
          emergencyContact,
          allergies,
          continuousMeds,
          dietaryRestrictions,
        },
        create: {
          userId: userId,
          bloodType,
          healthInsurance,
          emergencyContact,
          allergies,
          continuousMeds,
          dietaryRestrictions,
        },
      });
    });

    // 5. Revalida o cache da página de perfil e possivelmente a de usuários (se o admin for ver)
    revalidatePath("/perfil");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Falha de comunicação com o banco de dados ou erro no upload." };
  }
}