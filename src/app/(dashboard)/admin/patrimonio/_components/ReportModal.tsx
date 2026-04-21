"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getInventoryReportData, getLoansReportData } from "../actions";

// Mapas de tradução para o PDF
const CONDITION_MAP = {
  NEW: "Novo",
  GOOD: "Bom",
  FAIR: "Regular",
  DAMAGED: "Danificado",
};

export default function ReportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [reportType, setReportType] = useState<"INVENTORY" | "LOANS">("INVENTORY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const generatePDF = async () => {
    setIsLoading(true);
    setError("");

    try {
      const doc = new jsPDF();
      const generatedAt = new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Cabeçalho Padrão do Grupo Escoteiro
      doc.setFontSize(18);
      doc.setTextColor(22, 163, 74); // scout-green (Tailwind green-600)
      doc.text("Grupo Escoteiro Amizade 66SP - Relatório de Patrimônio", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${generatedAt}`, 14, 26);

      if (reportType === "INVENTORY") {
        doc.text("Tipo: Inventário Completo (Ativos e Baixados)", 14, 32);
        
        const res = await getInventoryReportData();
        if (res.error || !res.data) throw new Error(res.error);

        const tableColumn = ["Nº Carga", "Material", "Categoria", "Qtd", "Condição", "Status / Empréstimo"];
        const tableRows = res.data.map((item: any) => {
          let statusStr = "Disponível";
          if (!item.isActive) {
            statusStr = `BAIXADO\nMotivo: ${item.dischargeReason}`;
          } else if (item.loans && item.loans.length > 0) {
            statusStr = `Emprestado para: ${item.loans[0].user.name}`;
          }

          return [
            item.chargeNumber,
            item.name,
            item.category,
            item.quantity.toString(),
            CONDITION_MAP[item.condition as keyof typeof CONDITION_MAP],
            statusStr
          ];
        });

        autoTable(doc, {
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [22, 163, 74] }, // scout-green
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 5: { cellWidth: 50 } } // Dá mais espaço para a coluna de Status
        });

        doc.save("Relatorio_Patrimonio_Completo.pdf");

      } else {
        // Relatório de Empréstimos
        let subtitle = "Tipo: Histórico de Empréstimos";
        if (startDate && endDate) {
          subtitle += ` (Período: ${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')})`;
        }
        doc.text(subtitle, 14, 32);

        const res = await getLoansReportData(startDate, endDate);
        if (res.error || !res.data) throw new Error(res.error);

        const tableColumn = ["Material", "Nº Carga", "Responsável", "Retirada", "Prev. Devolução", "Devolução Real", "Status"];
        const tableRows = res.data.map((loan: any) => {
          const isReturned = !!loan.returnedAt;
          const isLate = !isReturned && loan.expectedReturn && new Date(loan.expectedReturn) < new Date();
          
          let status = "No Prazo";
          if (isReturned) status = "Devolvido";
          else if (isLate) status = "ATRASADO";

          return [
            loan.item.name,
            loan.item.chargeNumber,
            loan.user.name,
            new Date(loan.borrowedAt).toLocaleDateString('pt-BR'),
            loan.expectedReturn ? new Date(loan.expectedReturn).toLocaleDateString('pt-BR') : "-",
            loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString('pt-BR') : "-",
            status
          ];
        });

        autoTable(doc, {
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] }, // blue-600 para diferenciar
          styles: { fontSize: 9, cellPadding: 3 },
        });

        doc.save("Relatorio_Historico_Emprestimos.pdf");
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao gerar PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        
        {/* ==========================================
            CABEÇALHO DO MODAL
        ========================================== */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <i className="fa-solid fa-file-pdf text-2xl"></i>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-800 leading-tight">
                Gerar Relatório
              </h2>
              <p className="text-gray-500 text-xs font-semibold mt-0.5">Exporte os dados em formato PDF</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm border border-gray-200"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Alerta de Erro */}
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in-up border border-red-200 shadow-sm">
              <i className="fa-solid fa-triangle-exclamation text-lg"></i> {error}
            </div>
          )}

          {/* Seleção do Tipo de Relatório */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
              O que você deseja exportar?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Opção: Inventário */}
              <button
                onClick={() => setReportType("INVENTORY")}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                  reportType === "INVENTORY" 
                    ? "border-scout-green bg-scout-green/5 text-scout-green shadow-sm" 
                    : "border-gray-100 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <i className={`fa-solid fa-boxes-stacked text-2xl ${reportType === "INVENTORY" ? "text-scout-green" : "text-gray-300"}`}></i>
                <span className={`text-sm font-bold ${reportType === "INVENTORY" ? "text-gray-900" : "text-gray-600"}`}>Estoque</span>
              </button>
              
              {/* Opção: Empréstimos */}
              <button
                onClick={() => setReportType("LOANS")}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                  reportType === "LOANS" 
                    ? "border-blue-500 bg-blue-50/50 text-blue-600 shadow-sm" 
                    : "border-gray-100 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <i className={`fa-solid fa-clock-rotate-left text-2xl ${reportType === "LOANS" ? "text-blue-500" : "text-gray-300"}`}></i>
                <span className={`text-sm font-bold ${reportType === "LOANS" ? "text-gray-900" : "text-gray-600"}`}>Histórico</span>
              </button>
            </div>
          </div>

          {/* Filtros Opcionais para Histórico */}
          {reportType === "LOANS" && (
            <div className="bg-blue-50/50 p-4 md:p-5 rounded-2xl border border-blue-100 space-y-4 animate-fade-in-up">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <i className="fa-regular fa-calendar"></i> Filtro de Período (Opcional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data Inicial</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-700" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data Final</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-700" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              RODAPÉ COM BOTÕES
          ========================================== */}
          <div className="pt-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
            <button 
              onClick={onClose} 
              className="w-full sm:w-auto px-6 py-3.5 text-sm text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={generatePDF}
              disabled={isLoading || (reportType === "LOANS" && ((!!startDate && !endDate) || (!startDate && !!endDate)))}
              className={`w-full sm:w-auto px-6 py-3.5 text-sm text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${
                reportType === "INVENTORY" ? "bg-scout-green hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Gerando PDF...</>
              ) : (
                <><i className="fa-solid fa-download"></i> Baixar Relatório</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}