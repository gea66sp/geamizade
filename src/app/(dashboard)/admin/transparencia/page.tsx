import prisma from "@/src/lib/prisma";
import ExplorerTree from "./_components/ExplorerTree";

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
  // O código abaixo soma a propriedade "size" (em bytes) dos documentos.
  // Nota: Se a sua tabela 'Document' ainda não tiver a coluna 'size', isso retornará 0.
  const totalBytes = allDocuments.reduce((acc, doc) => acc + doc.size, 0);
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const limitGB = 1;
  const limitMB = limitGB * 1024;
  const percentage = Math.min((Number(usedMB) / limitMB) * 100, 100).toFixed(1);

  return (
    // Transformamos o pai em um flex-col com gap-4 para acomodar os dois blocos
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full animate-fade-in-down h-[calc(100vh-100px)] flex flex-col gap-4">
      
      {/* BARRA DE PROGRESSO DE ARMAZENAMENTO */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 shrink-0">
        <div className="flex justify-between items-end mb-2.5">
          <div>
            <h2 className="text-sm font-bold text-stone-800">Armazenamento em Nuvem</h2>
            <p className="text-xs text-stone-500">Uso do Armazenamento</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-700">{usedMB} MB</span>
            <span className="text-xs font-bold text-stone-400"> / {limitGB} GB</span>
          </div>
        </div>
        
        {/* Barra Visual */}
        <div className="w-full bg-stone-100 rounded-full h-2.5 mb-3.5 border border-stone-200 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${Number(percentage) > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        {/* Aviso de Limites */}
        <div className="flex items-start gap-2.5 text-xs text-stone-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
          <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="leading-relaxed">
            O tamanho máximo permitido para envios é de <strong className="text-stone-800">4,5 MB por arquivo</strong>. 
            Para solicitar o aumento de tamanho individual de arquivo ou expandir o limite total do acervo, entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>

      {/* ÁREA DO EXPLORER TREE */}
      {/* flex-1 e min-h-0 garantem que ele preencha o espaço que sobrou e ative a barra de rolagem interna */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Acervo do Grupo</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <ExplorerTree folders={allFolders} documents={allDocuments} adminUsers={adminUsers} />
        </div>
      </div>
      
    </div>
  );
}