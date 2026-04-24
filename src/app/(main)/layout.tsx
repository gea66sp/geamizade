import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
 
import '../globals.css';
import Navbar from '@/src/components/main/Navbar';
import Footer from '@/src/components/main/Footer';
import InstallPrompt from "@/src/components/main/InstallPrompt";

// 👇 Importando os novos componentes de Privacidade e Analytics
import CookieBanner from "@/src/components/CookieBanner";
import GoogleAnalytics from "@/src/components/GoogleAnalytics";

// Configuração das fontes do design original
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

const BASE_URL = 'https://www.geamizade.org.br';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s',
    default: 'GE AMIZADE | Grupo Escoteiro Amizade 66/SP',
  },
  description: 'Grupo Escoteiro Amizade 66/SP - Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos em Taubaté!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Ícones FontAwesome utilizados no Navbar, Hero e Footer */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      
      <body 
        className={`${openSans.variable} ${montserrat.variable} font-sans bg-stone-50 text-stone-800 antialiased min-h-screen flex flex-col`} 
        suppressHydrationWarning
      >
        {/* =========================================
            INJETOR INTELIGENTE DO GOOGLE ANALYTICS
            (Só ativa se o usuário aceitar no CookieBanner)
        ========================================= */}
        <GoogleAnalytics />

        <Navbar />
        
        <main className="grow">
          {children}
        </main>
        
        <Footer />
        
        {/* =========================================
            OVERLAYS E AVISOS (Flutuantes)
        ========================================= */}
        <InstallPrompt />
        <CookieBanner />

      </body>
    </html>
  );
}