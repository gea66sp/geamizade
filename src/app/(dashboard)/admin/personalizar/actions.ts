"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob"; // Requer @vercel/blob instalado

export async function saveSiteSettings(formData: FormData) {
  // 1. Busca a configuração atual para saber se precisamos deletar imagens antigas
  const currentSettings = await prisma.homePageSettings.findFirst();

  // --- LÓGICA DE IMAGEM: HERO ---
  let finalHeroImageUrl = currentSettings?.heroImage || null;
  const heroImageMethod = formData.get("heroImageMethod") as "FILE" | "URL" | "KEEP";
  
  if (heroImageMethod === "FILE") {
    const file = formData.get("heroImageFile") as File;
    if (file && file.size > 0) {
      // Deleta a antiga do Vercel se existir
      if (finalHeroImageUrl?.includes("blob.vercel-storage.com")) await del(finalHeroImageUrl);
      const blob = await put(`site/hero-${Date.now()}-${file.name}`, file, { access: "public" });
      finalHeroImageUrl = blob.url;
    }
  } else if (heroImageMethod === "URL") {
    const externalUrl = formData.get("heroImageUrl") as string;
    // Deleta a antiga do Vercel se existir e estamos trocando por link externo
    if (finalHeroImageUrl?.includes("blob.vercel-storage.com")) await del(finalHeroImageUrl);
    finalHeroImageUrl = externalUrl;
  }

  // --- LÓGICA DE IMAGEM: ABOUT ---
  let finalAboutImageUrl = currentSettings?.aboutImage || null;
  const aboutImageMethod = formData.get("aboutImageMethod") as "FILE" | "URL" | "KEEP";
  
  if (aboutImageMethod === "FILE") {
    const file = formData.get("aboutImageFile") as File;
    if (file && file.size > 0) {
      if (finalAboutImageUrl?.includes("blob.vercel-storage.com")) await del(finalAboutImageUrl);
      const blob = await put(`site/about-${Date.now()}-${file.name}`, file, { access: "public" });
      finalAboutImageUrl = blob.url;
    }
  } else if (aboutImageMethod === "URL") {
    const externalUrl = formData.get("aboutImageUrl") as string;
    if (finalAboutImageUrl?.includes("blob.vercel-storage.com")) await del(finalAboutImageUrl);
    finalAboutImageUrl = externalUrl;
  }

  // 2. Salvar/Atualizar HomePageSettings (Usa upsert ou atualiza o first)
  const homeData = {
    heroTitle: formData.get("heroTitle") as string,
    heroShortText: formData.get("heroShortText") as string,
    heroImage: finalHeroImageUrl,
    aboutText: formData.get("aboutText") as string,
    aboutImage: finalAboutImageUrl,
    impactedYouthCount: parseInt(formData.get("impactedYouthCount") as string) || 0,
  };

  if (currentSettings) {
    await prisma.homePageSettings.update({ where: { id: currentSettings.id }, data: homeData });
  } else {
    await prisma.homePageSettings.create({ data: homeData });
  }

  // 3. Salvar FAQs (A forma mais segura de syncronizar listas no Prisma é deletar as antigas e criar novas, mantendo a ordem do array)
  const faqsJson = formData.get("faqs") as string;
  if (faqsJson) {
    const faqs = JSON.parse(faqsJson);
    
    // Limpa os antigos e insere os novos em transação
    await prisma.$transaction([
      prisma.faq.deleteMany({}),
      prisma.faq.createMany({
        data: faqs.map((f: any, index: number) => ({
          question: f.question,
          answer: f.answer,
          isActive: f.isActive,
          order: index, // O array já dita a ordem
        }))
      })
    ]);
  }

  revalidatePath("/admin/personalizar");
}