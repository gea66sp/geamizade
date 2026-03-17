import Link from 'next/link';

const CompassIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-lg mx-auto mb-8" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base da Bússola */}
    <circle cx="100" cy="100" r="80" fill="#E7E5E4" /> {/* stone-200 */}
    <circle cx="100" cy="100" r="70" fill="#FAFAF9" /> {/* stone-50 */}
    
    {/* Marcações cardeais */}
    <path d="M100 35 L100 45" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />
    <path d="M100 165 L100 155" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />
    <path d="M35 100 L45 100" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />
    <path d="M165 100 L155 100" stroke="#A8A29E" strokeWidth="4" strokeLinecap="round" />

    {/* Agulha Norte (Vermelha/Laranja) */}
    <path d="M100 45 L115 100 L85 100 Z" fill="#EA580C" /> {/* orange-600 */}
    {/* Agulha Sul (Verde Escoteiro) */}
    <path d="M100 155 L115 100 L85 100 Z" fill="#059669" /> {/* emerald-600 */}
    
    {/* Eixo Central */}
    <circle cx="100" cy="100" r="8" fill="#292524" /> {/* stone-800 */}
    <circle cx="100" cy="100" r="3" fill="#FAFAF9" />
  </svg>
);

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-stone-100 flex">
      
      {/* Sidebar (Menu Lateral Simulado) - Oculto em telas muito pequenas */}
      <aside className="w-64 bg-stone-900 text-stone-300 hidden md:flex flex-col p-6 shadow-2xl z-10">
        <div className="flex items-center gap-3 mb-10 text-white font-bold text-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
            ⚜️
          </div>
          GE Amizade
        </div>
        
        <nav className="space-y-4 flex-1">
          <div className="flex items-center gap-3 px-3 py-2 bg-stone-800 text-emerald-400 rounded-lg cursor-pointer">
            <span className="text-xl">⛺</span> Início
          </div>
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-stone-800 hover:text-white rounded-lg transition-colors cursor-pointer">
            <span className="text-xl">📝</span> Progressão
          </div>
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-stone-800 hover:text-white rounded-lg transition-colors cursor-pointer">
            <span className="text-xl">🏅</span> Especialidades
          </div>
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-stone-800 hover:text-white rounded-lg transition-colors cursor-pointer">
            <span className="text-xl">📅</span> Calendário
          </div>
        </nav>

        <Link href="/" className="flex items-center gap-3 px-3 py-2 hover:bg-stone-800 hover:text-red-400 rounded-lg transition-colors mt-auto">
          <span>Sair (Logout)</span>
        </Link>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Cabeçalho (Header) */}
        <header className="bg-white h-20 border-b border-stone-200 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-2xl font-bold text-stone-800">Meu Painel</h1>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-stone-800">Chefe / Escoteiro</p>
              <p className="text-xs text-stone-500">Tropa Escoteira</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-emerald-800 font-bold">
              SC
            </div>
          </div>
        </header>

        {/* Conteúdo "Em Construção" */}
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white p-12 rounded-3xl shadow-lg border border-stone-100 text-center animate-fade-in-down">
            
            <CompassIllustration />

            <h2 className="text-3xl font-black text-emerald-800 mb-4 tracking-tight">
              Mapeando o Terreno...
            </h2>
            
            <p className="text-stone-600 text-lg leading-relaxed mb-8">
              Nossa equipe de pioneiros está erguendo as estruturas desta área. 
              Em breve, você terá acesso completo ao gerenciamento de progressões, 
              fichas médicas e informações da sua patrulha.
            </p>

            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-medium text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              Sistema em Desenvolvimento
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}