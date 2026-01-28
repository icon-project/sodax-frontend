'use client';

import { BookOpen, FileArrowDown, ShareNetwork } from '@phosphor-icons/react/dist/ssr';
import { useShare } from '@/hooks/use-share';
import { downloadFile } from '@/lib/download-utils';

interface PageActionsProps {
  pdfUrl?: string;
  pdfTitle?: string;
  shareTitle: string;
  shareUrl?: string;
}

export function PageActions({ pdfUrl, pdfTitle = 'Case Study', shareTitle, shareUrl }: PageActionsProps) {
  const { handleShare, feedback } = useShare({ title: shareTitle, url: shareUrl });

  const handlePdfDownload = () => {
    if (pdfUrl) {
      downloadFile(pdfUrl, `${pdfTitle}.pdf`);
    }
  };

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {/* SODAX SDK Link */}
      <a
        href="https://docs.sodax.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5 text-[var(--clay)] hover:text-[var(--espresso)] transition-colors"
        title="View SODAX SDK Documentation"
      >
        <BookOpen size={18} weight="duotone" className="opacity-70 group-hover:opacity-100" />
        <span className="font-['InterMedium'] text-sm hidden sm:inline">Docs</span>
      </a>

      {/* PDF Download */}
      {pdfUrl && (
        <button
          onClick={handlePdfDownload}
          className="group flex items-center gap-1.5 text-[var(--clay)] hover:text-[var(--espresso)] transition-colors"
          aria-label={`Download ${pdfTitle} PDF`}
          title="Download PDF"
        >
          <FileArrowDown size={18} weight="duotone" className="opacity-70 group-hover:opacity-100" />
          <span className="font-['InterMedium'] text-sm hidden sm:inline">PDF</span>
        </button>
      )}

      {/* Share Button */}
      <div className="relative flex items-center">
        <button
          onClick={handleShare}
          className="group inline-flex items-center gap-1.5 text-[var(--clay)] hover:text-[var(--espresso)] transition-colors"
          aria-label="Share page"
          title="Share this page"
        >
          <ShareNetwork size={18} weight="duotone" className="opacity-70 group-hover:opacity-100" />
          <span className="font-['InterMedium'] text-sm hidden sm:inline">Share</span>
        </button>
        {feedback.type && (
          <div
            className={`fixed sm:absolute bottom-4 left-4 right-4 sm:bottom-auto sm:left-auto sm:right-0 sm:top-full mt-0 sm:mt-2 px-3 py-2 rounded-lg text-xs font-['InterMedium'] text-center sm:text-left sm:whitespace-nowrap z-50 shadow-lg ${
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
    </div>
  );
}
