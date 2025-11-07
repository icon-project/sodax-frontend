// packages/sdk/src/services/BackendApiService.test.ts
/**
 * Test file for BackendApiService
 * Tests the proxy functionality for Sodax Backend API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackendApiService } from './BackendApiService.js';

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
});
