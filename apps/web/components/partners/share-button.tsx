'use client';

import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = {
      title,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors shrink-0"
      aria-label="Share page"
    >
      <Share2 size={16} className="text-[var(--espresso)]" />
      <span className="font-['InterMedium'] text-sm text-[var(--espresso)] hidden sm:inline">Share this page</span>
    </button>
  );
}
