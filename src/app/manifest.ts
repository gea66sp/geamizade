import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grupo Escoteiro Amizade 66/SP',
    short_name: 'GE Amizade',
    description: 'Sistema e Portal do Grupo Escoteiro Amizade 66/SP',
    start_url: '/login',
    display: 'standalone', // ISSO AQUI É A MÁGICA: Esconde a barra do navegador!
    background_color: '#ffffff',
    theme_color: '#1b4d3e', // Substitua pelo tom exato do seu Verde Escoteiro
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}