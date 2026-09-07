"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import PasswordFields from "@/src/components/dashboard/PasswordFields";
import { resetUserPassword } from "../actions";

export default function ModalRedefinirSenha({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string | null; email: string | null } | null;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (formData: FormData) => {
    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await resetUserPassword(user.id, password);
    setIsSaving(false);

    if (!res.success) {
      setError(res.error ?? "Falha ao redefinir a senha.");
      return;
    }

    setDone(true);
    router.refresh();
  };

  const fecharTudo = () => {
    setDone(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-key text-xl"></i>
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-bold text-gray-800 leading-tight">
                Redefinir senha
              </h2>
              <p className="text-gray-500 text-xs mt-0.5 truncate">
                {user.name ?? "Usuário"}
                {user.email ? ` · ${user.email}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={fecharTudo}
            aria-label="Fechar"
            className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-800">Senha redefinida</h3>
              <p className="text-sm text-gray-600 mt-2">
                Entregue a senha provisória a <strong>{user.name}</strong>. No próximo acesso, a
                pessoa será obrigada a criar uma senha própria — você não ficará sabendo a senha
                definitiva dela.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Ela também recebeu um aviso no portal informando que a senha foi alterada.
              </p>
            </div>
            <button
              onClick={fecharTudo}
              className="cursor-pointer w-full py-3 bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
            >
              Concluir
            </button>
          </div>
        ) : (
          <form action={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
              <p className="text-xs text-amber-800">
                Isto substitui a senha atual da pessoa. Ela perderá o acesso com a senha antiga e
                terá de usar a provisória que você definir aqui.
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-200">
                <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                <span>{error}</span>
              </div>
            )}

            <PasswordFields
              label="Senha provisória"
              confirmLabel="Repita a senha provisória"
              autoFocus
              onValidityChange={setIsValid}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={fecharTudo}
                disabled={isSaving}
                className="cursor-pointer px-6 py-3 text-sm text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !isValid}
                title={!isValid ? "Preencha todos os requisitos da senha" : undefined}
                className="cursor-pointer px-8 py-3 text-sm bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSaving ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
