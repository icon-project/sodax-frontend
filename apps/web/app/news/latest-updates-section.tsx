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
      <div className="grid sm:grid-cols-2 gap-4">
        {displayedArticles.map(article => (
          <Link
            key={article._id}
            href={`/news/${article.slug}`}
            className="group bg-white rounded-[24px] overflow-hidden hover:shadow-[0px_8px_40px_0px_#ede6e6] transition-all duration-300 shadow-[0px_4px_32px_0px_#ede6e6] flex flex-col"
          >
            {article.image && (
              <div className="relative aspect-[16/9] bg-[#ede6e6] overflow-hidden m-2 rounded-[16px]">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-4 flex flex-col gap-2">
              <h3 className="text-[18px] font-bold text-[#483534] leading-[1.2] group-hover:text-[var(--cherry-soda)] transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-[14px] text-[#6b5c5b] leading-[1.4] line-clamp-2">{article.excerpt}</p>
              <div className="inline-flex items-center h-5 px-2 bg-[#ede6e6] rounded-[256px] w-fit">
                <time className="text-[11px] text-[#8e7e7d] leading-[1.3]">
                  {formatDate(article.publishedAt || article.createdAt)}
                </time>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center gap-2 h-10 px-6 bg-white text-[#483534] text-[12px] font-medium rounded-[240px] hover:bg-[#ede6e6] transition-all duration-200 shadow-[0px_4px_32px_0px_#ede6e6]"
          >
            Load More Articles
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
