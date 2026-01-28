'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown } from '@phosphor-icons/react';
import { formatDate } from './utils';

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  publishedAt?: Date;
  createdAt: Date;
  categories: string[];
  tags: string[];
}

interface LatestUpdatesSectionProps {
  articles: NewsArticle[];
}

export function LatestUpdatesSection({ articles }: LatestUpdatesSectionProps) {
  const [visibleCount, setVisibleCount] = useState(8);
  const displayedArticles = articles.slice(0, visibleCount);
  const hasMore = articles.length > visibleCount;

  const loadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  if (articles.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xl font-black text-[var(--espresso)] mb-4 pb-2 border-b-2 border-[var(--cherry-soda)]">
        Latest Updates
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {displayedArticles.map(article => (
          <Link
            key={article._id}
            href={`/news/${article.slug}`}
            className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border border-[var(--clay-light)] hover:border-[var(--cherry-soda)]"
          >
            {article.image && (
              <div className="relative aspect-[16/9] bg-[var(--cream)] overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-base font-bold text-[var(--espresso)] leading-tight mb-2 group-hover:text-[var(--cherry-soda)] transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-[var(--clay)] mb-2 line-clamp-2">{article.excerpt}</p>
              <time className="text-xs text-[var(--clay-light)]">
                {formatDate(article.publishedAt || article.createdAt)}
              </time>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--cherry-soda)] font-semibold border-2 border-[var(--cherry-soda)] rounded-lg hover:bg-[var(--cherry-soda)] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Load More Articles
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
