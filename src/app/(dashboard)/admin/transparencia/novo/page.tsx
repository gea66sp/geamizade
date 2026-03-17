"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { createDocument } from "../actions";

// Botão inteligente que sabe quando o formulário está carregando
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // Aumentei levemente o padding vertical no mobile para facilitar o clique (py-3.5)
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
    >
      {pending ? (
        <>
          {/* Ícone de Loading */}
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {/* Texto encurtado no mobile para não quebrar linha caso a tela seja muito pequena */}
          <span className="hidden sm:inline">Enviando para o Acervo...</span>
          <span className="sm:hidden">Enviando...</span>
        </>
      ) : (
        "Salvar Documento"
      )}
    </button>
  );
}

export default function NovoDocumentoPage() {
  return (
    // Espaçamento do container reduzido no mobile (p-4)
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto w-full animate-fade-in-down">
      
      {/* Alinhamento do cabeçalho ajustado para itens iniciarem no topo (items-start) no mobile, evitando que o botão de voltar fique desalinhado se o título quebrar em duas linhas */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-6 md:mb-8">
        <Link 
          href="/admin/transparencia" 
          // Margem negativa no mobile (-ml-2) para alinhar visualmente com o limite esquerdo da tela, compensando o padding do botão
          className="p-2 -ml-2 sm:ml-0 mt-0.5 sm:mt-0 text-stone-400 hover:bg-stone-200 hover:text-stone-700 rounded-full transition-colors shrink-0"
          title="Voltar"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
            Novo Documento
          </h1>
          <p className="text-stone-500 mt-1 text-sm sm:text-base">
            Adicione um novo arquivo ao portal da transparência.
          </p>
        </div>
      </div>

      {/* Espaçamento interno do formulário menor no celular (p-5) */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6 md:p-8">
        <form action={createDocument} className="space-y-5 sm:space-y-6">
          
          <div className="space-y-1.5 sm:space-y-2">
            <label htmlFor="title" className="block text-sm font-bold text-stone-700">
              Título do Documento
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="Ex: Balanço Financeiro - Março/2026"
              className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label htmlFor="folder" className="block text-sm font-bold text-stone-700">
              Pasta / Categoria
            </label>
            {/* CORREÇÃO DO SELECT: Como você usava 'appearance-none' (que remove a setinha padrão do navegador), o usuário de mobile não saberia que é um dropdown. Adicionei um ícone de seta customizado. */}
            <div className="relative">
              <select
                id="folder"
                name="folder"
                required
                className="w-full pl-4 pr-10 py-3 sm:py-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800 appearance-none text-sm sm:text-base"
              >
                <option value="">Selecione a categoria...</option>
                <option value="Atas de Reunião">Atas de Reunião</option>
                <option value="Balanços Financeiros">Balanços Financeiros</option>
                <option value="Regulamentos">Regulamentos Internos</option>
                <option value="Calendário">Calendários Anuais</option>
                <option value="Outros">Outros</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label htmlFor="file" className="block text-sm font-bold text-stone-700">
              Arquivo (PDF)
            </label>
            {/* CORREÇÃO DO FILE INPUT: Redução do tamanho da fonte e margens internas (file:px-3 file:mr-3 text-xs) exclusivas para mobile para evitar que o nome do arquivo longo quebre o layout horizontal. */}
            <input
              type="file"
              id="file"
              name="file"
              accept="application/pdf"
              required
              className="w-full px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800 text-xs sm:text-sm file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:transition-colors cursor-pointer"
            />
          </div>

          <div className="pt-2 sm:pt-4 mt-2 sm:mt-4 border-t border-stone-100">
            <SubmitButton />
          </div>

        </form>
      </div>
    </div>
  );
}