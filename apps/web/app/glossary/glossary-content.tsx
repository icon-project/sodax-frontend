'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { slugify } from '@/lib/notion';
import type { NotionPage } from '@/lib/notion';

interface GlossaryContentProps {
  conceptPages: NotionPage[];
  systemPages: NotionPage[];
}

export function GlossaryContent({ conceptPages, systemPages }: GlossaryContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extract all unique tags from both sections
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    [...conceptPages, ...systemPages].forEach(page => {
      page.properties.Tags.multi_select.forEach(tag => tagSet.add(tag.name));
    });
    return Array.from(tagSet).sort();
  }, [conceptPages, systemPages]);

  // Filter function
  const filterPages = (pages: NotionPage[]) => {
    return pages.filter(page => {
      const title = page.properties.Title.title[0]?.plain_text.toLowerCase() || '';
      const summary = page.properties['One-sentency summary']?.rich_text?.[0]?.plain_text?.toLowerCase() || '';
      const pageTags = page.properties.Tags.multi_select.map(t => t.name);

      // Text search filter
      const matchesSearch =
        searchQuery === '' || title.includes(searchQuery.toLowerCase()) || summary.includes(searchQuery.toLowerCase());

      // Tag filter (match ANY selected tag)
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => pageTags.includes(tag));

      return matchesSearch && matchesTags;
    });
  };

  const filteredConceptPages = filterPages(conceptPages);
  const filteredSystemPages = filterPages(systemPages);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery !== '' || selectedTags.length > 0;
  const totalResults = filteredConceptPages.length + filteredSystemPages.length;

  return (
    <>
      {/* Filter Section */}
      <div className="bg-white rounded-3xl p-6 w-full max-w-236 mb-8">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-clay">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Search concepts and components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search concepts and components"
            className="w-full pl-12 pr-4 py-3 text-[16px] text-espresso placeholder:text-clay bg-cream-white rounded-2xl border-2 border-transparent focus:border-espresso focus:outline-none transition-colors"
          />
        </div>

        {/* Tags Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-espresso">Filter by tags</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] text-cherry-soda hover:underline flex items-center gap-1"
              >
                <X size={14} weight="bold" />
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${tag}`}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-espresso text-white'
                      : 'bg-cream-white text-clay hover:bg-espresso/10 hover:text-espresso'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-cream-white">
            <span className="text-[14px] text-clay-dark">
              Showing <span className="font-semibold text-espresso">{totalResults}</span> result
              {totalResults !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Grid of Sections */}
      <div className="flex flex-wrap gap-4 justify-center w-full">
        {/* Concepts Section */}
        <div className="bg-white flex flex-col gap-4 items-start pb-6 pt-12 px-6 rounded-3xl w-full md:w-114">
          <div className="flex gap-2 items-center justify-center w-full mb-2">
            <h2 className="flex-1 text-[18px] font-bold leading-[1.2] text-espresso">
              Concepts {hasActiveFilters && `(${filteredConceptPages.length})`}
            </h2>
          </div>
          <p className="text-[14px] leading-[1.4] text-clay-dark w-full mb-4">
            Mental models and ideas that explain how SODAX works
          </p>

          <div className="flex flex-col gap-4 w-full">
            {filteredConceptPages.length === 0 ? (
              <div className="text-center py-8 text-[14px] text-clay">No concepts match your filters</div>
            ) : (
              filteredConceptPages.map(page => {
                const title = page.properties.Title.title[0]?.plain_text || '';
                const summary = page.properties['One-sentency summary']?.rich_text?.[0]?.plain_text || '';
                const tags = page.properties.Tags.multi_select.slice(0, 3).map(t => t.name);
                const slug = slugify(title);

                return (
                  <Link
                    key={page.id}
                    href={`/concepts/${slug}`}
                    className="bg-white border border-cream-white p-4 rounded-2xl hover:border-espresso/20 transition-colors"
                  >
                    <h3 className="font-semibold text-espresso mb-2">{title}</h3>
                    <p className="text-[14px] leading-[1.4] text-clay-dark line-clamp-2 mb-3">{summary}</p>

                    {tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-linear-to-r from-cream-white to-cream-white mix-blend-multiply h-5 px-2 rounded-full flex items-center justify-center"
                          >
                            <span className="text-[11px] leading-[1.3] text-clay">{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* System Components Section */}
        <div className="bg-white flex flex-col gap-4 items-start pb-6 pt-12 px-6 rounded-3xl w-full md:w-114">
          <div className="flex gap-2 items-center justify-center w-full mb-2">
            <h2 className="flex-1 text-[18px] font-bold leading-[1.2] text-espresso">
              System Components {hasActiveFilters && `(${filteredSystemPages.length})`}
            </h2>
          </div>
          <p className="text-[14px] leading-[1.4] text-clay-dark w-full mb-4">
            Technical components and their responsibilities
          </p>

          <div className="flex flex-col gap-4 w-full">
            {filteredSystemPages.length === 0 ? (
              <div className="text-center py-8 text-[14px] text-clay">No components match your filters</div>
            ) : (
              filteredSystemPages.map(page => {
                const title = page.properties.Title.title[0]?.plain_text || '';
                const summary = page.properties['One-sentency summary']?.rich_text?.[0]?.plain_text || '';
                const tags = page.properties.Tags.multi_select.slice(0, 3).map(t => t.name);
                const slug = slugify(title);

                return (
                  <Link
                    key={page.id}
                    href={`/system/${slug}`}
                    className="bg-white border border-cream-white p-4 rounded-2xl hover:border-espresso/20 transition-colors"
                  >
                    <h3 className="font-semibold text-espresso mb-2">{title}</h3>
                    <p className="text-[14px] leading-[1.4] text-clay-dark line-clamp-2 mb-3">{summary}</p>

                    {tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-linear-to-r from-cream-white to-cream-white mix-blend-multiply h-5 px-2 rounded-full flex items-center justify-center"
                          >
                            <span className="text-[11px] leading-[1.3] text-clay">{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
