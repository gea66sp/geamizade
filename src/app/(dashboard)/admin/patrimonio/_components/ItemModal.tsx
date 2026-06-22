"use client";

import { useState, useEffect } from "react";
import { saveInventoryItem } from "../actions";

export default function ItemModal({ isOpen, onClose, item, troops }: { isOpen: boolean, onClose: () => void, item: any, troops: any[] }) {
  const [formData, setFormData] = useState({
    chargeNumber: "",
    name: "",
    category: "",
    quantity: 1,
    condition: "GOOD",
    notes: "",
    troopId: "",
    patrolId: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({
        chargeNumber: item.chargeNumber || "",
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        condition: item.condition,
        notes: item.notes || "",
        troopId: item.troopId || "",
        patrolId: item.patrolId || "",
      });
    } else {
      setFormData({ 
        chargeNumber: "", name: "", category: "", quantity: 1, condition: "GOOD", notes: "", troopId: "", patrolId: "" 
      });
    }
    setError("");
  }, [item, isOpen]);

  if (!isOpen) return null;

  // Lógica para mostrar as patrulhas apenas se a tropa selecionada possuir patrulhas
  const selectedTroopData = troops.find(t => t.id === formData.troopId);
  const currentPatrols = selectedTroopData ? selectedTroopData.patrols : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const res = await saveInventoryItem({ id: item?.id, ...formData } as any);
    setIsLoading(false);
    
    if (res.error) setError(res.error); 
    else onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] relative">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className={`fa-solid ${item ? 'fa-pen' : 'fa-box-open'} text-xl`}></i>
            </div>
            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                {item ? "Editar Material" : "Cadastrar Material"}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Preencha os dados e a propriedade do item.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0 cursor-pointer">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar flex-1">
          <form id="item-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in-up border border-red-100 mb-2">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i> {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Nome do Material <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-tag text-gray-400"></i></div>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800" placeholder="Ex: Barraca Canadense 4 Lugares" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Número de Carga (Opcional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-hashtag text-gray-400"></i></div>
                  <input type="text" value={formData.chargeNumber} onChange={e => setFormData({...formData, chargeNumber: e.target.value.toUpperCase()})} disabled={!!item} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono font-bold text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Auto: MC-XXXXXX" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Categoria <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-shapes text-gray-400"></i></div>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-medium text-gray-800" placeholder="Ex: Ferramentas, Campo..." />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Quantidade <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-cubes text-gray-400"></i></div>
                  <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-black text-gray-800" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Estado de Conservação <span className="text-red-500">*</span></label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-bold text-gray-800 cursor-pointer">
                  <option value="NEW">Novo em Folha</option>
                  <option value="GOOD">Bom Estado</option>
                  <option value="FAIR">Regular (Marcas de uso)</option>
                  <option value="DAMAGED">Danificado / Precisa de reparo</option>
                </select>
              </div>
            </div>

            {/* ==========================================
                NOVO: ALOCAÇÃO DE PATRIMÔNIO (TROPA/PATRULHA)
            ========================================== */}
            <div className="border-t border-gray-100 pt-5 mt-2">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <i className="fa-solid fa-sitemap text-scout-green"></i> Alocação do Material
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Este item pertence a qual Seção?</label>
                  <select 
                    value={formData.troopId} 
                    onChange={e => setFormData({...formData, troopId: e.target.value, patrolId: ""})} // Reseta a patrulha se mudar a tropa
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-bold text-gray-800 cursor-pointer"
                  >
                    <option value="">Almoxarifado Central (Grupo Geral)</option>
                    {troops.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Sub-alocação (Patrulha)</label>
                  <select 
                    value={formData.patrolId} 
                    onChange={e => setFormData({...formData, patrolId: e.target.value})}
                    disabled={!formData.troopId} // Só ativa se tiver Tropa selecionada
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all text-sm font-bold text-gray-800 cursor-pointer disabled:opacity-50 disabled:bg-gray-100"
                  >
                    <option value="">{formData.troopId ? "Tropa Inteira (Uso Comum)" : "Selecione uma Seção primeiro..."}</option>
                    {currentPatrols.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

              </div>
            </div>

            <div className="space-y-1.5 border-t border-gray-100 pt-5 mt-2">
              <label className="block text-sm font-bold text-gray-700">Observações Adicionais</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm text-gray-800 custom-scrollbar resize-none h-24" placeholder="Detalhes sobre o material, peças faltando, modelo..." />
            </div>

          </form>
        </div>

        {/* RODAPÉ COM BOTÕES */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 rounded-b-3xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto px-6 py-3.5 text-sm text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="item-form" disabled={isLoading} className="w-full sm:w-auto px-8 py-3.5 text-sm bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-95">
            {isLoading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Processando...</> : <><i className="fa-solid fa-floppy-disk"></i> Salvar Material</>}
          </button>
        </div>
        
      </div>
    </div>
  );
}