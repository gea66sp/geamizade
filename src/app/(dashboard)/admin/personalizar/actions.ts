"use server";

import prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob"; // Requer @vercel/blob instalado

export async function saveSiteSettings(formData: FormData) {
  // ==========================================
  // 1. CONFIGURAÇÕES DA HOME PAGE
  // ==========================================
  const currentSettings = await prisma.homePageSettings.findFirst();

  // --- LÓGICA DE IMAGEM: HERO ---
  let finalHeroImageUrl = currentSettings?.heroImage || null;
  const heroImageMethod = formData.get("heroImageMethod") as "FILE" | "URL" | "KEEP";
  
  if (heroImageMethod === "FILE") {
    const file = formData.get("heroImageFile") as File;
    if (file && file.size > 0) {
      if (finalHeroImageUrl?.includes("blob.vercel-storage.com")) await del(finalHeroImageUrl);
      const blob = await put(`site/hero-${Date.now()}-${file.name}`, file, { access: "public" });
      finalHeroImageUrl = blob.url;
    }
  } else if (heroImageMethod === "URL") {
    const externalUrl = formData.get("heroImageUrl") as string;
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

  // Salvar/Atualizar HomePageSettings
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

  // ==========================================
  // 2. DÚVIDAS FREQUENTES (FAQs)
  // ==========================================
  const faqsJson = formData.get("faqs") as string;
  if (faqsJson) {
    const faqs = JSON.parse(faqsJson);
    
    await prisma.$transaction([
      prisma.faq.deleteMany({}),
      prisma.faq.createMany({
        data: faqs.map((f: any, index: number) => ({
          question: f.question,
          answer: f.answer,
          isActive: f.isActive,
          order: index, 
        }))
      })
    ]);
  }

  // ==========================================
  // 3. PÁGINA INSTITUCIONAL
  // ==========================================
  const currentInstSettings = await prisma.institutionalPage.findFirst();

  // --- LÓGICA DE IMAGEM: HISTÓRIA ---
  let finalHistoryImageUrl = currentInstSettings?.historyImage || "";
  const historyImageMethod = formData.get("historyImageMethod") as "FILE" | "URL" | "KEEP";
  
  if (historyImageMethod === "FILE") {
    const file = formData.get("historyImageFile") as File;
    if (file && file.size > 0) {
      if (finalHistoryImageUrl?.includes("blob.vercel-storage.com")) await del(finalHistoryImageUrl);
      const blob = await put(`site/history-${Date.now()}-${file.name}`, file, { access: "public" });
      finalHistoryImageUrl = blob.url;
    }
  } else if (historyImageMethod === "URL") {
    const externalUrl = formData.get("historyImageUrl") as string;
    if (finalHistoryImageUrl?.includes("blob.vercel-storage.com")) await del(finalHistoryImageUrl);
    finalHistoryImageUrl = externalUrl;
  }

  // Parse dos Arrays/JSON
  const statsData = JSON.parse((formData.get("stats") as string) || "[]");
  const historyParagraphsData = JSON.parse((formData.get("historyParagraphs") as string) || "[]");
  const valuesListData = JSON.parse((formData.get("valuesList") as string) || "[]");
  const boardMembersData = JSON.parse((formData.get("boardMembers") as string) || "[]");
  const testimonialsData = JSON.parse((formData.get("testimonials") as string) || "[]");

  const instData = {
    stats: statsData,
    historyImage: finalHistoryImageUrl,
    historyBadgeYear: (formData.get("historyBadgeYear") as string) || "",
    historyBadgeLabel: (formData.get("historyBadgeLabel") as string) || "",
    historySubtitle: (formData.get("historySubtitle") as string) || "",
    historyTitle: (formData.get("historyTitle") as string) || "",
    historyParagraphs: historyParagraphsData,
    compassTitle: (formData.get("compassTitle") as string) || "",
    compassSubtitle: (formData.get("compassSubtitle") as string) || "",
    missionText: (formData.get("missionText") as string) || "",
    visionText: (formData.get("visionText") as string) || "",
    valuesList: valuesListData,
  };

  let instPageId = currentInstSettings?.id;

  // Salva ou Atualiza a base da Página Institucional
  if (currentInstSettings) {
    await prisma.institutionalPage.update({ where: { id: instPageId }, data: instData });
  } else {
    const newInst = await prisma.institutionalPage.create({ data: instData });
    instPageId = newInst.id;
  }

  // --- LÓGICA DE RELACIONAMENTOS: DIRETORIA E DEPOIMENTOS ---
  if (instPageId) {
    await prisma.$transaction([
      // Deleta os antigos
      prisma.boardMember.deleteMany({ where: { pageId: instPageId } }),
      prisma.testimonial.deleteMany({ where: { pageId: instPageId } }),
      
      // Cria os novos Membros da Diretoria
      prisma.boardMember.createMany({
        data: boardMembersData.map((member: any) => ({
          pageId: instPageId as string,
          name: member.name || "",
          role: member.role || "",
          bio: member.bio || "",
          imageUrl: member.imageUrl || "",
        }))
      }),
      
      // Cria os novos Depoimentos
      prisma.testimonial.createMany({
        data: testimonialsData.map((testim: any) => ({
          pageId: instPageId as string,
          authorName: testim.authorName || "",
          authorRole: testim.authorRole || "",
          quote: testim.quote || "",
          rating: testim.rating || 5,
        }))
      })
    ]);
  }

  revalidatePath("/admin/personalizar");
}