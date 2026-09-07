"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

import { deleteMemberPost, submitMemberPost, updateMemberPost } from "../actions";

type PostStatusValue = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";

type MyPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string | null;
  status: PostStatusValue;
  rejectionReason: string | null;
  updatedAt: Date | string;
};

type ToastState = { type: "success" | "error"; message: string } | null;

type PostDraft = {
  id: string | null;
  title: string;
  content: string;
  imageUrl: string;
};

const INITIAL_CONTENT = "<p><br/></p>";

const STATUS_META: Record<PostStatusValue, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  PENDING_REVIEW: { label: "Aguardando Aprovação", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  PUBLISHED: { label: "Publicado", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  REJECTED: { label: "Rejeitado", className: "bg-red-50 text-red-700 border border-red-200" },
};

function extractTextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function createEmptyDraft(): PostDraft {
  return { id: null, title: "", content: INITIAL_CONTENT, imageUrl: "" };
}

export default function MyPostsManager({ initialPosts }: { initialPosts: MyPost[] }) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<MyPost[]>(initialPosts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<PostDraft>(createEmptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
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

  const openNewPost = () => {
    setDraft(createEmptyDraft());
    setIsFormOpen(true);
  };

  const openEditPost = (post: MyPost) => {
    setDraft({ id: post.id, title: post.title, content: post.content, imageUrl: post.imageUrl ?? "" });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving || isUploadingCover) return;
    setIsFormOpen(false);
    setDraft(createEmptyDraft());
  };

  const updateEditorContent = () => {
    const html = editorRef.current?.innerHTML ?? INITIAL_CONTENT;
    setDraft((prev) => ({ ...prev, content: html }));
  };

  const runEditorCommand = (command: string) => {
    if (command === "insertImage") {
      const url = prompt("Cole a URL da imagem (ex: https://example.com/image.jpg):");
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
      setToast({ type: "error", message: "Escreva um pouco mais sobre a notícia antes de enviar." });
      return;
    }

    setIsSaving(true);
    try {
      const payload = { title: draft.title, content: htmlContent, imageUrl: draft.imageUrl || null };

      const result = draft.id ? await updateMemberPost(draft.id, payload) : await submitMemberPost(payload);

      if (!result.success) {
        setToast({ type: "error", message: result.error || "Não foi possível enviar a publicação." });
        return;
      }

      setToast({ type: "success", message: "Enviado! Aguarde a aprovação do seu chefe." });
      closeForm();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const removePost = async (post: MyPost) => {
    if (!window.confirm(`Deseja realmente excluir "${post.title}"?`)) return;

    const result = await deleteMemberPost(post.id);
    if (!result.success) {
      setToast({ type: "error", message: result.error || "Falha ao excluir a publicação." });
      return;
    }
    setToast({ type: "success", message: "Publicação excluída." });
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
          <h1 className="font-heading text-xl md:text-2xl font-extrabold text-gray-900">Minhas Publicações</h1>
          <p className="text-gray-500 text-sm mt-1">Envie notícias da sua tropa — seu chefe precisa aprovar antes de irem ao ar.</p>
        </div>

        <button
          onClick={openNewPost}
          className="cursor-pointer w-full sm:w-auto bg-scout-green hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          Nova Publicação
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {posts.length === 0 ? (
          <div className="p-10 text-center">
            <i className="fa-solid fa-file-circle-xmark text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 font-bold">Você ainda não enviou nenhuma publicação.</p>
          </div>
        ) : (
          posts.map((post) => {
            const meta = STATUS_META[post.status];
            const canEdit = post.status === "PENDING_REVIEW" || post.status === "REJECTED";
            return (
              <div key={post.id} className="p-4 md:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h3 className="font-heading text-lg font-bold text-gray-800 leading-tight">{post.title}</h3>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>

                <p className="text-xs font-medium text-gray-500">Atualizado em {formatDate(post.updatedAt)}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{extractTextFromHtml(post.content)}</p>

                {post.status === "REJECTED" && post.rejectionReason && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i>
                    {post.rejectionReason}
                  </p>
                )}

                {canEdit && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => openEditPost(post)}
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    >
                      <i className="fa-solid fa-pen mr-1"></i>
                      {post.status === "REJECTED" ? "Editar e Reenviar" : "Editar"}
                    </button>
                    <button
                      onClick={() => removePost(post)}
                      className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>Excluir
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-55 bg-black/65 backdrop-blur-sm overflow-y-auto p-3 md:p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
              <h2 className="font-heading text-xl font-bold text-gray-900">{draft.id ? "Editar Publicação" : "Nova Publicação"}</h2>
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
                      <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Enviando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane mr-2"></i>Enviar para Aprovação
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título da publicação"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Imagem de capa (opcional)</label>
                {draft.imageUrl ? (
                  <div className="space-y-2">
                    <img src={draft.imageUrl} alt="Capa selecionada" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                    <button
                      onClick={() => setDraft((prev) => ({ ...prev, imageUrl: "" }))}
                      className="cursor-pointer text-xs font-bold text-red-600 hover:text-red-700"
                      type="button"
                    >
                      Remover capa
                    </button>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Conteúdo</label>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => runEditorCommand("bold")} className="toolbar-btn" title="Negrito" type="button">
                      <i className="fa-solid fa-bold"></i>
                    </button>
                    <button onClick={() => runEditorCommand("italic")} className="toolbar-btn" title="Itálico" type="button">
                      <i className="fa-solid fa-italic"></i>
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
                    className="min-h-60 p-5 prose prose-sm max-w-none text-gray-800 focus:outline-none"
                  />
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
