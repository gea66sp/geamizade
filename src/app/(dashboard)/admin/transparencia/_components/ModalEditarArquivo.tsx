"use client";

import { useState, useEffect, useMemo } from "react";
import { updateDocument } from "../actions"; // Verifique se esta action existe e não tem redirect!

type AdminUser = { id: string; name: string | null; role: string };
type FolderBasic = { id: string; name: string; parentId: string | null };
type DocumentDetailed = { 
  id: string; title: string; description?: string | null; folderId: string | null;
  fileUrl: string; createdAt: Date;
  isPublic: boolean; isRestrictedView: boolean; isRestrictedEdit: boolean;
  allowedViewers: { id: string }[]; allowedEditors: { id: string }[];
};

interface ModalEditarArquivoProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentDetailed | null;
  adminUsers: AdminUser[];
  folders: FolderBasic[];
}

export default function ModalEditarArquivo({ isOpen, onClose, document, adminUsers, folders }: ModalEditarArquivoProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [isRestrictedView, setIsRestrictedView] = useState(false);
  const [isRestrictedEdit, setIsRestrictedEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para a Árvore de Destino (Mover Arquivo)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedTargetFolders, setExpandedTargetFolders] = useState<Set<string>>(new Set(["root"]));

  // Sincroniza os estados quando um novo documento é selecionado
  useEffect(() => {
    if (document) {
      setIsPublic(document.isPublic);
      setIsRestrictedView(document.isRestrictedView);
      setIsRestrictedEdit(document.isRestrictedEdit);
      setSelectedFolderId(document.folderId); // Define a pasta atual dele como destino inicial
      if (document.folderId) {
        setExpandedTargetFolders(prev => new Set(prev).add("root"));
      }
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const initialViewers = document.allowedViewers.map(u => u.id);
  const initialEditors = document.allowedEditors.map(u => u.id);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    // O folderId atualizado vai via input type="hidden"
    
    try {
      await updateDocument(document!.id, document!.fileUrl, formData);
      onClose();
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) {
        onClose();
        return;
      }
      alert(err.message || "Erro ao atualizar documento.");
    } finally {
      setIsSaving(false);
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: '2-digit', minute:'2-digit' }).format(date);
  };

  // --- ÁRVORE DE DESTINO NO FORMULÁRIO ---
  const renderTargetTree = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (childFolders.length === 0) return null;

    return (
      <div className="flex flex-col w-full">
        {childFolders.map(folder => {
          const isExpanded = expandedTargetFolders.has(folder.id);
          const isSelected = selectedFolderId === folder.id;
          
          return (
            <div key={folder.id} className="w-full">
              <div 
                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors mt-0.5 ${isSelected ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-stone-200/50 text-stone-700'}`}
                style={{ paddingLeft: `${(depth * 1.2) + 0.5}rem` }}
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <button 
                  type="button"
                  className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedTargetFolders(prev => {
                      const next = new Set(prev);
                      if (next.has(folder.id)) next.delete(folder.id);
                      else next.add(folder.id);
                      return next;
                    });
                  }}
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <span className="truncate select-none text-sm">{folder.name}</span>
              </div>
              
              {isExpanded && renderTargetTree(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto relative">
        
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <div>
            <h3 className="text-xl font-bold text-stone-800 leading-tight">Configurações do Documento</h3>
            <p className="text-stone-500 text-sm">Atualizado em: <span className="font-bold text-stone-700">{formatDate(document.createdAt)}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="folderId" value={selectedFolderId || ""} />

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-stone-700">Título do Documento *</label>
            <input type="text" name="title" defaultValue={document.title} required className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-stone-700">Descrição (Opcional)</label>
            <textarea name="description" defaultValue={document.description || ""} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800 resize-none"></textarea>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-sm font-bold text-stone-700">Localização (Mover arquivo)</label>
            <div className="border border-stone-200 rounded-xl bg-stone-50 p-2 h-44 overflow-y-auto">
              <div className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${selectedFolderId === null ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-stone-200/50 text-stone-700'}`} onClick={() => setSelectedFolderId(null)} >
                <button type="button" className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors" onClick={(e) => { e.stopPropagation(); setExpandedTargetFolders(prev => { const next = new Set(prev); next.has("root") ? next.delete("root") : next.add("root"); return next; }); }}>
                  <svg className={`w-3.5 h-3.5 transition-transform ${expandedTargetFolders.has("root") ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                <span className="truncate select-none text-sm">Raiz (Portal da Transparência)</span>
              </div>
              {expandedTargetFolders.has("root") && ( <div className="mt-1">{renderTargetTree(null, 0)}</div> )}
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* Permissões */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer w-max">
              <input type="checkbox" name="isPublic" value="true" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer" />
              <div><p className="font-bold text-stone-700 text-sm">Público (Visível no site)</p></div>
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer w-max">
                <input type="checkbox" name="isRestrictedView" value="true" checked={isRestrictedView} onChange={e => setIsRestrictedView(e.target.checked)} className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer" />
                <div><p className="font-bold text-stone-700 text-sm">Restringir Visualização Interna</p></div>
              </label>
              
              {isRestrictedView && (
                <div className="ml-8 max-h-36 overflow-y-auto border border-stone-200 rounded-xl bg-stone-50 p-2 space-y-1 animate-fade-in">
                  {adminUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-1.5 hover:bg-stone-200/50 rounded-lg cursor-pointer transition-colors w-full">
                      <input type="checkbox" name="allowedViewers" value={u.id} defaultChecked={initialViewers.includes(u.id)} className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer" />
                      <span className="text-sm text-stone-700">{u.name} <span className="text-xs text-stone-400">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer w-max">
                <input type="checkbox" name="isRestrictedEdit" value="true" checked={isRestrictedEdit} onChange={e => setIsRestrictedEdit(e.target.checked)} className="w-5 h-5 text-red-600 rounded border-stone-300 focus:ring-red-500 cursor-pointer" />
                <div><p className="font-bold text-stone-700 text-sm">Restringir Edição/Exclusão</p></div>
              </label>

              {isRestrictedEdit && (
                <div className="ml-8 max-h-36 overflow-y-auto border border-stone-200 rounded-xl bg-stone-50 p-2 space-y-1 animate-fade-in">
                  {adminUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-1.5 hover:bg-stone-200/50 rounded-lg cursor-pointer transition-colors w-full">
                      <input type="checkbox" name="allowedEditors" value={u.id} defaultChecked={initialEditors.includes(u.id)} className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500 cursor-pointer" />
                      <span className="text-sm text-stone-700">{u.name} <span className="text-xs text-stone-400">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-100">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-stone-600 font-bold hover:bg-stone-100 rounded-xl cursor-pointer disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm">
              {isSaving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}