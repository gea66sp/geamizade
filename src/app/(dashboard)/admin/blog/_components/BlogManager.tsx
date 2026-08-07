"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

import {
  createBlogPost,
  deleteBlogPost,
  setBlogPostPublication,
  updateBlogPost,
} from "../actions";

type TroopOption = {
  id: string;
  name: string;
  branch: string;
};

type BlogPostItem = {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string | null;
  published: boolean;
  troopId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
  troop: {
    id: string;
    name: string;
    branch: string;
  } | null;
};

type CurrentUser = {
  id: string;
  name: string | null;
  role: string;
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

type PostDraft = {
  id: string | null;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  troopId: string;
  published: boolean;
};

const INITIAL_CONTENT = "<p><br/></p>";

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractTextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function createEmptyDraft(): PostDraft {
  return {
    id: null,
    title: "",
    slug: "",
    content: INITIAL_CONTENT,
    imageUrl: "",
    troopId: "",
    published: false,
  };
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BlogManager({
  initialPosts,
  troops,
  currentUser,
}: {
  initialPosts: BlogPostItem[];
  troops: TroopOption[];
  currentUser: CurrentUser;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<BlogPostItem[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [troopFilter, setTroopFilter] = useState("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<PostDraft>(createEmptyDraft());
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [previewPost, setPreviewPost] = useState<BlogPostItem | null>(null);
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isFormOpen || !editorRef.current) return;

    const nextHtml = draft.content || INITIAL_CONTENT;
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [isFormOpen, draft.content]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const text = `${post.title} ${post.slug} ${post.author.name ?? ""}`.toLowerCase();
      const query = search.trim().toLowerCase();

      const matchesSearch = query.length === 0 || text.includes(query);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PUBLISHED" ? post.published : !post.published);
      const matchesTroop =
        troopFilter === "ALL" || (post.troopId && post.troopId === troopFilter);

      return matchesSearch && matchesStatus && matchesTroop;
    });
  }, [posts, search, statusFilter, troopFilter]);

  const openNewPost = () => {
    setDraft(createEmptyDraft());
    setSlugTouched(false);
    setIsFormOpen(true);
  };

  const openEditPost = (post: BlogPostItem) => {
    setDraft({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      imageUrl: post.imageUrl ?? "",
      troopId: post.troopId ?? "",
      published: post.published,
    });
    setSlugTouched(true);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving || isUploadingCover) return;
    setIsFormOpen(false);
    setDraft(createEmptyDraft());
    setSlugTouched(false);
  };

  const updateTitle = (value: string) => {
    setDraft((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : toSlug(value),
    }));
  };

  const updateEditorContent = () => {
    const html = editorRef.current?.innerHTML ?? INITIAL_CONTENT;
    setDraft((prev) => ({ ...prev, content: html }));
  };

  const runEditorCommand = (command: string, value?: string) => {
    if (command === "insertImage") {
      const url = prompt("Cole a URL da imagem (ex: https://example.com/image.jpg):");
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === "createLink") {
      const url = prompt("Cole a URL do link (ex: https://example.com):");
      if (url) {
        document.execCommand(command, false, url);
      }
    } else {
      document.execCommand(command, false, value);
    }
    updateEditorContent();
    editorRef.current?.focus();
  };

  const uploadCoverImage = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const blob = await upload(`blog/capas/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setDraft((prev) => ({ ...prev, imageUrl: blob.url }));
      setToast({ type: "success", message: "Imagem de capa enviada com sucesso." });
    } catch (error) {
      console.error("Erro no upload da capa:", error);
      setToast({ type: "error", message: "Falha ao enviar a imagem de capa." });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleCoverInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadCoverImage(file);
  };

  const saveDraft = async () => {
    const htmlContent = editorRef.current?.innerHTML ?? draft.content;
    const textContent = extractTextFromHtml(htmlContent);

    if (draft.title.trim().length < 3) {
      setToast({ type: "error", message: "Informe um título com pelo menos 3 caracteres." });
      return;
    }

    if (textContent.length < 20) {
      setToast({ type: "error", message: "Escreva um conteúdo mais completo para a publicação." });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: draft.title,
        slug: draft.slug,
        content: htmlContent,
        imageUrl: draft.imageUrl || null,
        published: draft.published,
        troopId: draft.troopId || null,
      };

      const result = draft.id
        ? await updateBlogPost(draft.id, payload)
        : await createBlogPost(payload);

      if (!result.success) {
        setToast({
          type: "error",
          message: result.error || "Não foi possível salvar a publicação.",
        });
        return;
      }

      setToast({
        type: "success",
        message: draft.id ? "Publicação atualizada com sucesso." : "Publicação criada com sucesso.",
      });
      closeForm();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublication = async (post: BlogPostItem) => {
    const result = await setBlogPostPublication(post.id, !post.published);
    if (!result.success) {
      setToast({
        type: "error",
        message: result.error || "Não foi possível alterar o status da publicação.",
      });
      return;
    }

    setToast({
      type: "success",
      message: !post.published ? "Publicação liberada no site." : "Publicação retornou para rascunho.",
    });
    router.refresh();
  };

  const removePost = async (post: BlogPostItem) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir "${post.title}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    const result = await deleteBlogPost(post.id);
    if (!result.success) {
      setToast({
        type: "error",
        message: result.error || "Falha ao excluir a publicação.",
      });
      return;
    }

    setToast({ type: "success", message: "Publicação excluída com sucesso." });
    router.refresh();
  };

  const previewFromDraft = (): BlogPostItem => {
    return {
      id: draft.id || "preview",
      title: draft.title || "Pré-visualização sem título",
      slug: draft.slug || toSlug(draft.title || "publicacao"),
      content: editorRef.current?.innerHTML || draft.content || INITIAL_CONTENT,
      imageUrl: draft.imageUrl || null,
      published: draft.published,
      troopId: draft.troopId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        image: null,
        role: currentUser.role,
      },
      troop: troops.find((t) => t.id === draft.troopId) || null,
    };
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-60 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <i
            className={`fa-solid ${
              toast.type === "success"
                ? "fa-circle-check"
                : toast.type === "error"
                ? "fa-triangle-exclamation"
                : "fa-circle-info"
            }`}
          ></i>
          <p className="text-sm font-bold">{toast.message}</p>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl">
              <i className="fa-solid fa-newspaper"></i>
            </span>
            Gestão de Notícias e Blog
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            Gerencie rascunhos, publicações e pré-visualização completa antes de liberar no site.
          </p>
        </div>

        <button
          onClick={openNewPost}
          className="cursor-pointer w-full sm:w-auto bg-scout-green hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          Nova Publicação
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, slug ou autor..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-medium"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PUBLISHED" | "DRAFT")}
            className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Rascunhos</option>
          </select>

          <select
            value={troopFilter}
            onChange={(e) => setTroopFilter(e.target.value)}
            className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
          >
            <option value="ALL">Todas as Tropas</option>
            <option value="">Notícia Geral</option>
            {troops.map((troop) => (
              <option key={troop.id} value={troop.id}>
                {troop.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-gray-200">
            <i className="fa-solid fa-file-circle-xmark text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 font-bold">Nenhuma publicação encontrada.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading text-lg font-bold text-gray-800 leading-tight">{post.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${
                      post.published
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {post.published ? "Publicado" : "Rascunho"}
                  </span>
                </div>

                <p className="text-xs font-medium text-gray-500">
                  /{post.slug} • Atualizado em {formatDate(post.updatedAt)}
                </p>

                <p className="text-sm text-gray-600 line-clamp-3">{extractTextFromHtml(post.content)}</p>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">
                    {post.troop ? post.troop.name : "Geral do Grupo"}
                  </span>
                  <span className="text-[11px] bg-scout-green/10 text-scout-green px-2.5 py-1 rounded-full font-bold">
                    {post.author.name || "Diretoria"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => openEditPost(post)}
                    className="cursor-pointer py-2 rounded-xl text-sm font-bold bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fa-solid fa-pen mr-1.5"></i>Editar
                  </button>
                  <button
                    onClick={() => setPreviewPost(post)}
                    className="cursor-pointer py-2 rounded-xl text-sm font-bold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <i className="fa-solid fa-eye mr-1.5"></i>Prévia
                  </button>
                  <button
                    onClick={() => togglePublication(post)}
                    className={`cursor-pointer py-2 rounded-xl text-sm font-bold border ${
                      post.published
                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <i className={`fa-solid ${post.published ? "fa-box-archive" : "fa-paper-plane"} mr-1.5`}></i>
                    {post.published ? "Rascunho" : "Publicar"}
                  </button>
                  <button
                    onClick={() => removePost(post)}
                    className="cursor-pointer py-2 rounded-xl text-sm font-bold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                  >
                    <i className="fa-solid fa-trash mr-1.5"></i>Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-230 text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-200">
              <th className="p-4">Publicação</th>
              <th className="p-4 w-45">Escopo</th>
              <th className="p-4 w-35">Status</th>
              <th className="p-4 w-45">Atualização</th>
              <th className="p-4 text-right w-65">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50/80">
                <td className="p-4 align-top">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 leading-tight">{post.title}</p>
                    <p className="text-xs font-medium text-gray-500">/{post.slug}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{extractTextFromHtml(post.content)}</p>
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-2">
                    <span className="inline-flex text-xs px-2.5 py-1 rounded-full font-bold bg-gray-100 text-gray-600">
                      {post.troop ? post.troop.name : "Geral do Grupo"}
                    </span>
                    <p className="text-xs text-gray-500">{post.author.name || "Diretoria"}</p>
                  </div>
                </td>
                <td className="p-4 align-top">
                  <span
                    className={`inline-flex text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${
                      post.published
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {post.published ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className="p-4 align-top text-xs text-gray-500 font-medium">{formatDate(post.updatedAt)}</td>
                <td className="p-4 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPreviewPost(post)}
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      <i className="fa-solid fa-eye mr-1"></i>Prévia
                    </button>
                    <button
                      onClick={() => openEditPost(post)}
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    >
                      <i className="fa-solid fa-pen mr-1"></i>Editar
                    </button>
                    <button
                      onClick={() => togglePublication(post)}
                      className={`cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border ${
                        post.published
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      <i className={`fa-solid ${post.published ? "fa-box-archive" : "fa-paper-plane"} mr-1`}></i>
                      {post.published ? "Rascunho" : "Publicar"}
                    </button>
                    <button
                      onClick={() => removePost(post)}
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-55 bg-black/65 backdrop-blur-sm overflow-y-auto p-3 md:p-6">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col lg:flex-row justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-900">
                  {draft.id ? "Editar Publicação" : "Nova Publicação"}
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Cadastre conteúdo com preview e controle de publicação.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsDraftPreviewOpen(true)}
                  className="cursor-pointer px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                >
                  <i className="fa-solid fa-eye mr-2"></i>Pré-visualizar
                </button>
                <button
                  onClick={closeForm}
                  disabled={isSaving || isUploadingCover}
                  className="cursor-pointer px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveDraft}
                  disabled={isSaving || isUploadingCover}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-scout-green text-white font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Salvando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk mr-2"></i>Salvar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título</label>
                  <input
                    value={draft.title}
                    onChange={(e) => updateTitle(e.target.value)}
                    placeholder="Digite o título da publicação"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Slug amigável</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">/</span>
                    <input
                      value={draft.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setDraft((prev) => ({ ...prev, slug: toSlug(e.target.value) }));
                      }}
                      placeholder="minha-publicacao"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => runEditorCommand("bold")} className="toolbar-btn" title="Negrito">
                      <i className="fa-solid fa-bold"></i>
                    </button>
                    <button onClick={() => runEditorCommand("italic")} className="toolbar-btn" title="Itálico">
                      <i className="fa-solid fa-italic"></i>
                    </button>
                    <button onClick={() => runEditorCommand("underline")} className="toolbar-btn" title="Sublinhado">
                      <i className="fa-solid fa-underline"></i>
                    </button>
                    
                    <button onClick={() => runEditorCommand("createLink")} className="toolbar-btn" title="Link">
                      <i className="fa-solid fa-link"></i>
                    </button>
                    <button onClick={() => runEditorCommand("insertImage")} className="toolbar-btn" title="Imagem URL">
                      <i className="fa-regular fa-image"></i>
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={updateEditorContent}
                    className="min-h-96 p-5 prose prose-sm md:prose-base max-w-none prose-headings:font-heading prose-a:text-scout-green text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-4">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">Capa da Notícia</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {draft.imageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={draft.imageUrl}
                          alt="Capa selecionada"
                          className="w-full h-44 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          onClick={() => setDraft((prev) => ({ ...prev, imageUrl: "" }))}
                          className="cursor-pointer text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          Remover capa
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-44 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-bold">
                        Sem capa definida
                      </div>
                    )}

                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverInputChange}
                    />
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="cursor-pointer w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUploadingCover ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Enviando capa...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up mr-2"></i>Upload da capa
                        </>
                      )}
                    </button>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400">
                        ou use URL externa
                      </label>
                      <input
                        value={draft.imageUrl}
                        onChange={(e) => setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-4">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">Configurações</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Escopo</label>
                      <select
                        value={draft.troopId}
                        onChange={(e) => setDraft((prev) => ({ ...prev, troopId: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
                      >
                        <option value="">Geral do Grupo</option>
                        {troops.map((troop) => (
                          <option key={troop.id} value={troop.id}>
                            {troop.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.published}
                        onChange={(e) => setDraft((prev) => ({ ...prev, published: e.target.checked }))}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-scout-green focus:ring-scout-green"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-700">Publicar no site</p>
                        <p className="text-xs text-gray-500">
                          Desmarcado = fica salvo como rascunho no painel administrativo.
                        </p>
                      </div>
                    </label>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                        Autor responsável
                      </p>
                      <p className="text-sm font-bold text-gray-800">{currentUser.name || "Diretoria"}</p>
                      <p className="text-[11px] text-gray-500">{currentUser.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(previewPost || isDraftPreviewOpen) && (
        <PreviewModal
          post={previewPost || previewFromDraft()}
          onClose={() => {
            setPreviewPost(null);
            setIsDraftPreviewOpen(false);
          }}
        />
      )}

      <style jsx>{`
        .toolbar-btn {
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #4b5563;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .toolbar-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }
      `}</style>
    </div>
  );
}

function PreviewModal({ post, onClose }: { post: BlogPostItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm p-3 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center gap-4">
          <div>
            <h3 className="font-heading text-xl md:text-2xl font-bold text-gray-900">Pré-visualização</h3>
            <p className="text-sm text-gray-500 font-medium">
              Assim a publicação será exibida quando estiver ativa.
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="Fechar"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <article className="p-4 md:p-8 space-y-6">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-60 md:h-80 object-cover rounded-2xl border border-gray-200"
            />
          )}

          <header className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${
                  post.published
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {post.published ? "Publicado" : "Rascunho"}
              </span>
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">
                {post.troop ? post.troop.name : "Geral do Grupo"}
              </span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              {post.title}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              por {post.author.name || "Diretoria"} • {formatDate(post.updatedAt)}
            </p>
          </header>

          <div
            className="prose prose-sm md:prose-base max-w-none prose-headings:font-heading prose-a:text-scout-green text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>
    </div>
  );
}
