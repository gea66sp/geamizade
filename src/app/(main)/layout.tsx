import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import Script from 'next/script'; 
import '../globals.css';
import Navbar from '@/src/components/main/Navbar';
import Footer from '@/src/components/main/Footer';
import InstallPrompt from "@/src/components/main/InstallPrompt";

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
            GOOGLE ANALYTICS (GTAG)
        ============================================= */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-G7S2JHLYCG`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-G7S2JHLYCG', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />

        <Navbar />
        
        <main className="grow">
          {children}
        </main>
        
        <Footer />
        <InstallPrompt />
      </body>
    </html>
  );
}