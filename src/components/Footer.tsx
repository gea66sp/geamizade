import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contato" className="bg-gray-900 text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          
          {/* Info Grupo */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <i className="fa-solid fa-fire text-scout-yellow text-3xl"></i>
              <span className="font-heading font-bold text-xl md:text-2xl tracking-tight">GE Amizade 66/SP</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed grow">
              Educando para a vida através de atividades ao ar livre e valores éticos. Filiado à União dos Escoteiros do Brasil (UEB).
            </p>
            <div className="flex space-x-4">
              {/* Áreas de toque aumentadas e Acessibilidade (aria-label) garantida */}
              <Link href="https://www.instagram.com/amizade66sp/" target="_blank" aria-label="Visitar Instagram do GE Amizade" className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-scout-yellow hover:text-scout-dark hover:scale-110 transition-all duration-300 shadow-sm">
                <i className="fa-brands fa-instagram text-xl"></i>
              </Link>
              <Link href="https://web.facebook.com/GEAmizade" target="_blank" aria-label="Visitar Facebook do GE Amizade" className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-scout-yellow hover:text-scout-dark hover:scale-110 transition-all duration-300 shadow-sm">
                <i className="fa-brands fa-facebook-f text-xl"></i>
              </Link>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-gray-800 pb-3 text-gray-100">Links Rápidos</h4>
            {/* Removido o space-y. O 'py-2' dentro do Link expande a área clicável no mobile */}
            <ul className="flex flex-col">
              <li>
                <Link href="/login" className="group flex items-center py-2 text-gray-400 hover:text-scout-yellow transition-colors">
                  <i className="fa-solid fa-chevron-right text-[10px] mr-3 text-gray-600 group-hover:text-scout-yellow transition-colors"></i>
                  Área de Membros
                </Link>
              </li>
              <li>
                <Link href="/portal-da-transparencia" className="group flex items-center py-2 text-gray-400 hover:text-scout-yellow transition-colors">
                  <i className="fa-solid fa-chevron-right text-[10px] mr-3 text-gray-600 group-hover:text-scout-yellow transition-colors"></i>
                  Portal da Transparência
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-gray-800 pb-3 text-gray-100">Fale Conosco</h4>
            <ul className="flex flex-col text-sm">
              <li className="flex items-start gap-3 py-2 text-gray-400">
                {/* w-4 e text-center forçam todos os ícones a terem a mesma largura, alinhando o texto ao lado perfeitamente */}
                <i className="fa-solid fa-location-dot mt-1 text-scout-yellow text-base w-4 text-center"></i>
                <span className="leading-relaxed">Rua Kenzo Kajita, 272 - Parque Mauá<br />Taubaté - SP, 12062-240</span>
              </li>
              <li>
                <a href="mailto:secretaria@geamizade.org.br" className="group flex items-center gap-3 py-2 text-gray-400 hover:text-white transition-colors">
                  <i className="fa-solid fa-envelope text-scout-yellow text-base w-4 text-center group-hover:scale-110 transition-transform"></i>
                  secretaria@geamizade.org.br
                </a>
              </li>
              <li>
                <a href="https://wa.me/551236227084" target="_blank" className="group flex items-center gap-3 py-2 text-gray-400 hover:text-white transition-colors">
                  <i className="fa-brands fa-whatsapp text-scout-yellow text-lg w-4 text-center group-hover:scale-110 transition-transform"></i>
                  (12) 3622-7084
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Visita */}
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-gray-800 pb-3 text-gray-100">Agende uma Visita</h4>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Venha conhecer nossa sede em um sábado de atividade. Mande uma mensagem para agendar!
            </p>
            {/* O focus-within faz o formulário inteiro acender quando o input é focado */}
            <form className="flex shadow-sm rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-scout-yellow focus-within:ring-offset-2 focus-within:ring-offset-gray-900 transition-all">
              <label htmlFor="email-visita" className="sr-only">Seu melhor e-mail</label>
              <input 
                id="email-visita"
                type="email" 
                placeholder="Seu melhor e-mail" 
                className="bg-gray-800 text-white px-4 py-3 w-full focus:outline-none border-none text-sm placeholder-gray-500" 
                required
              />
              <button 
                type="submit" 
                aria-label="Enviar mensagem de agendamento"
                className="bg-scout-yellow text-scout-dark px-5 py-3 font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center active:bg-yellow-500"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 text-center md:text-left">
          <p>&copy; {new Date().getFullYear()} Grupo Escoteiro Amizade 66/SP. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por: <a href="https://levbrands.com.br" target="_blank" aria-label="Visitar portfólio da LevBrands" className="text-gray-400 hover:text-scout-yellow font-semibold transition-colors">LevBrands</a>
          </p>
        </div>
      </div>
    </footer>
  );
}