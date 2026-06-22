"use client";
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-lg flex items-center gap-2">
      <i className="fa-solid fa-print"></i> Imprimir / PDF
    </button>
  );
}