/**
 * Loading UI for individual news article page
 */
export default function ArticleLoading() {
  return (
    <div className="min-h-screen w-full bg-almost-white">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 bg-cherry-soda h-30" />

      <div className="max-w-7xl mx-auto">
        <article className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Breadcrumb skeleton */}
            <nav className="mb-6">
              <div className="h-4 w-32 bg-clay-light rounded animate-pulse" />
            </nav>

            {/* Header skeleton */}
            <header className="mb-8 space-y-4">
              <div className="h-12 bg-clay-light rounded animate-pulse" />
              <div className="h-10 bg-clay-light rounded animate-pulse w-5/6" />
              <div className="space-y-2">
                <div className="h-6 bg-clay-light rounded animate-pulse" />
                <div className="h-6 bg-clay-light rounded animate-pulse w-4/5" />
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-clay-light">
                <div className="h-4 w-32 bg-clay-light rounded animate-pulse" />
                <div className="h-4 w-24 bg-clay-light rounded animate-pulse" />
              </div>
            </header>

            {/* Featured image skeleton */}
            <div className="relative aspect-video bg-cream rounded-xl mb-8 animate-pulse" />

            {/* Content skeleton */}
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-clay-light rounded animate-pulse"
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
