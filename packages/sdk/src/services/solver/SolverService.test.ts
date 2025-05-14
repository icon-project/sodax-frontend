import type { Address, Hex } from 'viem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  type CreateIntentParams,
  EvmHubProvider,
  type EvmSpokeChainConfig,
  EvmSpokeProvider,
  EvmWalletAbstraction,
  EvmWalletProvider,
  type ISpokeProvider,
  type Intent,
  IntentErrorCode,
  type IntentErrorResponse,
  type IntentExecutionRequest,
  type IntentExecutionResponse,
  type IntentQuoteRequest,
  type IntentStatusRequest,
  type Result,
  SONIC_MAINNET_CHAIN_ID,
  type SolverConfig,
  SolverService,
  getHubAssetInfo,
  getHubChainConfig,
  getIntentRelayChainId,
  spokeChainConfig,
} from '../../index.js';
import * as IntentRelayApiService from '../intentRelay/IntentRelayApiService.js';
import { EvmSolverService } from './EvmSolverService.js';

describe('SolverService', () => {
  const mockIntentsContract = '0x0987654321098765432109876543210987654321' satisfies Address;
  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
  const bscEthHubTokenAsset = getHubAssetInfo(BSC_MAINNET_CHAIN_ID, bscEthToken);
  if (!bscEthHubTokenAsset) {
    throw new Error('BSC ETH token asset not found');
  }
  const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';
  const arbWbtcHubTokenAsset = getHubAssetInfo(ARBITRUM_MAINNET_CHAIN_ID, arbWbtcToken);
  if (!arbWbtcHubTokenAsset) {
    throw new Error('BSC WBTC token asset not found');
  }

  const mockSolverConfig = {
    intentsContract: mockIntentsContract,
    solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
    relayerApiEndpoint: 'https://...',
  } satisfies SolverConfig;

  const mockQuoteRequest = {
    token_src: bscEthHubTokenAsset.asset,
    token_dst: arbWbtcHubTokenAsset.asset,
    token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
    token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
    amount: 1000n,
    quote_type: 'exact_input',
  } satisfies IntentQuoteRequest;

  const mockExecutionRequest = {
    intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
  } satisfies IntentExecutionRequest;

  const mockStatusRequest = {
    intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
  } satisfies IntentStatusRequest;

  const solverService = new SolverService(mockSolverConfig);

  const mockEvmWalletProvider = new EvmWalletProvider({
    chain: BSC_MAINNET_CHAIN_ID,
    privateKey: '0xe0a01496281934154fe895c31b352f19fa9250fc0ffa28a597335d26aeb2bbf9' as Hex, // NOTE: random private key for unit testing only
    provider: 'https://bsc-mainnet.infura.io/v3/1234567890',
  });

  const mockHubProvider = new EvmHubProvider(mockEvmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

  const mockBscSpokeProvider = new EvmSpokeProvider(
    mockEvmWalletProvider,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID] as EvmSpokeChainConfig,
  );

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
            code: IntentErrorCode.NO_PATH_FOUND,
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
        expect(result.error.detail.code).toBe(IntentErrorCode.UNKNOWN);
      }
    });
  });

  describe('postExecution', () => {
    it('should return a successful execution response', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            answer: 'OK',
            intent_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
          }) satisfies IntentExecutionResponse,
      });

      const result: Result<IntentExecutionResponse, IntentErrorResponse> =
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
            code: IntentErrorCode.QUOTE_NOT_FOUND,
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

    it('should handle network errors', async () => {
      // Mock fetch throwing an error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await solverService.postExecution(mockExecutionRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.detail.code).toBe(IntentErrorCode.UNKNOWN);
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
            code: IntentErrorCode.NO_PATH_FOUND,
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

    it('should handle network errors', async () => {
      // Mock fetch throwing an error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await solverService.getStatus(mockStatusRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.detail.code).toBe(IntentErrorCode.UNKNOWN);
      }
    });
  });

  describe('createAndSubmitIntent', () => {
    const mockCreateIntentParams = {
      inputToken: bscEthHubTokenAsset.asset,
      outputToken: arbWbtcHubTokenAsset.asset,
      inputAmount: BigInt(1000000),
      minOutputAmount: BigInt(900000),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: AVALANCHE_MAINNET_CHAIN_ID,
      dstChain: ARBITRUM_MAINNET_CHAIN_ID,
      srcAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      dstAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;

    const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockIntent = {
      intentId: BigInt(1),
      creator: mockBscSpokeProvider.walletProvider.getWalletAddress(),
      inputToken: mockCreateIntentParams.inputToken,
      outputToken: mockCreateIntentParams.outputToken,
      inputAmount: mockCreateIntentParams.inputAmount,
      minOutputAmount: mockCreateIntentParams.minOutputAmount,
      deadline: mockCreateIntentParams.deadline,
      allowPartialFill: mockCreateIntentParams.allowPartialFill,
      srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
      dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
      srcAddress: mockCreateIntentParams.srcAddress,
      dstAddress: mockCreateIntentParams.dstAddress,
      solver: mockCreateIntentParams.solver,
      data: mockCreateIntentParams.data,
    } satisfies Intent;

    beforeEach(() => {
      vi.spyOn(solverService, 'createIntent').mockResolvedValueOnce([mockTxHash, mockIntent]);
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        },
      });
    });

    it('should successfully create and submit an intent', async () => {
      vi.spyOn(EvmSolverService, 'createIntent').mockResolvedValueOnce([mockTxHash, mockIntent]);
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        },
      });
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
        success: true,
        message: 'Transaction submitted successfully',
      });

      const result = await solverService.createAndSubmitIntent(
        mockCreateIntentParams,
        mockBscSpokeProvider,
        mockHubProvider,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value[0]).toBeDefined();
        expect(result.value[1]).toEqual(mockIntent);
      }
      expect(solverService['createIntent']).toHaveBeenCalledWith(
        mockCreateIntentParams,
        mockBscSpokeProvider,
        mockHubProvider,
        false,
      );
      expect(solverService['postExecution']).toHaveBeenCalledWith({
        intent_tx_hash: mockTxHash,
      });
      expect(IntentRelayApiService.submitTransaction).toHaveBeenCalled();
    });

    it('should handle postExecution error', async () => {
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: false,
        error: {
          detail: {
            code: IntentErrorCode.UNKNOWN,
            message: 'Post execution failed',
          },
        },
      });

      const result = await solverService.createAndSubmitIntent(
        mockCreateIntentParams,
        mockBscSpokeProvider,
        mockHubProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle submitTransaction error', async () => {
      vi.spyOn(EvmSolverService, 'createIntent').mockResolvedValueOnce([mockTxHash, mockIntent]);
      vi.spyOn(solverService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        },
      });
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
        success: false,
        message: 'Transaction submission failed',
      });

      const result = await solverService.createAndSubmitIntent(
        mockCreateIntentParams,
        mockBscSpokeProvider,
        mockHubProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Transaction submission failed');
      }
    });

    it('should handle unexpected errors', async () => {
      vi.spyOn(solverService, 'createIntent').mockRejectedValueOnce(new Error('Unexpected error'));

      const result = await solverService.createAndSubmitIntent(
        mockCreateIntentParams,
        mockBscSpokeProvider,
        mockHubProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('createIntent', () => {
    const mockCreateIntentParams = {
      inputToken: bscEthHubTokenAsset.asset,
      outputToken: arbWbtcHubTokenAsset.asset,
      inputAmount: BigInt(1000000),
      minOutputAmount: BigInt(900000),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: BSC_MAINNET_CHAIN_ID,
      dstChain: ARBITRUM_MAINNET_CHAIN_ID,
      srcAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      dstAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;

    const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockIntent = {
      intentId: BigInt(1),
      creator: mockBscSpokeProvider.walletProvider.getWalletAddress(),
      inputToken: mockCreateIntentParams.inputToken,
      outputToken: mockCreateIntentParams.outputToken,
      inputAmount: mockCreateIntentParams.inputAmount,
      minOutputAmount: mockCreateIntentParams.minOutputAmount,
      deadline: mockCreateIntentParams.deadline,
      allowPartialFill: mockCreateIntentParams.allowPartialFill,
      srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
      dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
      srcAddress: mockCreateIntentParams.srcAddress,
      dstAddress: mockCreateIntentParams.dstAddress,
      solver: mockCreateIntentParams.solver,
      data: mockCreateIntentParams.data,
    } satisfies Intent;

    it('should successfully create an intent for EVM chain', async () => {
      vi.spyOn(EvmSolverService, 'createIntent').mockResolvedValueOnce([mockTxHash, mockIntent]);
      vi.spyOn(EvmWalletAbstraction, 'getUserWallet').mockResolvedValueOnce(
        mockEvmWalletProvider.getWalletAddressBytes(),
      );

      const result = await solverService.createIntent(
        mockCreateIntentParams,
        mockBscSpokeProvider,
        mockHubProvider,
        false,
      );

      if (!result.ok) {
        throw new Error('Failed to create intent');
      }

      const [txHash, intent] = result.value;

      expect(txHash).toBeDefined();
      expect(txHash).toBe(mockTxHash);
      expect(intent).toEqual(mockIntent);
    });
  });

  describe('cancelIntent', () => {
    const mockCreateIntentParams = {
      inputToken: bscEthHubTokenAsset.asset,
      outputToken: arbWbtcHubTokenAsset.asset,
      inputAmount: BigInt(1000000),
      minOutputAmount: BigInt(900000),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: BSC_MAINNET_CHAIN_ID,
      dstChain: ARBITRUM_MAINNET_CHAIN_ID,
      srcAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      dstAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;

    const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockIntent = {
      intentId: BigInt(1),
      creator: mockBscSpokeProvider.walletProvider.getWalletAddress(),
      inputToken: mockCreateIntentParams.inputToken,
      outputToken: mockCreateIntentParams.outputToken,
      inputAmount: mockCreateIntentParams.inputAmount,
      minOutputAmount: mockCreateIntentParams.minOutputAmount,
      deadline: mockCreateIntentParams.deadline,
      allowPartialFill: mockCreateIntentParams.allowPartialFill,
      srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
      dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
      srcAddress: mockCreateIntentParams.srcAddress,
      dstAddress: mockCreateIntentParams.dstAddress,
      solver: mockCreateIntentParams.solver,
      data: mockCreateIntentParams.data,
    } satisfies Intent;

    it('should successfully cancel an intent for EVM chain', async () => {
      vi.spyOn(EvmSolverService, 'cancelIntent').mockResolvedValueOnce(mockTxHash);
      const result = await solverService.cancelIntent(mockIntent, mockBscSpokeProvider, mockHubProvider, false);

      expect(result).toBe(mockTxHash);
    });

    it('should throw error for non-EVM chain', async () => {
      const nonEvmSpokeProvider = {
        chainConfig: {
          chain: {
            type: 'cosmos',
          },
        },
      } as unknown as ISpokeProvider;

      await expect(solverService.cancelIntent(mockIntent, nonEvmSpokeProvider, mockHubProvider, false)).rejects.toThrow(
        'Invalid spoke provider (EvmSpokeProvider expected',
      );
    });

    it('should throw error for invalid spoke provider', async () => {
      const invalidSpokeProvider = {
        chainConfig: {
          chain: {
            type: 'evm',
          },
        },
      } as unknown as ISpokeProvider;

      await expect(
        solverService.cancelIntent(mockIntent, invalidSpokeProvider, mockHubProvider, false),
      ).rejects.toThrow('Invalid spoke provider (EvmSpokeProvider expected)');
    });
  });

  describe('getIntent', () => {
    const mockCreateIntentParams = {
      inputToken: bscEthHubTokenAsset.asset,
      outputToken: arbWbtcHubTokenAsset.asset,
      inputAmount: BigInt(1000000),
      minOutputAmount: BigInt(900000),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: BSC_MAINNET_CHAIN_ID,
      dstChain: ARBITRUM_MAINNET_CHAIN_ID,
      srcAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      dstAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;

    const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockIntent = {
      intentId: BigInt(1),
      creator: mockBscSpokeProvider.walletProvider.getWalletAddress(),
      inputToken: mockCreateIntentParams.inputToken,
      outputToken: mockCreateIntentParams.outputToken,
      inputAmount: mockCreateIntentParams.inputAmount,
      minOutputAmount: mockCreateIntentParams.minOutputAmount,
      deadline: mockCreateIntentParams.deadline,
      allowPartialFill: mockCreateIntentParams.allowPartialFill,
      srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
      dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
      srcAddress: mockCreateIntentParams.srcAddress,
      dstAddress: mockCreateIntentParams.dstAddress,
      solver: mockCreateIntentParams.solver,
      data: mockCreateIntentParams.data,
    } satisfies Intent;

    it('should successfully get an intent for EVM chain', async () => {
      vi.spyOn(EvmSolverService, 'getIntent').mockResolvedValueOnce(mockIntent);
      const result = await solverService.getIntent(mockTxHash, mockHubProvider);

      expect(result).toEqual(mockIntent);
    });
  });

  describe('getIntentHash', () => {
    const mockCreateIntentParams = {
      inputToken: bscEthHubTokenAsset.asset,
      outputToken: arbWbtcHubTokenAsset.asset,
      inputAmount: BigInt(1000000),
      minOutputAmount: BigInt(900000),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: BSC_MAINNET_CHAIN_ID,
      dstChain: ARBITRUM_MAINNET_CHAIN_ID,
      srcAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      dstAddress: mockEvmWalletProvider.getWalletAddressBytes(),
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;

    const mockIntent = {
      intentId: BigInt(1),
      creator: mockBscSpokeProvider.walletProvider.getWalletAddress(),
      inputToken: mockCreateIntentParams.inputToken,
      outputToken: mockCreateIntentParams.outputToken,
      inputAmount: mockCreateIntentParams.inputAmount,
      minOutputAmount: mockCreateIntentParams.minOutputAmount,
      deadline: mockCreateIntentParams.deadline,
      allowPartialFill: mockCreateIntentParams.allowPartialFill,
      srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
      dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
      srcAddress: mockCreateIntentParams.srcAddress,
      dstAddress: mockCreateIntentParams.dstAddress,
      solver: mockCreateIntentParams.solver,
      data: mockCreateIntentParams.data,
    } satisfies Intent;

    it('should successfully get an intent hash', () => {
      const result = solverService.getIntentHash(mockIntent);

      expect(result).toBe('0x701bef9ec753d87ac4128de4d4c3151b2e63d5c2ba01fa369802f4e8c2237774');
    });
  });
});
