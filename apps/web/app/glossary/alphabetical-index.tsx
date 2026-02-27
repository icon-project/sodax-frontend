import Link from 'next/link';
import { slugify } from '@/lib/notion';
import type { NotionPage } from '@/lib/notion';

interface AlphabeticalIndexProps {
  conceptPages: NotionPage[];
  systemPages: NotionPage[];
}

type GlossaryEntry = {
  page: NotionPage;
  type: 'concept' | 'system';
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AlphabeticalIndex({ conceptPages, systemPages }: AlphabeticalIndexProps) {
  // Merge all entries into a single sorted list
  const allEntries: GlossaryEntry[] = [
    ...conceptPages.map(page => ({ page, type: 'concept' as const })),
    ...systemPages.map(page => ({ page, type: 'system' as const })),
  ].sort((a, b) => {
    const aTitle = a.page.properties.Title.title[0]?.plain_text || '';
    const bTitle = b.page.properties.Title.title[0]?.plain_text || '';
    return aTitle.localeCompare(bTitle);
  });

  // Group by first letter
  const grouped = allEntries.reduce<Record<string, GlossaryEntry[]>>((acc, entry) => {
    const title = entry.page.properties.Title.title[0]?.plain_text || '';
    const letter = title[0]?.toUpperCase() || '#';
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(entry);
    return acc;
  }, {});

  const activeLetters = Object.keys(grouped).sort();

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
          {ALPHABET.map(letter => {
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
}
