import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import prisma from "@/src/lib/prisma";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

function extractTextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    select: {
      title: true,
      content: true,
      imageUrl: true,
    },
  });

  if (!post) {
    return {
      title: "Notícia não encontrada | GE Amizade",
    };
  }

  const description = extractTextFromHtml(post.content).slice(0, 180);

  return {
    title: `${post.title} | Blog GE Amizade`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: post.imageUrl ? [post.imageUrl] : undefined,
      type: "article",
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: {
      author: {
        select: {
          name: true,
          role: true,
        },
      },
      troop: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <main className="bg-white w-full animate-fade-in">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <header className="mb-8">
          <Link
            href="/blog"
            className="text-sm font-bold text-gray-500 hover:text-scout-green transition-colors inline-flex items-center gap-2 mb-5"
          >
            <i className="fa-solid fa-arrow-left"></i> Voltar para todas as notícias
          </Link>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[11px] font-bold text-scout-light uppercase tracking-widest bg-scout-green/10 px-2.5 py-1 rounded-full">
              {post.troop?.name || "Notícia Geral"}
            </span>
            <span className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-semibold">
              {formatDate(post.updatedAt)}
            </span>
          </div>

          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Por {post.author.name || "Diretoria"} • {post.author.role}
          </p>
        </header>

        {post.imageUrl && (
          <div className="relative w-full h-64 md:h-96 rounded-3xl overflow-hidden border border-gray-200 shadow-sm mb-8">
            <Image src={post.imageUrl} alt={post.title} fill className="object-cover" sizes="100vw" />
          </div>
        )}

        <div
          className="prose prose-sm md:prose-lg max-w-none prose-headings:font-heading prose-a:text-scout-green text-gray-800"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}

