import { MetadataRoute } from 'next';
import prisma from '@/src/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.geamizade.org.br';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portal-da-transparencia`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/institucional`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tropas`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/empresas-parceiras`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacidade`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const [publicDocuments, publishedPosts] = await Promise.all([
      prisma.document.findMany({
        where: { isPublic: true },
        select: { id: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const documentRoutes = publicDocuments.map((doc): MetadataRoute.Sitemap[number] => ({
      url: `${baseUrl}/portal-da-transparencia/arquivo/${doc.id}`,
      lastModified: doc.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    const blogRoutes = publishedPosts.map((post): MetadataRoute.Sitemap[number] => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    dynamicRoutes = [...documentRoutes, ...blogRoutes];
  } catch (error) {
    console.error('Erro ao buscar rotas dinâmicas para o sitemap:', error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}