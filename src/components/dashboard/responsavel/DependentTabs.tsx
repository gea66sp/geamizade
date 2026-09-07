"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteDependentDocumentAction,
  renameDependentDocumentAction,
  uploadDependentDocumentAction,
} from "@/src/lib/guardian.actions";

type FinancialRow = {
  id: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  status: "PENDING" | "PAID" | "CANCELLED";
  dueDate: Date | string;
  paidDate: Date | string | null;
};

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  size: number;
  createdAt: Date | string;
};

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const shortDate = (d: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));

const STATUS_META = {
  PENDING: { label: "Em aberto", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Pago", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelado", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function DependentTabs({
  dependentId,
  dependentName,
  financials,
  documents,
  openAmount,
}: {
  dependentId: string;
  dependentName: string;
  financials: FinancialRow[];
  documents: DocRow[];
  openAmount: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"FINANCEIRO" | "DOCUMENTOS">("FINANCEIRO");

  const [isUploading, setIsUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (formData: FormData) => {
    setIsUploading(true);
    setError(null);
    const res = await uploadDependentDocumentAction(dependentId, formData);
    setIsUploading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  const handleRename = async (doc: DocRow) => {
    const novo = window.prompt("Novo título do documento:", doc.title);
    if (novo === null) return;
    setBusyId(doc.id);
    setError(null);
    const res = await renameDependentDocumentAction(doc.id, novo);
    setBusyId(null);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  const handleDelete = async (doc: DocRow) => {
    if (!window.confirm(`Excluir "${doc.title}"? Esta ação não pode ser desfeita.`)) return;
    setBusyId(doc.id);
    setError(null);
    const res = await deleteDependentDocumentAction(doc.id);
    setBusyId(null);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {([
          { key: "FINANCEIRO", label: "Financeiro", icon: "fa-coins" },
          { key: "DOCUMENTOS", label: "Documentos", icon: "fa-folder-open", badge: documents.length },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`cursor-pointer px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-3 transition-all flex items-center gap-2 ${
              tab === t.key
                ? "border-scout-green text-scout-green bg-scout-green/5"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <i className={`fa-solid ${t.icon}`}></i>
            {t.label}
            {"badge" in t && t.badge ? (
              <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 rounded-full font-black">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-200">
          <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
          <span>{error}</span>
        </div>
      )}

      {tab === "FINANCEIRO" ? (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-2xl border ${
              openAmount > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Total em aberto</p>
            <p className={`font-heading text-3xl font-black ${openAmount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {brl(openAmount)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {openAmount > 0
                ? `Valores pendentes de ${dependentName}. Procure a tesouraria para regularizar.`
                : `${dependentName} está em dia com o grupo.`}
            </p>
          </div>

          {financials.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-gray-200">
              <i className="fa-solid fa-receipt text-4xl text-gray-200 mb-3"></i>
              <p className="text-gray-500 font-bold">Nenhum lançamento financeiro registrado.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {financials.map((t) => {
                const meta = STATUS_META[t.status];
                return (
                  <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{t.title}</p>
                      <p className="text-[11px] text-gray-500">
                        Vencimento {shortDate(t.dueDate)}
                        {t.paidDate ? ` · pago em ${shortDate(t.paidDate)}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-800">{brl(t.amount)}</p>
                      <span
                        className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <form action={handleUpload} className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-cloud-arrow-up text-scout-green"></i> Enviar documento
            </h3>
            <p className="text-xs text-gray-500">
              Ficha médica, autorizações e carteirinha de {dependentName}. Máximo de 4MB. O arquivo fica
              privado: só você, {dependentName} e a gestão do grupo conseguem abrir.
            </p>

            <input
              name="title"
              required
              placeholder="Ex: Ficha Médica 2026"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none text-sm"
            />
            <input
              name="file"
              type="file"
              required
              accept="application/pdf,image/*"
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-bold file:cursor-pointer"
            />
            <button
              type="submit"
              disabled={isUploading}
              className="cursor-pointer px-6 py-2.5 rounded-xl bg-scout-green text-white font-bold text-sm hover:bg-green-700 disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Enviando...
                </>
              ) : (
                "Enviar"
              )}
            </button>
          </form>

          {documents.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-gray-200">
              <i className="fa-regular fa-folder-open text-4xl text-gray-200 mb-3"></i>
              <p className="text-gray-500 font-bold">Nenhum documento enviado ainda.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{doc.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {shortDate(doc.createdAt)} · {(doc.size / 1024).toFixed(0)} KB
                      {doc.description ? ` · ${doc.description}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/api/documentos/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Baixar"
                      className="p-2.5 rounded-lg text-scout-green hover:bg-green-50 transition-colors"
                    >
                      <i className="fa-solid fa-download"></i>
                    </a>
                    <button
                      onClick={() => handleRename(doc)}
                      disabled={busyId === doc.id}
                      title="Renomear"
                      className="cursor-pointer p-2.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={busyId === doc.id}
                      title="Excluir"
                      className="cursor-pointer p-2.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
