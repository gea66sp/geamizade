"use client";

import { useState } from "react";
import { updateProfile } from "../actions"; 

type ProfileFormProps = {
  initialData: any; 
};

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState("pessoais");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Estado para o preview instantâneo da foto de perfil
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.image || null);

  // Função para criar o preview assim que o usuário escolhe a foto do PC/Celular
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // O formData agora enviará também o campo "image" contendo o Arquivo (File)
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
          onClick={() => setActiveTab("medica")}
          className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-4 font-bold text-sm transition-colors whitespace-nowrap min-w-35 flex-1 ${
            activeTab === "medica"
              ? "bg-white border-b-2 border-scout-green text-scout-green shadow-[0_-2px_0_0_inset_#22c55e]"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <i className="fa-solid fa-notes-medical"></i>
          Ficha Médica
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
              <p className="text-xs text-gray-500 mt-3 font-medium md:hidden">Toque na foto para alterar</p>
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
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Telefone / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-brands fa-whatsapp text-gray-400"></i></div>
                  <input name="phone" type="tel" defaultValue={initialData.phone || ""} placeholder="(11) 90000-0000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800" />
                </div>
              </div>

              {/* Campos Desabilitados (Apenas Leitura) */}
              <div className="space-y-1.5 opacity-70">
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
            </div>
          </div>

          {/* =======================================
              ABA: FICHA MÉDICA 
          ======================================= */}
          <div className={`${activeTab === "medica" ? "block animate-fade-in-up" : "hidden"} space-y-6 md:space-y-8`}>
            <div className="border-b border-gray-100 pb-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-800">Ficha Médica e Saúde</h2>
                <p className="text-sm text-gray-500 mt-1">Essas informações são vitais para acampamentos e atividades.</p>
              </div>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-notes-medical text-xl"></i>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Tipo Sanguíneo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-droplet text-red-400"></i></div>
                  <select name="bloodType" defaultValue={initialData.medicalRecord?.bloodType || ""} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition-all cursor-pointer font-bold text-gray-800 appearance-none">
                    <option value="">Não sei / Não informar</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Contato de Emergência</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-truck-medical text-gray-400"></i></div>
                  <input name="emergencyContact" type="text" placeholder="Nome e Telefone (Ex: Mãe - 11 9000-0000)" defaultValue={initialData.medicalRecord?.emergencyContact || ""} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800 font-medium" />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-amber-600 items-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> Alergias (Medicamentos, insetos, etc)</label>
                <textarea name="allergies" rows={2} placeholder="Descreva se possui alguma alergia..." defaultValue={initialData.medicalRecord?.allergies || ""} className="w-full px-4 py-3 border border-amber-200 rounded-xl bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all text-gray-800 custom-scrollbar resize-none font-medium" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Medicamentos de Uso Contínuo</label>
                <textarea name="continuousMeds" rows={2} placeholder="Descreva se toma algum remédio frequente..." defaultValue={initialData.medicalRecord?.continuousMeds || ""} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800 custom-scrollbar resize-none" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Restrições Alimentares</label>
                <textarea name="dietaryRestrictions" rows={2} placeholder="Vegetariano, intolerância a lactose..." defaultValue={initialData.medicalRecord?.dietaryRestrictions || ""} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800 custom-scrollbar resize-none" />
              </div>

              <div className="space-y-1.5 md:col-span-2 border-t border-gray-100 pt-5">
                <label className="block text-sm font-bold text-gray-700">Plano de Saúde (Convênio)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-id-card text-gray-400"></i></div>
                  <input name="healthInsurance" type="text" placeholder="Nome do plano e Nº da carteirinha" defaultValue={initialData.medicalRecord?.healthInsurance || ""} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800 font-medium" />
                </div>
              </div>

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
                  {/* autoComplete="new-password" evita que o navegador preencha sozinho */}
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
              <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg animate-fade-in ${message.type === "success" ? "bg-green-100/50 text-green-700" : "bg-red-100/50 text-red-600"}`}>
                <i className={`fa-solid ${message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
                {message.text}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer w-full sm:w-auto bg-scout-green hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
            ) : (
              <><i className="fa-solid fa-floppy-disk"></i> Salvar Perfil</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}