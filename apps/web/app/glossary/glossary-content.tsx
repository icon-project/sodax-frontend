'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MagnifyingGlassIcon, XIcon, CaretRightIcon, CaretLeftIcon } from '@phosphor-icons/react';
import type { NotionPage } from '@/lib/notion';
import { AlphabeticalIndex } from './alphabetical-index';

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
            <MagnifyingGlassIcon size={20} weight="bold" />
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
                <XIcon size={14} weight="bold" />
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
                <CaretLeftIcon size={14} weight="bold" />
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
                <CaretRightIcon size={14} weight="bold" />
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

      <AlphabeticalIndex conceptPages={filteredConceptPages} systemPages={filteredSystemPages} />
    </>
  );
}
