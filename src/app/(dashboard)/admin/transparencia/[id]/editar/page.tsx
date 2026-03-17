import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateDocument } from "../../actions";

// 1. Ajustamos a tipagem para avisar que params agora é uma Promise
export default async function EditarDocumentoPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 2. "Desempacotamos" a caixa do Next.js usando o await para pegar o ID real
  const { id } = await params;

  // 3. Busca o documento atual no banco de dados
  const document = await prisma.document.findUnique({
    where: { id },
  });

  // Se não encontrar (URL inválida), mostra a página 404
  if (!document) {
    notFound();
  }

  // Preparamos a Server Action para já receber o ID e a URL antiga do arquivo
  const updateDocumentWithId = updateDocument.bind(null, document.id, document.fileUrl);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full animate-fade-in-down">
      
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/transparencia" className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-emerald-800 tracking-tight">Editar Documento</h1>
          <p className="text-stone-500 mt-1">Atualize as informações ou substitua o arquivo PDF.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8">
        <form action={updateDocumentWithId} className="space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-bold text-stone-700">Título do Documento</label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={document.title} 
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="folder" className="block text-sm font-bold text-stone-700">Pasta / Categoria</label>
            <select
              id="folder"
              name="folder"
              defaultValue={document.folder} 
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800 appearance-none"
            >
              <option value="Atas de Reunião">Atas de Reunião</option>
              <option value="Balanços Financeiros">Balanços Financeiros</option>
              <option value="Regulamentos">Regulamentos Internos</option>
              <option value="Calendário">Calendários Anuais</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="file" className="block text-sm font-bold text-stone-700">
              Substituir Arquivo (PDF) <span className="text-stone-400 font-normal">- Opcional</span>
            </label>
            <p className="text-xs text-stone-500 mb-2">Deixe em branco se quiser manter o arquivo atual.</p>
            <input
              type="file"
              id="file"
              name="file"
              accept="application/pdf"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex gap-4">
            <Link href="/admin/transparencia" className="px-6 py-3 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors w-full text-center">
              Cancelar
            </Link>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all">
              Salvar Alterações
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}