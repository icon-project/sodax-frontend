'use client';

import { BookOpen, FileDown, Share2 } from 'lucide-react';

interface PageActionsProps {
  pdfUrl?: string;
  pdfTitle?: string;
  shareTitle: string;
  shareUrl?: string;
}

export function PageActions({ pdfUrl, pdfTitle = 'Case Study', shareTitle, shareUrl }: PageActionsProps) {
  const handlePdfDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${pdfTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = { title: shareTitle, url };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {/* SODAX SDK Link */}
      <a
        href="https://docs.sodax.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 text-[var(--clay)] hover:text-[var(--espresso)] transition-colors"
        title="View SODAX SDK Documentation"
      >
        <BookOpen size={18} className="opacity-70 group-hover:opacity-100" />
        <span className="font-['InterMedium'] text-sm hidden sm:inline">Docs</span>
      </a>

      {/* PDF Download */}
      {pdfUrl && (
        <button
          onClick={handlePdfDownload}
          className="group inline-flex items-center gap-1.5 text-[var(--clay)] hover:text-[var(--espresso)] transition-colors"
          aria-label={`Download ${pdfTitle} PDF`}
          title="Download PDF"
        >
          <FileDown size={18} className="opacity-70 group-hover:opacity-100" />
          <span className="font-['InterMedium'] text-sm hidden sm:inline">PDF</span>
        </button>
      )}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="group inline-flex items-center gap-1.5 text-[var(--clay)] hover:text-[var(--espresso)] transition-colors"
        aria-label="Share page"
        title="Share this page"
      >
        <Share2 size={18} className="opacity-70 group-hover:opacity-100" />
        <span className="font-['InterMedium'] text-sm hidden sm:inline">Share</span>
      </button>
    </div>
  );
}
