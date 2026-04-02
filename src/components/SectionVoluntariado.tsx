'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function SectionVoluntariado() {
  const [tipo, setTipo] = useState<'jovem' | 'adulto'>('jovem');
  const [form, setForm] = useState({
    nome: '',
    idade: '',
    telefone: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const enviarParaWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numeroWhatsApp = "551236227084"; 
    const perfil = tipo === 'jovem' ? 'Jovem' : 'Adulto Voluntário';
    
    const mensagem = `Olá! Meu nome é *${form.nome}* e quero conhecer mais sobre o grupo escoteiro!\n\n` +
      `*Perfil desejado:* Participar como ${perfil}\n` +
      `*Idade:* ${form.idade} anos\n` +
      `*Telefone:* ${form.telefone}\n` +
      `*E-mail:* ${form.email}\n\n` +
      `Gostaria de receber mais informações de como me juntar a vocês. Sempre Alerta!`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const isJovem = tipo === 'jovem';
  
  // Esquema de cores dinâmico
  const bgColor = isJovem ? 'bg-scout-yellow' : 'bg-scout-dark';
  const textColor = isJovem ? 'text-scout-dark' : 'text-white';
  const labelColor = isJovem ? 'text-scout-dark' : 'text-gray-300';
  const inputBg = isJovem ? 'bg-white/60 focus:bg-white border-transparent' : 'bg-white/5 border-white/10 text-white focus:bg-white/10 placeholder-gray-500';
  const btnSubmitColor = isJovem ? 'bg-scout-dark text-white hover:bg-gray-800' : 'bg-scout-yellow text-scout-dark hover:bg-yellow-400';

  return (
    <section id="contato" className={`relative overflow-hidden transition-colors duration-700 ease-in-out ${bgColor} ${textColor} py-16 md:py-24 mt-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Usamos grid apenas no desktop. No mobile, flex em coluna com os itens centralizados. */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* LADO ESQUERDO: TEXTOS E FORMULÁRIO */}
          <div className="w-full max-w-xl mx-auto lg:mx-0 flex flex-col justify-center text-center lg:text-left">
            
            

            {/* Formulário (Card) */}
            <div className={`w-full rounded-3xl p-6 md:p-8 transition-all duration-500 ${isJovem ? 'bg-white/30 backdrop-blur-sm shadow-xl border border-white/40' : 'bg-black/20 backdrop-blur-sm shadow-2xl border border-white/5'}`}>
              
              {/* Abas Seletoras */}
              <div className="flex p-1 bg-black/10 rounded-2xl mb-6">
                <button 
                  onClick={() => setTipo('jovem')}
                  className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${isJovem ? 'bg-white text-scout-dark shadow-sm' : 'text-current opacity-70 hover:opacity-100'}`}
                >
                  <i className="fa-solid fa-child-reaching mr-2 hidden sm:inline"></i>
                  Ser Escoteiro
                </button>
                <button 
                  onClick={() => setTipo('adulto')}
                  className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${!isJovem ? 'bg-scout-yellow text-scout-dark shadow-sm' : 'text-current opacity-70 hover:opacity-100'}`}
                >
                  <i className="fa-solid fa-handshake-angle mr-2 hidden sm:inline"></i>
                  Ser Voluntário
                </button>
              </div>

              <form onSubmit={enviarParaWhatsApp} className="space-y-4 text-left">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${labelColor}`}>Nome Completo</label>
                  <input type="text" name="nome" required value={form.nome} onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-scout-green outline-none transition-all ${inputBg}`} placeholder="Digite seu nome..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${labelColor}`}>Idade</label>
                    <input type="number" name="idade" required value={form.idade} onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-scout-green outline-none transition-all ${inputBg}`} placeholder="Ex: 14" />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${labelColor}`}>WhatsApp</label>
                    <input type="tel" name="telefone" required value={form.telefone} onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-scout-green outline-none transition-all ${inputBg}`} placeholder="(00) 90000-0000" />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${labelColor}`}>E-mail</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-scout-green outline-none transition-all ${inputBg}`} placeholder="seu@email.com" />
                </div>
                
                <button type="submit" className={`w-full mt-2 inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg gap-2 active:scale-95 hover:-translate-y-0.5 ${btnSubmitColor}`}>
                  <i className="fa-brands fa-whatsapp text-xl"></i> Falar com o Grupo
                </button>
              </form>
            </div>
            
          </div>

          {/* LADO DIREITO: IMAGEM (Apenas Desktop) */}
          {/* A classe 'hidden lg:block' faz com que a imagem e seu espaço desapareçam no mobile */}
          <div className="hidden lg:block relative w-full h-125 xl:h-150">
            <div className={`w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border-8 transition-colors duration-700 ${isJovem ? 'border-white/40 hover:-translate-y-2' : 'border-scout-yellow/20 hover:-translate-y-2 scale-95'}`}>
              
              <Image 
                src="/zooparque.png" 
                alt="Jovens escoteiros em atividade" 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`object-cover transition-opacity duration-700 ease-in-out ${isJovem ? 'opacity-100' : 'opacity-0'}`}
              />
              <Image 
                src="/camara-municipal.png" 
                alt="Adultos voluntários do grupo" 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`object-cover transition-opacity duration-700 ease-in-out ${!isJovem ? 'opacity-100' : 'opacity-0'}`}
              />
              
              <div className={`absolute inset-0 transition-colors duration-700 mix-blend-overlay ${isJovem ? 'bg-scout-yellow/10' : 'bg-scout-dark/30'}`}></div>
            </div>
            
            <div className={`absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl -z-10 transition-colors duration-700 ${isJovem ? 'bg-white/60' : 'bg-scout-yellow/40'}`}></div>
            <div className={`absolute top-1/2 -right-10 w-40 h-40 rounded-full blur-3xl -z-10 transition-colors duration-700 ${isJovem ? 'bg-scout-dark/10' : 'bg-blue-500/20'}`}></div>
          </div>

        </div>
      </div>
      
      {/* Detalhe visual de fundo da seção */}
      <div className={`absolute top-0 w-full lg:w-2/3 h-full pointer-events-none transition-all duration-1000 ease-in-out ${isJovem ? 'right-0 bg-linear-to-l from-white/10 to-transparent' : 'left-0 bg-linear-to-r from-black/20 to-transparent'}`}></div>
    </section>
  );
}