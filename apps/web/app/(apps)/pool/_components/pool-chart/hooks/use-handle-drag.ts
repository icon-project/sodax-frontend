import { useMemo, useRef } from 'react';
import type React from 'react';
import * as d3 from 'd3';
import type { ScaleLinear } from 'd3';
import { roundPrice } from '../price-utils';

const CURRENT_PRICE_GAP_FRACTION = 0.02;
const MIN_PRICE_GAP = 0.000001;

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
 * Unlike addEventListener on the SVG root, d3.drag attaches directly to the
 * target element, correctly dispatches on both pointer and touch, and stops
 * propagation so the chart's zoom-pan handler doesn't also fire. Callbacks
 * read live state via refs, so the behaviors don't need to be recreated on
 * every state change.
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

  return useMemo<HandleDragBehaviors>(() => {
    if (!enabled) {
      return null;
    }

    const getChartY = (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>): number => {
      const svg = svgRef.current;
      if (!svg) {
        return 0;
      }
      const rect = svg.getBoundingClientRect();
      const sourceEvent = event.sourceEvent as MouseEvent | TouchEvent | undefined;
      if (!sourceEvent) {
        return 0;
      }
      const clientY =
        'touches' in sourceEvent
          ? (sourceEvent.touches[0]?.clientY ?? sourceEvent.changedTouches?.[0]?.clientY ?? 0)
          : (sourceEvent as MouseEvent).clientY;
      return clientY - rect.top - depsRef.current.marginTop;
    };

    const minDrag = d3
      .drag<SVGRectElement, unknown>()
      .on('start', event => {
        event.sourceEvent?.stopPropagation?.();
      })
      .on('drag', event => {
        const { yScale, currentPrice, innerH } = depsRef.current;
        const clampedY = Math.max(0, Math.min(innerH, getChartY(event)));
        const price = Math.max(yScale.invert(clampedY), 0);
        const gap = Math.max(Math.abs(currentPrice) * CURRENT_PRICE_GAP_FRACTION, MIN_PRICE_GAP);
        const cap = Math.max(currentPrice - gap, 0);
        settersRef.current.setMinPrice(roundPrice(Math.min(price, cap)));
      });

    const maxDrag = d3
      .drag<SVGRectElement, unknown>()
      .on('start', event => {
        event.sourceEvent?.stopPropagation?.();
      })
      .on('drag', event => {
        const { yScale, currentPrice, innerH } = depsRef.current;
        const clampedY = Math.max(0, Math.min(innerH, getChartY(event)));
        const price = Math.max(yScale.invert(clampedY), 0);
        const gap = Math.max(Math.abs(currentPrice) * CURRENT_PRICE_GAP_FRACTION, MIN_PRICE_GAP);
        const floor = currentPrice + gap;
        settersRef.current.setMaxPrice(roundPrice(Math.max(price, floor)));
      });

    const bandDrag = d3
      .drag<SVGRectElement, unknown>()
      .on('start', event => {
        event.sourceEvent?.stopPropagation?.();
        const { yScale, innerH, minPrice, maxPrice } = depsRef.current;
        const [domainStart, domainEnd] = yScale.domain();
        const domainSpan = (domainEnd ?? 0) - (domainStart ?? 0);
        bandAnchorRef.current = {
          anchorY: getChartY(event),
          anchorMin: minPrice,
          span: maxPrice - minPrice,
          pxPerPrice: domainSpan === 0 ? 0 : innerH / domainSpan,
        };
      })
      .on('drag', event => {
        const anchor = bandAnchorRef.current;
        if (!anchor || anchor.pxPerPrice === 0) {
          return;
        }
        const y = getChartY(event);
        const priceDelta = (y - anchor.anchorY) / anchor.pxPerPrice;
        const nextMin = Math.max(anchor.anchorMin - priceDelta, 0);
        settersRef.current.setMinPrice(roundPrice(nextMin));
        settersRef.current.setMaxPrice(roundPrice(nextMin + anchor.span));
      })
      .on('end', () => {
        bandAnchorRef.current = null;
      });

    return { minDrag, maxDrag, bandDrag };
  }, [enabled, svgRef]);
}
