"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import PasswordFields from "@/src/components/dashboard/PasswordFields";
import { createTroopMemberAction, updateTroopMemberAction } from "@/src/lib/troopMembers.actions";

export type MembroParaEditar = {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
};

// Um modal para cadastrar e outro para editar seriam quase idênticos: o que
// muda é a senha (só na criação) e o cargo, que nunca aparece — o chefe
// cadastra jovens, e isso é constante no servidor.
export default function MembroFormModal({
  isOpen,
  onClose,
  troopId,
  troopName,
  membro,
}: {
  isOpen: boolean;
  onClose: () => void;
  troopId: string;
  troopName: string;
  /** Ausente = cadastro novo. */
  membro?: MembroParaEditar | null;
}) {
  const router = useRouter();
  const isEdit = !!membro;

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Na edição não há campo de senha, então nada a validar.
  const [senhaValida, setSenhaValida] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true);
    setError(null);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!isEdit) {
      const senha = formData.get("password") as string;
      if (senha !== (formData.get("confirmPassword") as string)) {
        setIsSaving(false);
        setError("As senhas não conferem.");
        return;
      }
    }

    const res = isEdit
      ? await updateTroopMemberAction(membro.id, {
          name,
          email,
          phone: (formData.get("phone") as string) || null,
        })
      : await createTroopMemberAction({
          name,
          email,
          password: formData.get("password") as string,
          troopId,
        });

    setIsSaving(false);
    if (!res.success) {
      setError(res.error);
      return;
    }

    onClose();
    router.refresh();
  };

  const inputCls =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className={`fa-solid ${isEdit ? "fa-user-pen" : "fa-user-plus"} text-xl`}></i>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-800 leading-tight">
                {isEdit ? "Editar dados do jovem" : "Cadastrar novo jovem"}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">{troopName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-200">
              <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              minLength={3}
              defaultValue={membro?.name ?? ""}
              placeholder="Ex: João da Silva"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={membro?.email ?? ""}
              placeholder="jovem@exemplo.com"
              className={inputCls}
            />
            <p className="text-xs text-gray-500">Será o login dele no portal.</p>
          </div>

          {isEdit ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Telefone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={membro?.phone ?? ""}
                placeholder="(12) 90000-0000"
                className={inputCls}
              />
            </div>
          ) : (
            <PasswordFields
              label="Senha provisória"
              confirmLabel="Repita a senha provisória"
              hint="Entregue esta senha ao jovem. No primeiro acesso ele será obrigado a trocá-la, então você não fica sabendo a senha definitiva dele."
              onValidityChange={setSenhaValida}
            />
          )}

          {isEdit && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <i className="fa-solid fa-lock mr-1.5 text-gray-400"></i>
              Cargo e tropa não podem ser alterados aqui — fale com a Diretoria.
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="cursor-pointer px-6 py-3 text-sm text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || (!isEdit && !senhaValida)}
              className="cursor-pointer px-8 py-3 text-sm bg-scout-green disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all disabled:opacity-70 active:scale-95"
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Salvando...
                </>
              ) : isEdit ? (
                "Salvar alterações"
              ) : (
                "Cadastrar jovem"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
