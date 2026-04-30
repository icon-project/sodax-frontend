import { useEffect, useMemo, useRef } from 'react';
import type React from 'react';
import * as d3 from 'd3';
import type { ScaleLinear } from 'd3';
import { roundPrice } from '../price-utils';

const MIN_PRICE_GAP = 0.000001;
const BAND_DRAGGING_CLASS = 'is-band-dragging';
// Sub-threshold mouse movement on click (e.g. accidental jitter, or a click on a
// handle that's clamped to the chart edge because the user typed an out-of-range
// value) must not be interpreted as a drag — otherwise yScale.invert at the
// clamped y would silently rewrite the typed price to the chart-edge value.
const DRAG_PIXEL_THRESHOLD = 3;

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
  const minHandleOffsetRef = useRef<number>(0);
  const maxHandleOffsetRef = useRef<number>(0);
  const minHandleStartYRef = useRef<number | null>(null);
  const maxHandleStartYRef = useRef<number | null>(null);

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

    const clampToChart = (y: number, innerH: number): number => Math.max(0, Math.min(innerH, y));

    // Reads the line's rendered y from the hit-rect's data attribute. This avoids
    // depending on `depsRef.current.minPrice/maxPrice`, which can lag one event
    // when the user types in the price input and clicks a handle without first
    // pressing Enter — the input's blur fires AFTER `mousedown`, so React state
    // hasn't been committed when d3's `start` runs.
    const readRenderedLineY = (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>): number => {
      const target = event.sourceEvent.target as SVGElement | null;
      const attr = target?.getAttribute?.('data-line-y');
      const parsed = attr === null || attr === undefined ? Number.NaN : Number.parseFloat(attr);
      if (Number.isFinite(parsed)) {
        return clampToChart(parsed, depsRef.current.innerH);
      }
      const { yScale, minPrice, innerH } = depsRef.current;
      return clampToChart(yScale(minPrice), innerH);
    };

    const minDrag = d3
      .drag<SVGRectElement, unknown>()
      .container(resolveContainer)
      .on('start', event => {
        const renderedLineY = readRenderedLineY(event);
        minHandleOffsetRef.current = toChartY(event.y) - renderedLineY;
        minHandleStartYRef.current = event.y;
      })
      .on('drag', event => {
        const startY = minHandleStartYRef.current;
        if (startY !== null && Math.abs(event.y - startY) < DRAG_PIXEL_THRESHOLD) {
          return;
        }
        const { yScale, maxPrice, innerH } = depsRef.current;
        const lineY = clampToChart(toChartY(event.y) - minHandleOffsetRef.current, innerH);
        const price = Math.max(yScale.invert(lineY), 0);
        // Only constraint: min must stay strictly below max.
        const cap = Math.max(maxPrice - MIN_PRICE_GAP, 0);
        settersRef.current.setMinPrice(roundPrice(Math.min(price, cap)));
      })
      .on('end', () => {
        minHandleStartYRef.current = null;
      });

    const maxDrag = d3
      .drag<SVGRectElement, unknown>()
      .container(resolveContainer)
      .on('start', event => {
        const renderedLineY = readRenderedLineY(event);
        maxHandleOffsetRef.current = toChartY(event.y) - renderedLineY;
        maxHandleStartYRef.current = event.y;
      })
      .on('drag', event => {
        const startY = maxHandleStartYRef.current;
        if (startY !== null && Math.abs(event.y - startY) < DRAG_PIXEL_THRESHOLD) {
          return;
        }
        const { yScale, minPrice, innerH } = depsRef.current;
        const lineY = clampToChart(toChartY(event.y) - maxHandleOffsetRef.current, innerH);
        const price = Math.max(yScale.invert(lineY), 0);
        // Only constraint: max must stay strictly above min.
        const floor = minPrice + MIN_PRICE_GAP;
        settersRef.current.setMaxPrice(roundPrice(Math.max(price, floor)));
      })
      .on('end', () => {
        maxHandleStartYRef.current = null;
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
