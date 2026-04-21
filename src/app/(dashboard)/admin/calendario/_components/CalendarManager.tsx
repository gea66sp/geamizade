"use client";

import { useState, useMemo } from "react";
import { EventFormModal } from "./EventFormModal";
import { deleteEvent } from "../actions";

// Tipagem baseada no retorno do Prisma
type EventWithDetails = any; 
type TroopInfo = any;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEK_DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEK_DAYS_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function CalendarManager({ initialEvents, troops }: { initialEvents: EventWithDetails[], troops: TroopInfo[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventWithDetails | null>(null);
  
  // Estado para controlar o mês/ano que está sendo visualizado
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleOpenNew = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: EventWithDetails) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  // Ação movida para dentro do Modal de Edição na prática real, 
  // mas mantida aqui caso você tenha um botão de excluir externo.
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (confirm("Tem certeza que deseja excluir esta atividade? A lista de presenças também será apagada.")) {
      const res = await deleteEvent(id);
      if (!res.success) alert(res.message);
    }
  };

  // Navegação do Calendário
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Cálculos do Calendário Mensal
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 (Dom) a 6 (Sáb)
  
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  // Agrupar eventos por dia para facilitar a renderização
  const eventsByDay = useMemo(() => {
    const grouped: Record<number, EventWithDetails[]> = {};
    
    initialEvents.forEach(event => {
      const eventDate = new Date(event.startDate);
      if (eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear()) {
        const day = eventDate.getDate();
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(event);
      }
    });
    
    // Ordena os eventos dentro de cada dia pela hora
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    });

    return grouped;
  }, [initialEvents, currentDate]);

  // Função auxiliar para pegar o dia da semana de um dia específico do mês
  const getDayOfWeek = (day: number) => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
  };

  return (
    <div className="space-y-6">
      
      {/* ==========================================
          BARRA DE CONTROLES (Navegação)
      ========================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        
        {/* Controle do Mês */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <button 
            onClick={goToToday}
            className="cursor-pointer px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition-colors border border-gray-200 text-sm"
          >
            Hoje
          </button>
          
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-100 p-1">
            <button onClick={prevMonth} className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg hover:shadow-sm text-gray-500 transition-all">
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
            <h2 className="text-sm md:text-base font-bold text-gray-800 w-28 md:w-36 text-center capitalize select-none">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="cursor-pointer w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg hover:shadow-sm text-gray-500 transition-all">
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
          </div>
        </div>

        {/* Botão Novo Evento */}
        <button
          onClick={handleOpenNew}
          className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 bg-scout-green hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <i className="fa-solid fa-calendar-plus"></i>
          Nova Atividade
        </button>
      </div>

      {/* ==========================================
          VISÃO MOBILE: MODO AGENDA (LISTA)
      ========================================== */}
      <div className="md:hidden space-y-4">
        {Object.keys(eventsByDay).length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center text-3xl mb-3">
              <i className="fa-regular fa-calendar-xmark"></i>
            </div>
            <p className="text-gray-500 font-medium">Nenhuma atividade neste mês.</p>
          </div>
        ) : (
          Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = eventsByDay[day];
            
            // Só renderiza o dia no mobile se tiver eventos (ou se for o dia de hoje)
            const isToday = isCurrentMonth && today.getDate() === day;
            if (!dayEvents && !isToday) return null;

            const dayOfWeek = getDayOfWeek(day);

            return (
              <div key={`mob-${day}`} className={`bg-white rounded-2xl border ${isToday ? 'border-scout-green shadow-md' : 'border-gray-200 shadow-sm'} overflow-hidden`}>
                
                {/* Cabeçalho do Dia */}
                <div className={`px-4 py-3 flex items-center gap-3 border-b ${isToday ? 'bg-scout-green/10 border-scout-green/20' : 'bg-gray-50 border-gray-100'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${isToday ? 'bg-scout-green text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'}`}>
                    {day}
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-scout-green' : 'text-gray-400'}`}>
                      {WEEK_DAYS_FULL[dayOfWeek]}
                    </p>
                    {isToday && <p className="text-[10px] font-bold text-scout-green/70 uppercase">Hoje</p>}
                  </div>
                </div>

                {/* Eventos do Dia */}
                <div className="p-3 space-y-2">
                  {!dayEvents || dayEvents.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">Sem atividades hoje</p>
                  ) : (
                    dayEvents.map(event => (
                      <div 
                        key={event.id}
                        onClick={() => handleOpenEdit(event)}
                        className={`cursor-pointer p-3 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all ${
                          event.isGlobal 
                            ? 'bg-purple-50/50 border-purple-500 hover:bg-purple-50' 
                            : 'bg-emerald-50/50 border-emerald-500 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`font-bold text-sm leading-tight ${event.isGlobal ? 'text-purple-900' : 'text-emerald-900'}`}>
                            {event.title}
                          </h4>
                          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md ${event.isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {new Date(event.startDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          {event.location && (
                            <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                              <i className="fa-solid fa-location-dot"></i> {event.location}
                            </p>
                          )}
                          {!event.isGlobal && event.troop && (
                            <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                              <i className="fa-solid fa-tent"></i> {event.troop.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==========================================
          VISÃO DESKTOP: MODO GRID MENSAL
      ========================================== */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
          {WEEK_DAYS_SHORT.map((day) => (
            <div key={day} className="py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do Mês */}
        <div className="grid grid-cols-7 auto-rows-fr">
          
          {/* Espaços vazios do início do mês */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-35 bg-gray-50/50 border-b border-r border-gray-100 p-2"></div>
          ))}

          {/* Dias reais do mês */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const isToday = isCurrentMonth && today.getDate() === day;
            const dayEvents = eventsByDay[day] || [];

            return (
              <div 
                key={day} 
                className={`min-h-35 p-2 xl:p-3 border-b border-r border-gray-100 transition-colors hover:bg-gray-50 relative group ${isToday ? 'bg-scout-green/5' : 'bg-white'}`}
              >
                {/* Número do dia */}
                <div className="flex justify-between items-start mb-2">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                    isToday 
                      ? 'bg-scout-green text-white shadow-sm' 
                      : 'text-gray-500 group-hover:text-scout-green group-hover:bg-scout-green/10'
                  }`}>
                    {day}
                  </span>
                </div>

                {/* Lista de Eventos do Dia */}
                <div className="space-y-1.5 custom-scrollbar max-h-25 overflow-y-auto pr-1">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => handleOpenEdit(event)}
                      className={`cursor-pointer px-2.5 py-1.5 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        event.isGlobal 
                          ? 'bg-purple-50 border-purple-500 hover:bg-purple-100' 
                          : 'bg-emerald-50 border-emerald-500 hover:bg-emerald-100'
                      }`}
                      title={`${event.title}\n${event.location ? `Local: ${event.location}` : ''}`}
                    >
                      <div className={`font-bold text-xs truncate ${event.isGlobal ? 'text-purple-900' : 'text-emerald-900'}`}>
                        {event.title}
                      </div>
                      <div className={`flex items-center justify-between mt-1 ${event.isGlobal ? 'text-purple-600' : 'text-emerald-600'}`}>
                        <span className="text-[10px] font-semibold">
                          {new Date(event.startDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {!event.isGlobal && <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-15">{event.troop?.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Formulário */}
      {isModalOpen && (
        <EventFormModal
          event={eventToEdit}
          troops={troops}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}