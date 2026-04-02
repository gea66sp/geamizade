"use client";

import { useState, useEffect } from "react";
import { updateFolder } from "../actions";

type AdminUser = { id: string; name: string | null; role: string };
type FolderDetailed = { 
  id: string; name: string; description?: string | null; 
  isPublic: boolean; isRestrictedView: boolean; isRestrictedEdit: boolean;
  allowedViewers: { id: string }[]; allowedEditors: { id: string }[];
};

interface ModalEditarPastaProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderDetailed | null;
  adminUsers: AdminUser[];
}

export default function ModalEditarPasta({ isOpen, onClose, folder, adminUsers }: ModalEditarPastaProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [isRestrictedView, setIsRestrictedView] = useState(false);
  const [isRestrictedEdit, setIsRestrictedEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza os estados quando uma nova pasta é selecionada
  useEffect(() => {
    if (folder) {
      setIsPublic(folder.isPublic);
      setIsRestrictedView(folder.isRestrictedView);
      setIsRestrictedEdit(folder.isRestrictedEdit);
    }
  }, [folder]);

  if (!isOpen || !folder) return null;

  const initialViewers = folder.allowedViewers.map(u => u.id);
  const initialEditors = folder.allowedEditors.map(u => u.id);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateFolder(folder!.id, formData);
      onClose(); // Fecha o modal após salvar
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) {
        onClose();
        return;
      }
      alert(err.message || "Erro ao atualizar pasta.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
        
        {/* Header do Modal com botão de Fechar nativo */}
        <div className="flex justify-between items-start mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-yellow/20 text-scout-yellow rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-folder-gear text-xl"></i>
            </div>
            <div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">Configurar Pasta</h3>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Editando propriedades de: <span className="font-semibold text-gray-700">{folder.name}</span></p>
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
          {/* Dados ocultos que a Server Action exige */}
          <input type="hidden" name="name" value={folder.name} />
          
          <div className="space-y-1.5">
            <label htmlFor="folder-description" className="block text-sm font-bold text-gray-700">Descrição da Pasta (Opcional)</label>
            <textarea 
              id="folder-description"
              name="description" 
              defaultValue={folder.description || ""} 
              rows={2} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-scout-green focus:ring-2 focus:ring-scout-green/20 text-gray-800 resize-none custom-scrollbar transition-all"
              placeholder="Breve resumo sobre os arquivos desta pasta..."
            ></textarea>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          {/* Permissões - Usando o mesmo container padronizado do Modal de Arquivos */}
          <div className="space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-800 text-base mb-2">Permissões e Acesso</h4>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center h-5 mt-0.5">
                <input type="checkbox" name="isPublic" value="true" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-5 h-5 text-scout-green rounded border-gray-300 focus:ring-scout-green cursor-pointer transition-colors" />
              </div>
              <div>
                <p className="font-bold text-gray-700 text-sm group-hover:text-scout-green transition-colors">Pública (Visível no site)</p>
                <p className="text-xs text-gray-500 mt-0.5">Todos os visitantes do site poderão ver os arquivos desta pasta.</p>
              </div>
            </label>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5 mt-0.5">
                  <input type="checkbox" name="isRestrictedView" value="true" checked={isRestrictedView} onChange={e => setIsRestrictedView(e.target.checked)} className="w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-gray-700 text-sm group-hover:text-amber-600 transition-colors">Restringir Visualização Interna</p>
                  <p className="text-xs text-gray-500 mt-0.5">Apenas administradores selecionados poderão ver esta pasta no painel.</p>
                </div>
              </label>
              
              {isRestrictedView && (
                <div className="ml-8 max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-white p-2 space-y-1 animate-fade-in custom-scrollbar">
                  {adminUsers.map(u => (
                    <label key={`view-${u.id}`} className="flex items-center gap-3 py-2.5 px-3 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors w-full border border-transparent hover:border-amber-100">
                      <input type="checkbox" name="allowedViewers" value={u.id} defaultChecked={initialViewers.includes(u.id)} className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer" />
                      <span className="text-sm font-medium text-gray-700 flex-1 truncate">{u.name} <span className="text-xs text-gray-400 font-normal ml-1">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5 mt-0.5">
                  <input type="checkbox" name="isRestrictedEdit" value="true" checked={isRestrictedEdit} onChange={e => setIsRestrictedEdit(e.target.checked)} className="w-5 h-5 text-red-500 rounded border-gray-300 focus:ring-red-500 cursor-pointer transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-gray-700 text-sm group-hover:text-red-600 transition-colors">Restringir Edição/Exclusão</p>
                  <p className="text-xs text-gray-500 mt-0.5">Apenas os usuários abaixo poderão editar, mover ou apagar esta pasta.</p>
                </div>
              </label>

              {isRestrictedEdit && (
                <div className="ml-8 max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-white p-2 space-y-1 animate-fade-in custom-scrollbar">
                  {adminUsers.map(u => (
                    <label key={`edit-${u.id}`} className="flex items-center gap-3 py-2.5 px-3 hover:bg-red-50/50 rounded-lg cursor-pointer transition-colors w-full border border-transparent hover:border-red-100">
                      <input type="checkbox" name="allowedEditors" value={u.id} defaultChecked={initialEditors.includes(u.id)} className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500 cursor-pointer" />
                      <span className="text-sm font-medium text-gray-700 flex-1 truncate">{u.name} <span className="text-xs text-gray-400 font-normal ml-1">({u.role})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSaving} 
              className="w-full sm:w-auto px-6 py-3 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="w-full sm:w-auto px-6 py-3 text-sm bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
            >
              {isSaving ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
              ) : (
                <><i className="fa-solid fa-check"></i> Salvar Permissões</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}