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
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  
  useEffect(() => { setFolders(initialFolders); }, [initialFolders]);
  useEffect(() => { setDocuments(initialDocuments); }, [initialDocuments]);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);

  const [creatingIn, setCreatingIn] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const [movingItem, setMovingItem] = useState<{ id: string, type: "folder" | "document", name: string } | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [expandedMoveFolders, setExpandedMoveFolders] = useState<Set<string>>(new Set(["root"]));
  
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  // Controle de estado para o Menu Mobile (Dropdown)
  const [openMobileMenuId, setOpenMobileMenuId] = useState<string | null>(null);

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

  // Wrapper para executar ações do menu mobile e fechá-lo em seguida
  const handleMobileAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setOpenMobileMenuId(null);
    action();
  };

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
                className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors mt-1 ${isSelected ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200' : 'hover:bg-gray-100 text-gray-700'}`}
                style={{ paddingLeft: `${(depth * 1.2) + 0.5}rem` }}
                onClick={() => setMoveTargetId(folder.id)}
              >
                <button type="button" className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors flex items-center justify-center w-6 h-6" onClick={(e) => {
                  e.stopPropagation(); setExpandedMoveFolders(prev => { const n = new Set(prev); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; });
                }}>
                  <i className={`fa-solid fa-chevron-right text-xs transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}></i>
                </button>
                <i className={`fa-solid ${isExpanded ? "fa-folder-open" : "fa-folder"} text-scout-yellow text-sm`}></i>
                <span className="truncate select-none text-sm">{folder.name}</span>
              </div>
              {isExpanded && renderMoveTree(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
    const childDocs = documents.filter(d => d.folderId === parentId);

    return (
      <div className="flex flex-col w-full text-sm relative">
        {/* PASTAS */}
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const isRenaming = renamingFolderId === folder.id;
          const isMenuOpen = openMobileMenuId === folder.id;

          return (
            // Adicionado z-40 e relative condicional para evitar o Trap de Z-Index
            <div key={folder.id} className={`w-full ${isMenuOpen ? 'relative z-40' : 'relative z-auto'}`}>
              <div className="flex items-center justify-between py-2 pr-2 lg:pr-4 hover:bg-gray-50 group transition-colors cursor-pointer text-gray-700 border-b border-gray-50/50" style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} onClick={() => !isRenaming && toggleFolder(folder.id)}>
                
                <div className="flex items-center gap-2 overflow-hidden w-full">
                  <div className="w-5 flex justify-center shrink-0">
                    <i className={`fa-solid fa-chevron-right text-[10px] text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}></i>
                  </div>
                  <i className={`fa-solid ${isExpanded ? "fa-folder-open" : "fa-folder"} text-scout-yellow text-base shrink-0`}></i>
                  
                  {isRenaming ? (
                    <input 
                      ref={inputRef} type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if(e.key === "Enter") handleRenameFolderInline(); if(e.key === "Escape") setRenamingFolderId(null); }} 
                      onBlur={handleRenameFolderInline} onClick={e => e.stopPropagation()}
                      className="h-7 w-full max-w-xs text-sm px-2 border-2 border-scout-green bg-white shadow-sm outline-none rounded-md focus:ring-2 focus:ring-scout-green/20"
                    />
                  ) : (
                    <span className="truncate select-none font-medium text-gray-700">{folder.name}</span>
                  )}
                </div>

                {!isRenaming && (
                  <div className="flex items-center shrink-0 relative">
                    {/* BOTÕES DESKTOP (Invisíveis no Mobile, Visíveis no Hover do Desktop) */}
                    <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setExpandedFolders(prev => new Set(prev).add(folder.id)); setCreatingIn(folder.id); }} className="p-2 text-gray-400 hover:text-scout-green hover:bg-scout-green/10 rounded-md transition-colors" title="Nova Subpasta">
                        <i className="fa-solid fa-folder-plus text-sm"></i>
                      </button>
                      <button onClick={() => triggerFileUpload(folder.id)} className="p-2 text-gray-400 hover:text-scout-green hover:bg-scout-green/10 rounded-md transition-colors" title="Novo Arquivo Aqui">
                        <i className="fa-solid fa-file-arrow-up text-sm"></i>
                      </button>
                      <button onClick={() => startRenaming(folder.id, folder.name)} className="p-2 text-gray-400 hover:text-scout-yellow hover:bg-scout-yellow/10 rounded-md transition-colors" title="Renomear">
                        <i className="fa-solid fa-pen text-sm"></i>
                      </button>
                      <button onClick={() => { setMovingItem({ id: folder.id, type: "folder", name: folder.name }); setMoveTargetId(null); setExpandedMoveFolders(new Set(["root"])); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Mover">
                        <i className="fa-solid fa-arrows-up-down-left-right text-sm"></i>
                      </button>
                      <button onClick={() => setEditingFolder(folder)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Editar Permissões">
                        <i className="fa-solid fa-user-lock text-sm"></i>
                      </button>
                      <button onClick={() => handleDeleteFolder(folder.id, folder.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir Pasta">
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </div>

                    {/* MENU MOBILE (3 Pontinhos visíveis apenas no Mobile) */}
                    <div className="flex lg:hidden">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMobileMenuId(isMenuOpen ? null : folder.id); }}
                        className="p-2 w-10 h-10 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 transition-colors relative z-50"
                      >
                        <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
                      </button>
                      
                      {/* Dropdown Menu Mobile com Backdrop Local */}
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMobileMenuId(null); }}></div>
                          <div className="absolute right-8 top-full mt-1 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col py-1.5 animate-fade-in-down origin-top-right">
                            <button onClick={(e) => handleMobileAction(e, () => { setExpandedFolders(prev => new Set(prev).add(folder.id)); setCreatingIn(folder.id); })} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                              <i className="fa-solid fa-folder-plus w-5 text-center text-scout-green"></i> Nova Subpasta
                            </button>
                            <button onClick={(e) => handleMobileAction(e, () => triggerFileUpload(folder.id))} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                              <i className="fa-solid fa-file-arrow-up w-5 text-center text-scout-green"></i> Novo Arquivo
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2"></div>
                            <button onClick={(e) => handleMobileAction(e, () => startRenaming(folder.id, folder.name))} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                              <i className="fa-solid fa-pen w-5 text-center text-gray-400"></i> Renomear
                            </button>
                            <button onClick={(e) => handleMobileAction(e, () => { setMovingItem({ id: folder.id, type: "folder", name: folder.name }); setMoveTargetId(null); setExpandedMoveFolders(new Set(["root"])); })} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                              <i className="fa-solid fa-arrows-up-down-left-right w-5 text-center text-blue-500"></i> Mover
                            </button>
                            <button onClick={(e) => handleMobileAction(e, () => setEditingFolder(folder))} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                              <i className="fa-solid fa-user-lock w-5 text-center text-purple-500"></i> Permissões
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2"></div>
                            <button onClick={(e) => handleMobileAction(e, () => handleDeleteFolder(folder.id, folder.name))} className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-left font-bold">
                              <i className="fa-solid fa-trash w-5 text-center"></i> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {isExpanded && !isRenaming && (
                <div className="flex flex-col w-full animate-fade-in">
                  {renderTree(folder.id, depth + 1)}
                  {creatingIn === folder.id && (
                    <div className="flex items-center py-2 gap-2" style={{ paddingLeft: `${((depth + 1) * 1.5) + 1}rem` }}>
                      <div className="w-5 shrink-0"></div>
                      <i className="fa-solid fa-folder text-scout-yellow text-base shrink-0"></i>
                      <input 
                        ref={inputRef} type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleCreateFolderInline}
                        className="h-7 w-full max-w-xs text-sm px-2 border-2 border-scout-green bg-white shadow-sm outline-none rounded-md focus:ring-2 focus:ring-scout-green/20" placeholder="Nome da pasta..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* DOCUMENTOS */}
        {childDocs.map(doc => {
          const isMenuOpen = openMobileMenuId === doc.id;
          return (
            <div key={doc.id} className={`flex items-center justify-between py-2 pr-2 lg:pr-4 hover:bg-gray-50 group transition-colors cursor-default text-gray-600 border-b border-gray-50/50 ${isMenuOpen ? 'relative z-40' : 'relative z-auto'}`} style={{ paddingLeft: `${(depth * 1.5) + 2.5}rem` }}>
              <div className="flex items-center gap-2.5 overflow-hidden w-full pr-2">
                <i className="fa-solid fa-file-pdf text-red-500 text-base shrink-0"></i>
                <span className="truncate">{doc.title}</span>
              </div>

              <div className="flex items-center shrink-0 relative">
                <span className="text-[11px] text-gray-400 mr-2 hidden sm:inline-block">{formatDate(doc.createdAt)}</span>
                
                {/* BOTÕES DESKTOP */}
                <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <a href={`/portal-da-transparencia/arquivo/${doc.id}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-scout-green hover:bg-scout-green/10 rounded-md transition-colors" title="Visualizar">
                    <i className="fa-solid fa-eye text-sm"></i>
                  </a>
                  <button onClick={() => { setMovingItem({ id: doc.id, type: "document", name: doc.title }); setMoveTargetId(null); setExpandedMoveFolders(new Set(["root"])); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Mover">
                    <i className="fa-solid fa-arrows-up-down-left-right text-sm"></i>
                  </button>
                  <button onClick={() => setEditingDocument(doc)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Editar">
                    <i className="fa-solid fa-pen text-sm"></i>
                  </button>
                  <button onClick={() => handleDeleteDocument(doc.id, doc.title, doc.fileUrl)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>

                {/* MENU MOBILE */}
                <div className="flex lg:hidden">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMobileMenuId(isMenuOpen ? null : doc.id); }}
                    className="p-2 w-10 h-10 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 transition-colors relative z-50"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
                  </button>
                  
                  {/* Dropdown Menu Mobile Documento */}
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMobileMenuId(null); }}></div>
                      <div className="absolute right-8 top-full mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col py-1.5 animate-fade-in-down origin-top-right">
                        <a href={`/portal-da-transparencia/arquivo/${doc.id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); setOpenMobileMenuId(null); }} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                          <i className="fa-solid fa-eye w-5 text-center text-scout-green"></i> Visualizar
                        </a>
                        <button onClick={(e) => handleMobileAction(e, () => { setMovingItem({ id: doc.id, type: "document", name: doc.title }); setMoveTargetId(null); setExpandedMoveFolders(new Set(["root"])); })} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                          <i className="fa-solid fa-arrows-up-down-left-right w-5 text-center text-blue-500"></i> Mover
                        </button>
                        <button onClick={(e) => handleMobileAction(e, () => setEditingDocument(doc))} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                          <i className="fa-solid fa-pen w-5 text-center text-purple-500"></i> Editar
                        </button>
                        <div className="h-px bg-gray-100 my-1 mx-2"></div>
                        <button onClick={(e) => handleMobileAction(e, () => handleDeleteDocument(doc.id, doc.title, doc.fileUrl))} className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-left font-bold">
                          <i className="fa-solid fa-trash w-5 text-center"></i> Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isRootMenuOpen = openMobileMenuId === "root";

  return (
    <div className="py-2 select-none relative h-full">
      <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange} />

      <div className={`w-full border-b border-gray-100 pb-2 mb-2 ${isRootMenuOpen ? 'relative z-40' : 'relative z-auto'}`}>
        <div className="flex items-center justify-between py-2.5 pr-2 lg:pr-4 pl-3 hover:bg-gray-50 group transition-colors cursor-pointer text-gray-800 rounded-t-lg relative" onClick={() => toggleFolder("root")}>
          <div className="flex items-center gap-2 font-bold text-base w-full">
            <div className="w-5 flex justify-center shrink-0">
              <i className={`fa-solid fa-chevron-right text-xs text-gray-400 transition-transform duration-200 ${expandedFolders.has("root") ? "rotate-90" : ""}`}></i>
            </div>
            <i className={`fa-solid ${expandedFolders.has("root") ? "fa-folder-open" : "fa-folder"} text-scout-green text-lg shrink-0`}></i>
            <span className="truncate">Portal da Transparência</span>
          </div>
          
          <div className="flex items-center shrink-0">
            {/* BOTÕES DA RAIZ DESKTOP */}
            <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setExpandedFolders(prev => new Set(prev).add("root")); setCreatingIn(null); }} className="p-2 text-gray-400 hover:text-scout-green hover:bg-scout-green/10 rounded-md transition-colors" title="Nova Pasta">
                <i className="fa-solid fa-folder-plus text-sm"></i>
              </button>
              <button onClick={() => triggerFileUpload(null)} className="p-2 text-gray-400 hover:text-scout-green hover:bg-scout-green/10 rounded-md transition-colors" title="Novo Arquivo">
                <i className="fa-solid fa-file-arrow-up text-sm"></i>
              </button>
            </div>

            {/* MENU DA RAIZ MOBILE */}
            <div className="flex lg:hidden">
              <button 
                onClick={(e) => { e.stopPropagation(); setOpenMobileMenuId(isRootMenuOpen ? null : "root"); }}
                className="p-2 w-10 h-10 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 transition-colors relative z-50"
              >
                <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
              </button>
              
              {isRootMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMobileMenuId(null); }}></div>
                  <div className="absolute right-8 top-full mt-1 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col py-1.5 animate-fade-in-down origin-top-right">
                    <button onClick={(e) => handleMobileAction(e, () => { setExpandedFolders(prev => new Set(prev).add("root")); setCreatingIn(null); })} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                      <i className="fa-solid fa-folder-plus w-5 text-center text-scout-green"></i> Nova Pasta
                    </button>
                    <button onClick={(e) => handleMobileAction(e, () => triggerFileUpload(null))} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left font-medium">
                      <i className="fa-solid fa-file-arrow-up w-5 text-center text-scout-green"></i> Novo Arquivo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {expandedFolders.has("root") && (
          <div className="w-full mt-1">
            {renderTree(null, 0)}
            {creatingIn === null && (
              <div className="flex items-center py-2 gap-2" style={{ paddingLeft: `2.5rem` }}>
                <i className="fa-solid fa-folder text-scout-yellow text-base shrink-0"></i>
                <input 
                  ref={inputRef} type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleCreateFolderInline}
                  className="h-7 w-full max-w-xs text-sm px-2 border-2 border-scout-green bg-white shadow-sm outline-none rounded-md focus:ring-2 focus:ring-scout-green/20" placeholder="Nome da pasta..."
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE MOVER */}
      {movingItem && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="font-heading font-bold text-gray-800 text-xl mb-1">Mover Item</h3>
            <p className="text-sm text-gray-500 mb-5 truncate">Selecione o destino para "{movingItem.name}"</p>
            
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50/50 mb-6 custom-scrollbar">
              <div 
                className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors ${moveTargetId === null ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => setMoveTargetId(null)}
              >
                <button 
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors flex items-center justify-center w-6 h-6 shrink-0"
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
                  <i className={`fa-solid fa-chevron-right text-xs transition-transform duration-200 ${expandedMoveFolders.has("root") ? "rotate-90" : ""}`}></i>
                </button>
                <i className={`fa-solid ${expandedMoveFolders.has("root") ? "fa-folder-open" : "fa-folder"} text-scout-green text-sm shrink-0`}></i>
                <span className="truncate select-none text-sm font-medium">Raiz (Portal da Transparência)</span>
              </div>
              
              {expandedMoveFolders.has("root") && (
                <div className="mt-1">
                  {renderMoveTree(null, 0)}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-auto shrink-0">
              <button type="button" onClick={() => setMovingItem(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">Cancelar</button>
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
                className="px-5 py-2.5 text-sm font-bold bg-scout-green text-white hover:bg-green-700 rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Mover Aqui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <h3 className="font-heading font-bold text-gray-800 text-xl mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">{confirmDialog.message}</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => setConfirmDialog(null)} className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDialog.onConfirm} className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl cursor-pointer transition-colors shadow-md">
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTER */}
      {toast && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl text-sm font-bold text-white transition-all animate-fade-in-up flex items-center gap-3 z-50 ${toast.type === "success" ? "bg-scout-green" : "bg-red-600"}`}>
          <i className={`fa-solid text-lg ${toast.type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <ModalNovoArquivo 
        isOpen={!!selectedFile} 
        file={selectedFile} 
        targetFolderId={uploadTargetId}
        folders={folders}
        adminUsers={adminUsers}
        onClose={() => setSelectedFile(null)} 
      />
      
      <ModalEditarPasta 
        isOpen={!!editingFolder}
        folder={editingFolder}
        adminUsers={adminUsers}
        onClose={() => setEditingFolder(null)}
      />

      <ModalEditarArquivo 
        isOpen={!!editingDocument}
        document={editingDocument}
        adminUsers={adminUsers}
        folders={folders}
        onClose={() => setEditingDocument(null)}
      />
    </div>
  );
}