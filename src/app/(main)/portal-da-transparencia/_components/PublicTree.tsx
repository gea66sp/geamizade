"use client";

import { useState } from "react";

type Folder = { id: string; name: string; parentId: string | null; createdAt: Date };
type Document = { id: string; title: string; folderId: string | null; fileUrl: string; createdAt: Date };

export default function PublicTree({ folders, documents }: { folders: Folder[], documents: Document[] }) {
  // A raiz já começa aberta para convidar o usuário a explorar
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  };

  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
    const childDocs = documents.filter(d => d.folderId === parentId);

    return (
      <div className="flex flex-col w-full text-sm sm:text-base">
        
        {/* Renderiza as Pastas */}
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          return (
            <div key={folder.id} className="w-full">
              <div 
                className="flex items-center justify-between py-2.5 sm:py-3 pr-4 hover:bg-stone-50 transition-colors cursor-pointer text-stone-700 border-b border-stone-50/50 rounded-lg"
                style={{ paddingLeft: `${(depth * 1.5) + 0.5}rem` }}
                onClick={() => toggleFolder(folder.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <button className="p-1 hover:bg-stone-200 rounded text-stone-400 transition-colors">
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span className="font-semibold truncate select-none">{folder.name}</span>
                </div>
              </div>
              
              {/* Filhos da Pasta */}
              {isExpanded && (
                <div className="flex flex-col w-full animate-fade-in">
                  {renderTree(folder.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}

        {/* Renderiza os Documentos */}
        {childDocs.map(doc => (
          <div 
            key={doc.id} 
            className="flex items-center justify-between py-2.5 sm:py-3 pr-2 sm:pr-4 hover:bg-emerald-50/50 transition-colors group text-stone-600 border-b border-stone-50/50 rounded-lg" 
            style={{ paddingLeft: `${(depth * 1.5) + 2.5}rem` }}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-1.5 bg-red-50 text-red-500 rounded-lg shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="truncate font-medium text-stone-700 group-hover:text-emerald-800 transition-colors">{doc.title}</span>
                <span className="text-[10px] sm:text-xs text-stone-400">{formatDate(doc.createdAt)}</span>
              </div>
            </div>

            {/* O link aponta para o visualizador que você já possui */}
            <a 
              href={`/portal-da-transparencia/arquivo/${doc.id}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-stone-100 hover:bg-emerald-600 text-stone-600 hover:text-white rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Visualizar</span>
              <span className="sm:hidden">Abrir</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="py-2 select-none">
      <div className="w-full">
        {/* Falsa Raiz Pública */}
        <div 
          className="flex items-center justify-between py-3 pr-4 pl-2 hover:bg-stone-50 transition-colors cursor-pointer text-stone-800 rounded-lg"
          onClick={() => toggleFolder("root")}
        >
          <div className="flex items-center gap-2 font-black text-lg">
            <button className="p-1 hover:bg-stone-200 rounded text-stone-400 transition-colors">
              <svg className={`w-5 h-5 transition-transform ${expandedFolders.has("root") ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            </div>
            <span>Documentos do Grupo</span>
          </div>
        </div>
        
        {expandedFolders.has("root") && (
          <div className="w-full mt-2">
            {renderTree(null, 0)}
          </div>
        )}
      </div>
    </div>
  );
}