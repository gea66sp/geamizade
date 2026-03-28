"use client";

import { useState, useEffect } from "react";
import { createDocument } from "../actions";

type Folder = { id: string; name: string; parentId: string | null };
type AdminUser = { id: string; name: string | null; role: string };

interface ModalNovoArquivoProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  targetFolderId: string | null;
  folders: Folder[];
  adminUsers: AdminUser[];
}

export default function ModalNovoArquivo({ isOpen, onClose, file, targetFolderId, folders, adminUsers }: ModalNovoArquivoProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [isRestrictedView, setIsRestrictedView] = useState(false);
  const [isRestrictedEdit, setIsRestrictedEdit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para a Árvore de Destino
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(targetFolderId);
  const [expandedTargetFolders, setExpandedTargetFolders] = useState<Set<string>>(new Set(["root"]));

  // Atualiza o destino se o modal for aberto a partir do botão "+" de uma pasta específica
  useEffect(() => {
    setSelectedTargetId(targetFolderId);
    // Se veio com uma pasta de destino, expande a raiz para mostrá-la
    if (targetFolderId) {
      setExpandedTargetFolders(prev => new Set(prev).add("root"));
    }
  }, [targetFolderId, isOpen]);

  if (!isOpen || !file) return null;

  // Limpa o nome do arquivo: tira .pdf (case insensitive) e troca underlines/traços por espaços
  const formatFileName = (name: string) => {
    return name
      .replace(/\.pdf$/i, "") // Tira o .pdf
      .replace(/[_-]/g, " ")  // Troca _ e - por espaço
      .trim();
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUploading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("file", file!); // Injeta o arquivo que veio da árvore
    
    try {
      await createDocument(formData);
      onClose(); // Fecha o modal após salvar
    } catch (err: any) {
      // Se por acaso sobrar algum redirect do Next.js, a gente ignora ele
      if (err.message === "NEXT_REDIRECT") return; 
      
      // Mostra o erro real que veio do backend
      alert(err.message || "Erro inesperado ao enviar o documento.");
    } finally {
      setIsUploading(false);
    }
  }

  // Função recursiva para renderizar a árvore de destino no formulário
  const renderTargetTree = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (childFolders.length === 0) return null;

    return (
      <div className="flex flex-col w-full">
        {childFolders.map(folder => {
          const isExpanded = expandedTargetFolders.has(folder.id);
          const isSelected = selectedTargetId === folder.id;
          
          return (
            <div key={folder.id} className="w-full">
              <div 
                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors mt-0.5 ${isSelected ? 'bg-emerald-100 text-emerald-800 font-bold' : 'hover:bg-stone-200/50 text-stone-700'}`}
                style={{ paddingLeft: `${(depth * 1.2) + 0.5}rem` }}
                onClick={() => setSelectedTargetId(folder.id)}
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
    // Modal voltou para 'fixed' para ocupar a tela toda com fundo embaçado
    <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-stone-800 mb-1">Finalizar Upload</h3>
        
        <div className="text-stone-500 text-sm mb-5 flex items-center gap-2 max-w-full overflow-hidden">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="shrink-0">Arquivo:</span> 
          <span className="font-bold text-stone-700 truncate">{file.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* O campo oculto para enviar o ID da pasta de destino com o formulário */}
          <input type="hidden" name="folderId" value={selectedTargetId || ""} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-stone-700">Título do Documento *</label>
              {/* Nome do arquivo já chega limpo no input */}
              <input type="text" name="title" required defaultValue={formatFileName(file.name)} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-stone-700">Descrição (Opcional)</label>
              <textarea name="description" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800 resize-none"></textarea>
            </div>

            {/* SELEÇÃO DE DESTINO EM ÁRVORE (Substituindo o Select antigo) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-stone-700">Pasta de Destino</label>
              <div className="border border-stone-200 rounded-xl bg-stone-50 p-2 h-44 overflow-y-auto">
                
                <div 
                  className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${selectedTargetId === null ? 'bg-emerald-100 text-emerald-800 font-bold' : 'hover:bg-stone-200/50 text-stone-700'}`}
                  onClick={() => setSelectedTargetId(null)}
                >
                  <button 
                    type="button"
                    className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTargetFolders(prev => {
                        const next = new Set(prev);
                        if (next.has("root")) next.delete("root");
                        else next.add("root");
                        return next;
                      });
                    }}
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${expandedTargetFolders.has("root") ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  <span className="truncate select-none text-sm">Raiz (Portal da Transparência)</span>
                </div>
                
                {expandedTargetFolders.has("root") && (
                  <div className="mt-1">
                    {renderTargetTree(null, 0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* Permissões */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer w-max">
              <input type="checkbox" name="isPublic" value="true" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer" />
              <div><p className="font-bold text-stone-700 text-sm">Público (Visível no site)</p></div>
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer w-max">
                <input type="checkbox" name="isRestrictedView" value="true" checked={isRestrictedView} onChange={(e) => setIsRestrictedView(e.target.checked)} className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer" />
                <div><p className="font-bold text-stone-700 text-sm">Restringir Visualização Interna</p></div>
              </label>
              
              {isRestrictedView && (
                <div className="ml-8 max-h-36 overflow-y-auto border border-stone-200 rounded-xl bg-stone-50 p-2 space-y-1 animate-fade-in">
                  <p className="text-xs font-bold text-stone-500 mb-2 px-1">Selecione quem pode visualizar:</p>
                  {adminUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-1.5 hover:bg-stone-200/50 rounded-lg cursor-pointer transition-colors w-full">
                      <input type="checkbox" name="allowedViewers" value={u.id} className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer" />
                      <span className="text-sm text-stone-700">{u.name} <span className="text-xs text-stone-400">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer w-max">
                <input type="checkbox" name="isRestrictedEdit" value="true" checked={isRestrictedEdit} onChange={(e) => setIsRestrictedEdit(e.target.checked)} className="w-5 h-5 text-red-600 rounded border-stone-300 focus:ring-red-500 cursor-pointer" />
                <div><p className="font-bold text-stone-700 text-sm">Restringir Edição/Exclusão</p></div>
              </label>

              {isRestrictedEdit && (
                <div className="ml-8 max-h-36 overflow-y-auto border border-stone-200 rounded-xl bg-stone-50 p-2 space-y-1 animate-fade-in">
                  <p className="text-xs font-bold text-stone-500 mb-2 px-1">Selecione quem pode editar:</p>
                  {adminUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-1.5 hover:bg-stone-200/50 rounded-lg cursor-pointer transition-colors w-full">
                      <input type="checkbox" name="allowedEditors" value={u.id} className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500 cursor-pointer" />
                      <span className="text-sm text-stone-700">{u.name} <span className="text-xs text-stone-400">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-100">
            <button type="button" onClick={onClose} disabled={isUploading} className="px-5 py-2.5 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button type="submit" disabled={isUploading} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm">
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                "Salvar Documento"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}