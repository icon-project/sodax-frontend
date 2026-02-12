export function ChainGroupSkeleton() {
  return (
    <div className="w-1/2">
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between gap-4 rounded-full px-4 py-3 bg-clay-light/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-clay-light/20" />
              <div className="w-14 h-4 rounded bg-clay-light/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
