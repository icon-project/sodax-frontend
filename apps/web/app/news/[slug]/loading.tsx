/**
 * Loading UI for individual news article page
 */
export default function ArticleLoading() {
  return (
    <div className="min-h-screen w-full bg-[var(--almost-white)]">
      <div className="max-w-7xl mx-auto">
        <article className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Breadcrumb skeleton */}
            <nav className="mb-6">
              <div className="h-4 w-32 bg-[var(--clay-light)] rounded animate-pulse" />
            </nav>

            {/* Header skeleton */}
            <header className="mb-8 space-y-4">
              <div className="h-12 bg-[var(--clay-light)] rounded animate-pulse" />
              <div className="h-10 bg-[var(--clay-light)] rounded animate-pulse w-5/6" />
              <div className="space-y-2">
                <div className="h-6 bg-[var(--clay-light)] rounded animate-pulse" />
                <div className="h-6 bg-[var(--clay-light)] rounded animate-pulse w-4/5" />
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-[var(--clay-light)]">
                <div className="h-4 w-32 bg-[var(--clay-light)] rounded animate-pulse" />
                <div className="h-4 w-24 bg-[var(--clay-light)] rounded animate-pulse" />
              </div>
            </header>

            {/* Featured image skeleton */}
            <div className="relative aspect-[16/9] bg-[var(--cream)] rounded-xl mb-8 animate-pulse" />

            {/* Content skeleton */}
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-[var(--clay-light)] rounded animate-pulse"
                  style={{ width: `${85 + Math.random() * 15}%` }}
                />
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
