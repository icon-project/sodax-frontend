/**
 * Tests for the BackendApiService HTTP proxy.
 *
 * Mirrors the shape of MoneyMarketService.test.ts / SwapService.test.ts:
 *
 *   1. A single module-scope `new Sodax()` backs every test — `sodax.backendApi` is the
 *      service under test. The same instance is reused via `vi.stubGlobal('fetch', ...)`
 *      to intercept every outbound HTTP call.
 *   2. `describe(method name)` + one or more `it` per flow. Branchy methods get nested
 *      `happy paths` / `rejects on invalid inputs` / `propagates internal errors` subgroups.
 *   3. Internal collaborators are exclusively `fetch` and the response-shape guards in
 *      `shared/guards.ts`. Both are exercised through real code — the guards are not
 *      mocked.
 *   4. URL construction, HTTP method, default vs override headers, query-string params,
 *      and timeout (`AbortController`) propagation are all asserted explicitly so a
 *      mutation in either `request<T>` or `makeRequest<T>` surfaces immediately.
 *   5. Methods that return `Result<T>` are validated with `expect(result).toEqual(...)`;
 *      methods that return raw `Promise<T>` are validated with `await expect(...).resolves`
 *      / `.rejects` — matching the runtime contract of each method.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address, ApiConfig, SubmitSwapTxRequest, SubmitSwapTxStatusResponse } from '@sodax/types';
// `@sodax/types` is consumed from `dist/` in vitest; in this branch the generated dist entry
// is stale for some exports. Import ChainKeys directly from source so the SDK unit tests
// stay runnable.
import { ChainKeys } from '../../../types/src/chains/chain-keys.js';
import { Sodax } from '../shared/entities/Sodax.js';
import { BackendApiService } from './BackendApiService.js';

// --- fetch stub -----------------------------------------------------------
//
// Every test routes through `global.fetch`. We stub it once for the file and reset
// the mock state between tests so each `it` configures its own response. `vi.stubGlobal`
// (over assignment to `global.fetch`) means the original is automatically restored when
// the file finishes.
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// --- test fixtures --------------------------------------------------------

const sodax = new Sodax();
const DEFAULT_BASE_URL = 'https://api.sodax.com/v1/be';

const SAMPLE_USER_ADDRESS = '0x1111111111111111111111111111111111111111' as Address;
const SAMPLE_TX_HASH = '0x46b053464f50836328b6158e1e33e5cf66c0e3ebe5004d30459b23acae5047a0';
const SAMPLE_INTENT_HASH = '0xf7e195884112667fb1c239bef650c19a730ba3eb93d38aa0313dc1754e39fc1b';
const SAMPLE_RESERVE_ADDRESS = '0x14238d267557e9d799016ad635b53cd15935d290';

const sampleSubmitSwapTxRequest: SubmitSwapTxRequest = {
  txHash: '0x1e68359c3b541ac4aa0239bdfed9356f79969392d7893b44d206d1f408be4fe9',
  srcChainKey: '0x38.bsc',
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

// Build a status response that the runtime guard accepts. The guard requires
// `data.srcChainId` (string) — the response type declares `srcChainKey`, but the
// guard is the source of truth at runtime, so tests target the guard.
const validStatusResponseShape = {
  success: true,
  data: {
    txHash: '0xabc',
    srcChainId: '146',
    srcChainKey: '0x38.bsc',
    status: 'pending',
    failedAttempts: 0,
  },
};

// --- helpers --------------------------------------------------------------

const okResponse = <T>(data: T) => ({ ok: true, status: 200, json: vi.fn().mockResolvedValue(data) });
const httpErrorResponse = (status: number, text: string) => ({
  ok: false,
  status,
  text: vi.fn().mockResolvedValue(text),
});
const abortFetchImpl = (_url: string, init: { signal: AbortSignal }) =>
  new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      reject(err);
    });
  });

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =========================================================================
// Intent endpoints — Result<T> wrapper, default GET headers.
// =========================================================================

describe('BackendApiService.getIntentByTxHash', () => {
  it('issues GET to /intent/tx/{txHash} with default headers and returns ok:true wrapping the JSON body', async () => {
    const intentBody = { intentHash: SAMPLE_INTENT_HASH, txHash: SAMPLE_TX_HASH };
    mockFetch.mockResolvedValueOnce(okResponse(intentBody));

    const result = await sodax.backendApi.getIntentByTxHash(SAMPLE_TX_HASH);

    expect(result).toEqual({ ok: true, value: intentBody });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/intent/tx/${SAMPLE_TX_HASH}`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    );
  });

  it('returns ok:false with HTTP_REQUEST_FAILED when the response status is non-2xx', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(500, 'Internal Server Error'));

    const result = await sodax.backendApi.getIntentByTxHash(SAMPLE_TX_HASH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('HTTP_REQUEST_FAILED');
      expect(((result.error as Error).cause as Error).message).toMatch(/HTTP 500: Internal Server Error/);
    }
  });

  it('returns ok:false when fetch rejects with a non-AbortError (network error)', async () => {
    const networkError = new Error('Network down');
    mockFetch.mockRejectedValueOnce(networkError);

    const result = await sodax.backendApi.getIntentByTxHash(SAMPLE_TX_HASH);

    expect(result).toEqual({ ok: false, error: networkError });
  });

  it('returns ok:false with UNKNOWN_REQUEST_ERROR when fetch rejects with a non-Error value', async () => {
    mockFetch.mockRejectedValueOnce('string-not-error');

    const result = await sodax.backendApi.getIntentByTxHash(SAMPLE_TX_HASH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('UNKNOWN_REQUEST_ERROR');
      expect((result.error as Error).cause).toBe('string-not-error');
    }
  });
});

describe('BackendApiService.getIntentByHash', () => {
  it('issues GET to /intent/{intentHash} and returns ok:true wrapping the JSON body', async () => {
    const intentBody = { intentHash: SAMPLE_INTENT_HASH, txHash: SAMPLE_TX_HASH };
    mockFetch.mockResolvedValueOnce(okResponse(intentBody));

    const result = await sodax.backendApi.getIntentByHash(SAMPLE_INTENT_HASH);

    expect(result).toEqual({ ok: true, value: intentBody });
    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/intent/${SAMPLE_INTENT_HASH}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns ok:false with HTTP_REQUEST_FAILED on 404', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(404, 'Not Found'));

    const result = await sodax.backendApi.getIntentByHash(SAMPLE_INTENT_HASH);

    expect(result.ok).toBe(false);
    if (!result.ok) expect((result.error as Error).message).toBe('HTTP_REQUEST_FAILED');
  });
});

// =========================================================================
// Swap submit-tx endpoints — guarded response shape; POST body forwarding.
// =========================================================================

describe('BackendApiService.submitSwapTx', () => {
  describe('happy paths', () => {
    it('POSTs JSON-stringified params to /swaps/submit-tx and returns ok:true on a valid response', async () => {
      const responseBody = { success: true, message: 'Swap transaction submitted successfully' };
      mockFetch.mockResolvedValueOnce(okResponse(responseBody));

      const result = await sodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest);

      expect(result).toEqual({ ok: true, value: responseBody });
      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_BASE_URL}/swaps/submit-tx`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(sampleSubmitSwapTxRequest),
        }),
      );
    });

    it('returns ok:true for a duplicate-submission acknowledgement (success: true with a different message)', async () => {
      const responseBody = { success: true, message: 'Swap transaction already exists' };
      mockFetch.mockResolvedValueOnce(okResponse(responseBody));

      const result = await sodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest);

      expect(result).toEqual({ ok: true, value: responseBody });
    });
  });

  describe('rejects on invalid response shape', () => {
    it('returns ok:false when the response is missing the success boolean', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ message: 'ok' }));

      const result = await sodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid submitSwapTx response: unexpected response shape/);
    });

    it('returns ok:false when the response is missing the message string', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ success: true }));

      const result = await sodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid submitSwapTx response: unexpected response shape/);
    });

    it('returns ok:false when the success field is not a boolean', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ success: 'yes', message: 'ok' }));

      const result = await sodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid submitSwapTx response: unexpected response shape/);
    });
  });

  describe('propagates internal errors', () => {
    it('returns ok:false with HTTP_REQUEST_FAILED on a 429 response', async () => {
      mockFetch.mockResolvedValueOnce(httpErrorResponse(429, 'Too Many Requests'));

      const result = await sodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.error as Error).message).toBe('HTTP_REQUEST_FAILED');
        expect(((result.error as Error).cause as Error).message).toMatch(/HTTP 429/);
      }
    });

    it('returns ok:false with REQUEST_TIMEOUT when the request is aborted by the timeout signal', async () => {
      const shortTimeoutSodax = new Sodax({
        api: { baseURL: DEFAULT_BASE_URL, timeout: 10, headers: { 'Content-Type': 'application/json' } },
      });
      mockFetch.mockImplementationOnce(abortFetchImpl);

      const result = await shortTimeoutSodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.error as Error).message).toBe('REQUEST_TIMEOUT');
        expect(((result.error as Error).cause as Error).message).toMatch(/Request timeout after 10ms/);
      }
    });
  });
});

describe('BackendApiService.getSubmitSwapTxStatus', () => {
  describe('happy paths', () => {
    it('issues GET with txHash query param only when srcChainKey is omitted', async () => {
      mockFetch.mockResolvedValueOnce(okResponse(validStatusResponseShape));

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_BASE_URL}/swaps/submit-tx/status?txHash=0xabc`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('issues GET with both txHash and srcChainKey query params when srcChainKey is provided', async () => {
      mockFetch.mockResolvedValueOnce(okResponse(validStatusResponseShape));

      await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc', srcChainKey: '0x38.bsc' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_BASE_URL}/swaps/submit-tx/status?txHash=0xabc&srcChainKey=0x38.bsc`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('returns ok:true with the status payload for a pending swap (no result field)', async () => {
      mockFetch.mockResolvedValueOnce(okResponse(validStatusResponseShape));

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result).toEqual({ ok: true, value: validStatusResponseShape });
      if (result.ok) expect((result.value as SubmitSwapTxStatusResponse).data.result).toBeUndefined();
    });

    it('returns ok:true and surfaces the executed result when the swap has completed', async () => {
      const executedShape = {
        success: true,
        data: {
          txHash: '0xabc',
          srcChainId: '146',
          srcChainKey: '0x38.bsc',
          status: 'executed',
          failedAttempts: 0,
          result: {
            dstIntentTxHash: '0xdef',
            packetData: { src_chain_id: 146, dst_chain_id: 42161 },
            intent_hash: '0x999',
          },
        },
      };
      mockFetch.mockResolvedValueOnce(okResponse(executedShape));

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result).toEqual({ ok: true, value: executedShape });
      if (result.ok) expect((result.value as SubmitSwapTxStatusResponse).data.result?.dstIntentTxHash).toBe('0xdef');
    });

    it('returns ok:true for a failed swap with failure metadata fields populated', async () => {
      const failedShape = {
        success: true,
        data: {
          txHash: '0xabc',
          srcChainId: '146',
          srcChainKey: '0x38.bsc',
          status: 'failed',
          failedAtStep: 'relaying',
          failureReason: 'Relay timeout',
          failedAttempts: 3,
        },
      };
      mockFetch.mockResolvedValueOnce(okResponse(failedShape));

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const data = (result.value as SubmitSwapTxStatusResponse).data;
        expect(data.status).toBe('failed');
        expect(data.failedAtStep).toBe('relaying');
        expect(data.failureReason).toBe('Relay timeout');
        expect(data.failedAttempts).toBe(3);
      }
    });
  });

  describe('rejects on invalid response shape', () => {
    it('returns ok:false when the data field is missing', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ success: true }));

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(String(result.error)).toMatch(/Invalid submitSwapTxStatus response: unexpected response shape/);
    });

    it('returns ok:false when data.status is not a string', async () => {
      mockFetch.mockResolvedValueOnce(
        okResponse({
          success: true,
          data: { txHash: '0xabc', srcChainId: '146', status: 123, failedAttempts: 0 },
        }),
      );

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(String(result.error)).toMatch(/Invalid submitSwapTxStatus response: unexpected response shape/);
    });

    it('returns ok:false when data.result is present but missing dstIntentTxHash', async () => {
      mockFetch.mockResolvedValueOnce(
        okResponse({
          success: true,
          data: {
            txHash: '0xabc',
            srcChainId: '146',
            status: 'executed',
            failedAttempts: 0,
            result: { packetData: {} },
          },
        }),
      );

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(String(result.error)).toMatch(/Invalid submitSwapTxStatus response: unexpected response shape/);
    });

    it('returns ok:false when failedAttempts is not a number', async () => {
      mockFetch.mockResolvedValueOnce(
        okResponse({
          success: true,
          data: { txHash: '0xabc', srcChainId: '146', status: 'pending', failedAttempts: 'zero' },
        }),
      );

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(String(result.error)).toMatch(/Invalid submitSwapTxStatus response: unexpected response shape/);
    });
  });

  describe('propagates internal errors', () => {
    it('returns ok:false with HTTP_REQUEST_FAILED on 404', async () => {
      mockFetch.mockResolvedValueOnce(httpErrorResponse(404, 'Swap transaction not found'));

      const result = await sodax.backendApi.getSubmitSwapTxStatus({ txHash: '0xabc' });

      expect(result.ok).toBe(false);
      if (!result.ok) expect((result.error as Error).message).toBe('HTTP_REQUEST_FAILED');
    });
  });
});

// =========================================================================
// Solver endpoints — raw Promise<T> return (no Result wrapper); throws on HTTP error.
// =========================================================================

describe('BackendApiService.getOrderbook', () => {
  it('issues GET to /solver/orderbook with offset+limit query params and resolves to the JSON body', async () => {
    const orderbook = { total: 0, data: [] };
    mockFetch.mockResolvedValueOnce(okResponse(orderbook));

    await expect(sodax.backendApi.getOrderbook({ offset: '0', limit: '10' })).resolves.toEqual(orderbook);

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/solver/orderbook?offset=0&limit=10`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('forwards different pagination values into the query string verbatim', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ total: 0, data: [] }));

    await sodax.backendApi.getOrderbook({ offset: '20', limit: '5' });

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/solver/orderbook?offset=20&limit=5`,
      expect.any(Object),
    );
  });

  it('rejects with HTTP_REQUEST_FAILED on a non-2xx response (Promise<T> return — not Result-wrapped)', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(503, 'Service Unavailable'));

    await expect(sodax.backendApi.getOrderbook({ offset: '0', limit: '5' })).rejects.toThrow('HTTP_REQUEST_FAILED');
  });
});

describe('BackendApiService.getUserIntents', () => {
  it('issues GET to /intent/user/{userAddress} with no query string when no filters are provided', async () => {
    const userIntents = { total: 0, offset: 0, limit: 0, items: [] };
    mockFetch.mockResolvedValueOnce(okResponse(userIntents));

    await expect(sodax.backendApi.getUserIntents({ userAddress: SAMPLE_USER_ADDRESS })).resolves.toEqual(userIntents);

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/intent/user/${SAMPLE_USER_ADDRESS}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('appends startDate / endDate as ISO strings and limit / offset verbatim when provided', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ total: 0, offset: 0, limit: 0, items: [] }));
    const startDate = Date.UTC(2024, 0, 1);
    const endDate = Date.UTC(2024, 1, 1);

    await sodax.backendApi.getUserIntents({
      userAddress: SAMPLE_USER_ADDRESS,
      startDate,
      endDate,
      limit: '50',
      offset: '0',
    });

    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain(`/intent/user/${SAMPLE_USER_ADDRESS}?`);
    expect(calledUrl).toContain(`startDate=${encodeURIComponent(new Date(startDate).toISOString())}`);
    expect(calledUrl).toContain(`endDate=${encodeURIComponent(new Date(endDate).toISOString())}`);
    expect(calledUrl).toContain('limit=50');
    expect(calledUrl).toContain('offset=0');
  });

  it('rejects with HTTP_REQUEST_FAILED on a non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(500, 'boom'));

    await expect(sodax.backendApi.getUserIntents({ userAddress: SAMPLE_USER_ADDRESS })).rejects.toThrow(
      'HTTP_REQUEST_FAILED',
    );
  });
});

// =========================================================================
// Money Market endpoints — mix of Result<T> and raw Promise<T> return shapes.
// =========================================================================

describe('BackendApiService.getMoneyMarketPosition', () => {
  it('issues GET to /moneymarket/position/{userAddress} and wraps the JSON body in ok:true', async () => {
    const position = {
      userAddress: SAMPLE_USER_ADDRESS,
      positions: [
        {
          reserveAddress: SAMPLE_RESERVE_ADDRESS,
          aTokenAddress: '0x5c50cf875aebad8d5ba548f229960c90b1c1f8c3',
          variableDebtTokenAddress: '0x96a4197803ac8b21a1b7aefe72e565c71a91a40f',
          aTokenBalance: '24998168147931621',
          variableDebtTokenBalance: '0',
          blockNumber: 37002111,
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(okResponse(position));

    const result = await sodax.backendApi.getMoneyMarketPosition(SAMPLE_USER_ADDRESS);

    expect(result).toEqual({ ok: true, value: position });
    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/moneymarket/position/${SAMPLE_USER_ADDRESS}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns ok:false with HTTP_REQUEST_FAILED on 500', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(500, 'boom'));

    const result = await sodax.backendApi.getMoneyMarketPosition(SAMPLE_USER_ADDRESS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect((result.error as Error).message).toBe('HTTP_REQUEST_FAILED');
  });
});

describe('BackendApiService.getAllMoneyMarketAssets', () => {
  it('issues GET to /moneymarket/asset/all and wraps the JSON body in ok:true', async () => {
    const assets = [{ symbol: 'sodaAVAX' }];
    mockFetch.mockResolvedValueOnce(okResponse(assets));

    const result = await sodax.backendApi.getAllMoneyMarketAssets();

    expect(result).toEqual({ ok: true, value: assets });
    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/moneymarket/asset/all`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('BackendApiService.getMoneyMarketAsset', () => {
  it('issues GET to /moneymarket/asset/{reserveAddress} and wraps the JSON body in ok:true', async () => {
    const asset = { reserveAddress: SAMPLE_RESERVE_ADDRESS, symbol: 'sodaAVAX' };
    mockFetch.mockResolvedValueOnce(okResponse(asset));

    const result = await sodax.backendApi.getMoneyMarketAsset(SAMPLE_RESERVE_ADDRESS);

    expect(result).toEqual({ ok: true, value: asset });
    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/moneymarket/asset/${SAMPLE_RESERVE_ADDRESS}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('BackendApiService.getMoneyMarketAssetBorrowers', () => {
  it('issues GET to /moneymarket/asset/{reserveAddress}/borrowers with offset+limit query params (raw Promise return)', async () => {
    const borrowers = { borrowers: [], total: 0, offset: 0, limit: 10 };
    mockFetch.mockResolvedValueOnce(okResponse(borrowers));

    await expect(
      sodax.backendApi.getMoneyMarketAssetBorrowers(SAMPLE_RESERVE_ADDRESS, { offset: '0', limit: '10' }),
    ).resolves.toEqual(borrowers);

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/moneymarket/asset/${SAMPLE_RESERVE_ADDRESS}/borrowers?offset=0&limit=10`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejects with HTTP_REQUEST_FAILED on a non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce(httpErrorResponse(500, 'boom'));

    await expect(
      sodax.backendApi.getMoneyMarketAssetBorrowers(SAMPLE_RESERVE_ADDRESS, { offset: '0', limit: '10' }),
    ).rejects.toThrow('HTTP_REQUEST_FAILED');
  });
});

describe('BackendApiService.getMoneyMarketAssetSuppliers', () => {
  it('issues GET to /moneymarket/asset/{reserveAddress}/suppliers with offset+limit query params (raw Promise return)', async () => {
    const suppliers = { suppliers: [], total: 0, offset: 0, limit: 10 };
    mockFetch.mockResolvedValueOnce(okResponse(suppliers));

    await expect(
      sodax.backendApi.getMoneyMarketAssetSuppliers(SAMPLE_RESERVE_ADDRESS, { offset: '0', limit: '10' }),
    ).resolves.toEqual(suppliers);

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/moneymarket/asset/${SAMPLE_RESERVE_ADDRESS}/suppliers?offset=0&limit=10`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('BackendApiService.getAllMoneyMarketBorrowers', () => {
  it('issues GET to /moneymarket/borrowers with offset+limit query params (raw Promise return)', async () => {
    const borrowers = { borrowers: [], total: 0, offset: 0, limit: 10 };
    mockFetch.mockResolvedValueOnce(okResponse(borrowers));

    await expect(sodax.backendApi.getAllMoneyMarketBorrowers({ offset: '0', limit: '10' })).resolves.toEqual(borrowers);

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/moneymarket/borrowers?offset=0&limit=10`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('forwards a distinct offset+limit pair into the query string verbatim', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ borrowers: [], total: 0, offset: 20, limit: 5 }));

    await sodax.backendApi.getAllMoneyMarketBorrowers({ offset: '20', limit: '5' });

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/moneymarket/borrowers?offset=20&limit=5`,
      expect.any(Object),
    );
  });
});

// =========================================================================
// Config endpoints — Result<T> wrappers, all GET, exhaustive endpoint coverage.
// Each endpoint is asserted to hit its exact path so a refactor that flips a
// path string surfaces immediately.
// =========================================================================

describe('BackendApiService config endpoints', () => {
  type ConfigCase = {
    name: string;
    invoke: () => Promise<{ ok: boolean }>;
    endpoint: string;
  };

  const cases: ConfigCase[] = [
    {
      name: 'getAllConfig',
      invoke: () => sodax.backendApi.getAllConfig(),
      endpoint: '/config/all',
    },
    {
      name: 'getChains',
      invoke: () => sodax.backendApi.getChains(),
      endpoint: '/config/spoke/chains',
    },
    {
      name: 'getSwapTokens',
      invoke: () => sodax.backendApi.getSwapTokens(),
      endpoint: '/config/swap/tokens',
    },
    {
      name: 'getSwapTokensByChainId',
      invoke: () => sodax.backendApi.getSwapTokensByChainId(ChainKeys.BSC_MAINNET),
      endpoint: `/config/swap/${ChainKeys.BSC_MAINNET}/tokens`,
    },
    {
      name: 'getMoneyMarketTokens',
      invoke: () => sodax.backendApi.getMoneyMarketTokens(),
      endpoint: '/config/money-market/tokens',
    },
    {
      name: 'getMoneyMarketReserveAssets',
      invoke: () => sodax.backendApi.getMoneyMarketReserveAssets(),
      endpoint: '/config/money-market/reserve-assets',
    },
    {
      name: 'getMoneyMarketTokensByChainId',
      invoke: () => sodax.backendApi.getMoneyMarketTokensByChainId(ChainKeys.BSC_MAINNET),
      endpoint: `/config/money-market/${ChainKeys.BSC_MAINNET}/tokens`,
    },
    {
      name: 'getRelayChainIdMap',
      invoke: () => sodax.backendApi.getRelayChainIdMap(),
      endpoint: '/config/relay/chain-id-map',
    },
    {
      name: 'getSpokeChainConfig',
      invoke: () => sodax.backendApi.getSpokeChainConfig(),
      endpoint: '/config/spoke/all-chains-configs',
    },
  ];

  for (const { name, invoke, endpoint } of cases) {
    it(`${name}: issues GET to ${endpoint} and wraps the JSON body in ok:true`, async () => {
      const body = { mock: name };
      mockFetch.mockResolvedValueOnce(okResponse(body));

      const result = await invoke();

      expect(result).toEqual({ ok: true, value: body });
      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_BASE_URL}${endpoint}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it(`${name}: returns ok:false with HTTP_REQUEST_FAILED on a non-2xx response`, async () => {
      mockFetch.mockResolvedValueOnce(httpErrorResponse(500, 'boom'));

      const result = await invoke();

      expect(result.ok).toBe(false);
      if (!result.ok) expect((result.error as Error).message).toBe('HTTP_REQUEST_FAILED');
    });
  }
});

// =========================================================================
// RequestOverrideConfig — proves that baseURL / headers / timeout overrides are
// honored on both GET (orderbook) and POST (submitSwapTx) flows.
// =========================================================================

describe('BackendApiService RequestOverrideConfig', () => {
  it('overrides baseURL on a GET method', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ total: 0, data: [] }));

    await sodax.backendApi.getOrderbook({ offset: '0', limit: '5' }, { baseURL: 'https://custom.example.com' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom.example.com/solver/orderbook?offset=0&limit=5',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('overrides baseURL on a POST method', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ success: true, message: 'ok' }));

    await sodax.backendApi.submitSwapTx(sampleSubmitSwapTxRequest, { baseURL: 'https://custom.example.com' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom.example.com/swaps/submit-tx',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('merges custom headers with the defaults (both present in the final headers)', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ total: 0, data: [] }));

    await sodax.backendApi.getOrderbook({ offset: '0', limit: '5' }, { headers: { 'X-Custom': 'test-value' } });

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

  it('per-request header takes precedence when overriding a default header', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ total: 0, data: [] }));

    await sodax.backendApi.getOrderbook({ offset: '0', limit: '5' }, { headers: { Accept: 'text/plain' } });

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

  it('overrides timeout on a per-request basis (rejects with REQUEST_TIMEOUT)', async () => {
    mockFetch.mockImplementationOnce(abortFetchImpl);

    await expect(sodax.backendApi.getOrderbook({ offset: '0', limit: '5' }, { timeout: 5 })).rejects.toThrow(
      'REQUEST_TIMEOUT',
    );
  });

  it('applies baseURL and custom headers together when both overrides are passed', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ total: 0, data: [] }));

    await sodax.backendApi.getOrderbook(
      { offset: '0', limit: '5' },
      { baseURL: 'https://custom.example.com', headers: { 'X-Request-Id': '12345' } },
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

  it('falls back to default baseURL and default headers when no override is passed', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ total: 0, data: [] }));

    await sodax.backendApi.getOrderbook({ offset: '0', limit: '5' });

    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/solver/orderbook?offset=0&limit=5`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    );
  });
});

// =========================================================================
// Utility methods — setHeaders / getBaseURL. setHeaders mutates the underlying
// ApiConfig, so this block uses a freshly-constructed BackendApiService rather
// than the shared `sodax.backendApi` to avoid leaking mutations across the file.
// =========================================================================

describe('BackendApiService.setHeaders', () => {
  it('persists the supplied headers and merges them into subsequent requests', async () => {
    const isolatedConfig: ApiConfig = {
      baseURL: DEFAULT_BASE_URL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    };
    const isolatedService = new BackendApiService(isolatedConfig);
    isolatedService.setHeaders({ 'X-Custom-Header': 'custom-value', 'X-API-Key': 'api-key-123' });
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true }));

    await isolatedService.getIntentByTxHash('0x123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Custom-Header': 'custom-value',
          'X-API-Key': 'api-key-123',
        }),
      }),
    );
  });

  it('overwrites an existing header on subsequent setHeaders calls (last write wins)', async () => {
    const isolatedConfig: ApiConfig = {
      baseURL: DEFAULT_BASE_URL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    };
    const isolatedService = new BackendApiService(isolatedConfig);
    isolatedService.setHeaders({ 'X-API-Key': 'first' });
    isolatedService.setHeaders({ 'X-API-Key': 'second' });
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true }));

    await isolatedService.getIntentByTxHash('0x123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-API-Key': 'second' }) }),
    );
  });
});

describe('BackendApiService.getBaseURL', () => {
  it('returns the baseURL provided at construction time', () => {
    expect(sodax.backendApi.getBaseURL()).toBe(DEFAULT_BASE_URL);
  });

  it('returns the overridden baseURL when an instance is constructed with a custom one', () => {
    const customService = new BackendApiService({
      baseURL: 'https://custom.example.com',
      timeout: 30_000,
      headers: {},
    });
    expect(customService.getBaseURL()).toBe('https://custom.example.com');
  });
});
