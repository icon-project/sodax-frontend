// Intercom often sets/updates inline `bottom` styles after it boots (and sometimes recreates the node),
// which can override our CSS and cause the bubble to overlap the mobile bottom nav. This component re-applies our desired
// bottom offset whenever Intercom mutates its DOM on mobile.
// How to adjust position: tweak `--intercom-mobile-bottom-offset` in `apps/web/app/globals.css` (smaller = lower).
'use client';

import { useEffect } from 'react';

const MOBILE_MAX_WIDTH_PX = 767;
const MOBILE_NAV_ID = 'sodax-mobile-bottom-nav';
const DEFAULT_GAP_PX = 8;

function getBottomValue(): string {
  return 'calc(var(--intercom-mobile-bottom-offset) + env(safe-area-inset-bottom, 0px))';
}

function setIntercomBottomOffsetFromNav(): void {
  const nav = document.getElementById(MOBILE_NAV_ID);
  if (!nav) {
    return;
  }

  const navHeight = Math.ceil(nav.getBoundingClientRect().height);
  const computed = window.getComputedStyle(document.documentElement);
  const gap = Number.parseInt(computed.getPropertyValue('--intercom-mobile-gap-px').trim(), 10);
  const gapPx = Number.isFinite(gap) ? gap : DEFAULT_GAP_PX;

  document.documentElement.style.setProperty('--intercom-mobile-bottom-offset', `${navHeight + gapPx}px`);
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
    // Avoid redundant inline style writes; those can retrigger MutationObserver loops on mobile.
    if (el.style.getPropertyValue('bottom') !== bottom) {
      el.style.setProperty('bottom', bottom, 'important');
    }
    // Some Intercom variants use logical properties.
    if (el.style.getPropertyValue('inset-block-end') !== bottom) {
      el.style.setProperty('inset-block-end', bottom, 'important');
    }
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

    let rafId: number | null = null;
    const scheduleApply = (): void => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setIntercomBottomOffsetFromNav();
        applyIntercomBottomOffset();
      });
    };

    scheduleApply();

    const nav = document.getElementById(MOBILE_NAV_ID);
    const resizeObserver = nav
      ? new ResizeObserver(() => {
          scheduleApply();
        })
      : null;

    if (nav && resizeObserver) {
      resizeObserver.observe(nav);
    }

    const onResize = (): void => {
      scheduleApply();
    };
    window.addEventListener('resize', onResize);

    const containerObserver = new MutationObserver(() => {
      scheduleApply();
    });

    // Intercom may mount late, so observe the document until it appears.
    const rootObserver = new MutationObserver(() => {
      const container = document.getElementById('intercom-container');
      if (!container) {
        return;
      }

      scheduleApply();

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
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
      rootObserver.disconnect();
      containerObserver.disconnect();
    };
  }, []);

  return null;
}
