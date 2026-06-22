"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ModalRelatorio({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  if (!isOpen) return null;

  const handleGerar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataInicio || !dataFim) return;
    
    // Redireciona para a página de relatório passando as datas na URL
    router.push(`/admin/financeiro/relatorio?inicio=${dataInicio}&fim=${dataFim}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-heading text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-file-pdf text-red-500"></i> Gerar Relatório
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleGerar} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Data Inicial</label>
            <input 
              type="date" 
              required 
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Data Final</label>
            <input 
              type="date" 
              required 
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2">
              <i className="fa-solid fa-print"></i> Gerar PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}