import { useEffect, useMemo, useRef } from 'react';
import type React from 'react';
import * as d3 from 'd3';
import type { ScaleLinear } from 'd3';
import { roundPrice } from '../price-utils';

const CURRENT_PRICE_GAP_FRACTION = 0.02;
const MIN_PRICE_GAP = 0.000001;
const BAND_DRAGGING_CLASS = 'is-band-dragging';

type DragDeps = {
  yScale: ScaleLinear<number, number>;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  innerH: number;
  marginTop: number;
};

type UseHandleDragArgs = {
  enabled: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  deps: DragDeps;
  setMinPrice: (price: number) => void;
  setMaxPrice: (price: number) => void;
};

export type HandleDragBehaviors = {
  minDrag: d3.DragBehavior<SVGRectElement, unknown, unknown>;
  maxDrag: d3.DragBehavior<SVGRectElement, unknown, unknown>;
  bandDrag: d3.DragBehavior<SVGRectElement, unknown, unknown>;
} | null;

type BandAnchor = {
  anchorY: number;
  anchorMin: number;
  span: number;
  pxPerPrice: number;
};

/**
 * Returns d3.drag behaviors for the min handle, max handle, and shaded band.
 *
 * The draw effect removes and recreates the hit rects on every min/max change,
 * so we anchor the drag `container` to the SVG root (a stable element) rather
 * than letting it default to the target's parentNode. With a stable container,
 * d3.pointer() keeps returning correct coordinates even when the target rect
 * is replaced mid-gesture.
 *
 * Callbacks read live state via refs, so the behaviors only need to be built
 * once per mount.
 */
export function useHandleDrag({
  enabled,
  svgRef,
  deps,
  setMinPrice,
  setMaxPrice,
}: UseHandleDragArgs): HandleDragBehaviors {
  const depsRef = useRef<DragDeps>(deps);
  depsRef.current = deps;

  const settersRef = useRef<{ setMinPrice: typeof setMinPrice; setMaxPrice: typeof setMaxPrice }>({
    setMinPrice,
    setMaxPrice,
  });
  settersRef.current = { setMinPrice, setMaxPrice };

  const bandAnchorRef = useRef<BandAnchor | null>(null);

  // Safety net: if the 'end' event is missed (e.g., window blur, pointercancel,
  // or the tab loses visibility mid-gesture) the body cursor and SVG class
  // could stay stuck. Clear them on any global drag-ending signal.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const clearDragState = (): void => {
      if (bandAnchorRef.current === null && document.body.style.cursor !== 'grabbing') {
        return;
      }
      bandAnchorRef.current = null;
      svgRef.current?.classList.remove(BAND_DRAGGING_CLASS);
      document.body.style.cursor = '';
    };

    window.addEventListener('blur', clearDragState);
    window.addEventListener('pointercancel', clearDragState);
    document.addEventListener('visibilitychange', clearDragState);

    return () => {
      window.removeEventListener('blur', clearDragState);
      window.removeEventListener('pointercancel', clearDragState);
      document.removeEventListener('visibilitychange', clearDragState);
      clearDragState();
    };
  }, [enabled, svgRef]);

  return useMemo<HandleDragBehaviors>(() => {
    if (!enabled) {
      return null;
    }

    // All three drags use the SVG root as the container so d3.pointer returns
    // SVG-local coords even after the hit rect is removed and recreated.
    const resolveContainer = (): SVGSVGElement => svgRef.current as SVGSVGElement;

    const toChartY = (svgY: number): number => svgY - depsRef.current.marginTop;

    const minDrag = d3
      .drag<SVGRectElement, unknown>()
      .container(resolveContainer)
      .on('drag', event => {
        const { yScale, currentPrice, innerH } = depsRef.current;
        const chartY = Math.max(0, Math.min(innerH, toChartY(event.y)));
        const price = Math.max(yScale.invert(chartY), 0);
        const gap = Math.max(Math.abs(currentPrice) * CURRENT_PRICE_GAP_FRACTION, MIN_PRICE_GAP);
        const cap = Math.max(currentPrice - gap, 0);
        settersRef.current.setMinPrice(roundPrice(Math.min(price, cap)));
      });

    const maxDrag = d3
      .drag<SVGRectElement, unknown>()
      .container(resolveContainer)
      .on('drag', event => {
        const { yScale, currentPrice, innerH } = depsRef.current;
        const chartY = Math.max(0, Math.min(innerH, toChartY(event.y)));
        const price = Math.max(yScale.invert(chartY), 0);
        const gap = Math.max(Math.abs(currentPrice) * CURRENT_PRICE_GAP_FRACTION, MIN_PRICE_GAP);
        const floor = currentPrice + gap;
        settersRef.current.setMaxPrice(roundPrice(Math.max(price, floor)));
      });

    const bandDrag = d3
      .drag<SVGRectElement, unknown>()
      .container(resolveContainer)
      .on('start', event => {
        const { yScale, innerH, minPrice, maxPrice } = depsRef.current;
        const [domainStart, domainEnd] = yScale.domain();
        const domainSpan = (domainEnd ?? 0) - (domainStart ?? 0);
        bandAnchorRef.current = {
          anchorY: toChartY(event.y),
          anchorMin: minPrice,
          span: maxPrice - minPrice,
          pxPerPrice: domainSpan === 0 ? 0 : innerH / domainSpan,
        };
        svgRef.current?.classList.add(BAND_DRAGGING_CLASS);
        document.body.style.cursor = 'grabbing';
      })
      .on('drag', event => {
        const anchor = bandAnchorRef.current;
        if (!anchor || anchor.pxPerPrice === 0) {
          return;
        }
        const chartY = toChartY(event.y);
        const priceDelta = (chartY - anchor.anchorY) / anchor.pxPerPrice;
        const nextMin = Math.max(anchor.anchorMin - priceDelta, 0);
        settersRef.current.setMinPrice(roundPrice(nextMin));
        settersRef.current.setMaxPrice(roundPrice(nextMin + anchor.span));
      })
      .on('end', () => {
        bandAnchorRef.current = null;
        svgRef.current?.classList.remove(BAND_DRAGGING_CLASS);
        document.body.style.cursor = '';
      });

    return { minDrag, maxDrag, bandDrag };
  }, [enabled, svgRef]);
}
