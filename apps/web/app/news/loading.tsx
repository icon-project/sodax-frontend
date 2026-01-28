/**
 * Loading UI for news pages
 * Provides instant feedback while data loads
 */
export default function NewsLoading() {
  return (
    <div className="min-h-screen w-full bg-[var(--almost-white)]">
      <div className="sticky top-0 z-40 bg-white border-b-2 border-[var(--cherry-soda)] h-14 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content skeleton */}
          <div className="min-w-0">
            {/* Featured article skeleton */}
            <div className="bg-white border-2 border-[var(--clay-light)] rounded-lg p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-[16/9] bg-[var(--cream)] rounded-lg animate-pulse" />
                <div className="space-y-4">
                  <div className="h-4 w-20 bg-[var(--cherry-soda)]/20 rounded-full animate-pulse" />
                  <div className="h-8 bg-[var(--clay-light)] rounded animate-pulse" />
                  <div className="h-6 bg-[var(--clay-light)] rounded animate-pulse w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-[var(--clay-light)] rounded animate-pulse" />
                    <div className="h-4 bg-[var(--clay-light)] rounded animate-pulse w-5/6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Grid skeleton */}
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-lg border border-[var(--clay-light)]">
                  <div className="aspect-[16/9] bg-[var(--cream)] rounded-lg mb-3 animate-pulse" />
                  <div className="h-6 bg-[var(--clay-light)] rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-[var(--clay-light)] rounded w-3/4 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[var(--cherry-soda)] to-[var(--cherry-dark)] rounded-xl p-6 h-64 animate-pulse" />
            <div className="bg-white rounded-xl p-6 border border-[var(--clay-light)] h-80 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
