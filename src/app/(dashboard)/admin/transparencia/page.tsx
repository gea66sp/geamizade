import prisma from "@/src/lib/prisma";
import ExplorerTree from "./_components/ExplorerTree";
import StorageAlert from "./_components/StorageAlert"; 
import { FolderTree, Server } from "lucide-react"; // Importação dos ícones leves
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transparência | GE Amizade 66SP",
  description: "Gerencie os documentos públicos do Grupo Escoteiro Amizade 66/SP.",
};

export default async function TransparenciaDashboardPage() {
  const allFolders = await prisma.folder.findMany({
    orderBy: { name: "asc" },
    include: {
      allowedViewers: { select: { id: true } },
      allowedEditors: { select: { id: true } },
    }
  });

  const allDocuments = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      allowedViewers: { select: { id: true } },
      allowedEditors: { select: { id: true } },
    }
  });
  
  // CORREÇÃO: Sincronizado com os papéis de gestão do backend (actions.ts)
  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "CHEFE", "FINANCEIRO", "DEVELOPER"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  // ==========================================
  // CÁLCULO DE ARMAZENAMENTO
  // ==========================================
  const totalBytes = allDocuments.reduce((acc, doc) => acc + doc.size, 0);
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const limitGB = 1; // Ajuste este limite conforme o seu plano do Vercel Blob
  const limitMB = limitGB * 1024;
  const percentage = Math.min((Number(usedMB) / limitMB) * 100, 100).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in-down flex flex-col gap-6 h-full min-h-[calc(100vh-10rem)]">
      
      {/* ÁREA DO EXPLORER TREE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-125">
        {/* Cabeçalho do Card */}
        <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-4 flex items-center gap-3 shrink-0">
          <FolderTree className="text-scout-yellow w-5 h-5" />
          <span className="text-sm font-bold text-gray-700">Estrutura de Arquivos</span>
        </div>
        
        {/* Área de conteúdo rolável isolada */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <ExplorerTree folders={allFolders} documents={allDocuments} adminUsers={adminUsers} />
        </div>
      </div>
      
      {/* BARRA DE PROGRESSO DE ARMAZENAMENTO */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 shrink-0 transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
              <Server className="text-gray-400 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">Armazenamento em Nuvem</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Uso do Acervo</p>
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
            <span className="text-2xl md:text-3xl font-black text-scout-green tracking-tight">{usedMB} <span className="text-lg md:text-xl font-bold">MB</span></span>
            <span className="text-sm font-bold text-gray-400 ml-1">/ {limitGB} GB</span>
          </div>
        </div>
        
        {/* Barra Visual */}
        <div className="w-full bg-gray-100 rounded-full h-4 mb-6 border border-gray-200 overflow-hidden shadow-inner relative">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${Number(percentage) > 90 ? 'bg-red-500' : 'bg-scout-green'}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        {/* Componente Client que gerencia o aviso fechável */}
        <StorageAlert />

      </div>
    </div>
  );
}