"use client";

import { useState, useEffect } from "react";
import { saveInventoryItem } from "../actions";

export default function ItemModal({ isOpen, onClose, item }: { isOpen: boolean, onClose: () => void, item: any }) {
  const [formData, setFormData] = useState({
    chargeNumber: "",
    name: "",
    category: "",
    quantity: 1,
    condition: "GOOD",
    notes: ""
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
        notes: item.notes || ""
      });
    } else {
      setFormData({ 
        chargeNumber: "", 
        name: "", 
        category: "", 
        quantity: 1, 
        condition: "GOOD", 
        notes: "" 
      });
    }
    setError(""); // Limpa o erro ao abrir/fechar
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Chama a server action para salvar ou atualizar
    const res = await saveInventoryItem({ id: item?.id, ...formData } as any);
    
    setIsLoading(false);
    
    if (res.error) {
      setError(res.error); // Exibe erro se o número de carga já existir
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[95vh] relative">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className={`fa-solid ${item ? 'fa-pen' : 'fa-box-open'} text-xl`}></i>
            </div>
            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                {item ? "Editar Material" : "Cadastrar Material"}
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Preencha os dados do item de patrimônio.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar flex-1">
          <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in-up border border-red-100 mb-2">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i> {error}
              </div>
            )}

            {/* Número de Carga */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Número de Carga (Opcional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-hashtag text-gray-400"></i>
                </div>
                <input 
                  type="text" 
                  value={formData.chargeNumber} 
                  onChange={e => setFormData({...formData, chargeNumber: e.target.value.toUpperCase()})} 
                  disabled={!!item} // Regra de Imutabilidade
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-mono font-bold text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed" 
                  placeholder={item ? "" : "Deixe em branco para gerar auto."} 
                />
              </div>
              {!item && (
                <p className="text-[10px] text-gray-500 font-medium ml-1">
                  Se vazio, o sistema criará no formato MC-XXXXXX.
                </p>
              )}
            </div>

            {/* Nome do Material */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Nome do Material <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-tag text-gray-400"></i>
                </div>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all font-semibold text-gray-800" 
                  placeholder="Ex: Barraca Canadense 4 Lugares" 
                />
              </div>
            </div>

            {/* Grid: Categoria e Quantidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Categoria <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-shapes text-gray-400"></i>
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-medium text-gray-800" 
                    placeholder="Ex: Ferramentas, Campo..." 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Quantidade <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-cubes text-gray-400"></i>
                  </div>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-black text-gray-800" 
                  />
                </div>
              </div>
            </div>

            {/* Condição */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Estado de Conservação <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-clipboard-check text-gray-400"></i>
                </div>
                <select 
                  value={formData.condition} 
                  onChange={e => setFormData({...formData, condition: e.target.value})} 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-bold text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="NEW">Novo em Folha</option>
                  <option value="GOOD">Bom Estado</option>
                  <option value="FAIR">Regular (Marcas de uso)</option>
                  <option value="DAMAGED">Danificado / Precisa de reparo</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Observações Adicionais</label>
              <textarea 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm text-gray-800 custom-scrollbar resize-none h-24" 
                placeholder="Detalhes sobre o material, peças faltando, modelo, cor, marca..." 
              />
            </div>

          </form>
        </div>

        {/* RODAPÉ COM BOTÕES */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 rounded-b-3xl">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3.5 text-sm text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="item-form"
            disabled={isLoading} 
            className="w-full sm:w-auto px-8 py-3.5 text-sm bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-95"
          >
            {isLoading ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Processando...</>
            ) : (
              <><i className="fa-solid fa-floppy-disk"></i> Salvar Material</>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}