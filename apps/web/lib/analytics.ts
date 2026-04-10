/**
 * Google Tag Manager (GTM) Analytics Utilities
 *
 * Centralized tracking for analytics events via GTM dataLayer.
 * All events follow GA4 naming conventions (lowercase with underscores).
 */

// Type definitions for analytics events
export interface SwapCompletedEvent {
  event: 'swap_completed';
  input_token_symbol: string;
  output_token_symbol: string;
  input_amount_usd: number;
  source_chain: string;
  destination_chain: string;
  transaction_hash: string;
}

export interface StakeCompletedEvent {
  event: 'stake_completed';
  amount_soda: string;
  received_xsoda: string;
  apy: number;
  source_chain: string;
  transaction_hash: string;
}

export interface UnstakeCompletedEvent {
  event: 'unstake_completed';
  amount_xsoda: string;
  expected_soda: string;
  method: 'regular' | 'instant';
  penalty_percent?: number;
  source_chain: string;
  transaction_hash: string;
}

export interface UnstakeClaimCompletedEvent {
  event: 'unstake_claim_completed';
  request_id: string;
  claimed_amount: string;
  penalty_percent: number;
  source_chain: string;
  transaction_hash: string;
}

export interface MigrationCompletedEvent {
  event: 'migration_completed';
  migration_mode: 'icxsoda' | 'bnusd';
  input_token_symbol: string;
  output_token_symbol: string;
  input_amount: string;
  source_chain: string;
  destination_chain: string;
  spoke_transaction_hash: string;
  hub_transaction_hash: string;
}

// Pool events

export interface SupplyLiquidityCompletedEvent {
  event: 'supply_liquidity_completed';
  amount_soda: string;
  amount_xsoda: string;
  min_price: string;
  max_price: string;
  source_chain: string;
  transaction_hash: string;
}

export interface AddLiquidityCompletedEvent {
  event: 'add_liquidity_completed';
  position_id: string;
  amount_soda: string;
  amount_xsoda: string;
  source_chain: string;
  spoke_transaction_hash: string;
  hub_transaction_hash: string;
}

export interface WithdrawLiquidityCompletedEvent {
  event: 'withdraw_liquidity_completed';
  position_id: string;
  withdraw_percentage: number;
  source_chain: string;
  spoke_transaction_hash: string;
  hub_transaction_hash: string;
}

export interface ClaimFeesCompletedEvent {
  event: 'claim_fees_completed';
  position_id: string;
  fees_soda: string;
  fees_xsoda: string;
  source_chain: string;
  spoke_transaction_hash: string;
  hub_transaction_hash: string;
}

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Push an event to the GTM dataLayer
 * @param eventData - The event data object to push
 */
function pushToDataLayer(eventData: Record<string, unknown>): void {
  if (typeof window === 'undefined') {
    console.warn('[Analytics] Cannot push to dataLayer: window is undefined');
    return;
  }

  if (!window.dataLayer) {
    console.warn('[Analytics] dataLayer not initialized');
    return;
  }

  window.dataLayer.push(eventData);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Event tracked:', eventData);
  }
}

/**
 * Track a successful swap completion
 * @param params - Swap completion parameters
 */
export function trackSwapCompleted(params: Omit<SwapCompletedEvent, 'event'>): void {
  pushToDataLayer({
    event: 'swap_completed',
    ...params,
  });
}

export function trackStakeCompleted(params: Omit<StakeCompletedEvent, 'event'>): void {
  pushToDataLayer({
    event: 'stake_completed',
    ...params,
  });
}

export function trackUnstakeCompleted(params: Omit<UnstakeCompletedEvent, 'event'>): void {
  pushToDataLayer({
    event: 'unstake_completed',
    ...params,
  });
}

export function trackUnstakeClaimCompleted(params: Omit<UnstakeClaimCompletedEvent, 'event'>): void {
  pushToDataLayer({
    event: 'unstake_claim_completed',
    ...params,
  });
}

export function trackMigrationCompleted(params: Omit<MigrationCompletedEvent, 'event'>): void {
  pushToDataLayer({
    event: 'migration_completed',
    ...params,
  });
}

// Pool tracking

export function trackSupplyLiquidityCompleted(params: Omit<SupplyLiquidityCompletedEvent, 'event'>): void {
  pushToDataLayer({ event: 'supply_liquidity_completed', ...params });
}

export function trackAddLiquidityCompleted(params: Omit<AddLiquidityCompletedEvent, 'event'>): void {
  pushToDataLayer({ event: 'add_liquidity_completed', ...params });
}

export function trackWithdrawLiquidityCompleted(params: Omit<WithdrawLiquidityCompletedEvent, 'event'>): void {
  pushToDataLayer({ event: 'withdraw_liquidity_completed', ...params });
}

export function trackClaimFeesCompleted(params: Omit<ClaimFeesCompletedEvent, 'event'>): void {
  pushToDataLayer({ event: 'claim_fees_completed', ...params });
}
