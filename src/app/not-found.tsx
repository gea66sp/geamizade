import Link from 'next/link';

const CampsiteIllustration = () => (
  <svg viewBox="0 0 400 300" className="w-full max-w-md drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sol (Substituindo a lua e estrelas) */}
    <circle cx="360" cy="60" r="35" fill="#FBBF24" className="animate-pulse" style={{ animationDuration: '3s' }} />
    
    {/* Nuvem na frente do Sol */}
    <g fill="#FFFFFF" opacity="0.95" className="drop-shadow-sm">
      <circle cx="320" cy="75" r="14" />
      <circle cx="340" cy="65" r="20" />
      <circle cx="360" cy="75" r="14" />
      <rect x="311" y="73" width="68" height="16" rx="8" />
    </g>

    {/* Nuvem extra para compor o céu claro */}
    <g fill="#FFFFFF" opacity="0.8" className="drop-shadow-sm" transform="translate(-200, -20) scale(0.8)">
      <circle cx="320" cy="75" r="14" />
      <circle cx="340" cy="65" r="20" />
      <circle cx="360" cy="75" r="14" />
      <rect x="311" y="73" width="68" height="16" rx="8" />
    </g>

    {/* Árvore de Fundo (Pinheiro - Tons mais claros para o dia) */}
    <path d="M100 220 L140 100 L180 220 Z" fill="#047857" />
    <path d="M110 220 L140 130 L170 220 Z" fill="#059669" opacity="0.8" />
    <rect x="135" y="220" width="10" height="20" fill="#78350F" />

    {/* Barraca */}
    <path d="M180 240 L250 120 L320 240 Z" fill="#059669" /> {/* Lateral */}
    <path d="M250 120 L320 240 L380 210 L310 90 Z" fill="#34D399" /> {/* Teto iluminado pelo sol */}
    <path d="M250 120 L250 240 L285 240 L250 170 Z" fill="#064E3B" /> {/* Entrada sombreada */}

    {/* Chão (Clareado para o dia) */}
    <ellipse cx="200" cy="255" rx="180" ry="15" fill="#A3E635" opacity="0.3" />

    {/* Fogueira */}
    {/* Lenha de fundo */}
    <rect x="192" y="244" width="36" height="6" rx="3" fill="#451A03" />

    {/* Fogo camada externa (Laranja) */}
    <path d="M190 250 C190 220, 210 210, 210 185 C210 210, 230 220, 230 250 Z" fill="#EA580C" />

    {/* Fogo camada intermediária (Âmbar) */}
    <path d="M196 250 C196 230, 210 220, 210 195 C210 220, 224 230, 224 250 Z" fill="#F59E0B" />

    {/* Fogo camada interna (Amarelo brilhante) */}
    <path d="M202 250 C202 235, 210 230, 210 210 C210 230, 218 235, 218 250 Z" fill="#FDE047" />

    {/* Lenhas cruzadas na frente */}
    <rect x="186" y="248" width="28" height="6" rx="2" fill="#78350F" transform="rotate(20 200 251)" />
    <rect x="206" y="248" width="28" height="6" rx="2" fill="#5D2906" transform="rotate(-20 220 251)" />

    {/* Faíscas subindo */}
    <circle cx="210" cy="170" r="2" fill="#FDE047" className="animate-pulse" />
    <circle cx="200" cy="182" r="1.5" fill="#F59E0B" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
    <circle cx="222" cy="190" r="1" fill="#FCD34D" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
  </svg>
);

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">
        
        {/* Ilustração adaptada */}
        <CampsiteIllustration />

        {/* Textos da página 404 */}
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-emerald-800 tracking-tight">
            404
          </h1>
          <h2 className="text-3xl font-bold text-stone-800">
            Ops! Você saiu da trilha.
          </h2>
          <p className="text-lg text-stone-600 max-w-md mx-auto">
            Página não encontrada.
          </p>
        </div>

        {/* Botão de retorno */}
        <Link 
          href="/"
          className="mt-4 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-1"
        >
          Ir para a página inicial.
        </Link>
        
      </div>
    </div>
  );
}