"use client";

import { useMemo, useState } from "react";

type Partner = {
  name: string;
  initials: string;
  description: string;
  category: string;
  categoryLabel: string;
  website: string;
  instagram: string;
  logoClass: string;
  icon: string;
};

const partners: Partner[] = [
  {
    name: "Trilha Viva",
    initials: "TV",
    description:
      "Equipamentos e experiências para quem encontra na natureza o seu melhor caminho.",
    category: "aventura",
    categoryLabel: "Aventura & Natureza",
    website: "https://www.trilhaviva.com.br",
    instagram: "https://www.instagram.com/trilhaviva",
    logoClass: "bg-emerald-700 text-white",
    icon: "fa-mountain-sun",
  },
  {
    name: "Ponto de Encontro",
    initials: "PE",
    description:
      "Alimentação artesanal e acolhimento para reunir pessoas em torno de boas histórias.",
    category: "alimentacao",
    categoryLabel: "Alimentação",
    website: "https://www.pontodeencontro.com.br",
    instagram: "https://www.instagram.com/pontodeencontro",
    logoClass: "bg-amber-400 text-scout-dark",
    icon: "fa-mug-hot",
  },
  {
    name: "Norte Criativo",
    initials: "NC",
    description:
      "Comunicação com propósito para projetos que transformam realidades e inspiram comunidades.",
    category: "servicos",
    categoryLabel: "Serviços",
    website: "https://www.nortecriativo.com.br",
    instagram: "https://www.instagram.com/nortecriativo",
    logoClass: "bg-sky-700 text-white",
    icon: "fa-compass-drafting",
  },
  {
    name: "Raiz & Cia",
    initials: "RC",
    description:
      "Produtos conscientes para uma rotina mais leve, saudável e conectada com o planeta.",
    category: "bem-estar",
    categoryLabel: "Bem-estar",
    website: "https://www.raizecia.com.br",
    instagram: "https://www.instagram.com/raizecia",
    logoClass: "bg-rose-700 text-white",
    icon: "fa-leaf",
  },
  {
    name: "Movimento Local",
    initials: "ML",
    description:
      "Soluções que aproximam negócios, famílias e iniciativas que fazem a diferença na cidade.",
    category: "servicos",
    categoryLabel: "Serviços",
    website: "https://www.movimentolocal.com.br",
    instagram: "https://www.instagram.com/movimentolocal",
    logoClass: "bg-violet-700 text-white",
    icon: "fa-people-group",
  },
  {
    name: "Caminho Seguro",
    initials: "CS",
    description:
      "Cuidado e proteção para que cada jornada seja vivida com tranquilidade e confiança.",
    category: "aventura",
    categoryLabel: "Aventura & Natureza",
    website: "https://www.caminhoseguro.com.br",
    instagram: "https://www.instagram.com/caminhoseguro",
    logoClass: "bg-slate-700 text-white",
    icon: "fa-shield-heart",
  },
];

const categories = [
  { value: "todas", label: "Todas as categorias", icon: "fa-border-all" },
  { value: "aventura", label: "Aventura & Natureza", icon: "fa-mountain-sun" },
  { value: "alimentacao", label: "Alimentação", icon: "fa-utensils" },
  { value: "servicos", label: "Serviços", icon: "fa-briefcase" },
  { value: "bem-estar", label: "Bem-estar", icon: "fa-heart" },
];

const whatsappUrl =
  "https://wa.me/551236227084?text=" +
  encodeURIComponent(
    "Olá! Quero ser uma empresa parceira do Grupo Escoteiro Amizade 66/SP. Gostaria de saber mais sobre como participar.",
  );

export default function ParceirasCatalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");

  const filteredPartners = useMemo(() => {
    const query = search.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesCategory =
        category === "todas" || partner.category === category;
      const matchesSearch =
        !query ||
        `${partner.name} ${partner.description} ${partner.categoryLabel}`
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-scout-green">
            Conheça quem apoia
          </p>
          <h2 className="font-heading text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Parceiros em destaque
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-gray-500 md:text-right">
          Uma rede feita de colaboração, confiança e vontade de deixar um
          impacto positivo.
        </p>
      </div>

      <div className="mb-10 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="relative">
          <label htmlFor="busca-parceiras" className="sr-only">
            Buscar empresa parceira
          </label>
          <i
            className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="busca-parceiras"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por empresa, categoria ou atividade..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-scout-green focus:bg-white focus:ring-4 focus:ring-scout-green/10"
          />
        </div>

        <div className="mt-4 md:hidden">
          <label
            htmlFor="categoria-parceiras-mobile"
            className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
          >
            Categoria selecionada
          </label>
          <div className="relative">
            <i
              className="fa-solid fa-filter pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-scout-green"
              aria-hidden="true"
            />
            <select
              id="categoria-parceiras-mobile"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-scout-green/30 bg-white py-3.5 pl-11 pr-10 text-sm font-bold text-gray-700 outline-none transition focus:border-scout-green focus:ring-4 focus:ring-scout-green/10"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <i
              className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-4 hidden gap-2 md:flex">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all ${
                category === item.value
                  ? "border-scout-green bg-scout-green text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-600 hover:border-scout-green/40 hover:text-scout-green"
              }`}
              aria-pressed={category === item.value}
            >
              <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 text-sm text-gray-500">
        <p>
          <strong className="text-gray-800">{filteredPartners.length}</strong>{" "}
          {filteredPartners.length === 1 ? "empresa encontrada" : "empresas encontradas"}
        </p>
        {(search || category !== "todas") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("todas");
            }}
            className="font-bold text-scout-green hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPartners.map((partner) => (
            <article
              key={partner.name}
              className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-scout-green/20 hover:shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-black tracking-tight shadow-inner ${partner.logoClass}`}
                  aria-label={`Logomarca ${partner.name}`}
                >
                  {partner.initials}
                </div>
                <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {partner.categoryLabel}
                </span>
              </div>
              <div className="flex grow flex-col p-6">
                <div className="mb-3 flex items-center gap-2">
                  <i
                    className={`fa-solid ${partner.icon} text-scout-yellow`}
                    aria-hidden="true"
                  />
                  <h3 className="font-heading text-xl font-bold text-gray-900">
                    {partner.name}
                  </h3>
                </div>
                <p className="grow text-sm leading-relaxed text-gray-500">
                  {partner.description}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-scout-green px-3 text-xs font-bold text-white transition-colors hover:bg-green-800"
                  >
                    <i className="fa-solid fa-globe" aria-hidden="true" />
                    Site
                  </a>
                  <a
                    href={partner.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram da ${partner.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                  >
                    <i className="fa-brands fa-instagram text-lg" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <i className="fa-solid fa-compass text-4xl text-gray-300" aria-hidden="true" />
          <h3 className="mt-4 font-heading text-xl font-bold text-gray-800">
            Nenhuma empresa encontrada
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Tente buscar por outro termo ou limpar os filtros.
          </p>
        </div>
      )}

      <div className="relative mt-16 overflow-hidden rounded-3xl bg-scout-yellow px-6 py-10 text-center shadow-lg sm:px-10 md:py-14">
        <div className="absolute -right-10 -top-16 text-9xl text-white/20" aria-hidden="true">
          <i className="fa-solid fa-handshake" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-scout-dark/70">
            Vamos construir juntos
          </p>
          <h2 className="font-heading text-3xl font-black text-scout-dark sm:text-4xl">
            Quero ser uma empresa parceira
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-scout-dark/80 sm:text-base">
            Sua empresa também pode apoiar o desenvolvimento de crianças e
            jovens. Fale com a nossa equipe e descubra as possibilidades.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-scout-dark px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-gray-900 hover:shadow-xl active:scale-95"
          >
            <i className="fa-brands fa-whatsapp text-xl" aria-hidden="true" />
            Falar pelo WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
