import Image from "next/image";
import Link from "next/link";
// Ajuste o caminho de importação do prisma conforme a estrutura do seu projeto
import prisma from "@/src/lib/prisma"; 
// Importe o novo componente (ajuste o caminho conforme sua estrutura, ex: "@/src/components/SectionVoluntariado")
import SectionVoluntariado from "@/src/components/SectionVoluntariado"; 

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GE Amizade 66SP",
  description: "Grupo Escoteiro Amizade 66/SP - Promovendo valores, aventuras e amizades duradouras. Junte-se a nós para explorar, aprender e crescer juntos em Taubaté!",
};

export default async function Home() {
  // 1. Busca as configurações da página
  const homeSettings = await prisma.homePageSettings.findFirst();

  // 2. Busca as FAQs ativas e as ordena
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  // 3. Fallbacks
  const heroTitle = homeSettings?.heroTitle || "Aventura, Aprendizado e Amizade.";
  const heroShortText = homeSettings?.heroShortText || "Construindo um mundo melhor através da educação ao ar livre, cidadania e trabalho em equipe!";
  const aboutText = homeSettings?.aboutText || "O Grupo Escoteiro Amizade 66/SP atua há décadas transformando a vida de jovens na comunidade. Nosso propósito é contribuir para que os jovens assumam seu próprio desenvolvimento, especialmente do caráter, ajudando-os a realizar suas plenas potencialidades físicas, intelectuais, sociais, afetivas e espirituais.\n\nAtravés do Método Escoteiro, oferecemos um ambiente seguro, divertido e desafiador. Somos uma grande família unida pelo desejo de 'deixar o mundo um pouco melhor do que o encontramos' (Baden-Powell).";
  const impactedCount = homeSettings?.impactedYouthCount || 500;
  const heroBgImage = homeSettings?.heroImage ? `url(${homeSettings.heroImage})` : undefined;
  const aboutImageSrc = homeSettings?.aboutImage || "/sobre-nos.png";

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <>
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Hero Section Otimizado (Responsividade e Contraste) */}
      <header 
        className="relative flex items-center justify-center text-center px-4 min-h-[80vh] md:min-h-150 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: heroBgImage, backgroundColor: '#1a202c' }}
      >
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        
        <div className="max-w-4xl mx-auto text-white z-10 animate-fade-in-up py-20">
          <span className="text-scout-yellow font-bold tracking-widest uppercase text-xs md:text-sm mb-4 block">Sempre Alerta!</span>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl mb-6 drop-shadow-md leading-tight">
            {heroTitle}
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-10 text-gray-200 font-light max-w-2xl mx-auto leading-relaxed">
            {heroShortText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <Link href="#contato" className="w-full sm:w-auto bg-scout-yellow text-scout-dark px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95">
              <i className="fa-solid fa-map-location-dot"></i> Quero ser Escoteiro
            </Link>
            <Link href="#sobre" className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/80 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 active:scale-95">
              Conheça o Grupo
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg className="relative block w-full h-12 md:h-16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,123.15,198.8,111.41C248.8,102.78,287.6,76.6,321.39,56.44Z" fill="#ffffff"></path>
          </svg>
        </div>
      </header>

      {/* Resumo / Sobre Nós */}
      <section id="sobre" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-scout-green mb-4">Nossa História, Nossa Missão</h2>
            <div className="w-20 h-1.5 bg-scout-yellow mb-8 rounded-full"></div>
            <p className="text-gray-600 mb-8 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {aboutText}
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-scout-green font-medium text-lg">
                <i className="fa-solid fa-check-circle text-scout-yellow text-xl"></i> Formação de Lideranças
              </li>
              <li className="flex items-center gap-3 text-scout-green font-medium text-lg">
                <i className="fa-solid fa-check-circle text-scout-yellow text-xl"></i> Contato constante com a Natureza
              </li>
              <li className="flex items-center gap-3 text-scout-green font-medium text-lg">
                <i className="fa-solid fa-check-circle text-scout-yellow text-xl"></i> Cidadania e Serviço Comunitário
              </li>
            </ul>
          </div>
          
          <div className="relative order-1 lg:order-2 w-full aspect-4/3 lg:aspect-square rounded-2xl shadow-2xl overflow-hidden">
            <Image 
              src={aboutImageSrc} 
              alt="Sobre nós" 
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute -bottom-2 -right-2 bg-white p-5 rounded-tl-2xl shadow-xl border-t-4 border-l-4 border-white hidden md:block">
              <div className="text-center">
                <span className="block text-4xl font-extrabold text-scout-green">+{impactedCount}</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jovens Impactados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ramos Escoteiros */}
      <section id="ramos" className="py-16 md:py-24 bg-gray-50 border-t border-gray-100">
        {/* ... (Conteúdo original dos ramos permanece inalterado) ... */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-scout-green mb-4">Os Ramos Escoteiros</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">O Movimento Escoteiro é dividido por faixas etárias para oferecer atividades adequadas ao desenvolvimento de cada jovem.</p>
            <div className="w-20 h-1.5 bg-scout-yellow mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Ramo Lobinho */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 border-t-4 border-yellow-400 text-center group flex flex-col h-full">
              <div className="w-20 h-20 mx-auto bg-yellow-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <i className="fa-solid fa-paw text-3xl text-yellow-600"></i>
              </div>
              <h3 className="font-heading font-bold text-2xl text-gray-800 mb-2">Ramo Lobinho</h3>
              <span className="inline-block bg-yellow-100/50 text-yellow-800 text-sm font-bold px-4 py-1.5 rounded-full mb-4 mx-auto">6,5 a 10 anos</span>
              <p className="text-gray-600 mb-6 text-sm grow">Focado na socialização e no aprender brincando, inspirado no Livro da Selva.</p>
              <p className="font-bold text-yellow-600 italic mt-auto tracking-wide">"Melhor Possível"</p>
            </div>

            {/* Ramo Escoteiro */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 border-t-4 border-green-600 text-center group flex flex-col h-full">
              <div className="w-20 h-20 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <i className="fa-solid fa-compass text-3xl text-green-700"></i>
              </div>
              <h3 className="font-heading font-bold text-2xl text-gray-800 mb-2">Ramo Escoteiro</h3>
              <span className="inline-block bg-green-100/50 text-green-800 text-sm font-bold px-4 py-1.5 rounded-full mb-4 mx-auto">11 a 14 anos</span>
              <p className="text-gray-600 mb-6 text-sm grow">Aventura, sistema de patrulhas e acampamentos. A fase da descoberta e amizade.</p>
              <p className="font-bold text-green-700 italic mt-auto tracking-wide">"Sempre Alerta"</p>
            </div>

            {/* Ramo Sênior */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 border-t-4 border-red-800 text-center group flex flex-col h-full">
              <div className="w-20 h-20 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <i className="fa-solid fa-mountain text-3xl text-red-800"></i>
              </div>
              <h3 className="font-heading font-bold text-2xl text-gray-800 mb-2">Ramo Sênior</h3>
              <span className="inline-block bg-red-100/50 text-red-800 text-sm font-bold px-4 py-1.5 rounded-full mb-4 mx-auto">15 a 17 anos</span>
              <p className="text-gray-600 mb-6 text-sm grow">Superação de limites, grandes desafios físicos e exploração. Autoconhecimento.</p>
              <p className="font-bold text-red-800 italic mt-auto tracking-wide">"Sempre Alerta"</p>
            </div>

            {/* Ramo Pioneiro */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 border-t-4 border-red-500 text-center group flex flex-col h-full">
              <div className="w-20 h-20 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <i className="fa-solid fa-hands-holding-circle text-3xl text-red-600"></i>
              </div>
              <h3 className="font-heading font-bold text-2xl text-gray-800 mb-2">Ramo Pioneiro</h3>
              <span className="inline-block bg-red-100/50 text-red-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4 mx-auto">18 a 21 anos</span>
              <p className="text-gray-600 mb-6 text-sm grow">Projeto de vida, integração na sociedade e forte ênfase no serviço ao próximo.</p>
              <p className="font-bold text-red-600 italic mt-auto tracking-wide">"Servir"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section id="destaques" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-scout-green mb-4">Destaques do Grupo</h2>
            <div className="w-20 h-1.5 bg-scout-yellow rounded-full"></div>
          </div>
          <Link href="#" className="group text-scout-green font-bold hover:text-scout-dark flex items-center gap-2 transition-colors py-2">
            Ver todas as notícias <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-gray-100">
            <div className="relative w-full h-48">
              <Image src="/zooparque.png" alt="Visita ao Zooparque" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
            <div className="p-6 flex flex-col grow">
              <span className="text-xs font-bold text-scout-light uppercase tracking-widest mb-2 block">Passeio</span>
              <h3 className="font-heading font-bold text-xl text-gray-800 mb-3">Visita ao Zooparque 2026</h3>
              <p className="text-gray-600 text-sm mb-6 grow line-clamp-4">No último final de semana a Alcateia Chill juntamente com a família escoteira do GE Amizade passou o dia no Zooparque Itatiba, em meio a animais, trilhas e aventuras…. Um dia inesquecível de muitas descobertas, risadas, amizades, registros e muita diversão!</p>
              <Link href="https://www.instagram.com/amizade66sp/" target="_blank" className="group text-scout-green font-semibold hover:text-scout-dark inline-flex items-center gap-2 transition-colors mt-auto">
                Ler mais <i className="fa-solid fa-arrow-right text-xs transform group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-gray-100">
            <div className="relative w-full h-48">
              <Image src="/acao-comunitaria.png" alt="Ação Comunitária" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
            <div className="p-6 flex flex-col grow">
              <span className="text-xs font-bold text-scout-light uppercase tracking-widest mb-2 block">Inclusão Social</span>
              <h3 className="font-heading font-bold text-xl text-gray-800 mb-3">Festival Paralímpico</h3>
              <p className="text-gray-600 text-sm mb-6 grow line-clamp-4">Festival Paralímpico, realizado no Ginásio da CTI, em Taubaté, sob a coordenação do Comitê Paralímpico Brasileiro (CPB). Fantástica experiência onde, além do contato direto com o esporte adaptado, os jovens puderam vivenciar na prática valores de empatia, cooperação e serviço ao próximo.</p>
              <Link href="https://www.instagram.com/amizade66sp/" target="_blank" className="group text-scout-green font-semibold hover:text-scout-dark inline-flex items-center gap-2 transition-colors mt-auto">
                Ler mais <i className="fa-solid fa-arrow-right text-xs transform group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-gray-100">
            <div className="relative w-full h-48">
              <Image src="/camara-municipal.png" alt="Conquista" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
            <div className="p-6 flex flex-col grow">
              <span className="text-xs font-bold text-scout-light uppercase tracking-widest mb-2 block">Conquista</span>
              <h3 className="font-heading font-bold text-xl text-gray-800 mb-3">Homenagem na Câmara Municipal</h3>
              <p className="text-gray-600 text-sm mb-6 grow line-clamp-4">Parabenizamos nossos Escoteiros e Chefes que receberam reconhecimento por seus serviços à comunidade.</p>
              <Link href="https://www.instagram.com/amizade66sp/" target="_blank" className="group text-scout-green font-semibold hover:text-scout-dark inline-flex items-center gap-2 transition-colors mt-auto">
                Ler mais <i className="fa-solid fa-arrow-right text-xs transform group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Calendário de Atividades */}
      <section id="calendario" className="py-16 md:py-24 bg-scout-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">Próximas Atividades</h2>
              <div className="w-20 h-1.5 bg-scout-yellow mb-8 rounded-full"></div>
              <p className="text-gray-300 mb-8 text-base md:text-lg leading-relaxed">
                Mantenha-se atualizado com a nossa programação. Atividades regulares acontecem todos os sábados, das <strong className="text-white">14h:30min às 17h:30min</strong>, em nossa sede.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 sm:gap-6 hover:bg-white/10 transition-colors border-l-4 border-scout-yellow">
                <div className="text-center min-w-17.5 sm:min-w-20">
                  <span className="block text-scout-yellow font-extrabold text-2xl uppercase leading-none">11</span>
                  <span className="block text-gray-400 text-xs sm:text-sm font-medium mt-1 uppercase tracking-wider">Abril</span>
                </div>
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-white mb-1">Reunião de Sede</h4>
                  <p className="text-gray-400 text-xs sm:text-sm"><i className="fa-regular fa-clock mr-1.5"></i> 14:30 - 17:30 | Todos os Ramos</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 sm:gap-6 hover:bg-white/10 transition-colors border-l-4 border-blue-500">
                <div className="text-center min-w-17.5 sm:min-w-20">
                  <span className="block text-blue-400 font-extrabold text-2xl uppercase leading-none">18</span>
                  <span className="block text-gray-400 text-xs sm:text-sm font-medium mt-1 uppercase tracking-wider">Abril</span>
                </div>
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-white mb-1">Reunião de Sede</h4>
                  <p className="text-gray-400 text-xs sm:text-sm"><i className="fa-regular fa-clock mr-1.5"></i> 14:30 - 17:30 | Todos os Ramos</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 sm:gap-6 hover:bg-white/10 transition-colors border-l-4 border-green-500">
                <div className="text-center min-w-17.5 sm:min-w-20">
                  <span className="block text-green-400 font-extrabold text-2xl uppercase leading-none">25</span>
                  <span className="block text-gray-400 text-xs sm:text-sm font-medium mt-1 uppercase tracking-wider">Abril</span>
                </div>
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-white mb-1">Reunião de Sede</h4>
                  <p className="text-gray-400 text-xs sm:text-sm"><i className="fa-regular fa-clock mr-1.5"></i> 14:30 - 17:30 | Todos os Ramos</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 sm:gap-6 hover:bg-white/10 transition-colors border-l-4 border-gray-500 opacity-70">
                <div className="text-center min-w-17.5 sm:min-w-20">
                  <span className="block text-gray-400 font-extrabold text-2xl uppercase leading-none">02</span>
                  <span className="block text-gray-400 text-xs sm:text-sm font-medium mt-1 uppercase tracking-wider">Maio</span>
                </div>
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-white mb-1">Feriado Nacional</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Não haverá atividade</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Perguntas Frequentes */}
      {faqs.length > 0 && (
        <section id="faq" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-scout-green mb-4">Dúvidas Frequentes</h2>
              <div className="w-20 h-1.5 bg-scout-yellow mx-auto rounded-full"></div>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details 
                  key={faq.id} 
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden [&_summary::-webkit-details-marker]:hidden transition-all duration-300"
                >
                  <summary className="font-bold text-base md:text-lg text-gray-800 p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors list-none select-none">
                    <div className="flex items-start gap-3 pr-4">
                      <i className="fa-solid fa-circle-question text-scout-yellow mt-1 text-lg"></i>
                      <span>{faq.question}</span>
                    </div>
                    <span className="shrink-0 transition-transform duration-300 group-open:rotate-180 bg-gray-50 p-2 rounded-full">
                      <i className="fa-solid fa-chevron-down text-gray-500 text-sm"></i>
                    </span>
                  </summary>
                  
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap pl-0 md:pl-9 border-t border-gray-100 pt-5 mt-2">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COMPONENTE INTERATIVO IMPORTADO AQUI */}
      <SectionVoluntariado />

    </>
  );
}