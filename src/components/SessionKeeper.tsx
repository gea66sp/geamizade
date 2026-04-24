"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SessionKeeper() {
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Vai buscar a preferência que guardámos no auth.ts
      const rememberMe = (session.user as any).rememberMe;

      if (rememberMe === false) {
        // Verifica se a sessão do navegador ainda é a mesma
        const isBrowserSessionActive = sessionStorage.getItem("scout_active_session");

        if (!isBrowserSessionActive) {
          // O navegador foi fechado e reaberto! O utilizador não queria ser lembrado.
          // Forçamos o logout e limpamos os cookies residuais.
          signOut({ callbackUrl: "/login" });
        }
      }
      setIsChecking(false);
    } else if (status === "unauthenticated") {
      setIsChecking(false);
    }
  }, [session, status]);

  // Enquanto verifica a segurança, pode devolver null ou um pequeno ecrã de loading
  if (isChecking && status === "authenticated") return null;

  return null;
}