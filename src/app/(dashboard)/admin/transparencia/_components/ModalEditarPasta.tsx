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
    <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
          <div>
            <h3 className="text-xl font-bold text-stone-800 leading-tight">Configurações da Pasta</h3>
            <p className="text-stone-500 text-sm">Editando permissões de: <span className="font-bold text-stone-700">{folder.name}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados ocultos que a Server Action exige, mas que o usuário não precisa mudar aqui (já que ele renomeia na árvore) */}
          <input type="hidden" name="name" value={folder.name} />
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-stone-700">Descrição (Opcional)</label>
            <textarea name="description" defaultValue={folder.description || ""} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800 resize-none"></textarea>
          </div>

          <hr className="border-stone-100" />

          {/* Permissões */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer w-max">
              <input type="checkbox" name="isPublic" value="true" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer" />
              <div><p className="font-bold text-stone-700 text-sm">Pública (Visível no site)</p></div>
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
            <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm">
              {isSaving ? "Salvando..." : "Salvar Permissões"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}