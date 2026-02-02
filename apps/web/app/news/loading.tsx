/**
 * Loading UI for news pages
 * Provides instant feedback while data loads
 */
export default function NewsLoading() {
  return (
    <div className="min-h-screen w-full bg-[var(--almost-white)]">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 bg-[var(--cherry-soda)] h-14" />

      {/* Category Filter Tabs skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 md:justify-center md:flex-wrap scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-10 rounded-[240px] animate-pulse ${
                i === 0 ? 'w-24 bg-[#ede6e6]' : 'w-32 border-[3px] border-[#ede6e6]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[624px_304px] gap-4 lg:justify-center">
          {/* Main Content Area */}
          <div className="min-w-0 flex flex-col gap-4">
            {/* Featured Article skeleton */}
            <div className="bg-white rounded-[24px] overflow-hidden shadow-[0px_4px_32px_0px_#ede6e6] p-2">
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <div className="w-full md:w-[288px] h-[200px] md:h-[180px] bg-[#ede6e6] rounded-[16px] shrink-0 animate-pulse" />
                <div className="flex flex-col gap-2 p-2 flex-1">
                  <div className="h-3 w-16 bg-[#ede6e6] rounded animate-pulse" />
                  <div className="h-7 bg-[#ede6e6] rounded animate-pulse" />
                  <div className="h-5 bg-[#ede6e6] rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-[#ede6e6] rounded animate-pulse w-full" />
                  <div className="h-5 w-24 bg-[#ede6e6] rounded-[256px] animate-pulse" />
                </div>
              </div>
            </div>

            {/* Secondary Articles skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white p-2 rounded-[24px] shadow-[0px_4px_32px_0px_#ede6e6] flex flex-col gap-4"
                >
                  <div className="w-full h-[180px] bg-[#ede6e6] rounded-[16px] animate-pulse" />
                  <div className="flex flex-col gap-2 p-2">
                    <div className="h-3 w-20 bg-[#ede6e6] rounded animate-pulse" />
                    <div className="h-5 bg-[#ede6e6] rounded animate-pulse" />
                    <div className="h-4 bg-[#ede6e6] rounded animate-pulse w-full" />
                    <div className="h-4 bg-[#ede6e6] rounded animate-pulse w-2/3" />
                    <div className="h-5 w-24 bg-[#ede6e6] rounded-[256px] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Latest Updates section skeleton */}
            <div className="flex flex-col gap-4">
              <div className="h-6 w-32 bg-[#ede6e6] rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-2 rounded-[24px] shadow-[0px_4px_32px_0px_#ede6e6] flex flex-col gap-4"
                  >
                    <div className="w-full h-[180px] bg-[#ede6e6] rounded-[16px] animate-pulse" />
                    <div className="flex flex-col gap-2 p-2">
                      <div className="h-3 w-20 bg-[#ede6e6] rounded animate-pulse" />
                      <div className="h-5 bg-[#ede6e6] rounded animate-pulse" />
                      <div className="h-4 bg-[#ede6e6] rounded animate-pulse w-full" />
                      <div className="h-5 w-24 bg-[#ede6e6] rounded-[256px] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <aside className="flex flex-col gap-4">
            {/* SDK Documentation Card skeleton */}
            <div className="bg-[#ede6e6] rounded-[24px] p-8 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-24 bg-[#d9d1d1] rounded animate-pulse" />
                <div className="h-5 w-40 bg-[#d9d1d1] rounded animate-pulse" />
                <div className="h-4 w-full bg-[#d9d1d1] rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-[#d9d1d1] rounded animate-pulse" />
              </div>
              <div className="h-px w-full bg-[#d9d1d1]" />
              <div className="h-4 w-32 bg-[#d9d1d1] rounded animate-pulse" />
            </div>

            {/* Social Media Card skeleton */}
            <div className="bg-[#ede6e6] rounded-[24px] p-8 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-32 bg-[#d9d1d1] rounded animate-pulse" />
                <div className="h-5 w-44 bg-[#d9d1d1] rounded animate-pulse" />
                <div className="h-4 w-full bg-[#d9d1d1] rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-[#d9d1d1] rounded animate-pulse" />
              </div>
              <div className="h-px w-full bg-[#d9d1d1]" />
              <div className="flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 w-28 bg-[#d9d1d1] rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
