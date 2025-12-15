import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SolverIntentErrorCode,
  type SolverIntentQuoteRequest,
  type SolverIntentStatusRequest,
  type QuoteType,
  Sodax,
} from '../index.js';
import { SolverApiService } from './SolverApiService.js';
import { ARBITRUM_MAINNET_CHAIN_ID, BSC_MAINNET_CHAIN_ID, type Hex, type SolverConfig } from '@sodax/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SolverApiService', async () => {
  const mockConfig: SolverConfig = {
    solverApiEndpoint: 'https://api.example.com',
    intentsContract: '0x1234567890123456789012345678901234567890',
  };

  const sodax = new Sodax();

  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
  const bscEthHubTokenAsset = sodax.config.getHubAssetInfo(BSC_MAINNET_CHAIN_ID, bscEthToken)?.asset;
  if (!bscEthHubTokenAsset) {
    throw new Error('BSC ETH token asset not found');
  }
  const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';
  const arbWbtcHubTokenAsset = sodax.config.getHubAssetInfo(ARBITRUM_MAINNET_CHAIN_ID, arbWbtcToken)?.asset;
  if (!arbWbtcHubTokenAsset) {
    throw new Error('BSC WBTC token asset not found');
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuote', () => {
    const payload = {
      token_src: bscEthToken,
      token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
      token_dst: arbWbtcToken,
      token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
      amount: 1000000000000000000n,
      quote_type: 'exact_input' as QuoteType,
    } satisfies SolverIntentQuoteRequest;

    it('should return a successful quote response', async () => {
      const mockResponse = {
        quoted_amount: 2000000000000000000n,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await SolverApiService.getQuote(payload, mockConfig, sodax.config);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.quoted_amount).toBe(2000000000000000000n);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/quote',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token_src: sodax.config.getHubAssetInfo(payload.token_src_blockchain_id, payload.token_src)?.asset ?? '',
            token_dst: sodax.config.getHubAssetInfo(payload.token_dst_blockchain_id, payload.token_dst)?.asset ?? '',
            amount: payload.amount.toString(),
            quote_type: payload.quote_type,
          }),
        }),
      );
    });

    it('should handle API error response', async () => {
      const mockError = {
        detail: {
          code: SolverIntentErrorCode.NO_PATH_FOUND,
          message: 'No path found',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      });

      const result = await SolverApiService.getQuote(payload, mockConfig, sodax.config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(mockError);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await SolverApiService.getQuote(payload, mockConfig, sodax.config);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.detail.code).toBe(SolverIntentErrorCode.UNKNOWN);
      }
    });
  });

  describe('postExecution', () => {
    const validRequest = {
      intent_tx_hash: '0x1234567890123456789012345678901234567890123456789012345678901234' as Hex,
      quote_uuid: 'a0dd7652-b360-4123-ab2d-78cfbcd20c6b',
    };

    it('should successfully execute intent', async () => {
      const mockResponse = {
        output: {
          answer: 'OK',
          task_id: 'a0dd7652-b360-4123-ab2d-78cfbcd20c6b',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await SolverApiService.postExecution(validRequest, mockConfig);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/execute',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validRequest),
        }),
      );
    });

    it('should handle API error response', async () => {
      const mockError = {
        detail: {
          code: SolverIntentErrorCode.QUOTE_NOT_FOUND,
          message: 'Quote not found',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      });

      const result = await SolverApiService.postExecution(validRequest, mockConfig);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(mockError);
      }
    });
  });

  describe('getStatus', () => {
    const validRequest = {
      intent_tx_hash: '0x1234567890123456789012345678901234567890123456789012345678901234' as Hex,
    } satisfies SolverIntentStatusRequest;

    it('should successfully get status', async () => {
      const mockResponse = {
        status: 'completed',
        result: {
          transaction_hash: '0x123',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await SolverApiService.getStatus(validRequest, mockConfig);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/status',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validRequest),
        }),
      );
    });

    it('should handle API error response', async () => {
      const mockError = {
        detail: {
          code: SolverIntentErrorCode.QUOTE_NOT_FOUND,
          message: 'Quote not found',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      });

      const result = await SolverApiService.getStatus(validRequest, mockConfig);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(mockError);
      }
    });
  });
});
