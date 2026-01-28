'use client';

import { useState, useEffect, useRef } from 'react';
import { ShareIcon, CheckIcon, LinkIcon, XLogo, RedditLogo } from '@phosphor-icons/react';

interface ShareButtonProps {
  title: string;
  url: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    setHasNativeShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this article: ${title}`,
          url: url,
        });
        setShowMenu(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareX = () => {
    const text = encodeURIComponent(title);
    const shareUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const handleShareReddit = () => {
    const shareUrl = encodeURIComponent(url);
    const text = encodeURIComponent(title);
    window.open(`https://reddit.com/submit?url=${shareUrl}&title=${text}`, '_blank', 'width=800,height=600');
    setShowMenu(false);
  };

  if (!isClient) {
    // Render neutral state during SSR to avoid hydration mismatch
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[var(--clay)] font-medium text-sm rounded transition-colors duration-200 opacity-0"
        aria-label="Share article"
      >
        <ShareIcon className="w-4 h-4" aria-hidden="true" />
        <span>Share</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[var(--clay)] hover:text-[var(--cherry-soda)] font-medium text-sm rounded transition-colors duration-200 hover:bg-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--cherry-soda)] focus:ring-offset-1"
        aria-label="Share article"
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        <ShareIcon className="w-4 h-4" aria-hidden="true" />
        <span>Share</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-[var(--clay-light)] py-1 z-50">
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--espresso)] hover:bg-[var(--cream)] transition-colors text-left"
            >
              <ShareIcon className="w-4 h-4" aria-hidden="true" />
              <span>Share via...</span>
            </button>
          )}

          <button
            onClick={handleShareX}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--espresso)] hover:bg-[var(--cream)] transition-colors text-left"
          >
            <XLogo className="w-4 h-4" aria-hidden="true" />
            <span>Share on X</span>
          </button>

          <button
            onClick={handleShareReddit}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--espresso)] hover:bg-[var(--cream)] transition-colors text-left"
          >
            <RedditLogo className="w-4 h-4" aria-hidden="true" />
            <span>Share on Reddit</span>
          </button>

          <div className="border-t border-[var(--clay-light)] my-1" />

          <button
            onClick={handleCopyLink}
            disabled={copied}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--espresso)] hover:bg-[var(--cream)] transition-colors text-left disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" aria-hidden="true" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
