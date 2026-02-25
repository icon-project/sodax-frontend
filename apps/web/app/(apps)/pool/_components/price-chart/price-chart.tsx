'use client';

import type React from 'react';
import type { IChartApi, ISeriesApi, IPriceLine, UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { usePoolContext } from '../../_hooks/usePoolContext';
import { mockChartData } from '../../_mocks';
import { TimePeriodSelector } from './time-period-selector';
import { RangeHandle } from './range-handle';
import { TickDistribution } from './tick-distribution';
import { useTickLiquidityDistribution } from '@sodax/dapp-kit';

export function PriceChart(): React.JSX.Element {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const minPriceLineRef = useRef<IPriceLine | null>(null);
  const maxPriceLineRef = useRef<IPriceLine | null>(null);

  const { chartPeriod, minPrice, maxPrice } = usePoolState();
  const { setMinPrice, setMaxPrice } = usePoolActions();
  const { poolData, selectedPoolKey } = usePoolContext();

  // Fetch tick liquidity distribution for the selected pool
  const { data: tickDistribution, isLoading: isTickLoading } = useTickLiquidityDistribution({
    poolKey: selectedPoolKey,
  });

  // Handle Y positions for draggable range overlays
  const [minHandleY, setMinHandleY] = useState<number | null>(null);
  const [maxHandleY, setMaxHandleY] = useState<number | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Use real price from pool data, fallback to 0
  const currentPrice = poolData?.price ? Number(poolData.price.toSignificant(6)) : 0;

  // Set default ±5% range when pool data first loads
  useEffect(() => {
    if (currentPrice > 0 && !minPrice && !maxPrice) {
      setMinPrice((currentPrice * 0.95).toFixed(4));
      setMaxPrice((currentPrice * 1.05).toFixed(4));
    }
  }, [currentPrice, minPrice, maxPrice, setMinPrice, setMaxPrice]);

  const chartData = useMemo(() => {
    const raw = mockChartData[chartPeriod] ?? mockChartData['1D'] ?? [];
    return raw.map(point => ({
      time: point.time as UTCTimestamp,
      value: point.value,
    }));
  }, [chartPeriod]);

  const initChart = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!chartContainerRef.current) return;

    const { createChart, AreaSeries, ColorType, CrosshairMode } = await import('lightweight-charts');

    // Destroy existing chart if present
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      minPriceLineRef.current = null;
      maxPriceLineRef.current = null;
    }

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8e7e7d',
        fontFamily: 'InterRegular, Inter, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(185, 172, 171, 0.12)', style: 2 },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: 'rgba(185, 172, 171, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#a55c55',
        },
        horzLine: {
          color: 'rgba(185, 172, 171, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#a55c55',
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: chartPeriod === '1H' || chartPeriod === '1D',
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#A55C55',
      topColor: 'rgba(165, 92, 85, 0.2)',
      bottomColor: 'rgba(165, 92, 85, 0.02)',
      lineWidth: 2,
      crosshairMarkerBackgroundColor: '#A55C55',
      crosshairMarkerBorderColor: '#ede6e6',
      crosshairMarkerRadius: 4,
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
    });

    series.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;
  }, [chartData, chartPeriod]);

  // Initialize chart on mount
  useEffect(() => {
    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        minPriceLineRef.current = null;
        maxPriceLineRef.current = null;
      }
    };
  }, [initChart]);

  // Update price range lines + force chart to include min/max in visible range
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove old lines
    if (minPriceLineRef.current) {
      series.removePriceLine(minPriceLineRef.current);
      minPriceLineRef.current = null;
    }
    if (maxPriceLineRef.current) {
      series.removePriceLine(maxPriceLineRef.current);
      maxPriceLineRef.current = null;
    }

    const minVal = Number.parseFloat(minPrice);
    const maxVal = Number.parseFloat(maxPrice);

    if (minPrice && !Number.isNaN(minVal) && minVal > 0) {
      minPriceLineRef.current = series.createPriceLine({
        price: minVal,
        color: 'rgba(165, 92, 85, 0.6)',
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: 'Min',
      });
    }

    if (maxPrice && !Number.isNaN(maxVal) && maxVal > 0) {
      maxPriceLineRef.current = series.createPriceLine({
        price: maxVal,
        color: 'rgba(165, 92, 85, 0.6)',
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: 'Max',
      });
    }

    // Extend auto-scale to always include min/max prices with padding
    // This ensures range handles are never off-screen
    series.applyOptions({
      autoscaleInfoProvider: ((
        original: () => {
          priceRange: { minValue: number; maxValue: number };
          margins?: { above: number; below: number };
        } | null,
      ) => {
        const res = original();
        if (res !== null) {
          if (!Number.isNaN(minVal) && minVal > 0) {
            res.priceRange.minValue = Math.min(res.priceRange.minValue, minVal);
          }
          if (!Number.isNaN(maxVal) && maxVal > 0) {
            res.priceRange.maxValue = Math.max(res.priceRange.maxValue, maxVal);
          }
          // Add 5% padding so handles aren't at the very edge
          const range = res.priceRange.maxValue - res.priceRange.minValue;
          const padding = range * 0.05;
          res.priceRange.minValue -= padding;
          res.priceRange.maxValue += padding;
        }
        return res;
      }) as Parameters<typeof series.applyOptions>[0]['autoscaleInfoProvider'],
    });
  }, [minPrice, maxPrice]);

  // Sync store min/max prices → handle Y positions
  const syncHandlePositions = useCallback(() => {
    const series = seriesRef.current;
    if (!series) return;

    const minVal = Number.parseFloat(minPrice);
    const maxVal = Number.parseFloat(maxPrice);

    if (minPrice && !Number.isNaN(minVal) && minVal > 0) {
      const y = series.priceToCoordinate(minVal);
      setMinHandleY(y ?? null);
    } else {
      setMinHandleY(null);
    }

    if (maxPrice && !Number.isNaN(maxVal) && maxVal > 0) {
      const y = series.priceToCoordinate(maxVal);
      setMaxHandleY(y ?? null);
    } else {
      setMaxHandleY(null);
    }
  }, [minPrice, maxPrice]);

  useEffect(() => {
    syncHandlePositions();
  }, [syncHandlePositions]);

  // Also resync after chart init / data change (coordinates change when chart redraws)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = () => syncHandlePositions();
    chart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
    };
  }, [syncHandlePositions]);

  // Drag handlers: convert Y coordinate back to price
  const handleMinDrag = useCallback(
    (y: number) => {
      const series = seriesRef.current;
      if (!series) return;
      setMinHandleY(y);
      const price = series.coordinateToPrice(y);
      if (price != null && Number.isFinite(price as number)) {
        setMinPrice((price as number).toFixed(4));
      }
    },
    [setMinPrice],
  );

  const handleMaxDrag = useCallback(
    (y: number) => {
      const series = seriesRef.current;
      if (!series) return;
      setMaxHandleY(y);
      const price = series.coordinateToPrice(y);
      if (price != null && Number.isFinite(price as number)) {
        setMaxPrice((price as number).toFixed(4));
      }
    },
    [setMaxPrice],
  );

  const handleDragEnd = useCallback(() => {
    // Resync to snap handles to exact price positions
    syncHandlePositions();
  }, [syncHandlePositions]);

  // Compute percentage from current price
  const minPercentage = useMemo(() => {
    const minVal = Number.parseFloat(minPrice);
    if (!minPrice || Number.isNaN(minVal) || currentPrice === 0) return '';
    return (((minVal - currentPrice) / currentPrice) * 100).toFixed(2);
  }, [minPrice, currentPrice]);

  const maxPercentage = useMemo(() => {
    const maxVal = Number.parseFloat(maxPrice);
    if (!maxPrice || Number.isNaN(maxVal) || currentPrice === 0) return '';
    return (((maxVal - currentPrice) / currentPrice) * 100).toFixed(2);
  }, [maxPrice, currentPrice]);

  // Resize observer
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      setContainerHeight(height);
      if (chartRef.current && width > 0 && height > 0) {
        chartRef.current.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Chart container with range handle overlays */}
      <div className="relative w-full h-48 lg:h-72">
        <div ref={chartContainerRef} className="absolute inset-0 right-8" />

        {/* Tick liquidity distribution (right side) */}
        <TickDistribution distribution={tickDistribution} containerHeight={containerHeight} isLoading={isTickLoading} />

        {/* Current price bubble */}
        {currentPrice > 0 && (
          <div className="absolute right-9 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-espresso z-10">
            <span className="font-['InterRegular'] text-[11px] text-cream-white font-medium">
              {currentPrice.toFixed(6)}
            </span>
          </div>
        )}

        {/* Draggable range handles */}
        <RangeHandle
          y={maxHandleY ?? 0}
          percentage={maxPercentage}
          variant="upper"
          onDrag={handleMaxDrag}
          onDragEnd={handleDragEnd}
          containerHeight={containerHeight}
          visible={maxHandleY != null && maxPercentage !== ''}
        />
        <RangeHandle
          y={minHandleY ?? 0}
          percentage={minPercentage}
          variant="lower"
          onDrag={handleMinDrag}
          onDragEnd={handleDragEnd}
          containerHeight={containerHeight}
          visible={minHandleY != null && minPercentage !== ''}
        />
      </div>

      {/* Tools bar below chart */}
      <div className="flex items-center justify-between">
        <TimePeriodSelector />
      </div>
    </div>
  );
}
