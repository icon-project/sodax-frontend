'use client';

import { ShareNetwork } from '@phosphor-icons/react/dist/ssr';
import { useShare } from '@/hooks/use-share';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const { handleShare, feedback } = useShare({ title, url });

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors shrink-0 w-full sm:w-auto"
        aria-label="Share page"
      >
        <ShareNetwork size={16} weight="duotone" className="text-[var(--espresso)]" />
        <span className="font-['InterMedium'] text-sm text-[var(--espresso)] sm:hidden md:inline">Share this page</span>
        <span className="font-['InterMedium'] text-sm text-[var(--espresso)] hidden sm:inline md:hidden">Share</span>
      </button>
      {feedback.type && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 px-3 py-2 rounded-lg text-xs font-['InterMedium'] text-center z-50 shadow-lg ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
