import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.geamizade.org.br';
  const privatePaths = [
    '/api/',
    '/_next/',
    '/admin/',
    '/chefe/',
    '/membro/',
    '/responsavel/',
    '/login',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      ...['GPTBot', 'PerplexityBot', 'Google-Extended', 'ChatGPT-User'].map(
        (userAgent) => ({
          userAgent,
          allow: '/',
          disallow: privatePaths,
        }),
      ),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}