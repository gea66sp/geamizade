"use client";

import { useMemo, useState } from "react";

type TutorialRole = "ADMIN" | "CHEFE" | "MEMBER" | "RESPONSAVEL";

type Tutorial = {
  title: string;
  summary: string;
  steps: string[];
  roles: TutorialRole[];
};

type TutorialCategory = {
  name: string;
  icon: string;
  tutorials: Tutorial[];
};

const CATEGORIES: TutorialCategory[] = [
  {
    name: "Começando",
    icon: "fa-compass",
    tutorials: [
      {
        title: "Conheça o painel",
        summary: "Use o menu lateral ou o menu superior para acessar os recursos disponíveis para o seu perfil.",
        steps: [
          "Acesse a página inicial pelo item Início.",
          "No celular, toque no botão de menu para abrir a navegação.",
          "Use o sino para consultar suas notificações sem sair da página atual.",
          "Acesse Meu Perfil para atualizar seus dados e documentos.",
        ],
        roles: ["ADMIN", "CHEFE", "MEMBER", "RESPONSAVEL"],
      },
      {
        title: "Atualizar seu perfil",
        summary: "Mantenha nome, telefone, foto e senha atualizados.",
        steps: [
          "Abra Meu Perfil no menu.",
          "Edite os campos desejados e salve as alterações.",
          "Para trocar a senha, informe a senha atual e crie uma senha que atenda à política exibida.",
          "Use a área de documentos para enviar, renomear ou remover arquivos pessoais.",
        ],
        roles: ["ADMIN", "CHEFE", "MEMBER", "RESPONSAVEL"],
      },
    ],
  },
  {
    name: "Calendário e presença",
    icon: "fa-calendar-days",
    tutorials: [
      {
        title: "Consultar eventos e confirmar presença",
        summary: "Veja os próximos eventos e registre sua resposta dentro do prazo.",
        steps: [
          "Abra Calendário e selecione um evento.",
          "Confira local, horário, descrição e prazo para resposta.",
          "Escolha Sim ou Não e confirme.",
          "O responsável pode responder pelos dependentes vinculados à conta; essa decisão prevalece sobre a resposta do jovem.",
        ],
        roles: ["CHEFE", "MEMBER", "RESPONSAVEL"],
      },
      {
        title: "Criar e acompanhar eventos",
        summary: "Chefes e administradores podem cadastrar atividades e acompanhar respostas.",
        steps: [
          "Abra Calendário e escolha criar evento.",
          "Informe título, datas, local, público e prazo de RSVP.",
          "Revise o público antes de salvar.",
          "Use a lista de presença para acompanhar as respostas quando sua função tiver essa permissão.",
        ],
        roles: ["ADMIN", "CHEFE"],
      },
    ],
  },
  {
    name: "Comunicação",
    icon: "fa-bell",
    tutorials: [
      {
        title: "Ler e organizar notificações",
        summary: "Acompanhe avisos do grupo e marque mensagens como lidas.",
        steps: [
          "Abra o sino ou Notificações no menu.",
          "Toque em uma notificação para acessar o recurso relacionado.",
          "Marque notificações como lidas depois de consultá-las.",
          "Responsáveis também recebem cópias de avisos relacionados aos dependentes.",
        ],
        roles: ["ADMIN", "CHEFE", "MEMBER", "RESPONSAVEL"],
      },
      {
        title: "Enviar notificações",
        summary: "Administradores e chefes podem comunicar públicos dentro do seu escopo.",
        steps: [
          "Abra Notificações e selecione Nova notificação.",
          "Escolha o público, revise título e mensagem.",
          "Envios de monitores precisam de aprovação do chefe responsável.",
          "Nunca inclua senhas ou informações sensíveis no texto da notificação.",
        ],
        roles: ["ADMIN", "CHEFE"],
      },
    ],
  },
  {
    name: "Gestão operacional",
    icon: "fa-people-group",
    tutorials: [
      {
        title: "Gerenciar tropa e membros",
        summary: "Chefes acompanham a composição da própria tropa e seus responsáveis.",
        steps: [
          "Abra Minha Tropa para consultar membros e patrulhas.",
          "Use os filtros e ações disponíveis para localizar um cadastro.",
          "Ao cadastrar um jovem, confira os dados antes de salvar.",
          "A conta criada com senha provisória deverá fazer a troca no primeiro acesso.",
        ],
        roles: ["ADMIN", "CHEFE"],
      },
      {
        title: "Lançar financeiro e patrimônio",
        summary: "Registre movimentações e controle empréstimos conforme sua permissão.",
        steps: [
          "No Financeiro, informe o escopo correto da movimentação antes de salvar.",
          "No Patrimônio, registre empréstimos, devoluções e responsáveis.",
          "Confira a tropa ou patrulha selecionada: o sistema valida o escopo no servidor.",
          "Administradores fazem a gestão geral; chefes operam apenas os recursos da própria seção.",
        ],
        roles: ["ADMIN", "CHEFE"],
      },
    ],
  },
  {
    name: "Conteúdo e site",
    icon: "fa-globe",
    tutorials: [
      {
        title: "Cadastrar empresas parceiras",
        summary: "Mantenha no site público as empresas que apoiam o Grupo Escoteiro.",
        steps: [
          "Abra Empresas parceiras no menu administrativo.",
          "Cadastre ou selecione uma categoria, como Alimentação ou Serviços.",
          "Preencha nome, descrição breve, site e Instagram.",
          "Envie o logotipo em JPG, PNG ou WebP; sem imagem, as iniciais da empresa serão usadas.",
          "Use Editar para trocar a categoria. Uma categoria só pode ser excluída quando não tiver empresas associadas.",
        ],
        roles: ["ADMIN"],
      },
      {
        title: "Gerenciar notícias e páginas",
        summary: "Publique conteúdos e mantenha as informações institucionais atualizadas.",
        steps: [
          "Use Notícias / Blog para criar, editar e revisar publicações.",
          "Use Personalizar Site para atualizar a home, FAQ e informações institucionais.",
          "Use Transparência para organizar pastas e documentos públicos.",
          "Revise links e imagens antes de publicar.",
        ],
        roles: ["ADMIN", "CHEFE"],
      },
    ],
  },
  {
    name: "Responsáveis",
    icon: "fa-children",
    tutorials: [
      {
        title: "Acompanhar dependentes",
        summary: "Consulte dados, finanças e documentos dos jovens vinculados à sua conta.",
        steps: [
          "Abra Meus Dependentes para ver os vínculos disponíveis.",
          "Selecione um dependente para consultar finanças e documentos.",
          "Ao enviar um documento, confirme que ele pertence ao dependente correto.",
          "No Calendário, responda pelos dependentes dentro do prazo.",
        ],
        roles: ["RESPONSAVEL"],
      },
    ],
  },
];

export default function TutorialCenter({ role }: { role: TutorialRole }) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [search, setSearch] = useState("");
  const [openTitle, setOpenTitle] = useState<string | null>(null);

  const visibleCategories = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        tutorials: category.tutorials.filter((tutorial) => tutorial.roles.includes(role)),
      })).filter((category) => category.tutorials.length > 0),
    [role],
  );

  const filteredTutorials = visibleCategories
    .find((category) => category.name === selectedCategory)?.tutorials
    .filter((tutorial) => `${tutorial.title} ${tutorial.summary}`.toLowerCase().includes(search.toLowerCase().trim())) ?? [];

  return (
    <div className="space-y-6 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-scout-green">Central de ajuda</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-gray-900 sm:text-3xl">Tutoriais</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          Aprenda a usar os recursos disponíveis para o seu perfil no portal.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <label htmlFor="tutorial-search" className="sr-only">Buscar tutorial</label>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input id="tutorial-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-scout-green" />
          </div>
          <div className="relative mt-3 lg:hidden">
            <i className="fa-solid fa-filter pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-scout-green" aria-hidden="true" />
            <label htmlFor="tutorial-category-mobile" className="sr-only">Categoria do tutorial</label>
            <select
              id="tutorial-category-mobile"
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setSearch("");
              }}
              className="w-full appearance-none rounded-xl border border-scout-green/30 bg-white py-2.5 pl-9 pr-9 text-sm font-bold text-gray-700 outline-none transition focus:border-scout-green focus:ring-4 focus:ring-scout-green/10"
            >
              {visibleCategories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          </div>
          <nav className="mt-3 hidden space-y-1 lg:block" aria-label="Categorias de tutoriais">
            {visibleCategories.map((category) => (
              <button key={category.name} type="button" onClick={() => { setSelectedCategory(category.name); setSearch(""); }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${selectedCategory === category.name ? "bg-scout-green text-white" : "text-gray-600 hover:bg-green-50 hover:text-scout-green"}`}>
                <i className={`fa-solid ${category.icon} w-4 text-center`} aria-hidden="true" />
                <span>{category.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 space-y-3">
          {filteredTutorials.length > 0 ? filteredTutorials.map((tutorial) => {
            const isOpen = openTitle === tutorial.title;
            return (
              <article key={tutorial.title} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <button type="button" onClick={() => setOpenTitle(isOpen ? null : tutorial.title)} aria-expanded={isOpen} className="flex w-full items-start justify-between gap-4 p-4 text-left sm:p-5">
                  <span className="min-w-0"><strong className="block font-heading text-base text-gray-800 sm:text-lg">{tutorial.title}</strong><span className="mt-1 block text-sm leading-relaxed text-gray-500">{tutorial.summary}</span></span>
                  <i className={`fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"} mt-1 shrink-0 text-scout-green`} aria-hidden="true" />
                </button>
                {isOpen && <ol className="space-y-3 border-t border-gray-100 bg-gray-50 px-4 py-4 text-sm leading-relaxed text-gray-600 sm:px-5"><span className="text-xs font-bold uppercase tracking-wider text-scout-green">Como usar</span>{tutorial.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-scout-green text-xs font-bold text-white">{index + 1}</span><span>{step}</span></li>)}</ol>}
              </article>
            );
          }) : <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center"><i className="fa-solid fa-compass text-3xl text-gray-300" /><p className="mt-3 text-sm text-gray-500">Nenhum tutorial encontrado.</p></div>}
        </section>
      </div>
    </div>
  );
}
