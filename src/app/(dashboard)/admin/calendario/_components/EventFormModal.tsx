"use client";

import { useState, useTransition } from "react";
import { saveEvent, deleteEvent, EventFormData } from "../actions";
import { useRouter } from "next/navigation";

// Função auxiliar para formatar a data que vem do Prisma para o input type="datetime-local"
const formatDateForInput = (dateString?: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function EventFormModal({ event, troops, onClose }: { event?: any, troops: any[], onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  
  // Controle local para exibir/ocultar o select de tropa
  const [isGlobal, setIsGlobal] = useState<boolean>(event?.isGlobal ?? true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    
    const data: EventFormData = {
      id: event?.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      location: formData.get("location") as string,
      isGlobal: isGlobal, // Usamos o estado em vez do formData
      troopId: formData.get("troopId") as string,
    };

    startTransition(async () => {
      const res = await saveEvent(data);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    if (confirm("Tem certeza que deseja excluir esta atividade? O registro de presenças também será apagado.")) {
      setIsDeleting(true);
      const res = await deleteEvent(event.id);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className={`fa-solid ${event ? "fa-pen" : "fa-calendar-plus"} text-xl`}></i>
            </div>
            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                {event ? "Editar Atividade" : "Nova Atividade"}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Preencha os detalhes no calendário.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in-up border border-red-100">
              <i className="fa-solid fa-triangle-exclamation text-lg"></i> {error}
            </div>
          )}

          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Título */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Título da Atividade <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-tag text-gray-400"></i>
                </div>
                <input 
                  name="title" 
                  defaultValue={event?.title} 
                  required 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800"
                  placeholder="Ex: Acampamento de Grupo, Reunião Especial..."
                />
              </div>
            </div>

            {/* Datas (Grid responsivo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Início <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-regular fa-clock text-gray-400"></i>
                  </div>
                  <input 
                    type="datetime-local" 
                    name="startDate" 
                    defaultValue={formatDateForInput(event?.startDate)} 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-medium text-gray-800"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Término <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-flag-checkered text-gray-400"></i>
                  </div>
                  <input 
                    type="datetime-local" 
                    name="endDate" 
                    defaultValue={formatDateForInput(event?.endDate)} 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-medium text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Local */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Local</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-location-dot text-gray-400"></i>
                </div>
                <input 
                  name="location" 
                  defaultValue={event?.location} 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800"
                  placeholder="Ex: Sede do Grupo, Parque da Cidade..."
                />
              </div>
            </div>

            {/* Tipo de Evento (Cards Otimizados para Mobile) */}
            <div className="space-y-3 p-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Público Alvo da Atividade <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div 
                  onClick={() => setIsGlobal(true)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${isGlobal ? 'bg-scout-green/5 border-scout-green shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isGlobal ? 'bg-scout-green text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <i className="fa-solid fa-globe text-lg"></i>
                  </div>
                  <h4 className={`font-bold text-sm ${isGlobal ? 'text-scout-green' : 'text-gray-700'}`}>Global</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Todos os ramos</p>
                </div>

                <div 
                  onClick={() => setIsGlobal(false)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${!isGlobal ? 'bg-scout-green/5 border-scout-green shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${!isGlobal ? 'bg-scout-green text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <i className="fa-solid fa-tent text-lg"></i>
                  </div>
                  <h4 className={`font-bold text-sm ${!isGlobal ? 'text-scout-green' : 'text-gray-700'}`}>Seção</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Apenas uma tropa</p>
                </div>
              </div>

              {/* Select de Tropa com Animação */}
              {!isGlobal && (
                <div className="pt-4 animate-fade-in-up space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Tropa / Alcatéia Responsável</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fa-solid fa-people-group text-gray-400"></i>
                    </div>
                    <select 
                      name="troopId" 
                      defaultValue={event?.troopId || ""} 
                      required={!isGlobal}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Selecione a seção...</option>
                      {troops.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Descrição / Avisos <span className="text-red-500">*</span></label>
              <textarea 
                name="description" 
                defaultValue={event?.description}
                rows={4} 
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green resize-none outline-none transition-all custom-scrollbar text-gray-800"
                placeholder="O que levar, orientações aos pais, cronograma..."
              />
            </div>
          </form>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-between gap-3 shrink-0 rounded-b-3xl">
          
          {/* Botão Excluir (Se for edição) */}
          <div className="w-full sm:w-auto">
            {event && (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={isPending || isDeleting}
                className="w-full sm:w-auto px-6 py-3 text-sm text-red-500 font-bold bg-white border border-red-200 hover:bg-red-50 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-trash"></i>} 
                Excluir
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isPending || isDeleting}
              className="w-full sm:w-auto px-6 py-3 text-sm text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="event-form"
              disabled={isPending || isDeleting}
              className="w-full sm:w-auto px-8 py-3 text-sm bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-95"
            >
              {isPending ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
              ) : (
                <><i className="fa-solid fa-check"></i> Salvar</>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}