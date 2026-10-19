"use client";

import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import {
  createPartnerCategory,
  createPartnerCompany,
  deletePartnerCategory,
  deletePartnerCompany,
  updatePartnerCompany,
} from "../actions";

type Category = { id: string; name: string };
type Company = {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  description: string;
  categoryId: string;
  category: Category;
};
type Draft = Omit<Company, "id" | "category">;

const emptyDraft: Draft = {
  name: "",
  logoUrl: null,
  websiteUrl: "",
  instagramUrl: "",
  description: "",
  categoryId: "",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default function PartnerManager({
  initialCompanies,
  initialCategories,
}: {
  initialCompanies: Company[];
  initialCategories: Category[];
}) {
  const [companies] = useState(initialCompanies);
  const [categories] = useState(initialCategories);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const setFeedback = (nextError = "", nextMessage = "") => {
    setError(nextError);
    setMessage(nextMessage);
  };

  const refresh = () => window.location.reload();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        if (editingId) await updatePartnerCompany(editingId, formData);
        else await createPartnerCompany(formData);
        setFeedback("", "Empresa salva com sucesso.");
        setDraft(emptyDraft);
        setEditingId(null);
        refresh();
      } catch (caught) {
        setFeedback(caught instanceof Error ? caught.message : "Não foi possível salvar a empresa.");
      }
    });
  };

  const uploadLogo = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFeedback("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback("O logotipo deve ter no máximo 5 MB.");
      return;
    }
    try {
      const blob = await upload(`parceiros/logos/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setDraft((current) => ({ ...current, logoUrl: blob.url }));
      setFeedback("", "Logotipo enviado. Salve a empresa para confirmar.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Não foi possível enviar o logotipo.");
    }
  };

  const edit = (company: Company) => {
    setEditingId(company.id);
    setDraft({
      name: company.name,
      logoUrl: company.logoUrl,
      websiteUrl: company.websiteUrl,
      instagramUrl: company.instagramUrl,
      description: company.description,
      categoryId: company.categoryId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeCompany = (id: string) => {
    if (!window.confirm("Excluir esta empresa parceira?")) return;
    startTransition(async () => {
      try {
        await deletePartnerCompany(id);
        refresh();
      } catch (caught) {
        setFeedback(caught instanceof Error ? caught.message : "Não foi possível excluir a empresa.");
      }
    });
  };

  const addCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await createPartnerCategory(formData);
        setCategoryName("");
        refresh();
      } catch (caught) {
        setFeedback(caught instanceof Error ? caught.message : "Não foi possível criar a categoria.");
      }
    });
  };

  const removeCategory = (id: string) => {
    if (!window.confirm("Excluir esta categoria?")) return;
    startTransition(async () => {
      try {
        await deletePartnerCategory(id);
        refresh();
      } catch (caught) {
        setFeedback(caught instanceof Error ? caught.message : "Não foi possível excluir a categoria.");
      }
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-scout-green">Gestão do site</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-gray-900 md:text-3xl">Empresas parceiras</h1>
        <p className="mt-1 text-sm text-gray-500">Cadastre quem apoia o Grupo Escoteiro Amizade e mantenha o catálogo público atualizado.</p>
      </header>

      {(error || message) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || message}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-gray-800">{editingId ? "Editar empresa" : "Nova empresa"}</h2>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft); }} className="text-xs font-bold text-gray-500 hover:text-scout-green">Cancelar edição</button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">Nome da empresa<input name="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={120} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-scout-green" /></label>
            <label className="text-sm font-semibold text-gray-700">Categoria<select name="categoryId" value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} required className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-scout-green"><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="text-sm font-semibold text-gray-700">Site (opcional)<input name="websiteUrl" value={draft.websiteUrl ?? ""} onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })} placeholder="https://empresa.com.br" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-scout-green" /></label>
            <label className="text-sm font-semibold text-gray-700">Instagram (opcional)<input name="instagramUrl" value={draft.instagramUrl ?? ""} onChange={(e) => setDraft({ ...draft, instagramUrl: e.target.value })} placeholder="https://instagram.com/empresa" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-scout-green" /></label>
            <label className="text-sm font-semibold text-gray-700 md:col-span-2">Descrição breve<textarea name="description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={500} rows={4} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-scout-green" /></label>
            <div className="md:col-span-2">
              <span className="text-sm font-semibold text-gray-700">Logotipo</span>
              <div className="mt-1 flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 p-3 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-scout-green text-lg font-black text-white">{draft.logoUrl ? <img src={draft.logoUrl} alt="" className="h-full w-full object-contain" /> : initials(draft.name)}</div>
                <div className="flex-1"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadLogo(file); e.target.value = ""; }} className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-scout-green file:px-3 file:py-2 file:font-semibold file:text-white" /><p className="mt-1 text-xs text-gray-400">JPG, PNG ou WebP, até 5 MB. Sem logo, usamos as iniciais.</p></div>
              </div>
              <input type="hidden" name="logoUrl" value={draft.logoUrl ?? ""} />
            </div>
          </div>
          <button type="submit" disabled={isPending || categories.length === 0} className="mt-5 w-full rounded-xl bg-scout-green px-4 py-3 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50">{isPending ? "Salvando..." : editingId ? "Atualizar empresa" : "Cadastrar empresa"}</button>
        </form>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-heading text-lg font-bold text-gray-800">Categorias</h2>
          <form onSubmit={addCategory} className="mt-4 flex gap-2"><input name="name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Nova categoria" required maxLength={80} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-scout-green" /><button disabled={isPending} className="rounded-lg bg-scout-yellow px-3 font-bold text-scout-dark">Adicionar</button></form>
          <ul className="mt-4 divide-y divide-gray-100">{categories.map((category) => <li key={category.id} className="flex items-center justify-between gap-2 py-3 text-sm"><span className="font-medium text-gray-700">{category.name}</span><button type="button" onClick={() => removeCategory(category.id)} className="text-xs font-bold text-red-500 hover:underline">Excluir</button></li>)}</ul>
        </section>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-lg font-bold text-gray-800">Empresas cadastradas</h2><span className="text-sm text-gray-500">{companies.length} {companies.length === 1 ? "empresa" : "empresas"}</span></div>
        {companies.length === 0 ? <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Nenhuma empresa cadastrada ainda.</p> : <div className="grid gap-3 md:grid-cols-2">{companies.map((company) => <article key={company.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 p-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-scout-green font-bold text-white">{company.logoUrl ? <img src={company.logoUrl} alt="" className="h-full w-full object-contain" /> : initials(company.name)}</div><div className="min-w-0 flex-1"><h3 className="truncate font-bold text-gray-800">{company.name}</h3><p className="text-xs text-gray-500">{company.category.name}</p></div><button type="button" onClick={() => edit(company)} className="rounded-lg px-2 py-2 text-scout-green hover:bg-green-50" aria-label={`Editar ${company.name}`}><i className="fa-solid fa-pen" /></button><button type="button" onClick={() => removeCompany(company.id)} className="rounded-lg px-2 py-2 text-red-500 hover:bg-red-50" aria-label={`Excluir ${company.name}`}><i className="fa-solid fa-trash" /></button></article>)}</div>}
      </section>
    </div>
  );
}
