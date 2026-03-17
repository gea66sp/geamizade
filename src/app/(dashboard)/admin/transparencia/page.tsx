import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { deleteDocument } from "./actions";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(date);
};

export default async function TransparenciaDashboardPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in-down">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">Portal da Transparência</h1>
          <p className="text-stone-500 mt-1 text-sm md:text-base">Gerencie atas de reunião, balanços financeiros e documentos do Grupo.</p>
        </div>
        <Link 
          href="/admin/transparencia/novo" 
          className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 md:py-3 rounded-xl font-semibold shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Documento
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-10 md:p-16 flex flex-col items-center justify-center text-center">
            {/* Ícone de estado vazio simplificado para o exemplo */}
            <svg className="w-16 h-16 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="text-lg md:text-xl font-bold text-stone-700 mt-4">O arquivo está vazio</h3>
            <p className="text-stone-500 max-w-sm mt-2 text-sm md:text-base">Nenhum documento foi enviado ainda.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Cabeçalho da Tabela - Oculto no Mobile, Visível a partir do tablet (md) */}
            <div className="hidden md:grid grid-cols-12 gap-4 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider p-4 pl-6">
              <div className="col-span-5">Título do Documento</div>
              <div className="col-span-3">Pasta</div>
              <div className="col-span-2">Data de Envio</div>
              <div className="col-span-2 text-right pr-2">Ações</div>
            </div>

            {/* Lista de Documentos */}
            <div className="divide-y divide-stone-100">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center p-4 md:pl-6 hover:bg-stone-50/80 transition-colors group"
                >
                  
                  {/* Informações Principais (Título e Pasta no mobile) */}
                  <div className="col-span-5 flex items-start md:items-center gap-3 mb-3 md:mb-0">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 md:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-stone-800 font-medium text-sm md:text-base leading-tight">
                        {doc.title}
                      </span>
                      {/* Badge da Pasta visível junto ao título no mobile, oculto no desktop */}
                      <span className="md:hidden inline-block bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1 w-max">
                        {doc.folder}
                      </span>
                    </div>
                  </div>

                  {/* Pasta (Visível apenas no Desktop) */}
                  <div className="hidden md:block col-span-3">
                    <span className="bg-stone-100 border border-stone-200 text-stone-600 px-3 py-1 rounded-full text-xs font-semibold">
                      {doc.folder}
                    </span>
                  </div>

                  {/* Data e Ações no Mobile / Apenas Data no Desktop */}
                  <div className="flex items-center justify-between md:col-span-4 w-full">
                    
                    {/* Data */}
                    <div className="text-stone-500 text-xs md:text-sm md:w-1/2">
                      {formatDate(doc.createdAt)}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end gap-1 md:gap-2 md:w-1/2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      
                      {/* Botão Visualizar */}
                      <a href={`/portal-da-transparencia/arquivo/${doc.id}`} target="_blank" rel="noopener noreferrer" className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Visualizar">
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>

                      {/* Botão Editar */}
                      <Link href={`/admin/transparencia/${doc.id}/editar`} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>

                      {/* Botão Excluir */}
                      <form action={deleteDocument.bind(null, doc.id, doc.fileUrl)}>
                        <button type="submit" className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </form>

                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}