import prisma from "@/src/lib/prisma";
import ExplorerTree from "./_components/ExplorerTree";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transparência",
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
  
  // Busca administradores para o modal de novo arquivo
  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "CHEFE"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  // ==========================================
  // CÁLCULO DE ARMAZENAMENTO
  // ==========================================
  const totalBytes = allDocuments.reduce((acc, doc) => acc + doc.size, 0);
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const limitGB = 1;
  const limitMB = limitGB * 1024;
  const percentage = Math.min((Number(usedMB) / limitMB) * 100, 100).toFixed(1);

  return (
    // Removido o fixed height problemático e substituído por flex fluido
    <div className="max-w-6xl mx-auto w-full animate-fade-in-down flex flex-col gap-6 h-full min-h-[calc(100vh-10rem)]">
      
      {/* NOVO: Cabeçalho da Página (UX e Acessibilidade) */}
      <div className="shrink-0">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-scout-green mb-1 md:mb-2">
          Transparência
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          Gerencie a estrutura de pastas e os documentos públicos do Acervo Escoteiro.
        </p>
      </div>
      
      {/* BARRA DE PROGRESSO DE ARMAZENAMENTO */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 shrink-0 transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-server text-gray-400 text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 leading-tight">Armazenamento em Nuvem</h2>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Uso do Acervo</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-lg md:text-xl font-black text-scout-green">{usedMB} MB</span>
            <span className="text-sm font-bold text-gray-400"> / {limitGB} GB</span>
          </div>
        </div>
        
        {/* Barra Visual */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-5 border border-gray-200 overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${Number(percentage) > 90 ? 'bg-red-500' : 'bg-scout-green'}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        {/* Aviso de Limites Otimizado */}
        <div className="flex items-start gap-3.5 text-sm text-gray-600 bg-blue-50/80 p-4 rounded-xl border border-blue-100">
          <i className="fa-solid fa-circle-info text-blue-500 text-lg mt-0.5 shrink-0"></i>
          <p className="leading-relaxed">
            O tamanho máximo permitido para envios é de <strong className="text-gray-800">4,5 MB por arquivo</strong>. 
            Para solicitar o aumento do limite individual de arquivo ou expandir o armazenamento total, entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>

      {/* ÁREA DO EXPLORER TREE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-125">
        {/* Cabeçalho do Card */}
        <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 shrink-0">
          <i className="fa-solid fa-folder-tree text-scout-green/70 text-lg"></i>
          <span className="text-sm font-bold text-gray-700">Estrutura de Arquivos</span>
        </div>
        
        {/* Área de conteúdo rolável isolada */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar">
          <ExplorerTree folders={allFolders} documents={allDocuments} adminUsers={adminUsers} />
        </div>
      </div>
      
    </div>
  );
}