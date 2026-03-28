"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { deleteDocument, deleteFolder, createFolderInline, moveItem, renameFolderInline } from "../actions";
import ModalNovoArquivo from "./ModalNovoArquivo";
import ModalEditarPasta from "./ModalEditarPasta";
import ModalEditarArquivo from "./ModalEditarArquivo";

type Folder = { id: string; name: string; parentId: string | null; createdAt: Date };
type Document = { id: string; title: string; folderId: string | null; fileUrl: string; createdAt: Date };
type AdminUser = { id: string; name: string | null; role: string };

export default function ExplorerTree({ folders: initialFolders, documents: initialDocuments, adminUsers }: { folders: Folder[], documents: Document[], adminUsers: AdminUser[] }) {
  // Sincronização de estado com o servidor
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  
  useEffect(() => { setFolders(initialFolders); }, [initialFolders]);
  useEffect(() => { setDocuments(initialDocuments); }, [initialDocuments]);

  // Controles da Árvore Principal
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));

  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  
  //Controle de edição de permissões
  const [editingFolder, setEditingFolder] = useState<any | null>(null);

  // Criação e Renomeação Inline
  const [creatingIn, setCreatingIn] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Upload de Arquivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  // Modal de Mover
  const [movingItem, setMovingItem] = useState<{ id: string, type: "folder" | "document", name: string } | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [expandedMoveFolders, setExpandedMoveFolders] = useState<Set<string>>(new Set(["root"]));
  
  // Confirmações e Notificações
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  // Foco automático nos inputs
  useEffect(() => {
    if ((creatingIn !== undefined || renamingFolderId !== null) && inputRef.current) {
      inputRef.current.focus();
      if (renamingFolderId !== null) inputRef.current.select();
    }
  }, [creatingIn, renamingFolderId]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // --- LÓGICA DE ARQUIVOS ---
  const triggerFileUpload = (folderId: string | null) => {
    setUploadTargetId(folderId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
    e.target.value = ""; 
  };

  // --- LÓGICA DE PASTAS (CRIAR E RENOMEAR INLINE) ---
  const handleCreateFolderInline = async () => {
    if (!newFolderName.trim()) { setCreatingIn(undefined); return; }
    const formData = new FormData();
    formData.append("name", newFolderName.trim());
    if (creatingIn) formData.append("parentId", creatingIn);

    try {
      const newFolder = await createFolderInline(formData);
      setFolders(prev => [...prev, { ...newFolder, parentId: creatingIn, createdAt: new Date() } as Folder]);
      showToast("Pasta criada!", "success");
    } catch (error: any) {
      showToast(error.message || "Erro ao criar pasta.", "error");
    } finally {
      setCreatingIn(undefined); setNewFolderName("");
    }
  };

  const handleRenameFolderInline = async () => {
    if (!renamingFolderId || !renameValue.trim()) { setRenamingFolderId(null); return; }
    try {
      await renameFolderInline(renamingFolderId, renameValue.trim());
      setFolders(prev => prev.map(f => f.id === renamingFolderId ? { ...f, name: renameValue.trim() } : f));
      showToast("Pasta renomeada!", "success");
    } catch (error: any) {
      showToast(error.message || "Erro ao renomear.", "error");
    } finally {
      setRenamingFolderId(null); setRenameValue("");
    }
  };

  const startRenaming = (folderId: string, currentName: string) => {
    setRenameValue(currentName);
    setRenamingFolderId(folderId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreateFolderInline();
    if (e.key === "Escape") {
      setCreatingIn(undefined);
      setNewFolderName("");
    }
  };

  // --- LÓGICA DE EXCLUSÃO ---
  const handleDeleteFolder = (folderId: string, name: string) => {
    setConfirmDialog({
      isOpen: true, title: "Excluir Pasta", message: `Tem certeza que deseja excluir permanentemente a pasta "${name}" e TODO o seu conteúdo?`,
      onConfirm: async () => {
        try { await deleteFolder(folderId); showToast("Pasta excluída com sucesso!", "success"); } catch (e) { showToast("Erro ao excluir pasta.", "error"); }
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteDocument = (docId: string, name: string, fileUrl: string) => {
    setConfirmDialog({
      isOpen: true, title: "Excluir Arquivo", message: `Tem certeza que deseja excluir o arquivo "${name}"?`,
      onConfirm: async () => {
        try { await deleteDocument(docId, fileUrl); showToast("Arquivo excluído com sucesso!", "success"); } catch (e) { showToast("Erro ao excluir arquivo.", "error"); }
        setConfirmDialog(null);
      }
    });
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);

  // --- LÓGICA DO MODAL DE MOVER ---
  const invalidMoveIds = useMemo(() => {
    const invalidIds = new Set<string>();
    if (movingItem?.type === "folder") {
      invalidIds.add(movingItem.id);
      const addDescendants = (parentId: string) => {
        folders.filter(f => f.parentId === parentId).forEach(f => { invalidIds.add(f.id); addDescendants(f.id); });
      };
      addDescendants(movingItem.id);
    }
    return invalidIds;
  }, [movingItem, folders]);

  const renderMoveTree = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId && !invalidMoveIds.has(f.id)).sort((a, b) => a.name.localeCompare(b.name));
    if (childFolders.length === 0) return null;
    return (
      <div className="flex flex-col w-full">
        {childFolders.map(folder => {
          const isExpanded = expandedMoveFolders.has(folder.id);
          const isSelected = moveTargetId === folder.id;
          return (
            <div key={folder.id} className="w-full">
              <div 
                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors mt-0.5 ${isSelected ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-stone-100 text-stone-700'}`}
                style={{ paddingLeft: `${(depth * 1.2) + 0.5}rem` }}
                onClick={() => setMoveTargetId(folder.id)}
              >
                <button type="button" className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors" onClick={(e) => {
                  e.stopPropagation(); setExpandedMoveFolders(prev => { const n = new Set(prev); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; });
                }}>
                  <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <span className="truncate select-none text-sm">{folder.name}</span>
              </div>
              {isExpanded && renderMoveTree(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // --- RENDERIZAÇÃO DA ÁRVORE PRINCIPAL ---
  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
    const childDocs = documents.filter(d => d.folderId === parentId);

    return (
      <div className="flex flex-col w-full text-sm">
        {/* PASTAS */}
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const isRenaming = renamingFolderId === folder.id;

          return (
            <div key={folder.id} className="w-full">
              <div className="flex items-center justify-between py-1.5 pr-4 hover:bg-emerald-50/50 group transition-colors cursor-pointer text-stone-700" style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} onClick={() => !isRenaming && toggleFolder(folder.id)}>
                
                <div className="flex items-center gap-1.5 overflow-hidden w-full">
                  <svg className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  <svg className="w-5 h-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                  
                  {isRenaming ? (
                    <input 
                      ref={inputRef} type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if(e.key === "Enter") handleRenameFolderInline(); if(e.key === "Escape") setRenamingFolderId(null); }} 
                      onBlur={handleRenameFolderInline} onClick={e => e.stopPropagation()}
                      className="h-6 w-full max-w-50 text-sm px-1 border border-blue-500 bg-white shadow-sm outline-none rounded"
                    />
                  ) : (
                    <span className="truncate select-none">{folder.name}</span>
                  )}
                </div>

                {!isRenaming && (
  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
    
    {/* Nova Subpasta */}
    <button onClick={() => { setExpandedFolders(prev => new Set(prev).add(folder.id)); setCreatingIn(folder.id); }} 
      className="p-1 text-stone-400 hover:text-emerald-600 rounded cursor-pointer" title="Nova Subpasta">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H5z" /></svg>
    </button>

    {/* Novo Arquivo */}
    <button onClick={() => triggerFileUpload(folder.id)} 
      className="p-1 text-stone-400 hover:text-emerald-600 rounded cursor-pointer" title="Novo Arquivo Aqui">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    </button>

    {/* Renomear */}
    <button onClick={() => startRenaming(folder.id, folder.name)} 
      className="p-1 text-stone-400 hover:text-amber-600 rounded cursor-pointer" title="Renomear">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
    </button>

    {/* Mover */}
    <button onClick={() => { setMovingItem({ id: folder.id, type: "folder", name: folder.name }); setMoveTargetId(null); setExpandedMoveFolders(new Set(["root"])); }} 
      className="p-1 text-stone-400 hover:text-blue-600 rounded cursor-pointer" title="Mover">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    </button>

    
    {/* Botão de Editar Permissões (Agora abre o Modal) */}
<button onClick={() => setEditingFolder(folder)} className="p-1 text-stone-400 hover:text-blue-600 rounded cursor-pointer transition-colors" title="Editar Permissões">
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
</button>

    {/* Excluir */}
    <button onClick={() => handleDeleteFolder(folder.id, folder.name)} 
      className="p-1 text-stone-400 hover:text-red-600 rounded cursor-pointer" title="Excluir Pasta">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </button>
    
  </div>
)}
              </div>
              
              {isExpanded && !isRenaming && (
                <div className="flex flex-col w-full animate-fade-in">
                  {renderTree(folder.id, depth + 1)}
                  {creatingIn === folder.id && (
                    <div className="flex items-center py-1.5" style={{ paddingLeft: `${((depth + 1) * 1.5) + 1}rem` }}>
                      <svg className="w-4 h-4 text-transparent shrink-0 mr-1.5" viewBox="0 0 24 24"></svg>
                      <svg className="w-5 h-5 text-amber-400 shrink-0 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                      <input 
                        ref={inputRef} type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleCreateFolderInline}
                        className="h-6 w-48 text-sm px-1 border border-emerald-500 bg-white shadow-sm outline-none rounded" placeholder="Nome..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* DOCUMENTOS */}
        {childDocs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between py-1 pr-4 hover:bg-emerald-50/50 group transition-colors cursor-default text-stone-600 border-t border-transparent hover:border-stone-50" style={{ paddingLeft: `${(depth * 1.5) + 2.5}rem` }}>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span className="truncate">{doc.title}</span>
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[11px] text-stone-400 mr-2">{formatDate(doc.createdAt)}</span>
              <a href={`/portal-da-transparencia/arquivo/${doc.id}`} target="_blank" rel="noopener noreferrer" className="p-1 text-stone-400 hover:text-emerald-600 rounded cursor-pointer" title="Visualizar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </a>
              <button onClick={() => { setMovingItem({ id: doc.id, type: "document", name: doc.title }); setMoveTargetId(null); setExpandedMoveFolders(new Set(["root"])); }} className="p-1 text-stone-400 hover:text-blue-600 rounded cursor-pointer" title="Mover">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </button>
              {/* Botão de Editar Documento (Agora abre o Modal) */}
<button onClick={() => setEditingDocument(doc)} className="p-1 text-stone-400 hover:text-blue-600 rounded cursor-pointer transition-colors" title="Editar">
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
</button>
              <button onClick={() => handleDeleteDocument(doc.id, doc.title, doc.fileUrl)} className="p-1 text-stone-400 hover:text-red-600 rounded cursor-pointer" title="Excluir">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="py-2 select-none relative h-full">
      {/* INPUT INVISÍVEL PARA ARQUIVOS */}
      <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange} />

      <div className="w-full border-b border-stone-100 pb-2 mb-2">
        <div className="flex items-center justify-between py-1.5 pr-4 pl-2 hover:bg-emerald-50/50 group transition-colors cursor-pointer text-stone-800" onClick={() => toggleFolder("root")}>
          <div className="flex items-center gap-1.5 font-bold">
            <svg className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${expandedFolders.has("root") ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            <span>Portal da Transparência</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setExpandedFolders(prev => new Set(prev).add("root")); setCreatingIn(null); }} className="p-1 text-stone-400 hover:text-emerald-600 rounded cursor-pointer" title="Nova Pasta">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H5z" /></svg>
            </button>
            <button onClick={() => triggerFileUpload(null)} className="p-1 text-stone-400 hover:text-emerald-600 rounded cursor-pointer" title="Novo Arquivo">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
          </div>
        </div>
        
        {expandedFolders.has("root") && (
          <div className="w-full">
            {renderTree(null, 0)}
            {creatingIn === null && (
              <div className="flex items-center py-1.5" style={{ paddingLeft: `2.5rem` }}>
                <svg className="w-5 h-5 text-amber-400 shrink-0 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <input 
                  ref={inputRef} type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleCreateFolderInline}
                  className="h-6 w-48 text-sm px-1 border border-emerald-500 bg-white shadow-sm outline-none rounded" placeholder="Nome..."
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE MOVER (Árvore Customizada) */}
      {movingItem && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <h3 className="font-bold text-stone-800 text-lg mb-1">Mover Item</h3>
            <p className="text-sm text-stone-500 mb-4 truncate">Selecione o destino para "{movingItem.name}"</p>
            
            <div className="flex-1 overflow-y-auto border border-stone-200 rounded-xl p-2 bg-stone-50/50 mb-5">
              <div 
                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${moveTargetId === null ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-stone-100 text-stone-700'}`}
                onClick={() => setMoveTargetId(null)}
              >
                <button 
                  type="button"
                  className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedMoveFolders(prev => {
                      const next = new Set(prev);
                      if (next.has("root")) next.delete("root");
                      else next.add("root");
                      return next;
                    });
                  }}
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${expandedMoveFolders.has("root") ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                <span className="truncate select-none text-sm">Raiz (Portal da Transparência)</span>
              </div>
              
              {expandedMoveFolders.has("root") && (
                <div className="mt-1">
                  {renderMoveTree(null, 0)}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-auto">
              <button type="button" onClick={() => setMovingItem(null)} className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors">Cancelar</button>
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    await moveItem(movingItem.id, movingItem.type, moveTargetId);
                    setExpandedFolders(prev => new Set(prev).add(moveTargetId || "root"));
                    showToast("Item movido com sucesso!", "success");
                  } catch (err: any) {
                    showToast(err.message || "Erro ao mover.", "error");
                  }
                  setMovingItem(null);
                }}
                className="px-4 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Mover Aqui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="font-bold text-stone-800 text-lg mb-2">{confirmDialog.title}</h3>
            <p className="text-stone-500 text-sm mb-6">{confirmDialog.message}</p>
            
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
              <button onClick={() => setConfirmDialog(null)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDialog.onConfirm} className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl cursor-pointer transition-colors shadow-sm">
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTER */}
      {toast && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all animate-fade-in-up flex items-center gap-3 z-50 ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? (
            <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* MODAL DE NOVO ARQUIVO */}
      <ModalNovoArquivo 
        isOpen={!!selectedFile} 
        file={selectedFile} 
        targetFolderId={uploadTargetId}
        folders={folders}
        adminUsers={adminUsers}
        onClose={() => setSelectedFile(null)} 
      />
      {/* NOVO MODAL DE EDITAR PASTA */}
      <ModalEditarPasta 
        isOpen={!!editingFolder}
        folder={editingFolder}
        adminUsers={adminUsers}
        onClose={() => setEditingFolder(null)}
      />

      {/* NOVO MODAL DE EDITAR ARQUIVO */}
      <ModalEditarArquivo 
        isOpen={!!editingDocument}
        document={editingDocument}
        adminUsers={adminUsers}
        folders={folders} // Precisamos das pastas aqui para o seletor recursivo
        onClose={() => setEditingDocument(null)}
      />
    </div>
  );
}