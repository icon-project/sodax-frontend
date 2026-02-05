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

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer?: Object[];
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
