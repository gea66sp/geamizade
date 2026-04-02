import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 md:p-8 text-center relative overflow-hidden">
      
      {/* Elemento Visual de Fundo (Sutil) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-heading font-black text-gray-200/50 select-none pointer-events-none z-0">
        404
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center gap-6 md:gap-8 z-10 animate-fade-in-up">
        
        {/* Ilustração Simplificada e Responsiva (FontAwesome) */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center mb-4">
          {/* Fundo do Mapa */}
          <i className="fa-solid fa-map text-[6rem] md:text-[8rem] text-scout-green opacity-20"></i>
          
          {/* Bússola central (Quebrada/Perdida) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-compass text-[4rem] md:text-[5rem] text-scout-yellow animate-pulse drop-shadow-md"></i>
          </div>
          
          {/* Pegadas saindo da trilha */}
          <div className="absolute -top-4 -right-2 transform rotate-45 opacity-40">
            <i className="fa-solid fa-shoe-prints text-xl md:text-2xl text-gray-400"></i>
          </div>
          <div className="absolute top-8 -right-8 transform rotate-60 opacity-20">
            <i className="fa-solid fa-shoe-prints text-xl md:text-2xl text-gray-400"></i>
          </div>
        </div>

        {/* Textos da página 404 */}
        <div className="space-y-3 md:space-y-4">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-tight">
            Ops! Você saiu da trilha.
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
            A página que você está procurando não existe, foi movida ou a rota foi apagada do mapa.
          </p>
        </div>

        {/* Botão de retorno */}
        <Link 
          href="/"
          className="mt-6 inline-flex items-center gap-3 px-8 py-3.5 bg-scout-green hover:bg-gray-800 text-white font-bold text-base rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <i className="fa-solid fa-house"></i>
          Voltar ao Acampamento Base
        </Link>
        
      </div>
    </div>
  );
}