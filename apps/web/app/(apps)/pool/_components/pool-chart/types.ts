export type PricePoint = {
  time: number;
  price: number;
};

export type TickPoint = {
  price: number;
  liquidity: number;
};

export type LiquidityBucket = {
  tick_lower: number;
  tick_upper: number;
  liquidity: string;
  is_current: boolean;
};

export type LiquidityApiResponse = {
  buckets?: unknown;
};

export type OhlcInterval = '1h' | '1d';

export type OhlcApiPoint = {
  bucket: string;
  close_sqrt: string;
};

export type PoolChartProps = {
  pairPrice?: number | null;
  poolId?: string | null;
  minPrice?: number;
  maxPrice?: number;
  onMinPriceChange?: (price: number) => void;
  onMaxPriceChange?: (price: number) => void;
};

export type DragTarget = 'min' | 'max' | 'band';

export type BandDragAnchor = {
  anchorY: number;
  anchorMin: number;
  anchorMax: number;
  span: number;
  pxPerPrice: number;
};
