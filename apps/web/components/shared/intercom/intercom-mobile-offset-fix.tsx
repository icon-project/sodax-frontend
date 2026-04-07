// Intercom often sets/updates inline `bottom` styles after it boots (and sometimes recreates the node),
// which can override our CSS and cause the bubble to overlap the mobile bottom nav. This component re-applies our desired
// bottom offset whenever Intercom mutates its DOM on mobile.
// How to adjust position: tweak `--intercom-mobile-bottom-offset` in `apps/web/app/globals.css` (smaller = lower).
'use client';

import { useEffect } from 'react';

const MOBILE_MAX_WIDTH_PX = 767;

function getBottomValue(): string {
  return 'calc(var(--intercom-mobile-bottom-offset) + env(safe-area-inset-bottom, 0px))';
}

function applyIntercomBottomOffset(): void {
  const container = document.getElementById('intercom-container');
  if (!container) {
    return;
  }

  const bottom = getBottomValue();

  const candidates = container.querySelectorAll<HTMLElement>(
    [
      '.intercom-launcher-frame',
      '.intercom-lightweight-app-launcher',
      '.intercom-messenger-frame',
      'iframe',
      '[style]',
    ].join(','),
  );

  for (const el of candidates) {
    el.style.setProperty('bottom', bottom, 'important');
    // Some Intercom variants use logical properties.
    el.style.setProperty('inset-block-end', bottom, 'important');
  }
}

export default function IntercomMobileOffsetFix(): React.ReactElement | null {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    if (!media.matches) {
      return;
    }

    applyIntercomBottomOffset();

    const containerObserver = new MutationObserver(() => {
      applyIntercomBottomOffset();
    });

    // Intercom may mount late, so observe the document until it appears.
    const rootObserver = new MutationObserver(() => {
      const container = document.getElementById('intercom-container');
      if (!container) {
        return;
      }

      applyIntercomBottomOffset();

      containerObserver.observe(container, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: true,
      });

      rootObserver.disconnect();
    });

    rootObserver.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      rootObserver.disconnect();
      containerObserver.disconnect();
    };
  }, []);

  return null;
}
