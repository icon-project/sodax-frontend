// packages/sdk/src/services/BackendApiService.test.ts
/**
 * Test file for BackendApiService
 * Tests the proxy functionality for Sodax Backend API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackendApiService } from './BackendApiService.js';
import type { SubmitSwapTxRequest } from '@sodax/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('BackendApiService', () => {
  let backendApiService: BackendApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    backendApiService = new BackendApiService();
  });

  describe('Intent endpoints', () => {
    it('should get intent by transaction hash', async () => {
      const txHash = '0x46b053464f50836328b6158e1e33e5cf66c0e3ebe5004d30459b23acae5047a0';
      const mockData = {
        intentHash: '0xf7e195884112667fb1c239bef650c19a730ba3eb93d38aa0313dc1754e39fc1b',
        txHash,
        logIndex: 3,
        chainId: 146,
        blockNumber: 45467483,
        open: true,
        intent: {
          intentId: '6087132095738712308259047525879671834100759922389620368136384322155991813481',
          creator: '0x152740b9dB0C232a2909d4BeE5Ee83F565785813',
          inputToken: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
          outputToken: '0x9Ee17486571917837210824b0d4CAdfe3B324D12',
          inputAmount: '5000000000000000000',
          minOutputAmount: '1965353839071625320',
          deadline: '1756807054',
          allowPartialFill: false,
          srcChain: 1768124270,
          dstChain: 5,
          srcAddress: '0x000136a591b8bf330f129fd75686199ee34f09ebbd',
          dstAddress: '0x33bad609fd656df90fb9da00058c59a54a5d7a6f',
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        },
        events: [],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getIntentByTxHash(txHash);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sodax.com/v1/be/intent/tx/${txHash}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        }),
      );
      expect(result).toEqual(mockData);
    });

    it('should get intent by intent hash', async () => {
      const intentHash = '0xf7e195884112667fb1c239bef650c19a730ba3eb93d38aa0313dc1754e39fc1b';
      const mockData = {
        intentHash,
        txHash: '0x46b053464f50836328b6158e1e33e5cf66c0e3ebe5004d30459b23acae5047a0',
        logIndex: 3,
        chainId: 146,
        blockNumber: 45467483,
        open: true,
        intent: {
          intentId: '6087132095738712308259047525879671834100759922389620368136384322155991813481',
          creator: '0x152740b9dB0C232a2909d4BeE5Ee83F565785813',
          inputToken: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
          outputToken: '0x9Ee17486571917837210824b0d4CAdfe3B324D12',
          inputAmount: '5000000000000000000',
          minOutputAmount: '1965353839071625320',
          deadline: '1756807054',
          allowPartialFill: false,
          srcChain: 1768124270,
          dstChain: 5,
          srcAddress: '0x000136a591b8bf330f129fd75686199ee34f09ebbd',
          dstAddress: '0x33bad609fd656df90fb9da00058c59a54a5d7a6f',
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        },
        events: [],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getIntentByHash(intentHash);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sodax.com/v1/be/intent/${intentHash}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        }),
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('Swap submit-tx endpoints', () => {
    const mockSubmitRequest: SubmitSwapTxRequest = {
      txHash: '0x1e68359c3b541ac4aa0239bdfed9356f79969392d7893b44d206d1f408be4fe9',
      srcChainId: '146',
      walletAddress: '0x152740b9dB0C232a2909d4BeE5Ee83F565785813',
      intent: {
        intentId: '123456789',
        creator: '0x152740b9dB0C232a2909d4BeE5Ee83F565785813',
        inputToken: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
        outputToken: '0x9Ee17486571917837210824b0d4CAdfe3B324D12',
        inputAmount: '5000000000000000000',
        minOutputAmount: '1965353839071625320',
        deadline: '0',
        allowPartialFill: false,
        srcChain: 1768124270,
        dstChain: 5,
        srcAddress: '0x000136a591b8bf330f129fd75686199ee34f09ebbd',
        dstAddress: '0x33bad609fd656df90fb9da00058c59a54a5d7a6f',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      },
      relayData: '0x',
    };

    describe('submitSwapTx', () => {
      it('should submit swap tx successfully (inserted)', async () => {
        const mockData = { success: true, message: 'Swap transaction submitted successfully' };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        const result = await backendApiService.submitSwapTx(mockSubmitRequest);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.sodax.com/v1/be/swaps/submit-tx',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(mockSubmitRequest),
          }),
        );
        expect(result).toEqual(mockData);
      });

      it('should submit swap tx successfully (duplicate)', async () => {
        const mockData = { success: true, message: 'Swap transaction already exists' };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        const result = await backendApiService.submitSwapTx(mockSubmitRequest);

        expect(result).toEqual(mockData);
      });

      it('should throw on HTTP error response', async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 429, text: vi.fn().mockResolvedValue('Too Many Requests') });

        await expect(backendApiService.submitSwapTx(mockSubmitRequest)).rejects.toThrow('HTTP 429');
      });

      it('should throw on malformed response (missing success)', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ message: 'ok' }) });

        await expect(backendApiService.submitSwapTx(mockSubmitRequest)).rejects.toThrow(
          'Invalid submitSwapTx response: unexpected response shape',
        );
      });

      it('should throw on malformed response (missing message)', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });

        await expect(backendApiService.submitSwapTx(mockSubmitRequest)).rejects.toThrow(
          'Invalid submitSwapTx response: unexpected response shape',
        );
      });

      it('should throw on timeout', async () => {
        const service = new BackendApiService({ timeout: 10 });
        mockFetch.mockImplementation(
          (_url: string, init: { signal: AbortSignal }) =>
            new Promise((_resolve, reject) => {
              init.signal.addEventListener('abort', () => {
                const err = new Error('The operation was aborted');
                err.name = 'AbortError';
                reject(err);
              });
            }),
        );

        await expect(service.submitSwapTx(mockSubmitRequest)).rejects.toThrow('Request timeout after 10ms');
      });
    });

    describe('getSubmitSwapTxStatus', () => {
      it('should get status with txHash only', async () => {
        const mockData = {
          success: true,
          data: { txHash: '0xabc', srcChainId: '146', status: 'pending', failedAttempts: 0 },
        };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        await backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.sodax.com/v1/be/swaps/submit-tx/status?txHash=0xabc',
          expect.objectContaining({ method: 'GET' }),
        );
      });

      it('should get status with txHash and srcChainId', async () => {
        const mockData = {
          success: true,
          data: { txHash: '0xabc', srcChainId: '42161', status: 'pending', failedAttempts: 0 },
        };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        await backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc', srcChainId: '42161' });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.sodax.com/v1/be/swaps/submit-tx/status?txHash=0xabc&srcChainId=42161',
          expect.objectContaining({ method: 'GET' }),
        );
      });

      it('should return pending status', async () => {
        const mockData = {
          success: true,
          data: { txHash: '0xabc', srcChainId: '146', status: 'pending', failedAttempts: 0 },
        };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        const result = await backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' });

        expect(result).toEqual(mockData);
        expect(result.data.result).toBeUndefined();
      });

      it('should return executed status with result', async () => {
        const mockData = {
          success: true,
          data: {
            txHash: '0xabc',
            srcChainId: '146',
            status: 'executed',
            failedAttempts: 0,
            result: {
              dstIntentTxHash: '0xdef',
              packetData: { src_chain_id: 146, dst_chain_id: 42161 },
              intent_hash: '0x999',
            },
          },
        };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        const result = await backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' });

        expect(result).toEqual(mockData);
        expect(result.data.result?.dstIntentTxHash).toBe('0xdef');
      });

      it('should return failed status with failure details', async () => {
        const mockData = {
          success: true,
          data: {
            txHash: '0xabc',
            srcChainId: '146',
            status: 'failed',
            failedAtStep: 'relaying',
            failureReason: 'Relay timeout',
            failedAttempts: 3,
          },
        };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        const result = await backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' });

        expect(result.data.status).toBe('failed');
        expect(result.data.failedAtStep).toBe('relaying');
        expect(result.data.failureReason).toBe('Relay timeout');
        expect(result.data.failedAttempts).toBe(3);
      });

      it('should throw on HTTP 404', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          text: vi.fn().mockResolvedValue('Swap transaction not found'),
        });

        await expect(backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' })).rejects.toThrow('HTTP 404');
      });

      it('should throw on malformed response (missing data)', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });

        await expect(backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' })).rejects.toThrow(
          'Invalid submitSwapTxStatus response: unexpected response shape',
        );
      });

      it('should throw on malformed response (invalid data.status)', async () => {
        const mockData = {
          success: true,
          data: { txHash: '0xabc', srcChainId: '146', status: 123, failedAttempts: 0 },
        };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        await expect(backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' })).rejects.toThrow(
          'Invalid submitSwapTxStatus response: unexpected response shape',
        );
      });

      it('should throw on malformed result (missing dstIntentTxHash)', async () => {
        const mockData = {
          success: true,
          data: {
            txHash: '0xabc',
            srcChainId: '146',
            status: 'executed',
            failedAttempts: 0,
            result: { packetData: {} },
          },
        };
        mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

        await expect(backendApiService.getSubmitSwapTxStatus({ txHash: '0xabc' })).rejects.toThrow(
          'Invalid submitSwapTxStatus response: unexpected response shape',
        );
      });
    });
  });

  describe('Solver endpoints', () => {
    it('should get orderbook with pagination', async () => {
      const mockData = {
        total: 35,
        data: [
          {
            intentState: {
              exists: true,
              remainingInput: '100000000',
              receivedOutput: '0',
              pendingPayment: false,
            },
            intentData: {
              intentId: '36260283099298602689159166687160463982951613941319676669351109935046058858211',
              creator: '0x9A0d129ccCd1aaD1d4B59DE680D61DE4Da335c5a',
              inputToken: '0x348007B53F25A9A857aB8eA81ec9E3CCBCf440f2',
              outputToken: '0xC3f020057510ffE10Ceb882e1B48238b43d78a5e',
              inputAmount: '100000000',
              minOutputAmount: '2856287435',
              deadline: '0',
              allowPartialFill: false,
              srcChain: 27,
              dstChain: 1,
              srcAddress: '0x000000120000000000000000fef6f953ec3337495e54d4f2f885da8e9ff04fd38aa5e0ccd1e2406f5381619f',
              dstAddress: '0xfef6f953ec3337495e54d4f2f885da8e9ff04fd38aa5e0ccd1e2406f5381619f',
              solver: '0x0000000000000000000000000000000000000000',
              data: '0x',
              intentHash: '0x93e33f9f8b11c1a2c9286ee782c9e928c1f21bb5f4890ecfb9c8f2180f70666f',
              txHash: '0x13a40c5247fad1e1377a04196c3deffa7233737bb769c8a6ee0d59cb0819e0af',
              blockNumber: 44042914,
            },
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getOrderbook({ offset: '0', limit: '10' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sodax.com/v1/be/solver/orderbook?offset=0&limit=10',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('Money Market endpoints', () => {
    it('should get money market position', async () => {
      const userAddress = '0x1234567890abcdef';
      const mockData = {
        userAddress,
        positions: [
          {
            reserveAddress: '0x14238d267557e9d799016ad635b53cd15935d290',
            aTokenAddress: '0x5c50cf875aebad8d5ba548f229960c90b1c1f8c3',
            variableDebtTokenAddress: '0x96a4197803ac8b21a1b7aefe72e565c71a91a40f',
            aTokenBalance: '24998168147931621',
            variableDebtTokenBalance: '0',
            blockNumber: 37002111,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getMoneyMarketPosition(userAddress);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sodax.com/v1/be/moneymarket/position/${userAddress}`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });

    it('should get all money market assets', async () => {
      const mockData = [
        {
          reserveAddress: '0x14238d267557e9d799016ad635b53cd15935d290',
          aTokenAddress: '0x5c50cf875aebad8d5ba548f229960c90b1c1f8c3',
          totalATokenBalance: '433953032746160553984',
          variableDebtTokenAddress: '0x96a4197803ac8b21a1b7aefe72e565c71a91a40f',
          totalVariableDebtTokenBalance: '1095943425214487680',
          liquidityRate: '5940953627696226891198',
          symbol: 'sodaAVAX',
          totalSuppliers: 9,
          totalBorrowers: 3,
          variableBorrowRate: '2608455944703331307907910',
          stableBorrowRate: '0',
          liquidityIndex: '1000262900638005827898645600',
          variableBorrowIndex: '1002302853922605663462526518',
          blockNumber: 45043017,
        },
      ];

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getAllMoneyMarketAssets();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sodax.com/v1/be/moneymarket/asset/all',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });

    it('should get all money market borrowers with required pagination params', async () => {
      const mockData = {
        borrowers: [
          '0x0ab764ab3816cd036ea951be973098510d8105a6',
          '0x3f98ff3fe3e0190cf2720b0c51d29e2bbce239a3',
          '0x40f1271fe543f17eb64d022bbf7fc3c791a4342b',
        ],
        total: 22,
        offset: 0,
        limit: 10,
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getAllMoneyMarketBorrowers({ offset: '0', limit: '10' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sodax.com/v1/be/moneymarket/borrowers?offset=0&limit=10',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });

    it('should get all money market borrowers with different pagination values', async () => {
      const mockData = {
        borrowers: ['0x51c5b3c02c94f6293cdef0063d3b566f71d6288c', '0x5ded92ad2953c9c9fed3b457f13eb019487e1184'],
        total: 22,
        offset: 20,
        limit: 5,
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getAllMoneyMarketBorrowers({ offset: '20', limit: '5' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sodax.com/v1/be/moneymarket/borrowers?offset=20&limit=5',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });

    it('should get money market asset borrowers with pagination', async () => {
      const reserveAddress = '0xasset1';
      const mockData = {
        borrowers: [
          '0x73135d19c488ea5b002e0e07135d992ff7e6f070',
          '0xf754037f99af3d90a4db611d74966729b81a8a96',
          '0x6d7b6956589c17b2755193a67bf2d4b68827e58a',
        ],
        total: 3,
        offset: 0,
        limit: 10,
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getMoneyMarketAssetBorrowers(reserveAddress, {
        offset: '0',
        limit: '10',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sodax.com/v1/be/moneymarket/asset/${reserveAddress}/borrowers?offset=0&limit=10`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });

    it('should get money market asset suppliers with pagination', async () => {
      const reserveAddress = '0xasset1';
      const mockData = {
        suppliers: [
          '0x73135d19c488ea5b002e0e07135d992ff7e6f070',
          '0x47d34e04320926cb7cfe08872dc14db6c5ba6cf9',
          '0xf41cfe514527274052d0f292be068db1f830a4bb',
        ],
        total: 9,
        offset: 0,
        limit: 10,
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await backendApiService.getMoneyMarketAssetSuppliers(reserveAddress, {
        offset: '0',
        limit: '10',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sodax.com/v1/be/moneymarket/asset/${reserveAddress}/suppliers?offset=0&limit=10`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('Utility methods', () => {
    it('should set custom headers', () => {
      const headers = {
        'X-Custom-Header': 'custom-value',
        'X-API-Key': 'api-key-123',
      };

      backendApiService.setHeaders(headers);

      // Test that headers are set by making a request and checking the headers
      const mockData = { test: 'data' };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      backendApiService.getIntentByTxHash('0x123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            'X-API-Key': 'api-key-123',
          }),
        }),
      );
    });

    it('should return base URL', () => {
      const baseURL = backendApiService.getBaseURL();

      expect(baseURL).toBe('https://api.sodax.com/v1/be');
    });
  });

  describe('RequestOverrideConfig', () => {
    it('should override baseURL for GET methods', async () => {
      const mockData = { total: 0, data: [] };
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

      await backendApiService.getOrderbook({ offset: '0', limit: '5' }, { baseURL: 'https://custom.example.com' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.example.com/solver/orderbook?offset=0&limit=5',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should override baseURL for POST methods', async () => {
      const mockSubmitRequest: SubmitSwapTxRequest = {
        txHash: '0xabc',
        srcChainId: '146',
        walletAddress: '0x123',
        intent: {
          intentId: '1',
          creator: '0x123',
          inputToken: '0x456',
          outputToken: '0x789',
          inputAmount: '100',
          minOutputAmount: '90',
          deadline: '0',
          allowPartialFill: false,
          srcChain: 1,
          dstChain: 2,
          srcAddress: '0xaaa',
          dstAddress: '0xbbb',
          solver: '0x000',
          data: '0x',
        },
        relayData: '0x',
      };
      const mockData = { success: true, message: 'ok' };
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

      await backendApiService.submitSwapTx(mockSubmitRequest, { baseURL: 'https://custom.example.com' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.example.com/swaps/submit-tx',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should merge custom headers with defaults', async () => {
      const mockData = { total: 0, data: [] };
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

      await backendApiService.getOrderbook({ offset: '0', limit: '5' }, { headers: { 'X-Custom': 'test-value' } });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Custom': 'test-value',
          }),
        }),
      );
    });

    it('should allow overriding a default header', async () => {
      const mockData = { total: 0, data: [] };
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

      await backendApiService.getOrderbook({ offset: '0', limit: '5' }, { headers: { Accept: 'text/plain' } });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'text/plain',
          }),
        }),
      );
    });

    it('should override timeout', async () => {
      mockFetch.mockImplementation(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }),
      );

      await expect(
        backendApiService.getOrderbook({ offset: '0', limit: '5' }, { timeout: 5 }),
      ).rejects.toThrow('Request timeout after 5ms');
    });

    it('should apply all overrides together', async () => {
      const mockData = { total: 0, data: [] };
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

      await backendApiService.getOrderbook(
        { offset: '0', limit: '5' },
        {
          baseURL: 'https://custom.example.com',
          headers: { 'X-Request-Id': '12345' },
        },
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.example.com/solver/orderbook?offset=0&limit=5',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Request-Id': '12345',
          }),
        }),
      );
    });

    it('should use defaults when no config is provided', async () => {
      const mockData = { total: 0, data: [] };
      mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

      await backendApiService.getOrderbook({ offset: '0', limit: '5' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sodax.com/v1/be/solver/orderbook?offset=0&limit=5',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        }),
      );
    });
  });
});
