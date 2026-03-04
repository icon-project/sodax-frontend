'use client';

import { useState, useCallback } from 'react';

interface ShareOptions {
  title: string;
  url?: string;
}

interface UseShareReturn {
  handleShare: () => Promise<void>;
  isSharing: boolean;
  feedback: {
    message: string;
    type: 'success' | 'error' | null;
  };
  clearFeedback: () => void;
}

/**
 * Custom hook for handling web share functionality with fallback to clipboard.
 * Provides user feedback for both success and error states.
 */
export function useShare({ title, url }: ShareOptions): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null,
  });

  const clearFeedback = useCallback(() => {
    setFeedback({ message: '', type: null });
  }, []);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    clearFeedback();

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = { title, url: shareUrl };

    try {
      // Try native share API first (opens native share modal on mobile/supported browsers)
      if (navigator.share) {
        await navigator.share(shareData);
        // Note: We don't set success feedback here because the native share dialog
        // provides its own UI feedback
      } else {
        // Fallback: copy to clipboard for desktop browsers without share API
        await navigator.clipboard.writeText(shareUrl);
        setFeedback({
          message: 'Link copied to clipboard!',
          type: 'success',
        });
        // Auto-clear feedback after 3 seconds
        setTimeout(clearFeedback, 3000);
      }
    } catch (err) {
      // Only show error if user didn't cancel the share dialog
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        setFeedback({
          message: 'Unable to share. Please copy the URL from your browser.',
          type: 'error',
        });
        // Auto-clear error after 5 seconds
        setTimeout(clearFeedback, 5000);
      }
    } finally {
      setIsSharing(false);
    }
  }, [title, url, clearFeedback]);

  return {
    handleShare,
    isSharing,
    feedback,
    clearFeedback,
  };
}
