'use client';

import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactElement } from 'react';
import { useEffect, useRef } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TOOLTIP_LABEL = 'Read coverage';
const SCROLL_SPEED_PX_PER_MS = 0.04;
const DRAG_THRESHOLD_PX = 5;
const COPY_COUNT = 6;

type PressLogo = {
  name: string;
  href: string;
  render: () => ReactElement;
};

const CoindeskLogo = (): ReactElement => (
  <img src="/landing/press/coindesk.svg" alt="" className="h-6 w-[126.72px] shrink-0" draggable={false} />
);

const CointelegraphLogo = (): ReactElement => (
  <img src="/landing/press/cointelegraph.svg" alt="" className="h-8 w-[137px] shrink-0" draggable={false} />
);

const DecryptLogo = (): ReactElement => (
  <img src="/landing/press/decrypt.svg" alt="" className="h-10 w-[120.228px] shrink-0" draggable={false} />
);

// TODO: marketing — confirm Decrypt article URL. Placeholder for now.
const DECRYPT_ARTICLE_URL = '#';

const PRESS_LOGOS: PressLogo[] = [
  {
    name: 'Coindesk',
    href: 'https://www.coindesk.com/markets/2025/05/12/here-s-why-icon-rebranded-to-sodax-and-abandoned-its-layer-1',
    render: CoindeskLogo,
  },
  {
    name: 'Cointelegraph',
    href: 'https://cointelegraph.com/press-releases/sodax-lightlink-partner-to-expand-defi-liquidity-across-ethereum-layer-2-ecosystem',
    render: CointelegraphLogo,
  },
  {
    name: 'Decrypt',
    href: DECRYPT_ARTICLE_URL,
    render: DecryptLogo,
  },
];

export const PressBar = (): ReactElement => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const translateRef = useRef(0);
  const copyWidthRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const dragStartRef = useRef({ pointerX: 0, translate: 0, didDrag: false, pointerId: 0, isDown: false });

  useEffect(() => {
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!track || !copy) return;

    const measure = () => {
      // Each copy renders with `pr-[120px]`, so its offsetWidth already includes the trailing gap.
      copyWidthRef.current = copy.offsetWidth;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(copy);

    let lastTs = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = now - lastTs;
      lastTs = now;
      const copyWidth = copyWidthRef.current;

      if (copyWidth > 0 && !isDraggingRef.current && !isHoveringRef.current) {
        translateRef.current -= dt * SCROLL_SPEED_PX_PER_MS;
      }

      if (copyWidth > 0) {
        if (translateRef.current <= -copyWidth) translateRef.current += copyWidth;
        if (translateRef.current > 0) translateRef.current -= copyWidth;
      }

      track.style.transform = `translate3d(${translateRef.current}px, 0, 0)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    // Record start, but do NOT capture the pointer yet — capturing on pointerdown
    // would redirect the synthetic click to the viewport and block anchor navigation
    // for pure clicks. Capture is promoted in handlePointerMove once drag threshold fires.
    dragStartRef.current = {
      pointerX: e.clientX,
      translate: translateRef.current,
      didDrag: false,
      pointerId: e.pointerId,
      isDown: true,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const dragStart = dragStartRef.current;
    if (!dragStart.isDown) return;
    const deltaX = e.clientX - dragStart.pointerX;
    if (!dragStart.didDrag && Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      dragStart.didDrag = true;
      viewportRef.current?.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
    }
    if (dragStart.didDrag) {
      translateRef.current = dragStart.translate + deltaX;
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(e.pointerId)) {
      viewport.releasePointerCapture(e.pointerId);
    }
    dragStartRef.current.isDown = false;
    isDraggingRef.current = false;
  };

  const handleLogoClick = (e: ReactMouseEvent<HTMLAnchorElement>): void => {
    if (dragStartRef.current.didDrag) {
      e.preventDefault();
      dragStartRef.current.didDrag = false;
    }
  };

  return (
    <div
      ref={viewportRef}
      className="relative w-full overflow-hidden bg-[rgba(72,53,52,0.4)] backdrop-blur-xl cursor-grab active:cursor-grabbing select-none touch-pan-y"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={() => {
        isHoveringRef.current = true;
      }}
      onPointerLeave={() => {
        isHoveringRef.current = false;
      }}
      aria-label="Press coverage"
    >
      <div ref={trackRef} className="flex will-change-transform py-5">
        {Array.from({ length: COPY_COUNT }).map((_, copyIndex) => (
          <div
            key={copyIndex}
            ref={copyIndex === 0 ? copyRef : undefined}
            className="flex items-center gap-[120px] pr-[120px] shrink-0"
          >
            {PRESS_LOGOS.map((logo, logoIndex) => {
              const LogoAsset = logo.render;
              return (
                <Tooltip key={`${copyIndex}-${logo.name}-${logoIndex}`}>
                  <TooltipTrigger asChild>
                    <a
                      href={logo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      aria-label={`Read ${logo.name} coverage`}
                      className="shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      onClick={handleLogoClick}
                    >
                      <LogoAsset />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent
                    variant="bubble"
                    side="top"
                    sideOffset={16}
                    className="h-[54px] items-center gap-2 px-8 py-4 text-(length:--body-comfortable)"
                  >
                    <span className="flex items-center gap-1">
                      {TOOLTIP_LABEL}
                      <span aria-hidden="true">→</span>
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
