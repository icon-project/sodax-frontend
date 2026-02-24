/**
 * Mock price history data for the SODA/xSODA price chart.
 * Each entry represents a data point with time (unix seconds) and value.
 * Replace with real API data when available.
 */

export interface ChartDataPoint {
  time: number; // unix seconds
  value: number;
}

const BASE_PRICE = 0.79;
const now = Math.floor(Date.now() / 1000);
const DAY = 86400;

function generatePriceData(days: number, interval: number): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  const totalPoints = Math.floor((days * DAY) / interval);
  let price = BASE_PRICE;

  for (let i = totalPoints; i >= 0; i--) {
    const time = now - i * interval;
    // Random walk with mean reversion toward BASE_PRICE
    const drift = (BASE_PRICE - price) * 0.01;
    const noise = (Math.random() - 0.5) * 0.008;
    price = Math.max(0.65, Math.min(0.95, price + drift + noise));
    points.push({ time, value: Number(price.toFixed(6)) });
  }

  return points;
}

export const mockChartData: Record<string, ChartDataPoint[]> = {
  '1H': generatePriceData(1 / 24, 60),       // 1 hour, 1-min intervals
  '1D': generatePriceData(1, 300),            // 1 day, 5-min intervals
  '1W': generatePriceData(7, 3600),           // 1 week, 1-hour intervals
  '1M': generatePriceData(30, 14400),         // 1 month, 4-hour intervals
  '1Y': generatePriceData(365, DAY),          // 1 year, daily intervals
  ALL: generatePriceData(365 * 2, DAY * 2),   // 2 years, 2-day intervals
};

export const MOCK_CURRENT_PRICE = 0.790455;
