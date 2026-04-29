import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import * as d3 from 'd3';
import { MinusCircleIcon, PlusCircleIcon, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PoolChartProps, PricePoint, TickPoint } from './types';
import {
  C,
  DEFAULT_CURRENT_PRICE,
  HEIGHT,
  INTERACTIVE,
  ML,
  MOCK_CHART_MAX_PRICE,
  MOCK_CHART_MIN_PRICE,
  RANGES,
  RANGE_DAYS,
  RANGE_FETCH_CONFIG,
  SHOW_MIN_MAX_HANDLES,
  TICK_W,
  TM,
} from './constants';
import { generatePairData, getInitialPriceBand } from './mock-data';
import { parseLiquidityTickPoints, parseOhlcPricePoints } from './parsers';
import { formatPairPrice, normalizeExternalPrice, roundPrice } from './price-utils';
import { useChartZoomPan } from './hooks/use-chart-zoom-pan';
import { useHandleDrag } from './hooks/use-handle-drag';

const ALL_DATA = generatePairData(730);
const LATEST_POINT: PricePoint = ALL_DATA[ALL_DATA.length - 1] ?? { time: Date.now(), price: DEFAULT_CURRENT_PRICE };
const CURRENT_PRICE = LATEST_POINT.price;
const TICK_DATA: TickPoint[] = [];

export function PoolChart({
  pairPrice,
  poolId,
  minPrice: propMinPrice,
  maxPrice: propMaxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: PoolChartProps = {}): React.JSX.Element {
  const mainSvgRef = useRef<SVGSVGElement | null>(null);
  const tickSvgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [internalMinPrice, setInternalMinPrice] = useState<number>(roundPrice(CURRENT_PRICE * 0.85));
  const [internalMaxPrice, setInternalMaxPrice] = useState<number>(roundPrice(CURRENT_PRICE * 1.15));

  const minPrice = propMinPrice ?? internalMinPrice;
  const maxPrice = propMaxPrice ?? internalMaxPrice;

  const setMinPrice = useCallback(
    (price: number): void => {
      if (onMinPriceChange) {
        onMinPriceChange(price);
      } else {
        setInternalMinPrice(price);
      }
    },
    [onMinPriceChange],
  );

  const setMaxPrice = useCallback(
    (price: number): void => {
      if (onMaxPriceChange) {
        onMaxPriceChange(price);
      } else {
        setInternalMaxPrice(price);
      }
    },
    [onMaxPriceChange],
  );
  const [activeRange, setActiveRange] = useState<(typeof RANGES)[number]['label']>('1M');
  const [width, setWidth] = useState<number>(700);
  const [allData, setAllData] = useState<PricePoint[]>(ALL_DATA);
  const externalPairPrice = useMemo(() => normalizeExternalPrice(pairPrice), [pairPrice]);
  const [currentPrice, setCurrentPrice] = useState<number>(externalPairPrice ?? CURRENT_PRICE);
  const [tickData, setTickData] = useState<TickPoint[]>(TICK_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  const INNER_W = width - ML.left - ML.right;
  const INNER_H = HEIGHT - ML.top - ML.bottom;
  const TICK_IH = HEIGHT - TM.top - TM.bottom;
  const TICK_IW = TICK_W - TM.left - TM.right;

  const {
    transform: zoomTransform,
    zoomIn,
    zoomOut,
    reset: resetZoom,
  } = useChartZoomPan({
    svgRef: mainSvgRef,
    enabled: INTERACTIVE,
    viewportHeight: INNER_H,
  });

  useEffect(() => {
    if (externalPairPrice === null) {
      return;
    }
    setCurrentPrice(externalPairPrice);
  }, [externalPairPrice]);

  useEffect(() => {
    let ignore = false;

    async function buildPairData(): Promise<void> {
      setLoading(true);
      try {
        const resolvedPoolId = typeof poolId === 'string' ? poolId.trim() : '';
        if (!resolvedPoolId) {
          const mockData = generatePairData(RANGE_DAYS[activeRange]);
          if (ignore || !mockData.length) {
            return;
          }
          const last = mockData[mockData.length - 1]?.price ?? DEFAULT_CURRENT_PRICE;
          const initialBand = getInitialPriceBand(mockData, last);
          setAllData(mockData);
          setCurrentPrice(last);
          setTickData([]);
          setInternalMinPrice(initialBand.min);
          setInternalMaxPrice(initialBand.max);
          return;
        }

        const rangeConfig = RANGE_FETCH_CONFIG[activeRange];
        const toDate = new Date();
        const fromDate = new Date(toDate.getTime() - rangeConfig.lookbackMs);
        const params = new URLSearchParams({
          poolId: resolvedPoolId,
          interval: rangeConfig.interval,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          limit: String(rangeConfig.limit),
        });
        const [ohlcResponse, liquidityResponse] = await Promise.all([
          fetch(`/api/pool/ohlc?${params.toString()}`, { method: 'GET', cache: 'no-store' }),
          fetch(`/api/pool/liquidity?poolId=${encodeURIComponent(resolvedPoolId)}`, {
            method: 'GET',
            cache: 'no-store',
          }),
        ]);
        if (!ohlcResponse.ok) {
          throw new Error(`OHLC request failed (${ohlcResponse.status})`);
        }

        const payload: unknown = await ohlcResponse.json();
        const liquidityPayload: unknown = liquidityResponse.ok ? await liquidityResponse.json() : null;
        const data = parseOhlcPricePoints(payload);
        const ticks = parseLiquidityTickPoints(liquidityPayload);
        if (!data.length || ignore) {
          throw new Error('No valid OHLC points');
        }

        const last = data[data.length - 1]?.price ?? DEFAULT_CURRENT_PRICE;
        const initialBand = getInitialPriceBand(data, last);
        setAllData(data);
        setCurrentPrice(last);
        setTickData(ticks);
        setInternalMinPrice(initialBand.min);
        setInternalMaxPrice(initialBand.max);
      } catch {
        if (ignore) {
          return;
        }
        // fallback to generated pair-like data
        const fb = generatePairData(RANGE_DAYS[activeRange]);
        const fallbackLast = fb[fb.length - 1];
        const last = fallbackLast?.price ?? CURRENT_PRICE;
        const initialBand = getInitialPriceBand(fb, last);
        setAllData(fb);
        setCurrentPrice(last);
        setTickData([]);
        setInternalMinPrice(initialBand.min);
        setInternalMaxPrice(initialBand.max);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    buildPairData();

    return () => {
      ignore = true;
    };
  }, [activeRange, poolId]);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(Math.floor(entry.contentRect.width));
      }
    });

    if (wrapRef.current) {
      obs.observe(wrapRef.current);
    }

    return () => obs.disconnect();
  }, []);

  const visibleData = useMemo(() => {
    const range = RANGES.find(item => item.label === activeRange);
    if (!range || range.ms === null) {
      return allData;
    }

    const now = allData[allData.length - 1]?.time ?? Date.now();
    return allData.filter(d => d.time >= now - range.ms);
  }, [activeRange, allData]);

  const xScaleBase = useMemo(
    () =>
      d3
        .scaleTime<number, number>()
        .domain(d3.extent(visibleData, d => d.time) as [number, number])
        .range([0, INNER_W]),
    [visibleData, INNER_W],
  );

  const xScale = xScaleBase;

  const [yDomainMin, yDomainMax] = useMemo((): [number, number] => {
    const defaultMin = MOCK_CHART_MIN_PRICE;
    const defaultMax = MOCK_CHART_MAX_PRICE;
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      return [defaultMin, defaultMax];
    }

    const referencePrices = visibleData.map(point => point.price);
    const finiteReferences = referencePrices.filter(price => Number.isFinite(price) && price > 0);

    const maxDeviation = finiteReferences.reduce((acc, price) => Math.max(acc, Math.abs(price - currentPrice)), 0);
    const minHalfSpan = Math.max(currentPrice * 0.002, 0.000001);
    const halfSpan = Math.max(maxDeviation * 1.15, minHalfSpan);
    const paddedMin = currentPrice - halfSpan;
    const paddedMax = currentPrice + halfSpan;
    if (!Number.isFinite(paddedMin) || !Number.isFinite(paddedMax) || paddedMax <= paddedMin) {
      return [defaultMin, defaultMax];
    }
    return [roundPrice(paddedMin), roundPrice(paddedMax)];
  }, [visibleData, currentPrice]);

  const yScaleBase = useMemo(
    () => d3.scaleLinear().domain([yDomainMin, yDomainMax]).range([INNER_H, 0]),
    [yDomainMin, yDomainMax, INNER_H],
  );

  const yScale = useMemo(() => zoomTransform.rescaleY(yScaleBase), [zoomTransform, yScaleBase]);

  const clamp = useCallback((v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v)), []);
  const priceToY = useCallback((p: number) => clamp(yScale(p), 0, INNER_H), [yScale, INNER_H, clamp]);

  const dragBehaviors = useHandleDrag({
    enabled: INTERACTIVE,
    svgRef: mainSvgRef,
    deps: {
      yScale,
      currentPrice,
      minPrice,
      maxPrice,
      innerH: INNER_H,
      marginTop: ML.top,
    },
    setMinPrice,
    setMaxPrice,
  });

  useEffect(() => {
    void activeRange;
    if (INTERACTIVE) {
      resetZoom();
    }
  }, [activeRange, resetZoom]);

  useEffect(() => {
    if (!mainSvgRef.current || INNER_W <= 0) {
      return;
    }

    const svg = d3.select(mainSvgRef.current);
    svg.selectAll('defs').remove();
    svg.selectAll('.chart-content').remove();

    const minY = priceToY(minPrice);
    const maxY = priceToY(maxPrice);
    const cpY = priceToY(currentPrice);

    const defs = svg.append('defs');

    defs
      .append('clipPath')
      .attr('id', 'clip-band-in')
      .append('rect')
      .attr('x', 0)
      .attr('y', maxY)
      .attr('width', INNER_W)
      .attr('height', Math.max(0, minY - maxY));

    const outClip = defs.append('clipPath').attr('id', 'clip-band-out');
    outClip.append('rect').attr('x', 0).attr('y', 0).attr('width', INNER_W).attr('height', maxY);
    outClip
      .append('rect')
      .attr('x', 0)
      .attr('y', minY)
      .attr('width', INNER_W)
      .attr('height', Math.max(0, INNER_H - minY));

    const g = svg.append('g').attr('class', 'chart-content').attr('transform', `translate(${ML.left},${ML.top})`);

    const bandRect = g
      .append<SVGRectElement>('rect')
      .attr('class', 'band-hit')
      .attr('x', 0)
      .attr('y', maxY)
      .attr('width', INNER_W)
      .attr('height', Math.max(0, minY - maxY))
      .attr('fill', C.bandFill)
      .attr('pointer-events', INTERACTIVE ? 'all' : 'none')
      .style('cursor', INTERACTIVE ? 'grab' : 'default');
    if (dragBehaviors) {
      bandRect.call(dragBehaviors.bandDrag);
    }

    const line = d3
      .line<PricePoint>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.price))
      .curve(d3.curveCatmullRom.alpha(0.5));

    g.append('path')
      .datum(visibleData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', C.lineOutside)
      .attr('stroke-width', C.lineWidthOut)
      .attr('clip-path', 'url(#clip-band-out)');

    g.append('path')
      .datum(visibleData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', C.lineInside)
      .attr('stroke-width', C.lineWidthIn)
      .attr('clip-path', 'url(#clip-band-in)');

    g.append('g')
      .attr('transform', 'translate(0,0)')
      .call(
        d3
          .axisTop(xScale)
          .ticks(5)
          .tickFormat(d =>
            d3
              .timeFormat(activeRange === '1D' ? '%H:%M' : '%b %d')(new Date(d as number))
              .toUpperCase(),
          ),
      )
      .call(a => a.select('.domain').remove())
      .call(a => a.selectAll('line').remove())
      .call(a =>
        a
          .selectAll('text')
          .attr('fill', C.textDim)
          .attr('font-family', 'InterRegular')
          .attr('font-size', '9px')
          .attr('dy', '-4px'),
      );

    function drawHLine({
      y,
      color,
      label,
      price,
      dashed = false,
    }: {
      y: number;
      color: string;
      label: 'MIN' | 'MAX' | 'NOW';
      price: number;
      dashed?: boolean;
    }): void {
      const grp = g.append('g').attr('transform', `translate(0,${y})`);

      grp
        .append('line')
        .attr('x1', 0)
        .attr('x2', INNER_W)
        .attr('stroke', color)
        .attr('stroke-width', dashed ? 1 : 2)
        .attr('stroke-dasharray', dashed ? '5 4' : 'none')
        .attr('opacity', dashed ? 0.8 : 0.9)
        .attr('pointer-events', 'none');

      if (!dashed) {
        const pct = currentPrice === 0 ? 0 : ((price - currentPrice) / currentPrice) * 100;
        const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
        const cx = INNER_W / 2;

        const badgeH = 20;
        const badgeW = 70;
        const badgeX = cx - badgeW / 2 - 28;
        const fo = grp
          .append('foreignObject')
          .attr('class', 'pct-pill')
          .attr('x', badgeX)
          .attr('y', -badgeH / 2)
          .attr('width', badgeW)
          .attr('height', badgeH)
          .attr('pointer-events', 'none')
          .style('overflow', 'visible');

        const wrapper = fo
          .append('xhtml:div')
          .style('display', 'flex')
          .style('justify-content', 'center')
          .style('align-items', 'center')
          .style('width', '100%')
          .style('height', '100%');

        const pill = wrapper
          .append('xhtml:div')
          .style('height', '20px')
          .style('padding', '4px 8px')
          .style('background', 'white')
          .style('border-radius', '256px')
          .style('display', 'inline-flex')
          .style('flex-direction', 'column')
          .style('justify-content', 'center')
          .style('align-items', 'center');

        pill
          .append('xhtml:div')
          .style('color', C.lineInside)
          .style('font-size', '12px')
          .style('font-family', 'Inter, sans-serif')
          .style('font-weight', '700')
          .style('line-height', '16px')
          .style('white-space', 'nowrap')
          .text(pctStr);

        const iconW = 40;
        const iconH = 40;
        const iconX = cx + 4;
        const iconY = -iconH / 2;

        if (SHOW_MIN_MAX_HANDLES) {
          const hitRect = grp
            .append<SVGRectElement>('rect')
            .attr('x', iconX)
            .attr('y', iconY)
            .attr('width', iconW)
            .attr('height', iconH)
            .attr('fill', 'transparent')
            .attr('class', label === 'MAX' ? 'hit-max' : 'hit-min')
            .style('cursor', 'ns-resize');
          if (dragBehaviors) {
            hitRect.call(label === 'MAX' ? dragBehaviors.maxDrag : dragBehaviors.minDrag);
          }
        }

        if (SHOW_MIN_MAX_HANDLES) {
          const icon = grp
            .append('g')
            .attr('transform', `translate(${iconX}, ${iconY})`)
            .attr('pointer-events', 'none');

          const fid = `drag-shadow-${label}`;
          const iconFilter = icon
            .append('filter')
            .attr('id', fid)
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', '40')
            .attr('height', '40')
            .attr('filterUnits', 'userSpaceOnUse')
            .attr('color-interpolation-filters', 'sRGB');

          iconFilter.append('feFlood').attr('flood-opacity', '0').attr('result', 'BackgroundImageFix');
          iconFilter
            .append('feColorMatrix')
            .attr('in', 'SourceAlpha')
            .attr('type', 'matrix')
            .attr('values', '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0')
            .attr('result', 'hardAlpha');
          iconFilter.append('feOffset').attr('dy', '2');
          iconFilter.append('feGaussianBlur').attr('stdDeviation', '4');
          iconFilter.append('feComposite').attr('in2', 'hardAlpha').attr('operator', 'out');
          iconFilter
            .append('feColorMatrix')
            .attr('type', 'matrix')
            .attr('values', '0 0 0 0 0.930288 0 0 0 0 0.903541 0 0 0 0 0.903541 0 0 0 1 0');
          const merge = iconFilter.append('feMerge');
          merge.append('feMergeNode').attr('in', 'BackgroundImageFix');
          merge.append('feMergeNode').attr('in', 'SourceGraphic');

          icon
            .append('circle')
            .attr('cx', '20')
            .attr('cy', '18')
            .attr('r', '12')
            .attr('fill', C.handleCircle)
            .attr('filter', `url(#${fid})`);
          icon.append('path').attr('d', 'M14 16H26').attr('stroke', C.handleGrip).attr('stroke-linecap', 'round');
          icon.append('path').attr('d', 'M14 20H26').attr('stroke', C.handleGrip).attr('stroke-linecap', 'round');
        }
      }

      if (dashed) {
        const pH = 20;
        const pW = 90;
        const pX = 0;
        const nowFo = grp
          .append('foreignObject')
          .attr('x', pX)
          .attr('y', -pH / 2)
          .attr('width', pW)
          .attr('height', pH)
          .attr('pointer-events', 'none')
          .style('overflow', 'visible');

        nowFo
          .append('xhtml:div')
          .style('height', '20px')
          .style('padding', '4px 8px')
          .style('background', C.lineInside)
          .style('border-radius', '256px')
          .style('display', 'inline-flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('white-space', 'nowrap')
          .style('width', '100%')
          .append('xhtml:div')
          .style('color', 'white')
          .style('font-size', '11px')
          .style('font-family', 'Inter, sans-serif')
          .style('font-weight', '700')
          .style('line-height', '14.3px')
          .text(formatPairPrice(price));
      }
    }

    drawHLine({ y: maxY, color: C.minMaxLine, label: 'MAX', price: maxPrice });
    drawHLine({ y: cpY, color: C.nowLine, label: 'NOW', price: currentPrice, dashed: true });
    drawHLine({ y: minY, color: C.minMaxLine, label: 'MIN', price: minPrice });
  }, [minPrice, maxPrice, currentPrice, INNER_W, INNER_H, xScale, yScale, visibleData, activeRange, priceToY, dragBehaviors]);

  useEffect(() => {
    if (!tickSvgRef.current || TICK_IH <= 0) {
      return;
    }

    const svg = d3.select(tickSvgRef.current);
    svg.selectAll('*').remove();

    const minY = priceToY(minPrice);
    const maxY = priceToY(maxPrice);
    const clipMaxY = Math.max(0, Math.min(maxY, TICK_IH));
    const clipMinY = Math.max(0, Math.min(minY, TICK_IH));

    const defs = svg.append('defs');

    const inGrad = defs
      .append('linearGradient')
      .attr('id', 'tick-grad-in')
      .attr('x1', '1')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '0');
    inGrad.append('stop').attr('offset', '0%').attr('stop-color', C.tickInFill).attr('stop-opacity', C.tickInOpacityA);
    inGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', C.tickInFill)
      .attr('stop-opacity', C.tickInOpacityB);

    const outGrad = defs
      .append('linearGradient')
      .attr('id', 'tick-grad-out')
      .attr('x1', '1')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '0');
    outGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', C.tickOutFill)
      .attr('stop-opacity', C.tickOutOpacityA);
    outGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', C.tickOutFill)
      .attr('stop-opacity', C.tickOutOpacityB);

    defs
      .append('clipPath')
      .attr('id', 'clip-tick-in')
      .append('rect')
      .attr('x', 0)
      .attr('y', clipMaxY)
      .attr('width', TICK_IW)
      .attr('height', Math.max(0, clipMinY - clipMaxY));

    const outClip = defs.append('clipPath').attr('id', 'clip-tick-out');
    outClip.append('rect').attr('x', 0).attr('y', 0).attr('width', TICK_IW).attr('height', clipMaxY);
    outClip
      .append('rect')
      .attr('x', 0)
      .attr('y', clipMinY)
      .attr('width', TICK_IW)
      .attr('height', Math.max(0, TICK_IH - clipMinY));

    const g = svg.append('g').attr('transform', `translate(${TM.left},${TM.top})`);
    const liqMax = d3.max(tickData, d => d.liquidity) ?? 1;
    const xLiq = d3.scaleLinear().domain([0, liqMax]).range([TICK_IW, 0]);

    const liqArea = d3
      .area<TickPoint>()
      .x0(TICK_IW)
      .x1(d => xLiq(d.liquidity))
      .y(d => priceToY(d.price))
      .curve(d3.curveBasis);

    const liqLine = d3
      .line<TickPoint>()
      .x(d => xLiq(d.liquidity))
      .y(d => priceToY(d.price))
      .curve(d3.curveBasis);

    g.append('path')
      .datum(tickData)
      .attr('d', liqArea)
      .attr('fill', 'url(#tick-grad-out)')
      .attr('clip-path', 'url(#clip-tick-out)');
    g.append('path')
      .datum(tickData)
      .attr('d', liqLine)
      .attr('fill', 'none')
      .attr('stroke', C.tickOutStroke)
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .attr('clip-path', 'url(#clip-tick-out)');

    g.append('path')
      .datum(tickData)
      .attr('d', liqArea)
      .attr('fill', 'url(#tick-grad-in)')
      .attr('clip-path', 'url(#clip-tick-in)');
    g.append('path')
      .datum(tickData)
      .attr('d', liqLine)
      .attr('fill', 'none')
      .attr('stroke', C.tickInStroke)
      .attr('stroke-width', 2)
      .attr('opacity', 0.95)
      .attr('clip-path', 'url(#clip-tick-in)');
  }, [minPrice, maxPrice, tickData, TICK_IW, TICK_IH, priceToY]);

  return (
    <div className="w-full">
      <style>{`
        .lri-root {
          background: transparent;
          border-radius: 18px;
          width: 100%;
          user-select: none;
        }
        .lri-chart-row {
          background: transparent;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }
        .lri-main-chart {
          width: 100%;
          overflow: visible;
        }
        .lri-main-chart svg {
          display: block;
          width: 100%;
          overflow: visible;
          touch-action: none;
        }
        .lri-main-chart svg.is-band-dragging .band-hit {
          cursor: grabbing !important;
        }
        .lri-tick-panel {
          position: absolute;
          top: 0;
          right: 0;
          width: ${TICK_W}px;
          height: 100%;
          pointer-events: none;
        }
        .lri-tick-panel svg {
          display: block;
          width: 100%;
        }
        .lri-chart-row .pct-pill {
          opacity: 0;
          transition: opacity 200ms ease;
        }
        .lri-chart-row:hover .pct-pill {
          opacity: 1;
        }
        @media (max-width: 767px) {
          .lri-chart-row .pct-pill {
            opacity: 1;
          }
        }
      `}</style>

      <div className="lri-root">
        <div className="lri-chart-row" ref={wrapRef}>
          <div className={cn('lri-main-chart transition-opacity duration-200', loading ? 'opacity-0' : 'opacity-100')}>
            <svg
              ref={mainSvgRef}
              width={width}
              height={HEIGHT}
              style={{ width: '100%', height: HEIGHT }}
              viewBox={`0 0 ${width} ${HEIGHT}`}
              preserveAspectRatio="none"
            >
              <title>Pool price chart</title>
              <rect
                className="zoom-bg"
                transform={`translate(${ML.left},${ML.top})`}
                width={Math.max(0, width - ML.left - ML.right)}
                height={Math.max(0, INNER_H)}
                fill="transparent"
                style={{ cursor: INTERACTIVE ? 'crosshair' : 'default' }}
              />
            </svg>
          </div>

          <div className={cn('lri-tick-panel transition-opacity duration-200', loading ? 'opacity-0' : 'opacity-100')}>
            <svg
              ref={tickSvgRef}
              width={TICK_W}
              height={HEIGHT}
              style={{ width: '100%', height: HEIGHT }}
              viewBox={`0 0 ${TICK_W} ${HEIGHT}`}
              preserveAspectRatio="none"
            >
              <title>Pool tick liquidity chart</title>
            </svg>
          </div>

          {loading ? (
            <div className="absolute inset-0 z-10 pointer-events-none px-4 py-5">
              <div className="flex h-full w-full items-start justify-between gap-3">
                <div className="flex h-full flex-1 flex-col justify-between">
                  <Skeleton className="h-2 w-2/5 rounded-full" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-2 w-1/3 rounded-full self-end" />
                </div>
                <div className="flex h-full w-[80px] flex-col justify-center gap-2">
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-6 w-4/5 rounded-md" />
                  <Skeleton className="h-6 w-3/5 rounded-md" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {RANGES.map(range => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                className={cn(
                  `outline-none border-none shadow-none text-(length:--body-fine-print) px-2 py-1 h-[22px] font-['InterRegular']`,
                  activeRange === range.label ? `text-espresso font-['InterBold'] bg-cream-white` : '',
                )}
                onClick={() => setActiveRange(range.label)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <MinusCircleIcon
              className="w-4 h-4 text-clay cursor-pointer hover:text-espresso"
              onClick={INTERACTIVE ? zoomOut : undefined}
            />
            <Scan
              className="w-4 h-4 text-clay cursor-pointer hover:text-espresso"
              onClick={INTERACTIVE ? resetZoom : undefined}
            />
            <PlusCircleIcon
              className="w-4 h-4 text-clay cursor-pointer hover:text-espresso"
              onClick={INTERACTIVE ? zoomIn : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoolChart;
