// src/app/admin/components/StatCards.tsx
import { Users, AlertCircle, FileText, TrendingUp } from "lucide-react";

interface StatCardsProps {
  totalUsers: number;
  totalDocs: number;
  pendingTransactions: number;
}

export function StatCards({ totalUsers, totalDocs, pendingTransactions }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      
      {/* Card 1 */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp size={12} className="mr-1" /> +12%
          </span>
        </div>
        <p className="text-3xl font-black text-gray-800">{totalUsers}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">Membros Ativos</p>
      </div>

      {/* Card 2 */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          {pendingTransactions > 0 && (
            <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Ação Necessária
            </span>
          )}
        </div>
        <p className="text-3xl font-black text-gray-800">{pendingTransactions}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">Lançamentos Pendentes</p>
      </div>

      {/* Card 3 */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>
        <p className="text-3xl font-black text-gray-800">{totalDocs}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">Documentos Públicos</p>
      </div>

    </div>
  );
}