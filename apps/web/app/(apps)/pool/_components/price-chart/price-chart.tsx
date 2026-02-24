'use client';

import type React from 'react';
import type { IChartApi, ISeriesApi, IPriceLine, UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { usePoolState } from '../../_stores/pool-store-provider';
import { mockChartData, MOCK_CURRENT_PRICE } from '../../_mocks';
import { TimePeriodSelector } from './time-period-selector';

export function PriceChart(): React.JSX.Element {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const minPriceLineRef = useRef<IPriceLine | null>(null);
  const maxPriceLineRef = useRef<IPriceLine | null>(null);

  const { chartPeriod, minPrice, maxPrice } = usePoolState();

  const chartData = useMemo(() => {
    const raw = mockChartData[chartPeriod] ?? mockChartData['1D'] ?? [];
    return raw.map(point => ({
      time: point.time as UTCTimestamp,
      value: point.value,
    }));
  }, [chartPeriod]);

  // Compute price change for the selected period
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return { absolute: 0, percentage: 0 };
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    if (!first || !last) return { absolute: 0, percentage: 0 };
    const absolute = last.value - first.value;
    const percentage = first.value !== 0 ? (absolute / first.value) * 100 : 0;
    return { absolute, percentage };
  }, [chartData]);

  const isPositive = priceChange.percentage >= 0;

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

  // Update price range lines when min/max change
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
  }, [minPrice, maxPrice]);

  // Resize observer
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
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
      {/* Header: current price + change */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-['InterRegular'] text-lg font-semibold text-espresso">
            ${MOCK_CURRENT_PRICE.toFixed(6)}
          </span>
          <span
            className={`font-['InterRegular'] text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}
          >
            {isPositive ? '+' : ''}
            {priceChange.absolute.toFixed(6)} ({isPositive ? '+' : ''}
            {priceChange.percentage.toFixed(2)}%)
          </span>
        </div>
        <TimePeriodSelector />
      </div>

      {/* Chart container */}
      <div ref={chartContainerRef} className="w-full h-48" />
    </div>
  );
}
