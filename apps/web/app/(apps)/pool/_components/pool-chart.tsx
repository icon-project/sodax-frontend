import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MinusCircleIcon, PlusCircleIcon, RefreshCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PricePoint = {
  time: number;
  price: number;
};

type TickPoint = {
  price: number;
  liquidity: number;
};

function generateETHData(): PricePoint[] {
  const data: PricePoint[] = [];
  let price = 2800;
  const now = Date.now();

  for (let i = 730; i >= 0; i--) {
    price += (Math.random() - 0.47) * 55;
    price = Math.max(1200, Math.min(4800, price));
    data.push({ time: now - i * 24 * 60 * 60 * 1000, price: +price.toFixed(2) });
  }

  return data;
}

function generateTickData(currentPrice: number, count = 80): TickPoint[] {
  const ticks: TickPoint[] = [];
  const spread = currentPrice * 0.6;

  for (let i = 0; i < count; i++) {
    const tickPrice = currentPrice - spread / 2 + (i / count) * spread;
    const dist = Math.abs(tickPrice - currentPrice) / (spread * 0.25);
    const liq = Math.exp(-0.5 * dist * dist) * (0.6 + Math.random() * 0.4);
    ticks.push({ price: tickPrice, liquidity: liq });
  }

  return ticks;
}

const ALL_DATA = generateETHData();
const LATEST_POINT: PricePoint = ALL_DATA[ALL_DATA.length - 1] ?? { time: Date.now(), price: 2800 };
const CURRENT_PRICE = LATEST_POINT.price;
const NOW = LATEST_POINT.time;
const TICK_DATA = generateTickData(CURRENT_PRICE);

const C = {
  lineInside: '#483534',
  lineOutside: '#8E7E7D',
  lineWidthIn: 3,
  lineWidthOut: 1.5,
  nowLine: '#B9ACAB',
  minMaxLine: '#D7CDCB',
  bandFill: '#EDE6E6',
  bandOpacityTop: 0.18,
  bandOpacityBot: 0.1,
  textDim: '#8E7E7D',
  tickInStroke: 'transparent',
  tickOutStroke: 'transparent',
  tickInFill: '#B9ACAB',
  tickInOpacityA: 0.55,
  tickInOpacityB: 0.04,
  tickOutFill: '#EDE6E6',
  tickOutOpacityA: 0.55,
  tickOutOpacityB: 0.04,
  handleCircle: 'white',
  handleGrip: '#B9ACAB',
} as const;

const RANGES = [
  { label: '1D', ms: 1 * 86400000 },
  { label: '1W', ms: 7 * 86400000 },
  { label: '1M', ms: 30 * 86400000 },
  { label: '1Y', ms: 365 * 86400000 },
  { label: 'All', ms: null },
] as const;

const HEIGHT = 132;
const ML = { top: 24, right: 16, bottom: 8, left: 16 };
const TICK_W = 90;
const TM = { top: 20, right: 8, bottom: 36, left: 4 };

export function PoolChart(): React.JSX.Element {
  const mainSvgRef = useRef<SVGSVGElement | null>(null);
  const tickSvgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const zoomBehRef = useRef<d3.Selection<SVGRectElement, unknown, null, undefined> | null>(null);
  const zoomObjRef = useRef<d3.ZoomBehavior<SVGRectElement, unknown> | null>(null);

  const [minPrice, setMinPrice] = useState<number>(+(CURRENT_PRICE * 0.85).toFixed(2));
  const [maxPrice, setMaxPrice] = useState<number>(+(CURRENT_PRICE * 1.15).toFixed(2));
  const [activeRange, setActiveRange] = useState<(typeof RANGES)[number]['label']>('1M');
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [width, setWidth] = useState<number>(700);

  const draggingRef = useRef<'min' | 'max' | 'band' | null>(null);
  const dragDataRef = useRef<{
    anchorY: number;
    anchorMin: number;
    anchorMax: number;
    span: number;
    pxPerPrice: number;
  } | null>(null);

  const INNER_W = width - ML.left - ML.right;
  const INNER_H = HEIGHT - ML.top - ML.bottom;
  const TICK_IH = HEIGHT - TM.top - TM.bottom;
  const TICK_IW = TICK_W - TM.left - TM.right;

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
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
    const range = RANGES.find((item) => item.label === activeRange);
    if (!range || range.ms === null) {
      return ALL_DATA;
    }

    return ALL_DATA.filter((d) => d.time >= NOW - range.ms);
  }, [activeRange]);

  const xScaleBase = useMemo(
    () =>
      d3
        .scaleTime<number, number>()
        .domain(d3.extent(visibleData, (d) => d.time) as [number, number])
        .range([0, INNER_W]),
    [visibleData, INNER_W]
  );

  const xScale = useMemo(() => zoomTransform.rescaleX(xScaleBase), [zoomTransform, xScaleBase]);

  const priceMin = d3.min(visibleData, (d) => d.price) ?? 0;
  const priceMax = d3.max(visibleData, (d) => d.price) ?? 0;
  const pad = (priceMax - priceMin) * 0.3;
  const yDomainMin = Math.min(priceMin - pad, minPrice - 80);
  const yDomainMax = Math.max(priceMax + pad, maxPrice + 80);

  const yScale = useMemo(
    () => d3.scaleLinear().domain([yDomainMin, yDomainMax]).range([INNER_H, 0]),
    [yDomainMin, yDomainMax, INNER_H]
  );

  const clamp = useCallback((v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v)), []);
  const priceToY = useCallback((p: number) => clamp(yScale(p), 0, INNER_H), [yScale, INNER_H, clamp]);

  useEffect(() => {
    void activeRange;
    if (zoomBehRef.current && zoomObjRef.current) {
      zoomBehRef.current.call(zoomObjRef.current.transform, d3.zoomIdentity);
    }
  }, [activeRange]);

  useEffect(() => {
    if (!mainSvgRef.current || INNER_W <= 0) {
      return;
    }

    const zoom = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([0.5, 20])
      .translateExtent([
        [0, 0],
        [INNER_W, INNER_H],
      ])
      .extent([
        [0, 0],
        [INNER_W, INNER_H],
      ])
      .on('zoom', (event) => setZoomTransform(event.transform));

    zoomObjRef.current = zoom;
    const bg = d3.select(mainSvgRef.current).select<SVGRectElement>('.zoom-bg');
    bg.call(zoom).on('dblclick.zoom', null);
    zoomBehRef.current = bg;
  }, [INNER_W, INNER_H]);

  useEffect(() => {
    if (!mainSvgRef.current || INNER_W <= 0) {
      return;
    }

    const svg = d3.select(mainSvgRef.current);
    svg.selectAll('defs').remove();
    svg.selectAll('.chart-content').remove();

    const minY = priceToY(minPrice);
    const maxY = priceToY(maxPrice);
    const cpY = priceToY(CURRENT_PRICE);

    const defs = svg.append('defs');

    const bandGrad = defs
      .append('linearGradient')
      .attr('id', 'g-band')
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '1');
    bandGrad.append('stop').attr('offset', '0%').attr('stop-color', C.bandFill).attr('stop-opacity', C.bandOpacityTop);
    bandGrad.append('stop').attr('offset', '100%').attr('stop-color', C.bandFill).attr('stop-opacity', C.bandOpacityBot);

    const glow = defs.append('filter').attr('id', 'glow-f');
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'b');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'b');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    defs.append('clipPath').attr('id', 'clip-band-in').append('rect').attr('x', 0).attr('y', maxY).attr('width', INNER_W).attr('height', Math.max(0, minY - maxY));

    const outClip = defs.append('clipPath').attr('id', 'clip-band-out');
    outClip.append('rect').attr('x', 0).attr('y', 0).attr('width', INNER_W).attr('height', maxY);
    outClip.append('rect').attr('x', 0).attr('y', minY).attr('width', INNER_W).attr('height', Math.max(0, INNER_H - minY));

    const g = svg
      .append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${ML.left},${ML.top})`);

    g.append('rect')
      .attr('class', 'band-hit')
      .attr('x', 0)
      .attr('y', maxY)
      .attr('width', INNER_W)
      .attr('height', Math.max(0, minY - maxY))
      .attr('fill', 'url(#g-band)')
      .attr('pointer-events', 'all')
      .style('cursor', 'ns-resize');

    const line = d3
      .line<PricePoint>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.price))
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
      .attr('filter', 'url(#glow-f)')
      .attr('clip-path', 'url(#clip-band-in)');

    g.append('g')
      .attr('transform', 'translate(0,0)')
      .call(d3.axisTop(xScale).ticks(5).tickFormat((d) => d3.timeFormat(activeRange === '1D' ? '%H:%M' : '%b %d')(new Date(d as number))))
      .call((a) => a.select('.domain').remove())
      .call((a) => a.selectAll('line').remove())
      .call((a) =>
        a
          .selectAll('text')
          .attr('fill', C.textDim)
          .attr('font-family', "'JetBrains Mono',monospace")
          .attr('font-size', '9px')
          .attr('dy', '-4px')
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

      grp.append('line')
        .attr('x1', 0)
        .attr('x2', INNER_W)
        .attr('stroke', color)
        .attr('stroke-width', dashed ? 1 : 2)
        .attr('stroke-dasharray', dashed ? '5 4' : 'none')
        .attr('opacity', dashed ? 0.8 : 0.9)
        .attr('pointer-events', 'none');

      if (!dashed) {
        const pct = ((price - CURRENT_PRICE) / CURRENT_PRICE) * 100;
        const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
        const cx = INNER_W / 2;

        const badgeH = 20;
        const badgeW = 70;
        const badgeX = cx - badgeW / 2 - 28;
        const fo = grp
          .append('foreignObject')
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

        grp.append('rect')
          .attr('x', iconX)
          .attr('y', iconY)
          .attr('width', iconW)
          .attr('height', iconH)
          .attr('fill', 'transparent')
          .attr('class', label === 'MAX' ? 'hit-max' : 'hit-min')
          .style('cursor', 'ns-resize');

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

        icon.append('circle').attr('cx', '20').attr('cy', '18').attr('r', '12').attr('fill', C.handleCircle).attr('filter', `url(#${fid})`);
        icon.append('path').attr('d', 'M14 16H26').attr('stroke', C.handleGrip).attr('stroke-linecap', 'round');
        icon.append('path').attr('d', 'M14 20H26').attr('stroke', C.handleGrip).attr('stroke-linecap', 'round');
      }

      if (dashed) {
        const pH = 20;
        const pW = 90;
        const pX = INNER_W - pW - 8;
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
          .text(`$${d3.format(',.2f')(price)}`);
      }
    }

    drawHLine({ y: maxY, color: C.minMaxLine, label: 'MAX', price: maxPrice });
    drawHLine({ y: cpY, color: C.nowLine, label: 'NOW', price: CURRENT_PRICE, dashed: true });
    drawHLine({ y: minY, color: C.minMaxLine, label: 'MIN', price: minPrice });
  }, [minPrice, maxPrice, INNER_W, INNER_H, xScale, yScale, visibleData, activeRange, priceToY]);

  useEffect(() => {
    if (!tickSvgRef.current || TICK_IH <= 0) {
      return;
    }

    const svg = d3.select(tickSvgRef.current);
    svg.selectAll('*').remove();

    const minY = priceToY(minPrice);
    const maxY = priceToY(maxPrice);

    const defs = svg.append('defs');

    const inGrad = defs
      .append('linearGradient')
      .attr('id', 'tick-grad-in')
      .attr('x1', '1')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '0');
    inGrad.append('stop').attr('offset', '0%').attr('stop-color', C.tickInFill).attr('stop-opacity', C.tickInOpacityA);
    inGrad.append('stop').attr('offset', '100%').attr('stop-color', C.tickInFill).attr('stop-opacity', C.tickInOpacityB);

    const outGrad = defs
      .append('linearGradient')
      .attr('id', 'tick-grad-out')
      .attr('x1', '1')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '0');
    outGrad.append('stop').attr('offset', '0%').attr('stop-color', C.tickOutFill).attr('stop-opacity', C.tickOutOpacityA);
    outGrad.append('stop').attr('offset', '100%').attr('stop-color', C.tickOutFill).attr('stop-opacity', C.tickOutOpacityB);

    defs.append('clipPath').attr('id', 'clip-tick-in').append('rect').attr('x', 0).attr('y', maxY).attr('width', TICK_IW).attr('height', Math.max(0, minY - maxY));

    const outClip = defs.append('clipPath').attr('id', 'clip-tick-out');
    outClip.append('rect').attr('x', 0).attr('y', 0).attr('width', TICK_IW).attr('height', maxY);
    outClip.append('rect').attr('x', 0).attr('y', minY).attr('width', TICK_IW).attr('height', Math.max(0, TICK_IH - minY));

    const g = svg.append('g').attr('transform', `translate(${TM.left},${TM.top})`);
    const liqMax = d3.max(TICK_DATA, (d) => d.liquidity) ?? 1;
    const xLiq = d3.scaleLinear().domain([0, liqMax]).range([TICK_IW, 0]);

    const liqArea = d3
      .area<TickPoint>()
      .x0(TICK_IW)
      .x1((d) => xLiq(d.liquidity))
      .y((d) => priceToY(d.price))
      .curve(d3.curveBasis);

    const liqLine = d3
      .line<TickPoint>()
      .x((d) => xLiq(d.liquidity))
      .y((d) => priceToY(d.price))
      .curve(d3.curveBasis);

    g.append('path').datum(TICK_DATA).attr('d', liqArea).attr('fill', 'url(#tick-grad-out)').attr('clip-path', 'url(#clip-tick-out)');
    g.append('path')
      .datum(TICK_DATA)
      .attr('d', liqLine)
      .attr('fill', 'none')
      .attr('stroke', C.tickOutStroke)
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .attr('clip-path', 'url(#clip-tick-out)');

    g.append('path').datum(TICK_DATA).attr('d', liqArea).attr('fill', 'url(#tick-grad-in)').attr('clip-path', 'url(#clip-tick-in)');
    g.append('path')
      .datum(TICK_DATA)
      .attr('d', liqLine)
      .attr('fill', 'none')
      .attr('stroke', C.tickInStroke)
      .attr('stroke-width', 2)
      .attr('opacity', 0.95)
      .attr('clip-path', 'url(#clip-tick-in)');
  }, [minPrice, maxPrice, TICK_IW, TICK_IH, priceToY]);

  useEffect(() => {
    const svgEl = mainSvgRef.current;
    if (!svgEl) {
      return;
    }

    const getHit = (event: Event): 'min' | 'max' | 'band' | null => {
      const target = event.target;
      if (!(target instanceof SVGElement)) {
        return null;
      }
      if (target.classList.contains('hit-max')) {
        return 'max';
      }
      if (target.classList.contains('hit-min')) {
        return 'min';
      }
      if (target.classList.contains('band-hit')) {
        return 'band';
      }
      return null;
    };

    const getY = (event: MouseEvent | TouchEvent): number => {
      const rect = svgEl.getBoundingClientRect();
      const cy = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;
      return cy - rect.top - ML.top;
    };

    const onDown = (event: MouseEvent | TouchEvent): void => {
      const hit = getHit(event);
      if (!hit) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
      draggingRef.current = hit;

      if (hit === 'band') {
        dragDataRef.current = {
          anchorY: getY(event),
          anchorMin: minPrice,
          anchorMax: maxPrice,
          span: maxPrice - minPrice,
          pxPerPrice: INNER_H / (yDomainMax - yDomainMin),
        };
      }
    };

    const onMove = (event: MouseEvent | TouchEvent): void => {
      if (!draggingRef.current) {
        return;
      }

      event.preventDefault();
      const rect = svgEl.getBoundingClientRect();
      const cy = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;
      const y = cy - rect.top - ML.top;
      const p = yScale.invert(Math.max(0, Math.min(INNER_H, y)));

      if (draggingRef.current === 'min') {
        setMinPrice(+(Math.min(p, CURRENT_PRICE - 20)).toFixed(2));
      } else if (draggingRef.current === 'max') {
        setMaxPrice(+(Math.max(p, CURRENT_PRICE + 20)).toFixed(2));
      } else if (draggingRef.current === 'band' && dragDataRef.current) {
        const dd = dragDataRef.current;
        const priceDelta = (y - dd.anchorY) / dd.pxPerPrice;
        const newMin = +(dd.anchorMin - priceDelta).toFixed(2);
        setMinPrice(newMin);
        setMaxPrice(+(newMin + dd.span).toFixed(2));
      }
    };

    const onUp = (): void => {
      draggingRef.current = null;
      dragDataRef.current = null;
    };

    svgEl.addEventListener('mousedown', onDown, { capture: true });
    svgEl.addEventListener('mousemove', onMove, { capture: true, passive: false });
    svgEl.addEventListener('mouseup', onUp, { capture: true });
    svgEl.addEventListener('touchstart', onDown, { capture: true, passive: false });
    svgEl.addEventListener('touchmove', onMove, { capture: true, passive: false });
    svgEl.addEventListener('touchend', onUp, { capture: true });

    return () => {
      svgEl.removeEventListener('mousedown', onDown, { capture: true });
      svgEl.removeEventListener('mousemove', onMove, { capture: true });
      svgEl.removeEventListener('mouseup', onUp, { capture: true });
      svgEl.removeEventListener('touchstart', onDown, { capture: true });
      svgEl.removeEventListener('touchmove', onMove, { capture: true });
      svgEl.removeEventListener('touchend', onUp, { capture: true });
    };
  }, [yScale, minPrice, maxPrice, INNER_H, yDomainMin, yDomainMax]);

  const doZoom = useCallback((factor: number) => {
    if (zoomBehRef.current && zoomObjRef.current) {
      zoomBehRef.current.transition().duration(300).call(zoomObjRef.current.scaleBy, factor);
    }
  }, []);

  const doResetZoom = useCallback(() => {
    if (zoomBehRef.current && zoomObjRef.current) {
      zoomBehRef.current.transition().duration(300).call(zoomObjRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  return (
    <div className="w-full">
      <style>{`
        .lri-root {
          background: transparent;
          border-radius: 18px;
          width: 100%;
          user-select: none;
        }
        .lri-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }
        .lri-range-btns {
          display: flex;
          gap: 4px;
        }
        .lri-rbtn {
          padding: 5px 12px;
          border-radius: 6px;
          background: #f8f3f3;
          border: 1px solid #d8caca;
          color: #8e7e7d;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.5px;
        }
        .lri-rbtn:hover {
          border-color: #554341;
          color: #554341;
        }
        .lri-rbtn.active {
          background: #ede6e6;
          border-color: #554341;
          color: #554341;
        }
        .lri-zoom-btns {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .lri-zbtn {
          width: 30px;
          height: 28px;
          border-radius: 6px;
          background: #f8f3f3;
          border: 1px solid #d8caca;
          color: #8e7e7d;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .lri-zbtn:hover {
          border-color: #554341;
          color: #554341;
          background: #ede6e6;
        }
        .lri-zbtn.reset {
          font-size: 9px;
          width: auto;
          padding: 0 10px;
          letter-spacing: 0.5px;
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
      `}</style>

      <div className="lri-root">
        <div className="lri-chart-row" ref={wrapRef}>
          <div className="lri-main-chart">
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
                style={{ cursor: 'crosshair' }}
              />
            </svg>
          </div>

          <div className="lri-tick-panel">
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
        </div>

        <div className="lri-toolbar">
          <div className="lri-range-btns">
            {RANGES.map((range) => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                className={cn('outline-none border-none shadow-none text-(length:--body-fine-print) px-2 py-1 h-[22px]', activeRange === range.label ? 'text-espresso font-bold bg-cream-white' : '')}
                onClick={() => setActiveRange(range.label)}
              >{range.label}</Button>
            ))}
          </div>
          <div className="lri-zoom-btns">
              <MinusCircleIcon className="w-4 h-4 text-clay cursor-pointer hover:text-espresso" onClick={() => doZoom(1 / 1.5)}/>
              <RefreshCcwIcon className="w-4 h-4 text-clay cursor-pointer hover:text-espresso" onClick={doResetZoom}/>
              <PlusCircleIcon className="w-4 h-4 text-clay cursor-pointer hover:text-espresso" onClick={() => doZoom(1.5)}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoolChart;
