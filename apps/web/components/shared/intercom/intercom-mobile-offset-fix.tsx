// Pushes the Intercom launcher above the mobile bottom nav.
//
// Intercom mounts the launcher in two possible modes — iframe-based and
// lightweight DOM. In both modes the visible launcher element is `position:
// static` (or `relative`) inside a `position: fixed` wrapper with a *hashed*
// class name (`intercom-with-namespace-XXXX`) that changes per session, so
// no stable CSS selector can target the wrapper. We walk up from the launcher
// to find the fixed-positioned ancestor and write inline styles on it —
// inline `!important` beats Intercom's `<style>` injections regardless of
// cascade order or specificity.
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const MOBILE_MAX_WIDTH_PX = 767;
const MOBILE_NAV_ID = 'sodax-mobile-bottom-nav';
const GAP_PX = 8;
const INTERCOM_DEFAULT_PADDING_PX = 20;
const NAV_MOUNT_RECHECK_MS = 100;

const LAUNCHER_SELECTORS = [
  '.intercom-launcher-frame',
  '.intercom-lightweight-app-launcher',
  '.intercom-messenger-frame',
  '.intercom-lightweight-app-messenger',
].join(',');

function computeBottomOffsetPx(): number {
  const isMobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches;
  if (!isMobile) {
    return INTERCOM_DEFAULT_PADDING_PX;
  }

  const nav = document.getElementById(MOBILE_NAV_ID);
  if (!nav) {
    return INTERCOM_DEFAULT_PADDING_PX;
  }

  return Math.ceil(nav.getBoundingClientRect().height) + GAP_PX;
}

function findPositionedElement(launcher: HTMLElement): HTMLElement | null {
  if (getComputedStyle(launcher).position === 'fixed') {
    return launcher;
  }

  let current: HTMLElement | null = launcher.parentElement;
  while (current && current !== document.body) {
    if (getComputedStyle(current).position === 'fixed') {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function applyOffset(): void {
  const offsetPx = computeBottomOffsetPx();
  const value = `calc(${offsetPx}px + env(safe-area-inset-bottom, 0px))`;

  const launchers = document.querySelectorAll<HTMLElement>(LAUNCHER_SELECTORS);
  for (const launcher of launchers) {
    const positioned = findPositionedElement(launcher);
    if (positioned && positioned.style.getPropertyValue('bottom') !== value) {
      positioned.style.setProperty('bottom', value, 'important');
    }
  }
}

export default function IntercomMobileOffsetFix(): React.ReactElement | null {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || pathname === null) {
      return;
    }

    let scheduledFrame: number | null = null;
    const scheduleApply = (): void => {
      if (scheduledFrame !== null) {
        return;
      }
      scheduledFrame = window.requestAnimationFrame(() => {
        scheduledFrame = null;
        applyOffset();
      });
    };

    scheduleApply();
    const recheckTimer = window.setTimeout(scheduleApply, NAV_MOUNT_RECHECK_MS);

    // Intercom rewrites its wrapper's inline `bottom` after our overrides;
    // re-apply whenever any descendant `style` changes or new Intercom
    // elements mount. The dedup check inside applyOffset() prevents loops.
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });

    const onResize = (): void => {
      scheduleApply();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      if (scheduledFrame !== null) {
        window.cancelAnimationFrame(scheduledFrame);
      }
      window.clearTimeout(recheckTimer);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [pathname]);

  return null;
}
