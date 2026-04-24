import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/src/components/Providers"; // 👈 Importação incluída

export const viewport: Viewport = {
  themeColor: "#1b4d3e", // O seu verde escoteiro
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita que a tela dê zoom indesejado ao focar em inputs no celular
};

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const BASE_URL = 'https://www.geamizade.org.br'; 

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest", // Linka com o arquivo que criamos
  
  appleWebApp: {
    capable: true,
    title: "GE Amizade",
    statusBarStyle: "default",
  },
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s',
    default: 'GE AMIZADE | Grupo Escoteiro Amizade 66/SP',
  },
  description: 'Grupo Escoteiro Amizade 66/SP - Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos em Taubaté!',
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
    'Acampamento',
  ],
  authors: [{ name: 'Grupo Escoteiro Amizade 66/SP' }],
  category: 'Non-profit Organization',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'GE AMIZADE | Grupo Escoteiro Amizade 66/SP',
    description: 'Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos!',
    url: '/',
    siteName: 'GE AMIZADE',
    images: [
      {
        url: '/hero-image.jpg', 
        width: 1200,
        height: 630,
        alt: 'GE AMIZADE - Grupo Escoteiro Amizade 66/SP',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GE AMIZADE | Grupo Escoteiro Amizade 66/SP',
    description: 'Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos!',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon-192x192.png', 
    apple: '/apple-icon.png',
  },
};

// Estrutura de Dados Estruturados (Schema.org) - Usando array para LocalBusiness e NGO
const schema = [
  {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "NGO"], 
    "@id": `${BASE_URL}/institucional`,
    "name": "GE AMIZADE - Grupo Escoteiro Amizade 66/SP",
    "url": BASE_URL,
    "logo": `${BASE_URL}/flor-de-lis.jpg`,
    "image": `${BASE_URL}/hero-image.jpg`,
    "description": "Grupo Escoteiro em Taubaté focado no desenvolvimento de jovens através do Método Escoteiro.",
    "telephone": "+55 12 3622-7084", 
    "priceRange": "$", 
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rua Kenzo Kajita, 272", 
      "addressLocality": "Taubaté",
      "addressRegion": "SP",
      "postalCode": "12062-240", 
      "addressCountry": "BR"
    },
    "areaServed": {
      "@type": "City",
      "name": "Taubaté",
    },
    "sameAs": [
      "https://www.instagram.com/amizade66sp/",
      "https://www.facebook.com/GEAmizade/",
    ]
  }
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body className={`${openSans.variable} ${montserrat.variable} font-sans text-gray-800 bg-gray-50 flex flex-col min-h-screen antialiased`}>
        <Providers> {/* 👈 Providers envolvendo o conteúdo */}
          <main className="grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}