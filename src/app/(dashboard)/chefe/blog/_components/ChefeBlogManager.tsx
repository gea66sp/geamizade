"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

import {
  approveBlogPost,
  createBlogPost,
  deleteBlogPost,
  rejectBlogPost,
  setBlogPostStatus,
  updateBlogPost,
} from "@/src/app/(dashboard)/admin/blog/actions";

type TroopOption = { id: string; name: string };

type PostStatusValue = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";

type BlogPostItem = {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string | null;
  status: PostStatusValue;
  rejectionReason: string | null;
  troopId: string | null;
  updatedAt: Date | string;
  author: { id: string; name: string | null; role: string };
};

type CurrentUser = { id: string; name: string | null; role: string };

type ToastState = { type: "success" | "error"; message: string } | null;

type PostDraft = {
  id: string | null;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  troopId: string;
  status: "DRAFT" | "PUBLISHED";
};

const INITIAL_CONTENT = "<p><br/></p>";

const STATUS_META: Record<PostStatusValue, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  PENDING_REVIEW: { label: "Aguardando Aprovação", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  PUBLISHED: { label: "Publicado", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  REJECTED: { label: "Rejeitado", className: "bg-red-50 text-red-700 border border-red-200" },
};

function StatusBadge({ status }: { status: PostStatusValue }) {
  const meta = STATUS_META[status];
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function ChefeBlogManager({
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

  const defaultTroopId = troops[0]?.id ?? "";

  const [posts, setPosts] = useState<BlogPostItem[]>(initialPosts);
  const [tab, setTab] = useState<"TODAS" | "PENDENTES">("TODAS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<PostDraft>(createEmptyDraft(defaultTroopId));
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function createEmptyDraft(troopId: string): PostDraft {
    return { id: null, title: "", slug: "", content: INITIAL_CONTENT, imageUrl: "", troopId, status: "DRAFT" };
  }

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

  const pendingPosts = useMemo(() => posts.filter((p) => p.status === "PENDING_REVIEW"), [posts]);
  const visiblePosts = tab === "PENDENTES" ? pendingPosts : posts;

  const openNewPost = () => {
    setDraft(createEmptyDraft(defaultTroopId));
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
      troopId: post.troopId ?? defaultTroopId,
      status: post.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    });
    setSlugTouched(true);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving || isUploadingCover) return;
    setIsFormOpen(false);
    setDraft(createEmptyDraft(defaultTroopId));
    setSlugTouched(false);
  };

  const updateTitle = (value: string) => {
    setDraft((prev) => ({ ...prev, title: value, slug: slugTouched ? prev.slug : toSlug(value) }));
  };

  const updateEditorContent = () => {
    const html = editorRef.current?.innerHTML ?? INITIAL_CONTENT;
    setDraft((prev) => ({ ...prev, content: html }));
  };

  const runEditorCommand = (command: string) => {
    if (command === "insertImage") {
      const url = prompt("Cole a URL da imagem (ex: https://example.com/image.jpg):");
      if (url) document.execCommand(command, false, url);
    } else if (command === "createLink") {
      const url = prompt("Cole a URL do link (ex: https://example.com):");
      if (url) document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false);
    }
    updateEditorContent();
    editorRef.current?.focus();
  };

  const handleCoverInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

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
    if (!draft.troopId) {
      setToast({ type: "error", message: "Selecione a tropa da publicação." });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: draft.title,
        slug: draft.slug,
        content: htmlContent,
        imageUrl: draft.imageUrl || null,
        status: draft.status,
        troopId: draft.troopId,
      };

      const result = draft.id ? await updateBlogPost(draft.id, payload) : await createBlogPost(payload);

      if (!result.success) {
        setToast({ type: "error", message: result.error || "Não foi possível salvar a publicação." });
        return;
      }

      setToast({ type: "success", message: draft.id ? "Publicação atualizada." : "Publicação criada." });
      closeForm();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublication = async (post: BlogPostItem) => {
    const nextStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const result = await setBlogPostStatus(post.id, nextStatus);
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Não foi possível alterar o status." });
      return;
    }
    setToast({ type: "success", message: nextStatus === "PUBLISHED" ? "Publicação liberada no site." : "Publicação voltou para rascunho." });
    router.refresh();
  };

  const removePost = async (post: BlogPostItem) => {
    if (!window.confirm(`Deseja realmente excluir "${post.title}"? Essa ação não pode ser desfeita.`)) return;

    const result = await deleteBlogPost(post.id);
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Falha ao excluir a publicação." });
      return;
    }
    setToast({ type: "success", message: "Publicação excluída." });
    router.refresh();
  };

  const approvePost = async (post: BlogPostItem) => {
    const result = await approveBlogPost(post.id);
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Não foi possível aprovar a publicação." });
      return;
    }
    setToast({ type: "success", message: "Publicação aprovada e liberada no site." });
    router.refresh();
  };

  const rejectPost = async (post: BlogPostItem) => {
    const reason = window.prompt("Explique o motivo da rejeição (o autor vai ver esta mensagem):");
    if (reason === null) return;
    if (!reason.trim()) {
      setToast({ type: "error", message: "Informe o motivo da rejeição." });
      return;
    }

    const result = await rejectBlogPost(post.id, reason);
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Não foi possível rejeitar a publicação." });
      return;
    }
    setToast({ type: "success", message: "Publicação rejeitada." });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-60 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 ${
            toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <p className="text-sm font-bold">{toast.message}</p>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-scout-green/10 text-scout-green flex items-center justify-center text-2xl">
              <i className="fa-solid fa-newspaper"></i>
            </span>
            Blog da Tropa
          </h1>
          <p className="text-gray-500 font-medium mt-2">Publique notícias e revise o que os membros enviaram.</p>
        </div>

        <button
          onClick={openNewPost}
          className="cursor-pointer w-full sm:w-auto bg-scout-green hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          Nova Publicação
        </button>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-200 w-fit">
        <button
          onClick={() => setTab("TODAS")}
          className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === "TODAS" ? "bg-scout-green text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setTab("PENDENTES")}
          className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            tab === "PENDENTES" ? "bg-scout-green text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Pendentes de Aprovação
          {pendingPosts.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === "PENDENTES" ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>
              {pendingPosts.length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {visiblePosts.length === 0 ? (
          <div className="p-10 text-center">
            <i className="fa-solid fa-file-circle-xmark text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 font-bold">Nenhuma publicação encontrada.</p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <div key={post.id} className="p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-800 leading-tight">{post.title}</h3>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    /{post.slug} • {post.author.name || "Membro"} • Atualizado em {formatDate(post.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={post.status} />
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{extractTextFromHtml(post.content)}</p>

              {post.status === "REJECTED" && post.rejectionReason && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                  <i className="fa-solid fa-circle-exclamation mr-1.5"></i>
                  {post.rejectionReason}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {post.status === "PENDING_REVIEW" ? (
                  <>
                    <button
                      onClick={() => approvePost(post)}
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      <i className="fa-solid fa-check mr-1"></i>Aprovar
                    </button>
                    <button
                      onClick={() => rejectPost(post)}
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <i className="fa-solid fa-xmark mr-1"></i>Rejeitar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => togglePublication(post)}
                    className={`cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border ${
                      post.status === "PUBLISHED"
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {post.status === "PUBLISHED" ? "Voltar para Rascunho" : "Publicar"}
                  </button>
                )}
                <button
                  onClick={() => openEditPost(post)}
                  className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                >
                  <i className="fa-solid fa-pen mr-1"></i>Editar
                </button>
                <button
                  onClick={() => removePost(post)}
                  className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <i className="fa-solid fa-trash mr-1"></i>Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-55 bg-black/65 backdrop-blur-sm overflow-y-auto p-3 md:p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col lg:flex-row justify-between gap-4">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-900">
                {draft.id ? "Editar Publicação" : "Nova Publicação"}
              </h2>
              <div className="flex gap-2">
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

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => runEditorCommand("bold")} className="toolbar-btn" title="Negrito" type="button">
                      <i className="fa-solid fa-bold"></i>
                    </button>
                    <button onClick={() => runEditorCommand("italic")} className="toolbar-btn" title="Itálico" type="button">
                      <i className="fa-solid fa-italic"></i>
                    </button>
                    <button onClick={() => runEditorCommand("underline")} className="toolbar-btn" title="Sublinhado" type="button">
                      <i className="fa-solid fa-underline"></i>
                    </button>
                    <button onClick={() => runEditorCommand("createLink")} className="toolbar-btn" title="Link" type="button">
                      <i className="fa-solid fa-link"></i>
                    </button>
                    <button onClick={() => runEditorCommand("insertImage")} className="toolbar-btn" title="Imagem URL" type="button">
                      <i className="fa-regular fa-image"></i>
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={updateEditorContent}
                    className="min-h-80 p-5 prose prose-sm max-w-none prose-headings:font-heading prose-a:text-scout-green text-gray-800 focus:outline-none"
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
                        <img src={draft.imageUrl} alt="Capa selecionada" className="w-full h-36 object-cover rounded-xl border border-gray-200" />
                        <button
                          onClick={() => setDraft((prev) => ({ ...prev, imageUrl: "" }))}
                          className="cursor-pointer text-xs font-bold text-red-600 hover:text-red-700"
                          type="button"
                        >
                          Remover capa
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-bold">
                        Sem capa definida
                      </div>
                    )}

                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverInputChange} />
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      type="button"
                      className="cursor-pointer w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUploadingCover ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Enviando...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up mr-2"></i>Upload da capa
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-4">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">Configurações</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {troops.length > 1 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tropa</label>
                        <select
                          value={draft.troopId}
                          onChange={(e) => setDraft((prev) => ({ ...prev, troopId: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
                        >
                          {troops.map((troop) => (
                            <option key={troop.id} value={troop.id}>
                              {troop.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.status === "PUBLISHED"}
                        onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.checked ? "PUBLISHED" : "DRAFT" }))}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-scout-green focus:ring-scout-green"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-700">Publicar no site</p>
                        <p className="text-xs text-gray-500">Desmarcado = fica salvo como rascunho.</p>
                      </div>
                    </label>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Autor</p>
                      <p className="text-sm font-bold text-gray-800">{currentUser.name || "Chefe"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
