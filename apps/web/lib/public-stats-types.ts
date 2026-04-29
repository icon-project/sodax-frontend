export interface PublicStatsPrice {
  usd: number;
  oracle_updated_at: number;
}

export interface PublicStatsSupply {
  circulating: number;
  total: number;
  locked: number;
  circulating_pct: number;
  market_cap_usd: number;
  fully_diluted_valuation_usd: number;
}

export interface PublicStatsBurns {
  total_soda: number;
  last_7d_soda: number;
  last_30d_soda: number;
  today_soda: number;
  first_burn_date: string;
}

export interface PublicStatsNetworks {
  supported: number;
  active: number;
}

export interface PublicStatsActivity {
  txns_24h: number;
  txns_7d: number;
  txns_30d: number;
  cadence_seconds_24h: number;
  accel_pct_vs_30d: number;
}

export interface PublicStatsResponse {
  price: PublicStatsPrice | null;
  supply: PublicStatsSupply | null;
  burns: PublicStatsBurns | null;
  networks: PublicStatsNetworks | null;
  activity: PublicStatsActivity | null;
  fetched_at: string;
}

export interface PublicStatsBurnChartPoint {
  bucket_start: string;
  bucket_end: string;
  burned_period: number;
}

export interface PublicStatsBurnChartResponse {
  window: string;
  bucket: string;
  series: PublicStatsBurnChartPoint[];
  fetched_at: string;
}
