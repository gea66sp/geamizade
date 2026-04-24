import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | GE Amizade",
  description: "Saiba como o Grupo Escoteiro Amizade 66/SP protege seus dados e respeita sua privacidade conforme a LGPD.",
};

export default function PrivacyPage() {
  const lastUpdate = "24 de Abril de 2026";

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* ==========================================
            CABEÇALHO DA PÁGINA
        ========================================== */}
        <div className="text-center mb-16 animate-fade-in-down">
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-5 font-heading">
            Política de Privacidade
          </h1>
          
          <div className="mt-8 text-xs font-bold uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-4 py-2 rounded-full inline-block shadow-sm">
            Última atualização: {lastUpdate}
          </div>
        </div>

        {/* ==========================================
            CONTEÚDO PRINCIPAL
        ========================================== */}
        <div className="space-y-8 md:space-y-12 animate-fade-in-up">
          
          {/* Seção 1: Identidade */}
          <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6 text-scout-green">
              <i className="fa-solid fa-file-signature text-2xl"></i>
              <h2 className="text-2xl font-bold font-heading text-gray-900">1. Quem Somos</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-base md:text-lg font-medium">
              O portal <strong>geamizade.org.br</strong> é de propriedade e operação do <strong>Grupo Escoteiro Amizade 66/SP</strong>, com sede em Taubaté/SP. Somos os controladores dos dados coletados através desta plataforma, garantindo que o tratamento das informações ocorra exclusivamente para fins administrativos e educativos do movimento escoteiro.
            </p>
          </section>

          {/* Seção 2: O que coletamos */}
          <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-8 text-scout-green">
              <i className="fa-solid fa-lock text-2xl"></i>
              <h2 className="text-2xl font-bold font-heading text-gray-900">2. Dados que Coletamos</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <i className="fa-solid fa-address-card text-gray-400"></i> Informações de Cadastro:
                </h3>
                <ul className="text-base text-gray-600 space-y-3 font-medium ml-2 border-l-2 border-scout-green/20 pl-4">
                  <li>Dados pessoais (Nome, E-mail, Telefone);</li>
                  <li>Vínculos familiares (Pai/Mãe/Responsável);</li>
                  <li>Ramos escoteiros e progressão jovem;</li>
                  <li>Fichas médicas (exclusivo para segurança em atividades).</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <i className="fa-solid fa-globe text-gray-400"></i> Dados de Navegação:
                </h3>
                <ul className="text-base text-gray-600 space-y-3 font-medium ml-2 border-l-2 border-scout-green/20 pl-4">
                  <li>Endereço IP e cookies técnicos;</li>
                  <li>Páginas visitadas (via Google Analytics, sob consentimento).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 3: Cookies */}
          <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6 text-scout-green">
              <i className="fa-solid fa-cookie-bite text-2xl"></i>
              <h2 className="text-2xl font-bold font-heading text-gray-900">3. Uso de Cookies</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-base md:text-lg font-medium mb-8">
              Utilizamos cookies para melhorar sua experiência. Você pode gerenciar suas preferências através do nosso banner de consentimento localizado no rodapé do site.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <span className="font-bold text-scout-green block mb-2 text-sm uppercase tracking-widest items-center gap-2">
                  <i className="fa-solid fa-shield text-gray-400"></i> Essenciais
                </span>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Utilizados pelo sistema de login para manter sua sessão segura e pelo Google reCAPTCHA para evitar ataques de robôs. Sem eles, o portal administrativo não funciona.
                </p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <span className="font-bold text-blue-600 block mb-2 text-sm uppercase tracking-widest items-center gap-2">
                  <i className="fa-solid fa-chart-line text-gray-400"></i> Estatísticos
                </span>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Através do Google Analytics, coletamos dados anônimos de acesso para entender quais seções do site são mais úteis. Só são ativados se você clicar em "Aceitar Todos".
                </p>
              </div>
            </div>
          </section>

          {/* Seção 4: Direitos do Usuário */}
          <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6 text-scout-green">
              <i className="fa-solid fa-scale-balanced text-2xl"></i>
              <h2 className="text-2xl font-bold font-heading text-gray-900">4. Seus Direitos (LGPD)</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-base md:text-lg font-medium mb-8">
              Como titular dos dados, você possui direitos garantidos pela Lei Geral de Proteção de Dados:
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: "fa-eye", text: "Acesso aos dados" },
                { icon: "fa-pen-to-square", text: "Correção de erros" },
                { icon: "fa-trash-can", text: "Exclusão de conta" },
                { icon: "fa-ban", text: "Revogação de consentimento" },
                { icon: "fa-file-export", text: "Portabilidade" },
                { icon: "fa-share-nodes", text: "Informação de compartilhamento" }
              ].map((item, index) => (
                <div key={index} className="px-4 py-2.5 text-xs md:text-sm font-bold bg-scout-green/5 text-scout-green rounded-xl border border-scout-green/20 flex items-center gap-2">
                  <i className={`fa-solid ${item.icon} opacity-60`}></i> {item.text}
                </div>
              ))}
            </div>
          </section>

          {/* Seção 5: Contato */}
          <section className="bg-scout-dark p-8 md:p-12 rounded-3xl shadow-xl text-white text-center relative overflow-hidden">
            {/* Decoração de fundo */}
            <i className="fa-solid fa-compass absolute -right-10 -bottom-10 text-[12rem] text-white opacity-5"></i>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4 text-scout-yellow">
                <i className="fa-solid fa-circle-question text-3xl"></i>
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-heading tracking-wide mb-4">
                Dúvidas ou Solicitações?
              </h2>
              <p className="mb-10 text-gray-300 leading-relaxed text-base md:text-lg max-w-2xl mx-auto font-medium">
                Caso deseje exercer seus direitos ou tenha dúvidas sobre como tratamos suas informações, entre em contato com a Diretoria através do portal administrativo ou via e-mail institucional.
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center gap-3 bg-scout-yellow text-scout-dark font-black px-8 py-4 rounded-2xl hover:bg-yellow-400 hover:scale-105 transition-all uppercase tracking-widest text-sm shadow-lg"
              >
                <i className="fa-solid fa-house"></i> Voltar ao Início
              </Link>
            </div>
          </section>

        </div>

        {/* Rodapé da Página */}
        <div className="mt-20 text-center text-gray-400 text-sm font-bold">
          <p>
            <i className="fa-solid fa-campground mr-1"></i> © {new Date().getFullYear()} Grupo Escoteiro Amizade 66/SP.<br className="md:hidden"/> Todos os direitos reservados.
          </p>
        </div>

      </div>
    </div>
  );
}