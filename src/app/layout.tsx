import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = 'https://www.geamizade.org.br/'; 

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    template: '%s | GE AMIZADE',
    default: 'GE AMIZADE | Grupo Escoteiro Amizade 66SP',
  },

  description:
    'Grupo Escoteiro Amizade 66SP - Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos!',

  keywords: [
    'GE AMIZADE',
    'Grupo Escoteiro Amizade',
    'Escotismo',
    'Escoteiros em Taubaté',
    'Escoteiros do Brasil',
    'Escoteiros',
    'Grupo Escoteiro em Taubaté',
    'Desenvolvimento de jovens',
    'Atividades escoteiras',
    'Valores escoteiros',
    'Grupo Escoteiro',
    'Acampamento',
  ],

  openGraph: {
    title: 'GE AMIZADE | Grupo Escoteiro Amizade 66SP',
    description:
      'Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos!',
    url: '/',
    siteName: 'GE AMIZADE',
    images: [
      {
        url: '/og-image.png', 
        width: 1200,
        height: 630,
        alt: 'GE AMIZADE - Grupo Escoteiro Amizade 66SP',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'GE AMIZADE | Grupo Escoteiro Amizade 66SP',
    description:
      'Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos!',
    images: ['/og-image.png'],
  },

  icons: {
    icon: '/favicon.ico', 
    apple: '/apple-icon.png',
  },
};

// Estrutura de Dados Estruturados (Schema.org) para Negócio Local
const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness", 
  "@id": `${BASE_URL}/#localbusiness`,
  "name": "GE AMIZADE",
  "url": BASE_URL,
  "logo": `${BASE_URL}/logo.png`,
  "image": `${BASE_URL}/og-image.png`,
  "description":
    "Grupo Escoteiro Amizade 66SP - Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos!",
  "telephone": "+55 12 3622-7084", 
  "priceRange": "Gratuito", 

  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Kenzo Kajita, 272", 
    "addressLocality": "Taubaté",
    "addressRegion": "SP",
    "postalCode": "12062-240", 
    "addressCountry": "BR"
  },

  "areaServed": [
    {
      "@type": "City",
      "name": "Taubaté",
    }
  ],
  
  // Redes Sociais (Preencha quando tiver)
  "sameAs": [
    "https://www.instagram.com/amizade66sp/",
    "https://www.facebook.com/GEAmizade/",
    "https://www.youtube.com/channel/UC58vnMAkyeTN7ATE_SwfkrQ"
    
  ],

  // Ofertas de Serviço Específicas para Taubaté 
  "makesOffer": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "@id": `${BASE_URL}/institucional`,
        "name": "Grupo Escoteiro em Taubaté",
        "description": "Grupo Escoteiro Amizade 66SP - Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos!",
        "areaServed": {
          "@type": "City",
          "name": "Taubaté",
        },
        "provider": {
          "@type": "ProfessionalService",
          "name": "GE AMIZADE",
          "image": `${BASE_URL}/logo.png`
        }
      }
    },
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        {/* Injeção do Schema JSON-LD para o Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      
      <body className={`${inter.variable} antialiased bg-black text-white font-sans`}>
        {children}
      </body>
    </html>
  );
}