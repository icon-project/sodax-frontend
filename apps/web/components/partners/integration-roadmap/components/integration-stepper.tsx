// IntegrationStepper — vertical on mobile, horizontal on md+.
// Active step responds to scroll (IntersectionObserver) and hover.
// Motion: spring cubic-bezier on transform ("trap → resolve").
// Fallback: prefers-reduced-motion degrades to a plain accessible list.

'use client';

import { useEffect, useRef, useState } from 'react';

interface IntegrationStepperProps {
  steps: string[];
}

// Spring easing: compress slightly, overshoot, settle — the "trap → resolve" feel.
// Applied only to transform; color/shadow use standard ease.
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export function IntegrationStepper({ steps }: IntegrationStepperProps): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Scroll-driven: whichever step is most visible in the upper viewport becomes active.
  useEffect(() => {
    const stepCount = steps.length;
    // "elements" are the rendered <li> nodes for each step; we observe them to drive `activeIndex`.
    const elements = itemRefs.current
      .slice(0, stepCount)
      .filter(Boolean) as HTMLLIElement[];
    if (elements.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the intersecting entry closest to the top of the viewport.
        let best: { stepIndex: number; top: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const stepIndex = elements.indexOf(entry.target as HTMLLIElement);
          if (stepIndex === -1) continue;
          const top = entry.boundingClientRect.top;
          if (best === null || top < best.top) best = { stepIndex, top };
        }
        if (best !== null) setActiveIndex(best.stepIndex);
      },
      { threshold: 0.5, rootMargin: '-8% 0px -48% 0px' },
    );

    for (const element of elements) obs.observe(element);
    return () => obs.disconnect();
  }, [steps.length]);

  if (steps.length === 0) return <></>;

  const last = steps.length - 1;

  return (
    /*
     * Accessibility: <ol> with numbered <li> items.
     * aria-current="step" marks the active step for AT.
     * Visual embellishments (lines, circles) are aria-hidden.
     * Print: the stepper renders cleanly; connections and circles print in colour.
     */
    <ol
      aria-label="Integration steps"
      className="relative flex flex-col md:flex-row md:items-start"
    >
      {steps.map((step, i) => {
        const isActive = activeIndex === i;
        const isDone = i < activeIndex; // completed steps: lit up, not "current"
        const isLit = isActive || isDone;
        const isFirst = i === 0;
        const isLast = i === last;

        return (
          <li
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            aria-current={isActive ? 'step' : undefined}
            onMouseEnter={() => setActiveIndex(i)}
            // Mobile:  flex-row — circle left, text right, vertical line below circle.
            // Desktop: flex-col — circle top, text below, horizontal half-lines on each side.
            className="group relative flex flex-row items-start gap-3 pb-6 last:pb-0 md:flex-1 md:flex-col md:items-center md:pb-0 md:px-2 cursor-default select-none"
          >
            {/* ── Vertical connecting line (mobile only, skipped on last item) ── */}
            {!isLast && (
              <div
                aria-hidden
                className={[
                  'md:hidden absolute left-[15px] top-8 bottom-0 w-px',
                  'transition-colors duration-500 motion-reduce:transition-none',
                  isLit ? 'bg-cherry-soda/40' : 'bg-cherry-grey/30',
                ].join(' ')}
              />
            )}

            {/*
             * Horizontal connectors (desktop only).
             * Each <li> owns its left half and right half; adjacent halves join seamlessly.
             * A segment lights up when the step it leads INTO is done or active.
             */}
            {!isFirst && (
              <div
                aria-hidden
                className={[
                  'hidden md:block absolute top-4 right-1/2 left-0 h-px',
                  'transition-colors duration-500 motion-reduce:transition-none',
                  isLit ? 'bg-cherry-soda/40' : 'bg-cherry-grey/30',
                ].join(' ')}
              />
            )}
            {!isLast && (
              <div
                aria-hidden
                className={[
                  'hidden md:block absolute top-4 left-1/2 right-0 h-px',
                  'transition-colors duration-500 motion-reduce:transition-none',
                  isDone ? 'bg-cherry-soda/40' : 'bg-cherry-grey/30',
                ].join(' ')}
              />
            )}

            {/*
             * Circle node — filled+scaled when active, filled (no scale) when done.
             * Spring transition on transform for the "trap → resolve" feel.
             */}
            <div
              aria-hidden
              style={{
                transition: `background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, transform 0.4s ${SPRING}`,
              }}
              className={[
                'relative z-10 flex items-center justify-center shrink-0',
                'w-8 h-8 rounded-full text-[13px] font-bold',
                'motion-reduce:[transition:none] motion-reduce:scale-100',
                isActive
                  ? 'bg-cherry-soda text-white scale-110 shadow-[0_0_0_4px_rgb(165_92_85/0.15)]'
                  : isDone
                    ? 'bg-cherry-soda/80 text-white scale-100'
                    : [
                        'bg-cream-white text-espresso border border-cherry-grey/40 scale-100',
                        'group-hover:bg-cherry-soda/10 group-hover:border-cherry-soda/40 group-hover:scale-105',
                      ].join(' '),
              ].join(' ')}
            >
              {i + 1}
            </div>

            {/* ── Step text ── */}
            <p
              className={[
                'text-[14px] leading-normal min-w-0 md:w-full md:text-left',
                'pt-1 md:pt-0 md:mt-3',
                'transition-colors duration-200 motion-reduce:transition-none',
                isActive
                  ? 'text-espresso font-medium'
                  : isDone
                    ? 'text-clay-dark'
                    : 'text-clay-dark group-hover:text-espresso',
              ].join(' ')}
            >
              {step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
