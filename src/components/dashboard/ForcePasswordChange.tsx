"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import PasswordFields from "@/src/components/dashboard/PasswordFields";
import { changeOwnPasswordAction } from "@/src/lib/profile.actions";

// Tela mostrada NO LUGAR de qualquer página do dashboard enquanto a pessoa
// estiver com senha provisória. Não é uma rota: não há URL para contornar —
// os layouts a renderizam em vez do conteúdo, no servidor.
export default function ForcePasswordChange({ userName }: { userName?: string | null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true);
    setError(null);

    const res = await changeOwnPasswordAction(
      formData.get("password") as string,
      formData.get("confirm") as string
    );

    setIsSaving(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    // A barreira lê a flag do banco a cada requisição, então basta recarregar.
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-scout-dark p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-scout-yellow/20 text-scout-yellow flex items-center justify-center text-2xl mb-3">
            <i className="fa-solid fa-key"></i>
          </div>
          <h1 className="font-heading text-xl font-bold text-white">Crie a sua senha</h1>
          <p className="text-xs text-gray-300 mt-1">
            {userName ? `Olá, ${userName.split(" ")[0]}! ` : ""}
            Sua conta foi criada por um chefe com uma senha provisória.
          </p>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <i className="fa-solid fa-circle-info text-amber-500 mt-0.5"></i>
            <p className="text-xs text-amber-800">
              Escolha uma senha que só você conheça. Enquanto não trocar, não é possível acessar o
              portal.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-200">
              <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          <PasswordFields
            name="password"
            confirmName="confirm"
            label="Nova senha"
            confirmLabel="Repita a nova senha"
            autoFocus
            onValidityChange={setIsValid}
          />

          <button
            type="submit"
            disabled={isSaving || !isValid}
            className="cursor-pointer w-full py-3.5 bg-scout-green disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all disabled:opacity-70 active:scale-95"
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Salvando...
              </>
            ) : (
              "Salvar e entrar"
            )}
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
