import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import * as d3 from 'd3';

const ZOOM_WHEEL_SENSITIVITY = 0.0015;
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

function getPanBound(viewportHeight: number, zoomLevel: number): number {
  return Math.max(0, (viewportHeight * (zoomLevel - 1)) / 2);
}

function clampPan(pan: number, viewportHeight: number, zoomLevel: number): number {
  const bound = getPanBound(viewportHeight, zoomLevel);
  return Math.max(-bound, Math.min(bound, pan));
}

/**
 * Zooms and pans the chart's Y (price) axis only.
 *
 * Unlike d3.zoom (which couples X and Y via a shared scale factor), this hook
 * tracks zoomLevel and panY as explicit numbers so the price axis can zoom
 * independently of the time axis. Wheel events zoom around the cursor.
 * Drag-on-background pans within the zoomed viewport.
 *
 * The returned `transform` is a d3.ZoomTransform for easy use with `rescaleY`.
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

  // Re-clamp pan when zoom changes so we don't leave the content bounds.
  useEffect(() => {
    setPanY(prev => clampPan(prev, viewportHeight, zoomLevel));
  }, [zoomLevel, viewportHeight]);

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
      const rect = el.getBoundingClientRect();
      const cursorY = event.clientY - rect.top;

      const { zoomLevel: currentZoom, panY: currentPan } = stateRef.current;
      const zoomFactor = Math.exp(-event.deltaY * ZOOM_WHEEL_SENSITIVITY);
      const nextZoom = clampZoom(currentZoom * zoomFactor, minZoom, maxZoom);

      // Keep the pixel under the cursor at the same pre-zoom coordinate.
      const basePixelAtCursor = (cursorY - currentPan) / currentZoom;
      const nextPan = clampPan(cursorY - basePixelAtCursor * nextZoom, viewportHeight, nextZoom);

      setZoomLevel(nextZoom);
      setPanY(nextPan);
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
      setPanY(clampPan(panStart.startPan + delta, viewportHeight, stateRef.current.zoomLevel));
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
  }, [enabled, svgRef, viewportHeight, minZoom, maxZoom]);

  const transform = useMemo(
    () => d3.zoomIdentity.translate(0, panY).scale(zoomLevel),
    [zoomLevel, panY],
  );

  const zoomIn = useCallback((): void => {
    setZoomLevel(prev => clampZoom(prev * ZOOM_BUTTON_FACTOR, minZoom, maxZoom));
  }, [minZoom, maxZoom]);

  const zoomOut = useCallback((): void => {
    setZoomLevel(prev => clampZoom(prev / ZOOM_BUTTON_FACTOR, minZoom, maxZoom));
  }, [minZoom, maxZoom]);

  const reset = useCallback((): void => {
    setZoomLevel(1);
    setPanY(0);
  }, []);

  return { zoomLevel, panY, transform, zoomIn, zoomOut, reset };
}
