import { WalletAbstractionService } from '../services/hub/index.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  type CreateIntentParams,
  type EvmHubProviderConfig,
  type FeeAmount,
  type Intent,
  SolverIntentErrorCode,
  type SolverErrorResponse,
  type SolverExecutionRequest,
  type SolverExecutionResponse,
  type SolverIntentQuoteRequest,
  type SolverIntentStatusRequest,
  type PacketData,
  type PartnerFee,
  type RelayTxStatus,
  type Result,
  EvmSolverService,
  type SolverConfigParams,
  encodeAddress,
  getHubChainConfig,
} from '../../index.js';
import { Sodax } from './Sodax.js';
import { EvmSpokeProvider } from './Providers.js';
import * as IntentRelayApiService from '../services/intentRelay/IntentRelayApiService.js';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  getMoneyMarketConfig,
  type IEvmWalletProvider,
  spokeChainConfig,
  getIntentRelayChainId,
} from '@sodax/types';

describe('Sodax', () => {
  const partnerFeePercentage = {
    address: '0x0000000000000000000000000000000000000000', // NOTE: replace with actual partner address
    percentage: 100,
  } satisfies PartnerFee;

  const partnerFeeAmount = {
    address: '0x0000000000000000000000000000000000000000', // NOTE: replace with actual partner address
    amount: 1000n,
  } satisfies PartnerFee;

  const solverConfig = {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
    partnerFee: partnerFeePercentage,
  } satisfies SolverConfigParams;

  const moneyMarketConfig = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID);

  const hubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(),
  } satisfies EvmHubProviderConfig;

  // main instance to be used for all features
  const sodax = new Sodax({
    swaps: solverConfig,
    moneyMarket: moneyMarketConfig,
    hubProviderConfig: hubConfig,
  });

  describe('constructor', () => {
    it('should initialize with both services', () => {
      expect(sodax.swaps).toBeDefined();
      expect(sodax.moneyMarket).toBeDefined();
    });

    it('should initialize with custom hub provider config', () => {
      const sodax = new Sodax({
        swaps: solverConfig,
        hubProviderConfig: hubConfig,
      });
      expect(sodax.swaps).toBeDefined();
    });
  });

  describe('SwapService', () => {
    const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
    const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';

    const mockEvmWalletProvider = {
      sendTransaction: vi.fn(),
      getWalletAddress: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999'),
      waitForTransactionReceipt: vi.fn(),
    } as unknown as IEvmWalletProvider;

    const mockBscSpokeProvider = new EvmSpokeProvider(mockEvmWalletProvider, spokeChainConfig[BSC_MAINNET_CHAIN_ID]);

    describe('getQuote', () => {
      const quoteRequest = {
        token_src: bscEthToken,
        token_dst: arbWbtcToken,
        token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
        token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
        amount: 1000n,
        quote_type: 'exact_input',
      } satisfies SolverIntentQuoteRequest;

      it('should return a successful quote response', async () => {
        // Mock fetch response
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            quoted_amount: '950',
            uuid: 'a0dd7652-b360-4123-ab2d-78cfbcd20c6b',
          }),
        });

        const result = await sodax.swaps.getQuote(quoteRequest);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBeDefined();
          expect(result.value.quoted_amount).toBe(950n);
        }
        expect(fetch).toHaveBeenCalledWith(
          `${solverConfig.solverApiEndpoint}/quote`,
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

        const result = await sodax.swaps.getQuote(quoteRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
        }
      });

      it('should handle network errors', async () => {
        // Mock fetch throwing an error
        global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

        const result = await sodax.swaps.getQuote(quoteRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
          expect(result.error.detail.code).toBe(SolverIntentErrorCode.UNKNOWN);
        }
      });
    });

    describe('getPartnerFee', () => {
      it('should calculate fee correctly for given input amount', async () => {
        const inputAmount = 1000n;
        const expectedFee = 10n; // Assuming 1% fee

        const result = sodax.swaps.getPartnerFee(inputAmount);

        expect(result).toBe(expectedFee);
      });
    });

    describe('postExecution', () => {
      const executionRequest = {
        intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
      } satisfies SolverExecutionRequest;

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
          await sodax.swaps.postExecution(executionRequest);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBeDefined();
          expect(result.value.intent_hash).toBeDefined();
          expect(result.value.answer).toBe('OK');
        }
        expect(fetch).toHaveBeenCalledWith(
          `${solverConfig.solverApiEndpoint}/execute`,
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

        const result = await sodax.swaps.postExecution(executionRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe('getStatus', () => {
      const statusRequest = {
        intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
      } satisfies SolverIntentStatusRequest;

      it('should return a successful status response', async () => {
        // Mock fetch response
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 3,
            intent_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
          }),
        });

        const result = await sodax.swaps.getStatus(statusRequest);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBeDefined();
          expect(result.value.status).toBe(3);
        }
        expect(fetch).toHaveBeenCalledWith(
          `${solverConfig.solverApiEndpoint}/status`,
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

        const result = await sodax.swaps.getStatus(statusRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe('swap', () => {
      let mockCreateIntentParams: CreateIntentParams;
      let mockIntent: Intent & FeeAmount;
      let mockPacketData: PacketData;

      beforeEach(async () => {
        const walletAddress = await mockEvmWalletProvider.getWalletAddress();
        mockCreateIntentParams = {
          inputToken: bscEthToken,
          outputToken: arbWbtcToken,
          inputAmount: BigInt(1000000),
          minOutputAmount: BigInt(900000),
          deadline: BigInt(0),
          allowPartialFill: false,
          srcChain: BSC_MAINNET_CHAIN_ID,
          dstChain: ARBITRUM_MAINNET_CHAIN_ID,
          srcAddress: walletAddress,
          dstAddress: walletAddress,
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        } satisfies CreateIntentParams;

        const walletAddressBytes = await mockEvmWalletProvider.getWalletAddress();
        const creatorAddress = await mockBscSpokeProvider.walletProvider.getWalletAddress();
        mockIntent = {
          intentId: BigInt(1),
          creator: creatorAddress,
          inputToken:
            sodax.config.getHubAssetInfo(mockCreateIntentParams.srcChain, mockCreateIntentParams.inputToken)?.asset ??
            '0x',
          outputToken:
            sodax.config.getHubAssetInfo(mockCreateIntentParams.dstChain, mockCreateIntentParams.outputToken)?.asset ??
            '0x',
          inputAmount: mockCreateIntentParams.inputAmount,
          minOutputAmount: mockCreateIntentParams.minOutputAmount,
          deadline: mockCreateIntentParams.deadline,
          allowPartialFill: mockCreateIntentParams.allowPartialFill,
          srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
          dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
          srcAddress: walletAddressBytes,
          dstAddress: walletAddressBytes,
          solver: mockCreateIntentParams.solver,
          data: mockCreateIntentParams.data,
          feeAmount: partnerFeeAmount.amount,
        } satisfies Intent & FeeAmount;

        mockPacketData = {
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
      });

      it('should successfully create and submit an intent', async () => {
        const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        const walletAddress = await mockEvmWalletProvider.getWalletAddress();

        vi.spyOn(sodax.swaps, 'createIntent').mockResolvedValueOnce({
          ok: true,
          value: [mockTxHash, { ...mockIntent, feeAmount: partnerFeeAmount.amount }, '0x'],
        });
        vi.spyOn(WalletAbstractionService, 'getUserAbstractedWalletAddress').mockResolvedValueOnce(walletAddress);
        vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
          success: true,
          message: 'Transaction submitted successfully',
        });
        vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
          ok: true,
          value: mockPacketData,
        });
        vi.spyOn(sodax.swaps, 'postExecution').mockResolvedValueOnce({
          ok: true,
          value: {
            answer: 'OK',
            intent_hash: mockTxHash,
          },
        });

        const result = await sodax.swaps.swap({
          intentParams: mockCreateIntentParams,
          spokeProvider: mockBscSpokeProvider,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBeDefined();
          expect(result.value[0]).toBeDefined();
          expect(result.value[1]).toEqual(mockIntent);
        }
        expect(sodax.swaps['createIntent']).toHaveBeenCalledWith({
          intentParams: mockCreateIntentParams,
          spokeProvider: mockBscSpokeProvider,
          fee: sodax.swaps.config.partnerFee,
          raw: false,
          skipSimulation: false,
        });
        expect(sodax.swaps['postExecution']).toHaveBeenCalledWith({
          intent_tx_hash: mockTxHash,
        });
        expect(IntentRelayApiService.submitTransaction).toHaveBeenCalled();
      });
    });

    describe('cancelIntent', () => {
      let mockCreateIntentParams: CreateIntentParams;
      let intent: Intent & FeeAmount;

      beforeEach(async () => {
        const walletAddress = await mockEvmWalletProvider.getWalletAddress();
        mockCreateIntentParams = {
          inputToken: bscEthToken,
          outputToken: arbWbtcToken,
          inputAmount: BigInt(1000000),
          minOutputAmount: BigInt(900000),
          deadline: BigInt(0),
          allowPartialFill: false,
          srcChain: BSC_MAINNET_CHAIN_ID,
          dstChain: ARBITRUM_MAINNET_CHAIN_ID,
          srcAddress: walletAddress,
          dstAddress: walletAddress,
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        } satisfies CreateIntentParams;

        const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890';
        const [, constructedIntent] = EvmSolverService.constructCreateIntentData(
          mockCreateIntentParams,
          mockCreatorHubWalletAddress,
          solverConfig,
          sodax.config,
          partnerFeeAmount,
        );
        intent = { ...constructedIntent, feeAmount: partnerFeeAmount.amount } satisfies Intent & FeeAmount;
      });

      it('should successfully cancel an intent for EVM chain', async () => {
        const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        vi.spyOn(sodax.swaps, 'cancelIntent').mockResolvedValueOnce({
          ok: true,
          value: mockTxHash,
        });
        const result = await sodax.swaps.cancelIntent(intent, mockBscSpokeProvider);

        expect(result.ok).toBe(true);
        expect(result.ok && result.value).toBe(mockTxHash);
      });
    });

    describe('getIntent', () => {
      let mockCreateIntentParams: CreateIntentParams;
      let mockIntent: Intent & FeeAmount;

      beforeEach(async () => {
        const walletAddress = await mockEvmWalletProvider.getWalletAddress();
        mockCreateIntentParams = {
          inputToken: bscEthToken,
          outputToken: arbWbtcToken,
          inputAmount: BigInt(1000000),
          minOutputAmount: BigInt(900000),
          deadline: BigInt(0),
          allowPartialFill: false,
          srcChain: BSC_MAINNET_CHAIN_ID,
          dstChain: ARBITRUM_MAINNET_CHAIN_ID,
          srcAddress: walletAddress,
          dstAddress: walletAddress,
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        } satisfies CreateIntentParams;

        const creatorAddress = await mockBscSpokeProvider.walletProvider.getWalletAddress();
        const walletAddressBytes = encodeAddress(BSC_MAINNET_CHAIN_ID, walletAddress);
        mockIntent = {
          intentId: BigInt(1),
          creator: creatorAddress,
          inputToken:
            sodax.config.getHubAssetInfo(mockCreateIntentParams.srcChain, mockCreateIntentParams.inputToken)?.asset ??
            '0x',
          outputToken:
            sodax.config.getHubAssetInfo(mockCreateIntentParams.dstChain, mockCreateIntentParams.outputToken)?.asset ??
            '0x',
          inputAmount: mockCreateIntentParams.inputAmount,
          minOutputAmount: mockCreateIntentParams.minOutputAmount,
          deadline: mockCreateIntentParams.deadline,
          allowPartialFill: mockCreateIntentParams.allowPartialFill,
          srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
          dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
          srcAddress: walletAddressBytes,
          dstAddress: walletAddressBytes,
          solver: mockCreateIntentParams.solver,
          data: mockCreateIntentParams.data,
          feeAmount: partnerFeeAmount.amount,
        } satisfies Intent & FeeAmount;
      });

      it('should successfully get an intent for EVM chain', async () => {
        const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        vi.spyOn(EvmSolverService, 'getIntent').mockResolvedValueOnce(mockIntent);
        const result = await sodax.swaps.getIntent(mockTxHash);

        expect(result).toEqual(mockIntent);
      });

      it('should should successfully get an intent for EVM chain and format src and dst chain ids using getSpokeChainIdFromIntentRelayChainId', async () => {
        const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        vi.spyOn(EvmSolverService, 'getIntent').mockResolvedValueOnce(mockIntent);
        const result = await sodax.swaps.getIntent(mockTxHash);

        expect(result).toEqual(mockIntent);
        expect(mockCreateIntentParams.srcChain).toEqual(
          sodax.config.getSpokeChainIdFromIntentRelayChainId(mockIntent.srcChain),
        );
        expect(mockCreateIntentParams.dstChain).toEqual(
          sodax.config.getSpokeChainIdFromIntentRelayChainId(mockIntent.dstChain),
        );
      });
    });

    describe('isAllowanceValid', () => {
      let mockCreateIntentParams: CreateIntentParams;

      beforeEach(async () => {
        const walletAddress = await mockEvmWalletProvider.getWalletAddress();
        mockCreateIntentParams = {
          inputToken: bscEthToken,
          outputToken: arbWbtcToken,
          inputAmount: BigInt(1000000),
          minOutputAmount: BigInt(900000),
          deadline: BigInt(0),
          allowPartialFill: false,
          srcChain: BSC_MAINNET_CHAIN_ID,
          dstChain: ARBITRUM_MAINNET_CHAIN_ID,
          srcAddress: walletAddress,
          dstAddress: walletAddress,
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        } satisfies CreateIntentParams;
      });

      it('should return true when allowance is sufficient', async () => {
        vi.spyOn(sodax.swaps, 'isAllowanceValid').mockResolvedValueOnce({
          ok: true,
          value: true,
        });

        const result = await sodax.swaps.isAllowanceValid({
          intentParams: mockCreateIntentParams,
          spokeProvider: mockBscSpokeProvider,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should return false when allowance is insufficient', async () => {
        vi.spyOn(sodax.swaps, 'isAllowanceValid').mockResolvedValueOnce({
          ok: true,
          value: false,
        });

        const result = await sodax.swaps.isAllowanceValid({
          intentParams: mockCreateIntentParams,
          spokeProvider: mockBscSpokeProvider,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should handle errors', async () => {
        const mockError = new Error('ERC20 service error');
        vi.spyOn(sodax.swaps, 'isAllowanceValid').mockResolvedValueOnce({
          ok: false,
          error: mockError,
        });

        const result = await sodax.swaps.isAllowanceValid({
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
      let mockCreateIntentParams: CreateIntentParams;

      beforeEach(async () => {
        const walletAddress = await mockEvmWalletProvider.getWalletAddress();
        mockCreateIntentParams = {
          inputToken: bscEthToken,
          outputToken: arbWbtcToken,
          inputAmount: BigInt(1000000),
          minOutputAmount: BigInt(900000),
          deadline: BigInt(0),
          allowPartialFill: false,
          srcChain: BSC_MAINNET_CHAIN_ID,
          dstChain: ARBITRUM_MAINNET_CHAIN_ID,
          srcAddress: walletAddress,
          dstAddress: walletAddress,
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        } satisfies CreateIntentParams;
      });

      it('should successfully approve tokens', async () => {
        const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        vi.spyOn(sodax.swaps, 'approve').mockResolvedValueOnce({
          ok: true,
          value: mockTxHash,
        });

        const result = await sodax.swaps.approve({
          intentParams: mockCreateIntentParams,
          spokeProvider: mockBscSpokeProvider,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(mockTxHash);
        }
      });

      it('should return raw transaction when raw parameter is true', async () => {
        const mockRawTx = {
          to: '0x...' as `0x${string}`,
          data: '0x...' as `0x${string}`,
          from: '0x...' as `0x${string}`,
          value: 0n,
        };
        vi.spyOn(sodax.swaps, 'approve').mockResolvedValueOnce({
          ok: true,
          value: mockRawTx,
        });

        const result = await sodax.swaps.approve({
          intentParams: mockCreateIntentParams,
          spokeProvider: mockBscSpokeProvider,
          raw: true,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(mockRawTx);
        }
      });

      it('should handle errors', async () => {
        const mockError = new Error('ERC20 service error');
        vi.spyOn(sodax.swaps, 'approve').mockResolvedValueOnce({
          ok: false,
          error: mockError,
        });

        const result = await sodax.swaps.approve({
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
});
