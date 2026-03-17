const CampsiteIllustration = () => (
  // Reduzi levemente o max-w no mobile para a ilustração não engolir a tela inteira (max-w-[250px] md:max-w-sm)
  <svg viewBox="0 0 400 300" className="w-full max-w-62.5 md:max-w-sm drop-shadow-xl mx-auto lg:mx-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sol */}
    <circle cx="360" cy="60" r="35" fill="#FBBF24" className="animate-pulse" style={{ animationDuration: '3s' }} />
    
    {/* Nuvem na frente do Sol */}
    <g fill="#FFFFFF" opacity="0.95" className="drop-shadow-sm">
      <circle cx="320" cy="75" r="14" />
      <circle cx="340" cy="65" r="20" />
      <circle cx="360" cy="75" r="14" />
      <rect x="311" y="73" width="68" height="16" rx="8" />
    </g>

    {/* Nuvem extra */}
    <g fill="#FFFFFF" opacity="0.8" className="drop-shadow-sm" transform="translate(-200, -20) scale(0.8)">
      <circle cx="320" cy="75" r="14" />
      <circle cx="340" cy="65" r="20" />
      <circle cx="360" cy="75" r="14" />
      <rect x="311" y="73" width="68" height="16" rx="8" />
    </g>

    {/* Árvore de Fundo */}
    <path d="M100 220 L140 100 L180 220 Z" fill="#047857" />
    <path d="M110 220 L140 130 L170 220 Z" fill="#059669" opacity="0.8" />
    <rect x="135" y="220" width="10" height="20" fill="#78350F" />

    {/* Barraca */}
    <path d="M180 240 L250 120 L320 240 Z" fill="#059669" />
    <path d="M250 120 L320 240 L380 210 L310 90 Z" fill="#34D399" />
    <path d="M250 120 L250 240 L285 240 L250 170 Z" fill="#064E3B" />

    {/* Chão */}
    <ellipse cx="200" cy="255" rx="180" ry="15" fill="#A3E635" opacity="0.3" />

    {/* Fogueira */}
    <rect x="192" y="244" width="36" height="6" rx="3" fill="#451A03" />
    <path d="M190 250 C190 220, 210 210, 210 185 C210 210, 230 220, 230 250 Z" fill="#EA580C" />
    <path d="M196 250 C196 230, 210 220, 210 195 C210 220, 224 230, 224 250 Z" fill="#F59E0B" />
    <path d="M202 250 C202 235, 210 230, 210 210 C210 230, 218 235, 218 250 Z" fill="#FDE047" />
    <rect x="186" y="248" width="28" height="6" rx="2" fill="#78350F" transform="rotate(20 200 251)" />
    <rect x="206" y="248" width="28" height="6" rx="2" fill="#5D2906" transform="rotate(-20 220 251)" />

    {/* Faíscas */}
    <circle cx="210" cy="170" r="2" fill="#FDE047" className="animate-pulse" />
    <circle cx="200" cy="182" r="1.5" fill="#F59E0B" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
    <circle cx="222" cy="190" r="1" fill="#FCD34D" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
  </svg>
);

export default function Home() {
  return (
    // Reduzi o padding de p-6 para p-4 no mobile para aproveitar melhor a tela
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen bg-stone-50">
      
      {/* Aumentei levemente o max-w para 4xl, senão o card e o texto ficam muito espremidos no desktop. 
          O gap mudou de gap-12 fixo para gap-8 no mobile e gap-12 no desktop */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        
        {/* Coluna da Esquerda: Ilustração e Título */}
        {/* Adicionei flexbox para garantir que a imagem e o texto fiquem perfeitamente centralizados no mobile */}
        <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-4 md:space-y-6">
          <CampsiteIllustration />
          <div>
            {/* Fontes escalonadas: menores no celular (text-3xl) e maiores no desktop (md:text-5xl) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-800 tracking-tight">
              Sempre Alerta!
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-700 mt-2">
              Nosso site está em manutenção.
            </h2>
            <p className="text-stone-600 mt-3 md:mt-4 text-base md:text-lg leading-relaxed max-w-md">
              Estamos preparando o terreno e montando as pioneirias para o nosso novo acampamento digital. 
              Enquanto isso, você pode nos encontrar nos canais abaixo:
            </p>
          </div>
        </div>

        {/* Coluna da Direita: Card de Informações */}
        {/* Padding interno do card adaptável (p-6 no mobile, sm:p-8 no desktop) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-stone-100 space-y-5 sm:space-y-6 relative overflow-hidden">
          
          {/* Corrigido para bg-gradient-to-r que é o padrão correto do Tailwind */}
          <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-linear-to-r from-emerald-500 to-emerald-700" />

          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-widest text-emerald-600 uppercase mb-4">
              Informações do Grupo
            </h3>
            
            <ul className="space-y-4 sm:space-y-5">
              <li className="flex flex-col">
                <span className="text-stone-400 text-xs sm:text-sm font-semibold">Atividades</span>
                <span className="text-stone-800 text-sm sm:text-base font-medium">Sábados, das 14h30min às 17h30min</span>
              </li>
              
              <li className="flex flex-col">
                <span className="text-stone-400 text-xs sm:text-sm font-semibold">Endereço (Sede)</span>
                <span className="text-stone-800 text-sm sm:text-base font-medium leading-snug">
                  Rua Kenzo Kajita, 272<br />
                  Parque Mauá, Taubaté - SP<br />
                  Brasil
                </span>
              </li>

              <li className="flex flex-col">
                <span className="text-stone-400 text-xs sm:text-sm font-semibold">Telefone / WhatsApp</span>
                {/* Adicionado padding no mobile (py-1) para aumentar a área de toque (hitbox) no celular */}
                <a href="tel:+5512991477636" className="text-emerald-700 hover:text-emerald-800 font-bold text-sm sm:text-base transition-colors py-0.5 sm:py-0">
                  (12) 99147-7636
                </a>
              </li>

              <li className="flex flex-col">
                <span className="text-stone-400 text-xs sm:text-sm font-semibold">E-mail</span>
                <a href="mailto:secretaria@geamizade.org.br" className="text-emerald-700 hover:text-emerald-800 font-medium text-sm sm:text-base transition-colors break-all py-0.5 sm:py-0">
                  secretaria@geamizade.org.br
                </a>
              </li>

              <li className="flex flex-col">
                <span className="text-stone-400 text-xs sm:text-sm font-semibold">Portal da Transparência</span>
                <a href="/portal-da-transparencia" className="text-emerald-700 hover:text-emerald-800 font-medium text-sm sm:text-base transition-colors py-0.5 sm:py-0">
                  Acesse o nosso portal da transparência
                </a>
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-2 border-t border-stone-100 text-center">
            <span className="text-stone-400 font-mono text-xs sm:text-sm">geamizade.org.br</span>
          </div>
        </div>

      </div>
    </main>
  );
}