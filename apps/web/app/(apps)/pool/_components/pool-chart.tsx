// apps/web/app/(apps)/pool/_components/pool-chart.tsx
import type React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

function generateLiquidityData(
  currentPrice: number,
  numBins = 200,
  spread = 0.4,
): Array<{ price: number; liquidity: number }> {
  const data: Array<{ price: number; liquidity: number }> = [];
  const priceMin = currentPrice * (1 - spread);
  const priceMax = currentPrice * (1 + spread);
  const step = (priceMax - priceMin) / numBins;

  for (let i = 0; i < numBins; i++) {
    const price = priceMin + i * step;
    const distFromCurrent = Math.abs(price - currentPrice) / currentPrice;
    const base = Math.exp(-distFromCurrent * 8) * 100;
    const noise = (Math.random() - 0.5) * 10;
    const spike = Math.random() > 0.95 ? Math.random() * 30 : 0;
    const liquidity = Math.max(0, base + noise + spike);
    data.push({ price, liquidity });
  }
  return data;
}

const CURRENT_PRICE = 2485.32;
const ZOOM_LEVELS = [0.1, 0.2, 0.4, 0.8, 1.6];
const PERIODS = ['1D', '1W', '1M', '3M', 'ALL'] as const;
type Period = (typeof PERIODS)[number];

const zoomBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '8px',
  border: '1px solid #2A2A2A',
  background: '#1A1A1A',
  color: '#888',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
  fontFamily: 'monospace',
  lineHeight: 1,
};

export function PoolChart(): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(2);
  const [period, setPeriod] = useState<Period>('1M');
  const [rangeMin, setRangeMin] = useState<number>(CURRENT_PRICE * 0.85);
  const [rangeMax, setRangeMax] = useState<number>(CURRENT_PRICE * 1.15);
  const [dims, setDims] = useState({ width: 600, height: 220 });
  const rangeRef = useRef({ min: CURRENT_PRICE * 0.85, max: CURRENT_PRICE * 1.15 });

  const margin = { top: 20, right: 16, bottom: 32, left: 8 };

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const { width } = entries[0]?.contentRect ?? { width: 600 };
      setDims({ width, height: 220 });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback((): void => {
    if (!svgRef.current) return;

    const spread = ZOOM_LEVELS[zoomLevel] ?? 0.4;
    const rawData = generateLiquidityData(CURRENT_PRICE, 200, spread);
    const allData = rawData.map((d, i) => {
      const win = rawData.slice(Math.max(0, i - 3), Math.min(rawData.length, i + 4));
      const avg = win.reduce((s, v) => s + v.liquidity, 0) / win.length;
      return { price: d.price, liquidity: avg };
    });

    const W = dims.width - margin.left - margin.right;
    const H = dims.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', dims.width).attr('height', dims.height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xDomain = d3.extent(allData, d => d.price) as [number, number];
    const xScale = d3.scaleLinear().domain(xDomain).range([0, W]);
    const yScale = d3
      .scaleLinear()
      .domain([0, (d3.max(allData, d => d.liquidity) ?? 0) * 1.15])
      .range([H, 0]);

    const rMin = rangeRef.current.min;
    const rMax = rangeRef.current.max;

    // --- Defs ---
    const defs = svg.append('defs');

    const inGrad = defs
      .append('linearGradient')
      .attr('id', 'inAreaGrad')
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '1');
    inGrad.append('stop').attr('offset', '0%').attr('stop-color', '#FF007A').attr('stop-opacity', 0.4);
    inGrad.append('stop').attr('offset', '100%').attr('stop-color', '#FF007A').attr('stop-opacity', 0.02);

    const outGrad = defs
      .append('linearGradient')
      .attr('id', 'outAreaGrad')
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '1');
    outGrad.append('stop').attr('offset', '0%').attr('stop-color', '#4A4A4A').attr('stop-opacity', 0.3);
    outGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4A4A4A').attr('stop-opacity', 0.0);

    defs
      .append('clipPath')
      .attr('id', 'clipIn')
      .append('rect')
      .attr('x', xScale(rMin))
      .attr('y', 0)
      .attr('width', Math.max(0, xScale(rMax) - xScale(rMin)))
      .attr('height', H);

    const outClip = defs.append('clipPath').attr('id', 'clipOut');
    outClip
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', Math.max(0, xScale(rMin)))
      .attr('height', H);
    outClip
      .append('rect')
      .attr('x', xScale(rMax))
      .attr('y', 0)
      .attr('width', Math.max(0, W - xScale(rMax)))
      .attr('height', H);

    // --- Generators ---
    const area = d3
      .area<{ price: number; liquidity: number }>()
      .x(d => xScale(d.price))
      .y0(H)
      .y1(d => yScale(d.liquidity))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const line = d3
      .line<{ price: number; liquidity: number }>()
      .x(d => xScale(d.price))
      .y(d => yScale(d.liquidity))
      .curve(d3.curveCatmullRom.alpha(0.5));

    g.append('path')
      .datum(allData)
      .attr('d', area)
      .attr('fill', 'url(#outAreaGrad)')
      .attr('clip-path', 'url(#clipOut)');
    g.append('path')
      .datum(allData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#3A3A3A')
      .attr('stroke-width', 1.5)
      .attr('clip-path', 'url(#clipOut)');
    g.append('path').datum(allData).attr('d', area).attr('fill', 'url(#inAreaGrad)').attr('clip-path', 'url(#clipIn)');
    g.append('path')
      .datum(allData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#FF007A')
      .attr('stroke-width', 2)
      .attr('clip-path', 'url(#clipIn)');

    // Current price line
    const cpX = xScale(CURRENT_PRICE);
    g.append('line')
      .attr('x1', cpX)
      .attr('x2', cpX)
      .attr('y1', 0)
      .attr('y2', H)
      .attr('stroke', '#FF007A')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.6);
    g.append('text')
      .attr('x', cpX + 4)
      .attr('y', 10)
      .attr('fill', '#FF007A')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(`$${CURRENT_PRICE.toFixed(2)}`);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat(d => `$${d3.format(',.0f')(d as number)}`),
      )
      .call(ax => {
        ax.select('.domain').remove();
        ax.selectAll('.tick line').remove();
        ax.selectAll('.tick text').attr('fill', '#555').attr('font-size', '10px').attr('font-family', 'monospace');
      });

    // --- Helper: update clip paths when range changes ---
    function updateClips(newMin: number, newMax: number): void {
      svg
        .select('#clipIn rect')
        .attr('x', xScale(newMin))
        .attr('width', Math.max(0, xScale(newMax) - xScale(newMin)));
      const outRects = svg.select('#clipOut').selectAll<SVGRectElement, unknown>('rect');
      outRects.filter((_, i) => i === 0).attr('width', Math.max(0, xScale(newMin)));
      outRects
        .filter((_, i) => i === 1)
        .attr('x', xScale(newMax))
        .attr('width', Math.max(0, W - xScale(newMax)));
    }

    // --- LAYER 2: Custom pill handles (above brush) ---
    const HW = 12; // handle width

    function buildHandle(priceVal: number, isMin: boolean): d3.Selection<SVGGElement, unknown, null, undefined> {
      const handle = g
        .append('g')
        .attr('class', isMin ? 'custom-handle-min' : 'custom-handle-max')
        .attr('cursor', 'ew-resize')
        .attr('transform', `translate(${xScale(priceVal) - HW / 2}, 0)`);

      // vertical line
      handle
        .append('line')
        .attr('x1', HW / 2)
        .attr('x2', HW / 2)
        .attr('y1', 0)
        .attr('y2', H)
        .attr('stroke', '#FF007A')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7);

      // pill button
      handle
        .append('rect')
        .attr('x', 0)
        .attr('y', H / 2 - 18)
        .attr('width', HW)
        .attr('height', 36)
        .attr('rx', 6)
        .attr('fill', '#FF007A');

      handle
        .append('text')
        .attr('x', HW / 2)
        .attr('y', H / 2 + 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '9px')
        .text('◀▶');

      // price label
      handle
        .append('text')
        .attr('class', 'handle-label')
        .attr('x', isMin ? -4 : HW + 4)
        .attr('y', H / 2 - 24)
        .attr('text-anchor', isMin ? 'end' : 'start')
        .attr('fill', '#FF007A')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(`$${priceVal.toFixed(2)}`);

      // transparent wide hit area for easier grabbing
      handle
        .append('rect')
        .attr('x', -8)
        .attr('y', 0)
        .attr('width', HW + 16)
        .attr('height', H)
        .attr('fill', 'transparent');

      return handle;
    }

    const minHandleG = buildHandle(rMin, true);
    const maxHandleG = buildHandle(rMax, false);

    // --- LAYER 1: Brush (below handles) — crosshair drag to set range ---
    const brushG = g.append('g').attr('class', 'brush');
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [W, H],
      ])
      .on('brush end', (event: d3.D3BrushEvent<unknown>) => {
        if (!event.selection || event.sourceEvent?.type === 'drag') return;
        const [x0, x1] = event.selection as [number, number];
        const newMin = Math.max(xDomain[0], xScale.invert(x0));
        const newMax = Math.min(xDomain[1], xScale.invert(x1));
        rangeRef.current.min = newMin;
        rangeRef.current.max = newMax;
        setRangeMin(newMin);
        setRangeMax(newMax);
        updateClips(newMin, newMax);
        // move handles to new positions
        minHandleG.attr('transform', `translate(${xScale(newMin) - HW / 2}, 0)`);
        minHandleG.select('.handle-label').text(`$${newMin.toFixed(2)}`);
        maxHandleG.attr('transform', `translate(${xScale(newMax) - HW / 2}, 0)`);
        maxHandleG.select('.handle-label').text(`$${newMax.toFixed(2)}`);
      });

    brushG.call(brush as unknown as (sel: d3.Selection<SVGGElement, unknown, null, undefined>) => void);
    brushG.call(
      brush.move as unknown as (sel: d3.Selection<SVGGElement, unknown, null, undefined>, v: [number, number]) => void,
      [xScale(rMin), xScale(rMax)],
    );
    brushG.select('.selection').attr('fill', '#FF007A').attr('fill-opacity', 0.05).attr('stroke', 'none');
    brushG.selectAll('.handle').remove();
    brushG.select('.overlay').attr('cursor', 'crosshair');

    // Drag: only move horizontally, clamp to chart bounds
    function attachDrag(handle: d3.Selection<SVGGElement, unknown, null, undefined>, isMin: boolean): void {
      let startX = 0;
      let startPrice = 0;

      handle.call(
        d3
          .drag<SVGGElement, unknown>()
          .on('start', (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
            startX = event.x;
            startPrice = isMin ? rangeRef.current.min : rangeRef.current.max;
          })
          .on('drag', (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
            // convert pixel delta → price delta
            const dx = event.x - startX;
            const pxPerPrice = W / (xDomain[1] - xDomain[0]);
            const newPrice = Math.max(xDomain[0], Math.min(xDomain[1], startPrice + dx / pxPerPrice));

            if (isMin) {
              const safe = Math.min(newPrice, rangeRef.current.max - 1);
              rangeRef.current.min = safe;
              setRangeMin(safe);
              handle.attr('transform', `translate(${xScale(safe) - HW / 2}, 0)`);
              handle.select('.handle-label').text(`$${safe.toFixed(2)}`);
              updateClips(safe, rangeRef.current.max);
              // sync brush selection
              brushG.call(
                brush.move as unknown as (
                  sel: d3.Selection<SVGGElement, unknown, null, undefined>,
                  v: [number, number],
                ) => void,
                [xScale(safe), xScale(rangeRef.current.max)],
              );
            } else {
              const safe = Math.max(newPrice, rangeRef.current.min + 1);
              rangeRef.current.max = safe;
              setRangeMax(safe);
              handle.attr('transform', `translate(${xScale(safe) - HW / 2}, 0)`);
              handle.select('.handle-label').text(`$${safe.toFixed(2)}`);
              updateClips(rangeRef.current.min, safe);
              brushG.call(
                brush.move as unknown as (
                  sel: d3.Selection<SVGGElement, unknown, null, undefined>,
                  v: [number, number],
                ) => void,
                [xScale(rangeRef.current.min), xScale(safe)],
              );
            }
          }),
      );
    }

    attachDrag(minHandleG, true);
    attachDrag(maxHandleG, false);
  }, [dims, zoomLevel]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleZoomIn = (): void => setZoomLevel(z => Math.max(0, z - 1));
  const handleZoomOut = (): void => setZoomLevel(z => Math.min(ZOOM_LEVELS.length - 1, z + 1));
  const priceInRange = CURRENT_PRICE >= rangeMin && CURRENT_PRICE <= rangeMax;

  return (
    <div
      style={{
        background: '#0D0D0D',
        borderRadius: '20px',
        padding: '24px',
        fontFamily: 'monospace',
        color: '#fff',
        maxWidth: '700px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: '#888', letterSpacing: '0.05em' }}>LIQUIDITY RANGE</span>
        <div
          style={{ display: 'inline-flex', background: '#1A1A1A', borderRadius: '10px', padding: '3px', gap: '2px' }}
        >
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              type="button"
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: 'none',
                background: period === p ? '#FF007A' : 'transparent',
                color: period === p ? '#fff' : '#555',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'monospace',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '12px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: priceInRange ? 'rgba(255,0,122,0.1)' : 'rgba(255,100,0,0.1)',
            border: `1px solid ${priceInRange ? '#FF007A44' : '#FF640044'}`,
            fontSize: '11px',
            color: priceInRange ? '#FF007A' : '#FF6400',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: priceInRange ? '#FF007A' : '#FF6400',
              display: 'inline-block',
            }}
          />
          {priceInRange ? 'Current price in range' : 'Current price out of range'}
        </span>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
        <svg ref={svgRef} style={{ overflow: 'visible', display: 'block' }} />
      </div>

      {/* Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
        <span style={{ fontSize: '11px', color: '#555' }}>ZOOM</span>
        <button
          onClick={handleZoomIn}
          type="button"
          style={zoomBtnStyle}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#2A2A2A';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#1A1A1A';
          }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          type="button"
          style={zoomBtnStyle}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#2A2A2A';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#1A1A1A';
          }}
        >
          −
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '10px', color: '#444' }}>
          ±{((ZOOM_LEVELS[zoomLevel] ?? 0.4) * 100).toFixed(0)}% range
        </span>
      </div>

      {/* Range inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
        {(
          [
            {
              label: 'MIN PRICE',
              value: rangeMin,
              setter: (v: number) => {
                rangeRef.current.min = v;
                setRangeMin(v);
                draw();
              },
            },
            {
              label: 'MAX PRICE',
              value: rangeMax,
              setter: (v: number) => {
                rangeRef.current.max = v;
                setRangeMax(v);
                draw();
              },
            },
          ] as const
        ).map(({ label, value, setter }) => (
          <div
            key={label}
            style={{ background: '#1A1A1A', borderRadius: '12px', padding: '12px 14px', border: '1px solid #222' }}
          >
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '6px', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#555', fontSize: '13px' }}>$</span>
              <input
                type="number"
                value={value.toFixed(2)}
                onChange={e => {
                  const num = Number.parseFloat(e.target.value);
                  if (!Number.isNaN(num)) setter(num);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF007A',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>ETH per USDC</div>
          </div>
        ))}
      </div>
    </div>
  );
}
