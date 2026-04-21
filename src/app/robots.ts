import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.geamizade.org.br/'; 

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/admin/', '/chefe/', '/membro/', '/responsavel/' ], // Bloqueia rotas sensíveis e de backend
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}