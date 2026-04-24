"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Função que checa se o usuário deu consentimento total aos cookies
    const checkConsent = () => {
      const consent = localStorage.getItem("geamizade_cookie_preference");
      if (consent === "all") {
        setHasConsent(true);
      }
    };

    // Checa o consentimento assim que a página carrega
    checkConsent();

    // Fica "escutando" caso o usuário clique em "Aceitar Todos" no banner
    window.addEventListener('cookie_consent_updated', checkConsent);

    return () => {
      window.removeEventListener('cookie_consent_updated', checkConsent);
    };
  }, []);

  // Se o usuário não aceitou, retornamos nulo e o script não é injetado (LGPD)
  if (!hasConsent) return null;

  return (
    <>
      {/* =========================================
             GOOGLE ANALYTICS (GTAG) - GE AMIZADE
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
    </>
  );
}