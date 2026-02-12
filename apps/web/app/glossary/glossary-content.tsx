'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MagnifyingGlass, X, CaretRight, CaretLeft } from '@phosphor-icons/react';
import { slugify } from '@/lib/notion';
import type { NotionPage } from '@/lib/notion';

interface GlossaryContentProps {
  conceptPages: NotionPage[];
  systemPages: NotionPage[];
}

function filterPages(pages: NotionPage[], searchQuery: string, selectedTags: string[]) {
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

  const filteredConceptPages = filterPages(conceptPages, searchQuery, selectedTags);
  const filteredSystemPages = filterPages(systemPages, searchQuery, selectedTags);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery !== '' || selectedTags.length > 0;
  const totalResults = filteredConceptPages.length + filteredSystemPages.length;

  const tagScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = useCallback(() => {
    const el = tagScrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setCanScrollLeft(el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [checkScroll]);

  const scrollTags = useCallback(() => {
    const el = tagScrollRef.current;
    if (!el) return;
    // Scroll by roughly 7 tags worth (~560px)
    el.scrollBy({ left: 560, behavior: 'smooth' });
  }, []);

  const scrollTagsBack = useCallback(() => {
    const el = tagScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -560, behavior: 'smooth' });
  }, []);

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

          <div className="relative">
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-[1]" />
            )}
            {canScrollLeft && (
              <button
                type="button"
                onClick={scrollTagsBack}
                aria-label="Scroll tags left"
                className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-cream-white text-clay hover:text-espresso hover:border-espresso/20 transition-colors z-10"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
            )}
            <div
              ref={tagScrollRef}
              onScroll={checkScroll}
              className={`flex gap-2 overflow-x-auto scrollbar-hide ${canScrollLeft ? 'pl-12' : ''} ${canScrollRight ? 'pr-12' : ''}`}
            >
              {allTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isSelected}
                    aria-label={`Filter by ${tag}`}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 ${
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
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={scrollTags}
                aria-label="Scroll tags right"
                className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-cream-white text-clay hover:text-espresso hover:border-espresso/20 transition-colors z-10"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            )}
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

      {/* Alphabetical Index */}
      {(() => {
        // Merge all entries into a single sorted list
        const allEntries = [
          ...filteredConceptPages.map(page => ({ page, type: 'concept' as const })),
          ...filteredSystemPages.map(page => ({ page, type: 'system' as const })),
        ].sort((a, b) => {
          const aTitle = a.page.properties.Title.title[0]?.plain_text || '';
          const bTitle = b.page.properties.Title.title[0]?.plain_text || '';
          return aTitle.localeCompare(bTitle);
        });

        // Group by first letter
        const grouped = allEntries.reduce<Record<string, typeof allEntries>>((acc, entry) => {
          const title = entry.page.properties.Title.title[0]?.plain_text || '';
          const letter = title[0]?.toUpperCase() || '#';
          if (!acc[letter]) acc[letter] = [];
          acc[letter].push(entry);
          return acc;
        }, {});

        const activeLetters = Object.keys(grouped).sort();
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        if (allEntries.length === 0) {
          return <div className="text-center py-12 text-[14px] text-clay w-full">No entries match your filters</div>;
        }

        return (
          <div className="w-full max-w-236">
            {/* Sticky A–Z jump nav */}
            <nav
              aria-label="Alphabetical index"
              className="sticky top-16 z-10 bg-cream-white/90 backdrop-blur-sm py-3 mb-6 border-b border-cream-white"
            >
              <div className="flex flex-wrap gap-1 justify-center">
                {alphabet.map(letter => {
                  const isActive = activeLetters.includes(letter);
                  return (
                    <a
                      key={letter}
                      href={isActive ? `#letter-${letter}` : undefined}
                      aria-disabled={!isActive}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-colors ${
                        isActive
                          ? 'text-espresso hover:bg-espresso hover:text-white cursor-pointer'
                          : 'text-clay/30 cursor-default'
                      }`}
                    >
                      {letter}
                    </a>
                  );
                })}
              </div>
            </nav>

            {/* Letter sections */}
            <div className="flex flex-col gap-8">
              {activeLetters.map(letter => (
                <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
                  <h2 className="text-2xl font-black text-espresso mb-4 pb-2 border-b border-cream-white">{letter}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {grouped[letter]?.map(({ page, type }) => {
                      const title = page.properties.Title.title[0]?.plain_text || '';
                      const summary = page.properties['One-sentency summary']?.rich_text?.[0]?.plain_text || '';
                      const tags = page.properties.Tags.multi_select.slice(0, 3).map(t => t.name);
                      const slug = slugify(title);
                      const href = type === 'concept' ? `/concepts/${slug}` : `/system/${slug}`;
                      const typeLabel = type === 'concept' ? 'Concept' : 'System';

                      return (
                        <Link
                          key={page.id}
                          href={href}
                          className="bg-white border border-cream-white p-4 rounded-2xl hover:border-espresso/20 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-espresso">{title}</h3>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-clay bg-cream-white px-2 py-0.5 rounded-full shrink-0">
                              {typeLabel}
                            </span>
                          </div>
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
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        );
      })()}
    </>
  );
}
