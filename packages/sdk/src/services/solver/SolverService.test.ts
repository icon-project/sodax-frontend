import { WalletAbstractionService } from './../hub/WalletAbstractionService.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type CreateIntentParams,
  EvmHubProvider,
  type EvmHubProviderConfig,
  EvmSpokeProvider,
  type IEvmWalletProvider,
  type FeeAmount,
  type Intent,
  SolverIntentErrorCode,
  type SolverErrorResponse,
  type SolverExecutionRequest,
  type SolverExecutionResponse,
  type SolverIntentQuoteRequest,
  type SolverIntentStatusRequest,
  type IntentError,
  type PacketData,
  type PartnerFee,
  type RelayTxStatus,
  type Result,
  type SolverConfig,
  SolverService,
  getHubAssetInfo,
  getHubChainConfig,
  getIntentRelayChainId,
  spokeChainConfig,
  isIntentSubmitTxFailedError,
  isIntentCreationFailedError,
  isIntentPostExecutionFailedError,
  isWaitUntilIntentExecutedFailed,
  isIntentCreationUnknownError,
  Erc20Service,
  calculateFeeAmount,
  type SpokeProvider,
} from '../../index.js';
import * as IntentRelayApiService from '../intentRelay/IntentRelayApiService.js';
import { EvmWalletAbstraction } from '../hub/EvmWalletAbstraction.js';
import { EvmSolverService } from './EvmSolverService.js';
import { ARBITRUM_MAINNET_CHAIN_ID, BSC_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID, type Address } from '@sodax/types';

// Define a type for Intent with fee amount
type IntentWithFee = Intent & FeeAmount;

describe('SolverService', () => {
  const mockIntentsContract = '0x0987654321098765432109876543210987654321' satisfies Address;
  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
  const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';

  const mockSolverConfig = {
    intentsContract: mockIntentsContract,
    solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  } satisfies SolverConfig;

  const mockHubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  } satisfies EvmHubProviderConfig;

  const mockHubProvider = new EvmHubProvider(mockHubConfig);

  const mockQuoteRequest = {
    token_src: bscEthToken,
    token_dst: arbWbtcToken,
    token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
    token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
    amount: 1000n,
    quote_type: 'exact_input',
  } satisfies SolverIntentQuoteRequest;

  const mockExecutionRequest = {
    intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
  } satisfies SolverExecutionRequest;

  const mockStatusRequest = {
    intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
  } satisfies SolverIntentStatusRequest;

  const feeAmount = 1000n; // 1000 of input token
  const feePercentage = 100; // 1% fee

  const solverService = new SolverService(mockSolverConfig, mockHubProvider);
  const solverServiceWithPercentageFee = new SolverService(
    {
      ...mockSolverConfig,
      partnerFee: {
        address: '0x0000000000000000000000000000000000000000',
        percentage: feePercentage,
      },
    },
    mockHubProvider,
  );
  const solverServiceWithAmountFee = new SolverService(
    {
      ...mockSolverConfig,
      partnerFee: {
        address: '0x0000000000000000000000000000000000000000',
        amount: feeAmount,
      },
    },
    mockHubProvider,
  );

  const mockEvmWalletProvider = {
    sendTransaction: vi.fn(),
    getWalletAddress: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999' as `0x${string}`),
    getWalletAddressBytes: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999' as `0x${string}`),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockFee = {
    address: '0x0000000000000000000000000000000000000000',
    amount: feeAmount,
  } satisfies PartnerFee;

  const mockBscSpokeProvider = new EvmSpokeProvider(mockEvmWalletProvider, spokeChainConfig[BSC_MAINNET_CHAIN_ID]);

  const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

  const mockPacketData = {
    src_chain_id: Number(getIntentRelayChainId(BSC_MAINNET_CHAIN_ID)), // BSC chain ID
    src_tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    src_address: '0x1234567890123456789012345678901234567890',
    status: 'executed' satisfies RelayTxStatus,
    dst_chain_id: Number(getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID)), // Arbitrum chain ID
    conn_sn: 1,
    dst_address: '0x1234567890123456789012345678901234567890',
    dst_tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    signatures: ['0x1234567890123456789012345678901234567890'],
    payload: '0x',
  } satisfies PacketData;

  // Helper function to create mock intent params with resolved addresses
  const createMockIntentParams = async (): Promise<CreateIntentParams> => {
    const srcAddress = await mockEvmWalletProvider.getWalletAddress();
    const dstAddress = await mockEvmWalletProvider.getWalletAddress();
    return {
      inputToken: bscEthToken,
      outputToken: arbWbtcToken,
      inputAmount: BigInt(1000000),
      minOutputAmount: BigInt(900000),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: BSC_MAINNET_CHAIN_ID,
      dstChain: ARBITRUM_MAINNET_CHAIN_ID,
      srcAddress,
      dstAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;
  };

  // Helper function to create mock intent with resolved addresses
  const createMockIntent = async (params: CreateIntentParams): Promise<Intent> => {
    const creator = await mockBscSpokeProvider.walletProvider.getWalletAddress();
    const srcAddress = await mockEvmWalletProvider.getWalletAddressBytes();
    const dstAddress = await mockEvmWalletProvider.getWalletAddressBytes();

    return {
      intentId: BigInt(1),
      creator: creator,
      inputToken: getHubAssetInfo(params.srcChain, params.inputToken)?.asset ?? '0x',
      outputToken: getHubAssetInfo(params.dstChain, params.outputToken)?.asset ?? '0x',
      inputAmount: params.inputAmount,
      minOutputAmount: params.minOutputAmount,
      deadline: params.deadline,
      allowPartialFill: params.allowPartialFill,
      srcChain: getIntentRelayChainId(params.srcChain),
      dstChain: getIntentRelayChainId(params.dstChain),
      srcAddress,
      dstAddress,
      solver: params.solver,
      data: params.data,
    } satisfies Intent;
  };

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('getQuote', () => {
    it('should return a successful quote response', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quoted_amount: '950',
          uuid: 'a0dd7652-b360-4123-ab2d-78cfbcd20c6b',
        }),
      });

      const result = await solverService.getQuote(mockQuoteRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value.quoted_amount).toBe(950n);
      }
      expect(fetch).toHaveBeenCalledWith(
        `${mockSolverConfig.solverApiEndpoint}/quote`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        }),
      );
    });

    it('should handle API error responses', async () => {
      // Mock fetch error response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          detail: {
            code: SolverIntentErrorCode.NO_PATH_FOUND,
            message: 'Invalid request parameters',
          },
        }),
      });

      const result = await solverService.getQuote(mockQuoteRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle network errors', async () => {
      // Mock fetch throwing an error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await solverService.getQuote(mockQuoteRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.detail.code).toBe(SolverIntentErrorCode.UNKNOWN);
      }
    });
  });

  describe('getFee', () => {
    it('should calculate fee correctly for given input amount', () => {
      const inputAmount = 1000n;
      const expectedFee = 10n; // Assuming 1% fee

      const result = solverServiceWithPercentageFee.getFee(inputAmount);

      expect(result).toBe(expectedFee);
    });

    it('should handle zero input amount', () => {
      const inputAmount = 0n;

      expect(() => solverServiceWithPercentageFee.getFee(inputAmount)).toThrow();
    });

    it('should handle very large input amount', () => {
      const inputAmount = 2n ** 128n - 1n;
      const result = solverServiceWithPercentageFee.getFee(inputAmount);

      expect(result).toBeDefined();
      expect(typeof result).toBe('bigint');
      expect(result).toBeGreaterThan(0n);
    });

    it('should handle negative input amount', () => {
      const inputAmount = -1000n;

      expect(() => solverServiceWithPercentageFee.getFee(inputAmount)).toThrow();
    });

    it('should handle undefined input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => solverServiceWithPercentageFee.getFee(undefined)).toThrow();
    });

    it('should handle null input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => solverServiceWithPercentageFee.getFee(null)).toThrow();
    });

    it('should handle fee amount', () => {
      const inputAmount = 1000n;
      const result = solverServiceWithAmountFee.getFee(inputAmount);

      expect(result).toBe(feeAmount);
    });

    it('should handle undefined input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => solverServiceWithAmountFee.getFee(undefined)).toThrow();
    });

    it('should handle null input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => solverServiceWithAmountFee.getFee(null)).toThrow();
    });
  });

  describe('postExecution', () => {
    it('should return a successful post execution response', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            answer: 'OK',
            intent_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
          }) satisfies SolverExecutionResponse,
      });

      const result: Result<SolverExecutionResponse, SolverErrorResponse> =
        await solverService.postExecution(mockExecutionRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value.intent_hash).toBeDefined();
        expect(result.value.answer).toBe('OK');
      }
      expect(fetch).toHaveBeenCalledWith(
        `${mockSolverConfig.solverApiEndpoint}/execute`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        }),
      );
    });

    it('should handle API error responses', async () => {
      // Mock fetch error response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          detail: {
            code: SolverIntentErrorCode.QUOTE_NOT_FOUND,
            message: 'Execution failed',
          },
        }),
      });

      const result = await solverService.postExecution(mockExecutionRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('getStatus', () => {
    it('should return a successful status response', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 3,
          intent_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
        }),
      });

      const result = await solverService.getStatus(mockStatusRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value.status).toBe(3);
      }
      expect(fetch).toHaveBeenCalledWith(
        `${mockSolverConfig.solverApiEndpoint}/status`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        }),
      );
    });

    it('should handle API error responses', async () => {
      // Mock fetch error response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          detail: {
            code: SolverIntentErrorCode.NO_PATH_FOUND,
            message: 'Intent not found',
          },
        }),
      });

      const result = await solverService.getStatus(mockStatusRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('swap (a.k.a. createAndSubmitIntent)', () => {
    const mockSubmitPayload = {
      action: 'submit',
      params: {
        chain_id: '4',
        tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
    } as const;

    it('should successfully create and submit an intent', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);
      const mockIntentWithFee: IntentWithFee = { ...mockIntent, feeAmount };

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, mockIntentWithFee, '0x'],
      });
      vi.spyOn(WalletAbstractionService, 'getUserAbstractedWalletAddress').mockResolvedValueOnce(mockCreatorHubWalletAddress);
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
        success: true,
        message: 'Transaction submitted successfully',
      });
      vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
        ok: true,
        value: mockPacketData,
      });
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        },
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value[0]).toBeDefined();
        expect(result.value[1]).toEqual(mockIntentWithFee);
      }
      expect(solverService['createIntent']).toHaveBeenCalledWith({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
        fee: solverService.config.partnerFee,
        raw: false,
        skipSimulation: false,
      });
      expect(solverService['postExecution']).toHaveBeenCalledWith({
        intent_tx_hash: mockTxHash,
      });
      expect(IntentRelayApiService.submitTransaction).toHaveBeenCalled();
    });

    it('should handle createIntent error', async () => {
      const mockCreateIntentParams = await createMockIntentParams();

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'CREATION_FAILED',
          data: {
            payload: mockCreateIntentParams,
            error: new Error('Create intent failed'),
          },
        } satisfies IntentError<'CREATION_FAILED'>,
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && isIntentCreationFailedError(result.error)).toBeTruthy();
    });

    it('should handle submitTransaction error', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: feeAmount }, '0x'],
      });
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
        success: false,
        message: 'Transaction submission failed',
      });
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        },
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual({
          code: 'SUBMIT_TX_FAILED',
          data: {
            payload: mockSubmitPayload,
            error: new Error('Transaction submission failed'),
          },
        } satisfies IntentError<'SUBMIT_TX_FAILED'>);
      }
    });

    it('should handle submitTransaction message error', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: feeAmount }, '0x'],
      });
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
        success: false,
        message: 'Transaction submission failed',
      });
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        },
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && isIntentSubmitTxFailedError(result.error)).toBeTruthy();
    });

    it('should handle submitTransaction api error with SUBMIT_TX_FAILED error code', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: feeAmount }, '0x'],
      });
      vi.spyOn(solverService, 'submitIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'SUBMIT_TX_FAILED',
          data: {
            payload: mockSubmitPayload,
            error: new Error('Transaction submission failed'),
          },
        },
      });
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        },
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(isIntentSubmitTxFailedError(result.error)).toBeTruthy();
      }
    });

    it('should handle waitUntilIntentExecuted error', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: feeAmount }, '0x'],
      });
      vi.spyOn(solverService, 'submitIntent').mockResolvedValueOnce({
        ok: true,
        value: {
          success: true,
          message: 'Transaction submitted successfully',
        },
      });

      vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'RELAY_TIMEOUT',
          data: {
            payload: {
              intentRelayChainId: '4',
              spokeTxHash: mockTxHash,
              timeout: 10000,
              apiUrl: 'https://xcall-relay.nw.iconblockchain.xyz',
            },
            error: new Error('Transaction submission failed'),
          },
        },
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && isWaitUntilIntentExecutedFailed(result.error)).toBeTruthy();
    });

    it('should handle postExecution error', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: feeAmount }, '0x'],
      });
      vi.spyOn(solverService, 'submitIntent').mockResolvedValueOnce({
        ok: true,
        value: {
          success: true,
          message: 'Transaction submitted successfully',
        },
      });

      vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
        ok: true,
        value: mockPacketData,
      });

      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: false,
        error: {
          detail: {
            code: SolverIntentErrorCode.UNKNOWN,
            message: 'Post execution failed',
          },
        },
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && isIntentPostExecutionFailedError(result.error)).toBeTruthy();
    });

    it('should handle swap unknown error', async () => {
      const mockCreateIntentParams = await createMockIntentParams();

      vi.spyOn(solverService, 'swap').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'UNKNOWN',
          data: {
            payload: mockCreateIntentParams,
            error: new Error('Unknown error'),
          },
        } satisfies IntentError<'UNKNOWN'>,
      });

      const result = await solverService.swap({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && isIntentCreationUnknownError(result.error)).toBeTruthy();
    });
  });

  describe('createIntent', () => {
    it('should successfully create an intent for EVM chain', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);
      const mockIntentWithFee: IntentWithFee = { ...mockIntent, feeAmount };

      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, mockIntentWithFee, '0x'],
      });
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockCreatorHubWalletAddress);

      const result = await solverService.createIntent({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
        fee: mockFee,
        raw: false,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const [txHash, resultingIntent] = result.value;
        expect(txHash).toBe(mockTxHash);
        expect(resultingIntent).toEqual(mockIntentWithFee);
      }
    });
  });

  describe('cancelIntent', () => {
    it('should successfully cancel an intent for EVM chain', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(solverService, 'cancelIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      const result = await solverService.cancelIntent(mockIntent, mockBscSpokeProvider, false);

      expect(result.ok).toBe(true);
      expect(result.ok && result.value).toBe(mockTxHash);
    });
  });

  describe('getIntent', () => {
    it('should successfully get an intent for EVM chain', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(EvmSolverService, 'getIntent').mockResolvedValueOnce(mockIntent);
      const result = await solverService.getIntent(mockTxHash);

      expect(result).toEqual(mockIntent);
    });
  });

  describe('getIntentHash', () => {
    it('should successfully get an intent hash', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockIntent = await createMockIntent(mockCreateIntentParams);

      vi.spyOn(solverService, 'getIntentHash').mockReturnValueOnce(
        '0x8196c6646c0d811b2ff19ffdf61533ad2d73d724fcd69c77ec243a908364a35e',
      );
      const result = solverService.getIntentHash(mockIntent);

      expect(result).toBe('0x8196c6646c0d811b2ff19ffdf61533ad2d73d724fcd69c77ec243a908364a35e');
    });
  });

  describe('isAllowanceValid', () => {
    it('should return true when allowance is sufficient for EVM chain', async () => {
      const mockCreateIntentParams = await createMockIntentParams();

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
        ok: true,
        value: true,
      });

      const result = await solverService.isAllowanceValid({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        mockCreateIntentParams.inputToken,
        mockCreateIntentParams.inputAmount +
          calculateFeeAmount(mockCreateIntentParams.inputAmount, solverService.config.partnerFee),
        await mockEvmWalletProvider.getWalletAddress(),
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
        mockBscSpokeProvider,
      );
    });

    it('should return false when allowance is insufficient for EVM chain', async () => {
      const mockCreateIntentParams = await createMockIntentParams();

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
        ok: true,
        value: false,
      });

      const result = await solverService.isAllowanceValid({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it('should return true for non-EVM chains', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockNonEvmSpokeProvider = {
        chainConfig: {
          chain: {
            type: 'NON_EVM',
          },
        },
        walletProvider: {
          getWalletAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        },
      } as unknown as SpokeProvider;

      const result = await solverService.isAllowanceValid({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockNonEvmSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it('should handle errors from Erc20Service', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockError = new Error('ERC20 service error');

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
        ok: false,
        error: mockError,
      });

      const result = await solverService.isAllowanceValid({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });

    it('should handle exceptions', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockError = new Error('Unexpected error');

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockRejectedValueOnce(mockError);

      const result = await solverService.isAllowanceValid({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });
  });

  describe('approve', () => {
    it('should successfully approve tokens for EVM chain', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

      const result = await solverService.approve({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockTxHash);
      }
      expect(Erc20Service.approve).toHaveBeenCalledWith(
        mockCreateIntentParams.inputToken,
        mockCreateIntentParams.inputAmount +
          calculateFeeAmount(mockCreateIntentParams.inputAmount, solverService.config.partnerFee),
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
        mockBscSpokeProvider,
        undefined,
      );
    });

    it('should return raw transaction when raw parameter is true', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockRawTx = {
        to: '0x...' as `0x${string}`,
        data: '0x...' as `0x${string}`,
        from: '0x...' as `0x${string}`,
        value: 0n,
      };

      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockRawTx);

      const result = await solverService.approve({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
        raw: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockRawTx);
      }
      expect(Erc20Service.approve).toHaveBeenCalledWith(
        mockCreateIntentParams.inputToken,
        mockCreateIntentParams.inputAmount +
          calculateFeeAmount(mockCreateIntentParams.inputAmount, solverService.config.partnerFee),
        mockBscSpokeProvider.chainConfig.addresses.assetManager,
        mockBscSpokeProvider,
        true,
      );
    });

    it('should return error for non-EVM chains', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockNonEvmSpokeProvider = {
        chainConfig: {
          chain: {
            type: 'NON_EVM',
          },
        },
        walletProvider: {
          getWalletAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        },
      } as unknown as SpokeProvider;

      const result = await solverService.approve({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockNonEvmSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect((result.error as Error).message).toBe('Approve only supported for EVM spoke chains');
      }
    });

    it('should handle exceptions from Erc20Service', async () => {
      const mockCreateIntentParams = await createMockIntentParams();
      const mockError = new Error('ERC20 service error');

      vi.spyOn(Erc20Service, 'approve').mockRejectedValueOnce(mockError);

      const result = await solverService.approve({
        intentParams: mockCreateIntentParams,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });
  });
});
