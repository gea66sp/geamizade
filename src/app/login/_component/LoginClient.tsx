"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, LockKeyhole, ShieldAlert } from "lucide-react";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";

// ============================================================================
// COMPONENTE DE ILUSTRAÇÃO (Barraca, Árvore e Fogueira)
// ============================================================================
const CampsiteIllustration = () => (
  <svg viewBox="0 0 400 300" className="w-full max-w-lg drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Céu noturno / estrelas */}
    <circle cx="80" cy="60" r="2" fill="#D1FAE5" className="animate-pulse" />
    <circle cx="250" cy="40" r="1.5" fill="#D1FAE5" className="animate-pulse" style={{ animationDelay: '1s' }} />
    <circle cx="320" cy="90" r="2" fill="#D1FAE5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
    
    {/* Lua */}
    <circle cx="360" cy="50" r="30" fill="#FEF3C7" />
    {/* Buracos da Lua */}
    <circle cx="350" cy="40" r="6" fill="#FDE68A" opacity="0.7" />
    <circle cx="370" cy="55" r="8" fill="#FDE68A" opacity="0.7" />
    <circle cx="365" cy="35" r="4" fill="#FDE68A" opacity="0.7" />
    <circle cx="345" cy="60" r="3" fill="#FDE68A" opacity="0.7" />
    
    {/* Nuvem na frente da Lua */}
    <g fill="#FFFFFF" opacity="0.95">
      <circle cx="320" cy="75" r="14" />
      <circle cx="340" cy="65" r="20" />
      <circle cx="360" cy="75" r="14" />
      <rect x="311" y="73" width="68" height="16" rx="8" />
    </g>

    {/* Árvore de Fundo (Pinheiro) */}
    <path d="M100 220 L140 100 L180 220 Z" fill="#064E3B" />
    <path d="M110 220 L140 130 L170 220 Z" fill="#047857" opacity="0.6" />
    <rect x="135" y="220" width="10" height="20" fill="#451A03" />

    {/* Barraca */}
    <path d="M180 240 L250 120 L320 240 Z" fill="#059669" />
    <path d="M250 120 L320 240 L380 210 L310 90 Z" fill="#10B981" />
    <path d="M250 120 L250 240 L285 240 L250 170 Z" fill="#047857" />

    {/* Chão */}
    <ellipse cx="200" cy="255" rx="180" ry="15" fill="#064E3B" opacity="0.2" />

    {/* Fogueira */}
    <rect x="192" y="244" width="36" height="6" rx="3" fill="#451A03" />
    <path d="M190 250 C190 220, 210 210, 210 185 C210 210, 230 220, 230 250 Z" fill="#EA580C" />
    <path d="M196 250 C196 230, 210 220, 210 195 C210 220, 224 230, 224 250 Z" fill="#F59E0B" />
    <path d="M202 250 C202 235, 210 230, 210 210 C210 230, 218 235, 218 250 Z" fill="#FDE047" />
    <rect x="186" y="248" width="28" height="6" rx="2" fill="#78350F" transform="rotate(20 200 251)" />
    <rect x="206" y="248" width="28" height="6" rx="2" fill="#5D2906" transform="rotate(-20 220 251)" />
    <circle cx="210" cy="170" r="2" fill="#FDE047" className="animate-pulse" />
    <circle cx="200" cy="182" r="1.5" fill="#F59E0B" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
    <circle cx="222" cy="190" r="1" fill="#FCD34D" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
  </svg>
);

// ============================================================================
// PÁGINA DE LOGIN
// ============================================================================
export default function LoginClient() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // 👈 1. NOVO ESTADO
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const token = recaptchaRef.current?.getValue();
    if (!token) {
      setError("Confirme que você não é um robô para continuar.");
      setIsLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      captchaToken: token,
      remember: rememberMe.toString(), // 👈 2. ENVIA O ESTADO COMO STRING
      redirect: false,
    });

    if (res?.error) {
      setError("Credenciais inválidas ou falha na segurança.");
      setIsLoading(false);
      recaptchaRef.current?.reset();
    } else {
      sessionStorage.setItem("scout_active_session", "true");
      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8f9fa]">
      
      {/* ==================== LADO ESQUERDO: ILUSTRAÇÃO ==================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-400 relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-3xl -z-10" />

        <div className="z-10 w-full max-w-md flex flex-col items-center text-center">
          <CampsiteIllustration />
          
          <div className="mt-12 space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tight">
              Sempre Alerta!
            </h1>
            <p className="text-white text-lg leading-relaxed font-medium max-w-sm mx-auto">
              Acesse o portal interno. Uso interno exclusivo GE Amizade 66° SP
            </p>
          </div>
        </div>
      </div>

      {/* ==================== LADO DIREITO: FORMULÁRIO ==================== */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-12 py-10 relative">
        <div className="max-w-md w-full">
          
          {/* Card do Formulário */}
          <div className="bg-white p-6 sm:p-8 rounded-4xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Feedback de Erro */}
              {error && (
                <div className="flex items-center gap-3 p-4 text-xs font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in zoom-in-95">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p className="leading-snug">{error}</p>
                </div>
              )}

              {/* Agrupamento dos Inputs */}
              <div className="space-y-5">
                {/* Campo E-mail */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-emerald-600 ml-1">
                    E-mail de acesso
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:bg-white outline-none transition-all font-medium placeholder:text-gray-400"
                      placeholder="seu.email@exemplo.com"
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-emerald-600 ml-1">
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors">
                      <LockKeyhole className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:bg-white outline-none transition-all font-medium placeholder:text-gray-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* 👈 3. CONTROLES SECUNDÁRIOS: Lembrar de Mim & Esqueceu Senha */}
                <div className="flex items-center justify-between text-sm pt-1 ml-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                      Lembrar de mim
                    </span>
                  </label>
                  
                  {/* Link com visual mais limpo que a instrução gigante anterior */}
                  <div className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-help" title="Entre em contato com o seu Chefe para redefinir.">
                    Esqueceu a senha?
                  </div>
                </div>

              </div>

              {/* reCAPTCHA */}
              <div className="pt-4 pb-2 border-t border-gray-100">
                <div className="flex justify-center w-full">
                  <div className="transform scale-[0.85] sm:scale-100 origin-top transition-transform duration-300">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full flex justify-center items-center py-4 px-6 rounded-2xl text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] shadow-lg shadow-emerald-700/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-6 w-6 text-white" />
                ) : (
                  <span className="flex items-center gap-2 uppercase tracking-widest">
                    Acessar Sistema
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Rodapé */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-emerald-700 transition-colors font-medium flex items-center justify-center gap-2">
              &larr; Voltar para o portal público
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}