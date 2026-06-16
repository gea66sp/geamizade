"use client";

import { useState, useEffect } from "react";
import { createDocument } from "../actions";
import { upload } from "@vercel/blob/client"; // NOVO IMPORT AQUI

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
    if (!file) return;
    
    // 1. CAPTURA O FORMULÁRIO AGORA (antes do await limpar o evento)
    const formData = new FormData(e.currentTarget);
    
    setIsUploading(true);
    
    try {
      // 2. FAZ O UPLOAD DIRETO DO NAVEGADOR PARA O VERCEL BLOB
      const blob = await upload(`transparencia/arquivos/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload', // O endpoint que autoriza o upload
      });

      // 3. ADICIONA A URL E O TAMANHO AO FORMULÁRIO QUE SALVAMOS LÁ EM CIMA
      formData.append("fileUrl", blob.url); 
      formData.append("fileSize", file.size.toString()); 
      
      // 4. CHAMA A SERVER ACTION
      await createDocument(formData);
      onClose(); // Fecha o modal após salvar
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT") return; 
      alert(err.message || "Erro inesperado ao enviar o documento.");
    } finally {
      setIsUploading(false);
    }
  }

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
          const isSelected = selectedTargetId === folder.id;
          
          return (
            <div key={folder.id} className="w-full">
              <div 
                className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors mt-1 ${isSelected ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200' : 'hover:bg-gray-100 text-gray-700'}`}
                style={{ paddingLeft: `${(depth * 1.2) + 0.5}rem` }}
                onClick={() => setSelectedTargetId(folder.id)}
              >
                <button 
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors flex items-center justify-center w-6 h-6 shrink-0"
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
                  <i className={`fa-solid fa-chevron-right text-xs transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}></i>
                </button>
                <i className={`fa-solid ${isExpanded ? "fa-folder-open" : "fa-folder"} text-scout-yellow text-sm shrink-0`}></i>
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
    <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Header do Modal com botão de Fechar nativo */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
            </div>
            <div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">Finalizar Upload</h3>
              <div className="flex items-center gap-2 mt-1">
                <i className="fa-solid fa-file-pdf text-red-500 text-xs"></i>
                <p className="text-gray-500 text-xs md:text-sm font-medium truncate max-w-50 sm:max-w-xs">{file.name}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0"
            aria-label="Fechar modal"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* O campo oculto para enviar o ID da pasta de destino com o formulário */}
          <input type="hidden" name="folderId" value={selectedTargetId || ""} />

          {/* Dados Principais */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-sm font-bold text-gray-700">Título do Documento <span className="text-red-500">*</span></label>
            <input 
              id="title"
              type="text" 
              name="title" 
              required 
              defaultValue={formatFileName(file.name)} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/20 text-gray-800 transition-all" 
              placeholder="Ex: Ata de Reunião Março"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-bold text-gray-700">Descrição (Opcional)</label>
            <textarea 
              id="description"
              name="description" 
              rows={2} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/20 text-gray-800 resize-none custom-scrollbar transition-all"
              placeholder="Breve resumo sobre o arquivo..."
            ></textarea>
          </div>

          {/* SELEÇÃO DE DESTINO EM ÁRVORE */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Pasta de Destino</label>
            <div className="border border-gray-200 rounded-xl bg-gray-50 p-2.5 h-44 overflow-y-auto custom-scrollbar">
              
              <div 
                className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors ${selectedTargetId === null ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200' : 'hover:bg-gray-200/50 text-gray-700'}`}
                onClick={() => setSelectedTargetId(null)}
              >
                <button 
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors flex items-center justify-center w-6 h-6 shrink-0"
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
                  <i className={`fa-solid fa-chevron-right text-xs transition-transform duration-200 ${expandedTargetFolders.has("root") ? "rotate-90" : ""}`}></i>
                </button>
                <i className={`fa-solid ${expandedTargetFolders.has("root") ? "fa-folder-open" : "fa-folder"} text-scout-green text-sm shrink-0`}></i>
                <span className="truncate select-none text-sm">Raiz (Portal da Transparência)</span>
              </div>
              
              {expandedTargetFolders.has("root") && (
                <div className="mt-1">
                  {renderTargetTree(null, 0)}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          {/* Permissões */}
          <div className="space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-800 text-base mb-2">Permissões Iniciais</h4>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center h-5 mt-0.5">
                <input type="checkbox" name="isPublic" value="true" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-5 h-5 text-scout-green rounded border-gray-300 focus:ring-scout-green cursor-pointer transition-colors" />
              </div>
              <div>
                <p className="font-bold text-gray-700 text-sm group-hover:text-scout-green transition-colors">Público (Visível no site)</p>
                <p className="text-xs text-gray-500 mt-0.5">Qualquer visitante poderá ver e baixar este arquivo.</p>
              </div>
            </label>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5 mt-0.5">
                  <input type="checkbox" name="isRestrictedView" value="true" checked={isRestrictedView} onChange={(e) => setIsRestrictedView(e.target.checked)} className="w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-gray-700 text-sm group-hover:text-amber-600 transition-colors">Restringir Visualização Interna</p>
                  <p className="text-xs text-gray-500 mt-0.5">Apenas administradores selecionados poderão ver este arquivo.</p>
                </div>
              </label>
              
              {isRestrictedView && (
                <div className="ml-8 max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-white p-2 space-y-1 animate-fade-in custom-scrollbar">
                  <p className="text-xs font-bold text-gray-500 mb-2 px-2 pt-1">Selecione quem pode visualizar:</p>
                  {adminUsers.map(u => (
                    <label key={`view-${u.id}`} className="flex items-center gap-3 py-2.5 px-3 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors w-full border border-transparent hover:border-amber-100">
                      <input type="checkbox" name="allowedViewers" value={u.id} className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer" />
                      <span className="text-sm font-medium text-gray-700 flex-1 truncate">{u.name} <span className="text-xs text-gray-400 font-normal ml-1">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5 mt-0.5">
                  <input type="checkbox" name="isRestrictedEdit" value="true" checked={isRestrictedEdit} onChange={(e) => setIsRestrictedEdit(e.target.checked)} className="w-5 h-5 text-red-500 rounded border-gray-300 focus:ring-red-500 cursor-pointer transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-gray-700 text-sm group-hover:text-red-600 transition-colors">Restringir Edição/Exclusão</p>
                  <p className="text-xs text-gray-500 mt-0.5">Apenas os usuários selecionados poderão apagar este arquivo.</p>
                </div>
              </label>

              {isRestrictedEdit && (
                <div className="ml-8 max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-white p-2 space-y-1 animate-fade-in custom-scrollbar">
                  <p className="text-xs font-bold text-gray-500 mb-2 px-2 pt-1">Selecione quem pode editar/excluir:</p>
                  {adminUsers.map(u => (
                    <label key={`edit-${u.id}`} className="flex items-center gap-3 py-2.5 px-3 hover:bg-red-50/50 rounded-lg cursor-pointer transition-colors w-full border border-transparent hover:border-red-100">
                      <input type="checkbox" name="allowedEditors" value={u.id} className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500 cursor-pointer" />
                      <span className="text-sm font-medium text-gray-700 flex-1 truncate">{u.name} <span className="text-xs text-gray-400 font-normal ml-1">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isUploading} 
              className="w-full sm:w-auto px-6 py-3 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isUploading} 
              className="w-full sm:w-auto px-6 py-3 text-sm bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
            >
              {isUploading ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Enviando...</>
              ) : (
                <><i className="fa-solid fa-cloud-arrow-up"></i> Salvar e Enviar Arquivo</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}