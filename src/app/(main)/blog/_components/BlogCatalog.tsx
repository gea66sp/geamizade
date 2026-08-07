"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type BlogPostCard = {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string | null;
  updatedAt: Date | string;
  author: { name: string | null };
  troop: { id: string; name: string; branch: string } | null;
};

type TroopFilter = {
  id: string;
  name: string;
  branch: string;
};

function extractTextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default function BlogCatalog({
  posts,
  troops,
}: {
  posts: BlogPostCard[];
  troops: TroopFilter[];
}) {
  const [search, setSearch] = useState("");
  const [troopFilter, setTroopFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const POSTS_PER_PAGE = 9;

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const post of posts) {
      years.add(new Date(post.updatedAt).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const text = `${post.title} ${post.slug} ${extractTextFromHtml(post.content)}`.toLowerCase();
      const date = new Date(post.updatedAt);
      const postYear = String(date.getFullYear());
      const postMonth = String(date.getMonth() + 1).padStart(2, "0");
      const matchSearch = query.length === 0 || text.includes(query);
      const matchTroop =
        troopFilter === "ALL" ||
        (troopFilter === "GENERAL" ? !post.troop : post.troop?.id === troopFilter);
      const matchYear = yearFilter === "ALL" || postYear === yearFilter;
      const matchMonth = monthFilter === "ALL" || postMonth === monthFilter;
      return matchSearch && matchTroop && matchYear && matchMonth;
    });
  }, [posts, search, troopFilter, yearFilter, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por título ou conteúdo..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={troopFilter}
            onChange={(e) => {
              setTroopFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
          >
            <option value="ALL">Todos os Ramos</option>
            <option value="GENERAL">Notícias Gerais</option>
            {troops.map((troop) => (
              <option key={troop.id} value={troop.id}>
                {troop.name}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
          >
            <option value="ALL">Todos os anos</option>
            {availableYears.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="cursor-pointer px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none"
          >
            <option value="ALL">Todos os meses</option>
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-300 text-2xl">
            <i className="fa-regular fa-newspaper"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Nenhuma notícia encontrada</h2>
          <p className="text-gray-500">Ajuste os filtros para visualizar outras publicações.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
            <p className="font-medium">
              Exibindo <strong>{startIndex + 1}</strong> a{" "}
              <strong>{Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length)}</strong> de{" "}
              <strong>{filteredPosts.length}</strong> notícias
            </p>
            <p className="font-semibold">
              Página {safeCurrentPage} de {totalPages}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPosts.map((post) => (
              <article key={post.id} className="card-news">
                <div className="relative w-full h-52 bg-gray-100">
                  <Image
                    src={post.imageUrl || "/sobre-nos.png"}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="p-6 flex flex-col grow">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[11px] font-bold text-scout-light uppercase tracking-widest">
                      {post.troop?.name || "Notícia Geral"}
                    </span>
                    <span className="text-[11px] text-gray-400">•</span>
                    <span className="text-[11px] text-gray-500 font-semibold">{formatDate(post.updatedAt)}</span>
                  </div>

                  <h3 className="font-heading font-bold text-xl text-gray-800 mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 grow line-clamp-4">{extractTextFromHtml(post.content)}</p>

                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="text-xs text-gray-500 font-medium truncate">
                      Por {post.author.name || "Diretoria"}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group text-scout-green font-semibold hover:text-scout-dark inline-flex items-center gap-2 transition-colors shrink-0"
                    >
                      Ler mais
                      <i className="fa-solid fa-arrow-right text-xs transform group-hover:translate-x-1 transition-transform"></i>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-chevron-left mr-2"></i>Anterior
            </button>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                const isActive = pageNumber === safeCurrentPage;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`cursor-pointer w-9 h-9 rounded-lg border text-sm font-bold transition-colors ${
                      isActive
                        ? "bg-scout-green text-white border-scout-green"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima<i className="fa-solid fa-chevron-right ml-2"></i>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
