"use client";

import { useState } from "react";

import { checkPassword } from "@/src/lib/passwordPolicy";

// Campo de senha + confirmação, com a lista de requisitos marcando em tempo
// real o que já foi cumprido. Usado por TODAS as telas que definem senha, para
// que a experiência e a regra sejam as mesmas em todo lugar.
//
// A validação aqui é conveniência para quem digita. A barreira de verdade é
// `assertPasswordPolicy` nas Server Actions.
export default function PasswordFields({
  name = "password",
  confirmName = "confirmPassword",
  label = "Nova senha",
  confirmLabel = "Repita a senha",
  required = true,
  autoFocus = false,
  /** Texto auxiliar mostrado acima dos campos. */
  hint,
  onValidityChange,
}: {
  name?: string;
  confirmName?: string;
  label?: string;
  confirmLabel?: string;
  required?: boolean;
  autoFocus?: boolean;
  hint?: string;
  onValidityChange?: (isValid: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const check = checkPassword(password);
  const matches = confirm.length > 0 && password === confirm;
  const isValid = check.isValid && matches;

  const update = (nextPassword: string, nextConfirm: string) => {
    const c = checkPassword(nextPassword);
    onValidityChange?.(c.isValid && nextConfirm.length > 0 && nextPassword === nextConfirm);
  };

  const inputCls =
    "w-full pl-10 pr-11 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all text-gray-800";

  // A barra só ganha cor quando há algo digitado, para não parecer um erro
  // logo que o formulário abre.
  const strengthColor =
    password.length === 0
      ? "bg-gray-200"
      : check.metCount <= 2
      ? "bg-red-400"
      : check.metCount <= 4
      ? "bg-amber-400"
      : "bg-emerald-500";

  return (
    <div className="space-y-3">
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      <div className="space-y-1.5">
        <label htmlFor={name} className="block text-sm font-bold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-lock text-gray-400"></i>
          </div>
          <input
            id={name}
            name={name}
            type={showPassword ? "text" : "password"}
            required={required}
            autoFocus={autoFocus}
            autoComplete="new-password"
            data-1p-ignore
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              update(e.target.value, confirm);
            }}
            className={`${inputCls} ${
              password.length > 0 && !check.isValid
                ? "border-amber-300 focus:ring-amber-500/20 focus:border-amber-500"
                : "border-gray-200 focus:ring-scout-green/20 focus:border-scout-green"
            }`}
            placeholder="Crie uma senha forte"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="cursor-pointer absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
          </button>
        </div>
      </div>

      {/* Força + checklist */}
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${(check.metCount / check.requirements.length) * 100}%` }}
          />
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
          {check.requirements.map((r) => (
            <li
              key={r.id}
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                r.met ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <i
                className={`fa-solid ${
                  r.met ? "fa-circle-check" : "fa-circle"
                } text-[11px] shrink-0`}
                aria-hidden="true"
              ></i>
              <span>{r.label}</span>
              {/* Leitores de tela não enxergam a cor nem o ícone. */}
              <span className="sr-only">{r.met ? "cumprido" : "pendente"}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={confirmName} className="block text-sm font-bold text-gray-700">
          {confirmLabel} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-lock text-gray-400"></i>
          </div>
          <input
            id={confirmName}
            name={confirmName}
            type={showPassword ? "text" : "password"}
            required={required}
            autoComplete="new-password"
            data-1p-ignore
            value={confirm}
            onBlur={() => setTouchedConfirm(true)}
            onChange={(e) => {
              setConfirm(e.target.value);
              setTouchedConfirm(true);
              update(password, e.target.value);
            }}
            className={`${inputCls} ${
              touchedConfirm && confirm.length > 0 && !matches
                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                : "border-gray-200 focus:ring-scout-green/20 focus:border-scout-green"
            }`}
            placeholder="Digite a senha novamente"
          />
        </div>

        {touchedConfirm && confirm.length > 0 && (
          <p
            className={`text-xs font-bold flex items-center gap-1.5 ${
              matches ? "text-emerald-600" : "text-red-600"
            }`}
          >
            <i className={`fa-solid ${matches ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
            {matches ? "As senhas conferem." : "As senhas não conferem."}
          </p>
        )}
      </div>

      {/* Espelha o estado para quem monta o formulário, sem exigir controle. */}
      <input type="hidden" data-password-valid={isValid ? "true" : "false"} />
    </div>
  );
}
