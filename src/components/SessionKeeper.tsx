"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SessionKeeper() {
  useEffect(() => {
    // Força o logout e limpa o NextAuth do navegador
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8f9fa]">
      <p className="text-emerald-700 font-bold animate-pulse text-lg tracking-widest uppercase">
        Encerrando sessão segura...
      </p>
    </div>
  );
}