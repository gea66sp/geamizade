"use client";

import { useState } from "react";
import { updateProfile } from "../actions"; 
import UploadDocModal from "./UploadDocModal";
import RenameDocModal from "./RenameDocModal";
import DeleteDocModal from "./DeleteDocModal";

type ProfileFormProps = {
  initialData: any; 
};

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState("pessoais");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Controle dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToRename, setDocToRename] = useState<any>(null);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  
  // Estado para o preview instantâneo da foto de perfil e erro de validação
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.image || null);
  const [imageError, setImageError] = useState<string>("");

  const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // Limite rigoroso de 1 MB em bytes

  // Função para validar o tamanho e criar o preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(""); // Limpa erros anteriores

    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        setImageError(`Sua foto tem ${sizeInMB} MB. O limite é 1 MB.`);
        e.target.value = ""; // Limpa o input para evitar o envio acidental
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // O formData enviará name, phone, image e newPassword (se houver)
      const result = await updateProfile(formData, initialData.id);
      if (result.success) {
        setMessage({ type: "success", text: "Perfil atualizado com sucesso! ⚜️" });
      } else {
        setMessage({ type: "error", text: result.error || "Erro ao atualizar dados." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro inesperado de conexão. Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative">
      
      {/* NAVEGAÇÃO POR ABAS */}
      <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar bg-gray-50 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("pessoais")}
          className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-4 font-bold text-sm transition-colors whitespace-nowrap min-w-35 flex-1 ${
            activeTab === "pessoais"
              ? "bg-white border-b-2 border-scout-green text-scout-green shadow-[0_-2px_0_0_inset_#22c55e]"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <i className="fa-solid fa-address-card"></i>
          Dados Pessoais
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("documentos")}
          className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-4 font-bold text-sm transition-colors whitespace-nowrap min-w-35 flex-1 ${
            activeTab === "documentos"
              ? "bg-white border-b-2 border-scout-green text-scout-green shadow-[0_-2px_0_0_inset_#22c55e]"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <i className="fa-solid fa-folder-open"></i>
          Meus Documentos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("conta")}
          className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-4 font-bold text-sm transition-colors whitespace-nowrap min-w-35 flex-1 ${
            activeTab === "conta"
              ? "bg-white border-b-2 border-scout-green text-scout-green shadow-[0_-2px_0_0_inset_#22c55e]"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <i className="fa-solid fa-shield-halved"></i>
          Segurança
        </button>
      </div>

      {/* FORMULÁRIO PRINCIPAL */}
      <form action={handleSubmit} className="flex flex-col flex-1">
        
        <div className="p-5 md:p-8 flex-1 overflow-y-auto">
          
          {/* =======================================
              ABA: DADOS PESSOAIS 
          ======================================= */}
          <div className={`${activeTab === "pessoais" ? "block animate-fade-in-up" : "hidden"} space-y-6 md:space-y-8`}>
            
            {/* AVATAR INTERATIVO - UPLOAD DE FOTO */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-md group bg-gray-100">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Foto de Perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-scout-green/10 flex items-center justify-center text-scout-green font-black text-3xl md:text-5xl">
                    {initialData.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                
                {/* Camada de Hover para trocar a foto */}
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <i className="fa-solid fa-camera text-xl md:text-2xl mb-1"></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Alterar</span>
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                    onChange={handleImageChange} 
                  />
                </label>
              </div>

              {/* Feedback de Erro Visual Inline */}
              {imageError && (
                <div className="mt-3 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-fade-in border border-red-100">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  {imageError}
                </div>
              )}

              {/* Dica de usabilidade e Regra de negócio (Limite de 1MB) */}
              <p className="text-xs text-gray-500 mt-3 font-medium md:hidden">Toque na foto para alterar</p>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 hidden md:block">
                Formatos: JPG, PNG • Máx: <span className="text-amber-600">1 MB</span>
              </span>
            </div>

            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-800">Informações Básicas</h2>
              <p className="text-sm text-gray-500 mt-1">Como você será identificado no portal do grupo.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-user text-gray-400"></i></div>
                  <input name="name" type="text" defaultValue={initialData.name || ""} required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800" />
                </div>
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Telefone / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-brands fa-whatsapp text-gray-400"></i></div>
                  <input name="phone" type="tel" defaultValue={initialData.phone || ""} placeholder="(11) 90000-0000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800" />
                </div>
              </div>

              {/* Campos Desabilitados (Apenas Leitura) */}
              <div className="space-y-1.5 opacity-70 md:col-span-2 border-t border-gray-100 pt-5">
                <label className="block text-sm font-bold text-gray-500">E-mail <span className="font-normal text-xs">(Apenas leitura)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-envelope text-gray-400"></i></div>
                  <input name="email" type="email" defaultValue={initialData.email || ""} readOnly className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed font-medium" />
                </div>
              </div>

              <div className="space-y-1.5 opacity-70">
                <label className="block text-sm font-bold text-gray-500">Ramo Escoteiro <span className="font-normal text-xs">(Apenas leitura)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-tent text-gray-400"></i></div>
                  <input type="text" value={initialData.branch || "Sem Ramo Específico"} readOnly className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed font-medium capitalize" />
                </div>
              </div>

              <div className="space-y-1.5 opacity-70">
                <label className="block text-sm font-bold text-gray-500">Patrulha / Matilha <span className="font-normal text-xs">(Apenas leitura)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-paw text-gray-400"></i></div>
                  <input type="text" value={initialData.patrol?.name || "Sem Patrulha Vinculada"} readOnly className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed font-medium" />
                </div>
              </div>
            </div>
          </div>

          {/* =======================================
              ABA: MEUS DOCUMENTOS (NOVO)
          ======================================= */}
          <div className={`${activeTab === "documentos" ? "block animate-fade-in-up" : "hidden"} space-y-6 md:space-y-8`}>
            <div className="border-b border-gray-100 pb-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-800">Meus Documentos</h2>
                <p className="text-sm text-gray-500 mt-1">Sua Ficha Médica, Autorizações e Carteirinha ficam armazenados aqui.</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-folder-open text-xl"></i>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialData.personalDocs && initialData.personalDocs.length > 0 ? (
                initialData.personalDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 hover:border-blue-300 transition-colors flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                         <i className="fa-solid fa-file-pdf text-lg"></i>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800 line-clamp-1">{doc.title}</p>
                        <p className="text-xs text-gray-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    
                    {/* BOTÕES DE AÇÃO: RENOMEAR, EXCLUIR, BAIXAR */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button type="button" onClick={() => setDocToRename(doc)} className="text-blue-500 hover:bg-blue-100 p-2 sm:p-2.5 rounded-lg transition-colors" title="Renomear">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button type="button" onClick={() => setDocToDelete(doc)} className="text-red-500 hover:bg-red-100 p-2 sm:p-2.5 rounded-lg transition-colors" title="Eliminar">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-scout-green hover:bg-green-100 p-2 sm:p-2.5 rounded-lg transition-colors" title="Baixar Documento">
                        <i className="fa-solid fa-download"></i>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <i className="fa-solid fa-file-circle-xmark text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500 font-medium">Nenhum documento anexado ao seu perfil.</p>
                </div>
              )}
            </div>

            {/* Componente de Upload */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <i className="fa-solid fa-circle-info text-blue-500 mr-2"></i> 
                Para enviar novos documentos (como sua Ficha Médica atualizada em PDF), utilize o botão abaixo.
              </p>
              <button 
                   type="button" 
                    onClick={() => setIsModalOpen(true)} 
                    className="w-full py-4 border-2 border-dashed border-scout-green text-scout-green rounded-xl font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
              <i className="fa-solid fa-cloud-arrow-up"></i>
              Fazer Upload de Novo Documento
              </button>
            </div>
          </div>

          {/* =======================================
              ABA: SEGURANÇA 
          ======================================= */}
          <div className={`${activeTab === "conta" ? "block animate-fade-in-up" : "hidden"} space-y-6 md:space-y-8`}>
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-800">Alterar Senha</h2>
              <p className="text-sm text-gray-500 mt-1">Preencha apenas se desejar modificar sua senha atual.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Nova Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-lock text-gray-400"></i></div>
                  <input name="newPassword" type="password" minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* =======================================
            RODAPÉ FIXO COM FEEDBACK E BOTÃO
        ======================================= */}
        <div className="p-5 md:p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          
          <div className="w-full sm:w-auto flex-1">
            {message.text && (
              <div className={`flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl animate-fade-in ${message.type === "success" ? "bg-green-100/70 text-green-700 border border-green-200" : "bg-red-100/70 text-red-600 border border-red-200"}`}>
                <i className={`fa-solid ${message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
                {message.text}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSaving || imageError.length > 0}
            className="cursor-pointer w-full sm:w-auto bg-scout-green hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
            ) : (
              <><i className="fa-solid fa-floppy-disk"></i> Salvar Alterações</>
            )}
          </button>
        </div>

      </form>
      
      {/* =======================================
          MODAIS RENDERIZADOS
      ======================================= */}
      <UploadDocModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userId={initialData.id} 
      />

      <RenameDocModal 
        document={docToRename} 
        onClose={() => setDocToRename(null)} 
      />
      
      <DeleteDocModal 
        document={docToDelete} 
        onClose={() => setDocToDelete(null)} 
      />

    </div>
  );
}