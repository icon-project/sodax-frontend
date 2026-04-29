import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import * as d3 from 'd3';

const ZOOM_BUTTON_FACTOR = 1.5;

type UseChartZoomPanArgs = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  enabled: boolean;
  viewportHeight: number;
  minZoom?: number;
  maxZoom?: number;
};

type UseChartZoomPanResult = {
  zoomLevel: number;
  panY: number;
  transform: d3.ZoomTransform;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

function clampZoom(zoom: number, minZoom: number, maxZoom: number): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Zoom and pan state for the chart's Y (price) axis.
 *
 * Input mapping (Uniswap-style):
 * - Wheel / trackpad scroll  → PANS the chart up/down
 * - Drag on the background    → PANS
 * - zoomIn/zoomOut/reset fns  → exposed for the on-screen +/-/⎋ buttons
 *
 * The returned `transform` is a `d3.ZoomTransform` so consumers can feed it
 * straight into `rescaleY(yScaleBase)`.
 */
export function useChartZoomPan({
  svgRef,
  enabled,
  viewportHeight,
  minZoom = 0.5,
  maxZoom = 20,
}: UseChartZoomPanArgs): UseChartZoomPanResult {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panY, setPanY] = useState<number>(0);

  const stateRef = useRef<{ zoomLevel: number; panY: number }>({ zoomLevel, panY });
  stateRef.current = { zoomLevel, panY };

  const panStartRef = useRef<{ pointerY: number; startPan: number } | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const el = svgRef.current;
    if (!el) {
      return;
    }

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault();
      // Subtract deltaY so scrolling DOWN reveals content below (natural direction).
      setPanY(prev => prev - event.deltaY);
    };

    const handleMouseDown = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof SVGElement)) {
        return;
      }
      // Only pan from the background rect, not from handles or the liquidity band.
      if (!target.classList.contains('zoom-bg')) {
        return;
      }
      event.preventDefault();
      panStartRef.current = { pointerY: event.clientY, startPan: stateRef.current.panY };
    };

    const handleMouseMove = (event: MouseEvent): void => {
      const panStart = panStartRef.current;
      if (!panStart) {
        return;
      }
      const delta = event.clientY - panStart.pointerY;
      setPanY(panStart.startPan + delta);
    };

    const handleMouseUp = (): void => {
      panStartRef.current = null;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      panStartRef.current = null;
    };
  }, [enabled, svgRef]);

  const transform = useMemo(
    () => d3.zoomIdentity.translate(0, panY).scale(zoomLevel),
    [zoomLevel, panY],
  );

  const zoomBy = useCallback(
    (factor: number): void => {
      const { zoomLevel: currentZoom, panY: currentPan } = stateRef.current;
      const nextZoom = clampZoom(currentZoom * factor, minZoom, maxZoom);
      if (nextZoom === currentZoom) {
        return;
      }
      // Keep the viewport center anchored at the same base pixel so the zoom
      // appears to scale about the chart's middle rather than the top edge.
      const viewportCenter = viewportHeight / 2;
      const baseCenter = (viewportCenter - currentPan) / currentZoom;
      const nextPan = viewportCenter - baseCenter * nextZoom;
      setZoomLevel(nextZoom);
      setPanY(nextPan);
    },
    [minZoom, maxZoom, viewportHeight],
  );

  const zoomIn = useCallback((): void => {
    zoomBy(ZOOM_BUTTON_FACTOR);
  }, [zoomBy]);

  const zoomOut = useCallback((): void => {
    zoomBy(1 / ZOOM_BUTTON_FACTOR);
  }, [zoomBy]);

  const reset = useCallback((): void => {
    setZoomLevel(1);
    setPanY(0);
  }, []);

  return { zoomLevel, panY, transform, zoomIn, zoomOut, reset };
}
