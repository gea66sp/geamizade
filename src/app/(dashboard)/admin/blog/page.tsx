"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function BlogEditorPage() {
  // ==========================================
  // ESTADOS DO EDITOR (CACHE / CLIENT-SIDE)
  // ==========================================
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("GERAL");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  // Referência para o Editor Rico Nativo
  const editorRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // FUNÇÕES DE FUNCIONAMENTO DO EDITOR
  // ==========================================
  
  // Executa comandos de formatação de texto (Negrito, Itálico, H1, Imagem...)
  const formatText = (command: string, value: string | undefined = undefined) => {
    if (command === "insertImage") {
      const url = prompt("Cole a URL da imagem aqui:");
      if (url) document.execCommand(command, false, url);
    } else if (command === "createLink") {
      const url = prompt("Cole o Link (URL) aqui:");
      if (url) document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, value);
    }
    editorRef.current?.focus();
  };

  // Lida com o Upload de Foto de Capa (Preview Local)
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cria uma URL local provisória para exibir a imagem imediatamente
      const objectUrl = URL.createObjectURL(file);
      setCoverImage(objectUrl);
    }
  };

  // Simula a Publicação no Banco de Dados
  const handlePublish = async () => {
    if (!title.trim()) {
      setToast({ message: "O título da postagem é obrigatório.", type: "error" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setIsPublishing(true);
    
    // Pega o HTML gerado pelo usuário no editor
    // const contentHtml = editorRef.current?.innerHTML;

    // Simula um delay de rede (1.5 segundos)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsPublishing(false);
    setToast({ 
      message: "Recurso de Blog ainda em fase de testes. Nenhuma alteração foi enviada ao banco de dados.", 
      type: "info" 
    });

    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-down h-full min-h-[calc(100vh-10rem)] pb-12 relative">
      
      {/* ==========================================
          TOAST DE AVISO (FLUTUANTE)
      ========================================== */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-100 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in-up border ${
          toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" :
          toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
          "bg-green-50 border-green-200 text-green-800"
        }`}>
          <i className={`fa-solid text-2xl ${
            toast.type === "info" ? "fa-circle-info" :
            toast.type === "error" ? "fa-triangle-exclamation" :
            "fa-circle-check"
          }`}></i>
          <div>
            <h4 className="font-bold text-sm">Aviso do Sistema</h4>
            <p className="text-xs font-medium mt-0.5">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="mb-4">
        <Link href="/admin" className="text-sm font-bold text-gray-400 hover:text-scout-green transition-colors flex items-center gap-2 w-fit">
          <i className="fa-solid fa-arrow-left"></i> Voltar ao Painel
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-scout-green/10 text-scout-green rounded-2xl flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-newspaper"></i>
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Nova Publicação
            </h1>
            <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">Rascunho Local</span>
              <span>Editor de Blog</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
          >
            Salvar Rascunho
          </button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-8 py-3 bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Processando...</>
            ) : (
              <><i className="fa-solid fa-paper-plane"></i> Publicar Agora</>
            )}
          </button>
        </div>
      </div>

      {/* ==========================================
          ÁREA PRINCIPAL DE EDIÇÃO (GRID)
      ========================================== */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* COLUNA ESQUERDA: O EDITOR (70%) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* TÍTULO DA NOTÍCIA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
            <input 
              type="text" 
              placeholder="Digite o título da publicação aqui..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 text-2xl font-bold font-heading text-gray-800 placeholder:text-gray-300 outline-none rounded-xl focus:bg-gray-50 transition-colors"
            />
          </div>

          {/* EDITOR DE TEXTO RICO (RICH TEXT) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-125">
            
            {/* Toolbar do Editor */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                <button onClick={() => formatText("bold")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Negrito"><i className="fa-solid fa-bold"></i></button>
                <button onClick={() => formatText("italic")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Itálico"><i className="fa-solid fa-italic"></i></button>
                <button onClick={() => formatText("underline")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Sublinhado"><i className="fa-solid fa-underline"></i></button>
                <button onClick={() => formatText("strikeThrough")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Tachado"><i className="fa-solid fa-strikethrough"></i></button>
              </div>

              <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                <button onClick={() => formatText("formatBlock", "H1")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Título 1">H1</button>
                <button onClick={() => formatText("formatBlock", "H2")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Título 2">H2</button>
                <button onClick={() => formatText("formatBlock", "P")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Parágrafo"><i className="fa-solid fa-paragraph"></i></button>
              </div>

              <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                <button onClick={() => formatText("insertUnorderedList")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Lista com Marcadores"><i className="fa-solid fa-list-ul"></i></button>
                <button onClick={() => formatText("insertOrderedList")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Lista Numerada"><i className="fa-solid fa-list-ol"></i></button>
                <button onClick={() => formatText("formatBlock", "BLOCKQUOTE")} className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Citação"><i className="fa-solid fa-quote-right"></i></button>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => formatText("createLink")} className="w-8 h-8 rounded-lg hover:bg-blue-100 text-blue-600 font-bold flex items-center justify-center transition-colors cursor-pointer" title="Inserir Link"><i className="fa-solid fa-link"></i></button>
                <button onClick={() => formatText("insertImage")} className="w-8 h-8 rounded-lg hover:bg-scout-green/10 text-scout-green font-bold flex items-center justify-center transition-colors cursor-pointer" title="Inserir Imagem via URL"><i className="fa-regular fa-image"></i></button>
              </div>
            </div>

            {/* Content Editable Area */}
            <div 
              ref={editorRef}
              contentEditable 
              suppressContentEditableWarning={true}
              className="flex-1 p-6 md:p-8 focus:outline-none prose prose-gray max-w-none prose-headings:font-heading prose-a:text-scout-green text-gray-800"
              style={{ minHeight: '400px' }}
              data-placeholder="Comece a escrever a história épica do grupo aqui..."
            >
              <p><br/></p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CONFIGURAÇÕES (30%) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          {/* FOTO DE CAPA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 border-b border-gray-100 p-4 shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <i className="fa-regular fa-image text-gray-400"></i> Imagem de Capa
              </h3>
            </div>
            <div className="p-5 flex flex-col items-center justify-center">
              {coverImage ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                  <Image src={coverImage} alt="Capa" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors text-sm flex items-center gap-2">
                      <i className="fa-solid fa-arrows-rotate"></i> Trocar Capa
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="w-full h-48 border-2 border-dashed border-gray-300 hover:border-scout-green hover:bg-scout-green/5 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-white text-gray-400 group-hover:text-scout-green rounded-full flex items-center justify-center text-xl mb-2 transition-colors">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <span className="text-sm font-bold text-gray-600 group-hover:text-scout-green transition-colors">Fazer upload de imagem</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-1">Recomendado: 1200 x 630px</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
              )}
            </div>
          </div>

          {/* METADADOS DA POSTAGEM */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 border-b border-gray-100 p-4 shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <i className="fa-solid fa-sliders text-gray-400"></i> Configurações
              </h3>
            </div>
            <div className="p-5 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Status atual</label>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-sm font-bold w-fit">
                  <i className="fa-solid fa-pen-ruler"></i> Editando Localmente
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Categoria / Ramo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-tags text-gray-400"></i>
                  </div>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                  >
                    <option value="GERAL">Notícia Geral do Grupo</option>
                    <option value="LOBINHO">Ramo Lobinho</option>
                    <option value="ESCOTEIRO">Ramo Escoteiro</option>
                    <option value="SENIOR">Ramo Sênior</option>
                    <option value="PIONEIRO">Ramo Pioneiro</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Autor (Você)</label>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-scout-green/10 text-scout-green flex items-center justify-center font-bold">
                    <i className="fa-solid fa-user-shield"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">Sessão Atual</p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Administrador</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* CSS embutido temporário para colocar o placeholder do ContentEditable vazio */}
      <style dangerouslySetInnerHTML={{__html: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          display: block; /* For Firefox */
        }
      `}} />
    </div>
  );
}