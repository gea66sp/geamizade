import Navbar from '@/src/components/main/Navbar';
import Footer from '@/src/components/main/Footer';
import InstallPrompt from "@/src/components/main/InstallPrompt";

// 👇 Importando os novos componentes de Privacidade e Analytics
import CookieBanner from "@/src/components/CookieBanner";
import GoogleAnalytics from "@/src/components/GoogleAnalytics";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nota: <html> e <body> já são definidos no layout raiz (src/app/layout.tsx).
  // Este layout só adiciona o "esqueleto" visual do site público (Navbar/Footer/overlays).
  return (
    <div className="font-sans bg-stone-50 text-stone-800 antialiased min-h-screen flex flex-col">
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

    </div>
  );
}
