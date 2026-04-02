import { MetadataRoute } from 'next';
import prisma from "@/src/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ATENÇÃO: Certifique-se de que não haja barra no final da URL base
  const baseUrl = 'https://www.geamizade.org.br'; 

  // 1. Definição das rotas estáticas públicas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly', // O site tem notícias e eventos, logo muda com frequência
      priority: 1.0,
    },
    {
      url: `${baseUrl}/portal-da-transparencia`,
      lastModified: new Date(),
      changeFrequency: 'daily', // Revalida a cada 60s, o Google deve olhar sempre
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly', // Uma tela de login quase nunca muda
      priority: 0.5,
    },
  ];

  // 2. Busca dinâmica das rotas de arquivos públicos no banco de dados
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  try {
    // Buscamos apenas os documentos que são públicos para expor ao Google
    const publicDocuments = await prisma.document.findMany({
      where: { isPublic: true },
      select: { id: true, createdAt: true }, // Trazemos apenas o necessário para performance
    });

    dynamicRoutes = publicDocuments.map((doc) => ({
      url: `${baseUrl}/portal-da-transparencia/arquivo/${doc.id}`,
      lastModified: doc.createdAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Erro ao buscar documentos para o sitemap:", error);
    // Em caso de falha no banco (build time), ele segue apenas com as rotas estáticas
  }

  // 3. Retorna a fusão das rotas estáticas com as rotas dinâmicas geradas
  return [...staticRoutes, ...dynamicRoutes];
}