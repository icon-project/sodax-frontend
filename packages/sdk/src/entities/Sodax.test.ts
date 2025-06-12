import { describe, expect, it, vi } from 'vitest';
import {
  type CreateIntentParams,
  type EvmHubProviderConfig,
  EvmSpokeProvider,
  type FeeAmount,
  type Intent,
  IntentErrorCode,
  type IntentErrorResponse,
  type IntentExecutionRequest,
  type IntentExecutionResponse,
  type IntentQuoteRequest,
  type IntentStatusRequest,
  type PacketData,
  type PartnerFee,
  type RelayTxStatus,
  type Result,
  getHubAssetInfo,
  getHubChainConfig,
  getIntentRelayChainId,
  Sodax,
  EvmSolverService,
  getMoneyMarketConfig,
  type SpokeProvider,
  type IEvmWalletProvider,
  type TxReturnType,
  spokeChainConfig,
  type SolverConfigParams,
} from '../index.js';
import { EvmWalletAbstraction } from '../services/hub/EvmWalletAbstraction.js';
import * as IntentRelayApiService from '../services/intentRelay/IntentRelayApiService.js';
import { ARBITRUM_MAINNET_CHAIN_ID, BSC_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

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
    solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
    partnerFee: partnerFeePercentage,
  } satisfies SolverConfigParams;

  const moneyMarketConfig = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID);

  const hubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  } satisfies EvmHubProviderConfig;

  // main instance to be used for all features
  const sodax = new Sodax({
    solver: solverConfig,
    moneyMarket: moneyMarketConfig,
    hubProviderConfig: hubConfig,
  });

  describe('constructor', () => {
    it('should initialize with both services', () => {
      const sodax = new Sodax({
        solver: solverConfig,
        moneyMarket: moneyMarketConfig,
      });
      expect(sodax.solver).toBeDefined();
      expect(sodax.moneyMarket).toBeDefined();
    });

    it('should initialize with custom hub provider config', () => {
      const sodax = new Sodax({
        solver: solverConfig,
        hubProviderConfig: hubConfig,
      });
      expect(sodax.solver).toBeDefined();
    });
  });

  describe('SolverService', () => {
    const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
    const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';

    const mockEvmWalletProvider = {
      sendTransaction: vi.fn(),
      getWalletAddress: vi.fn().mockReturnValue('0x9999999999999999999999999999999999999999'),
      getWalletAddressBytes: vi.fn().mockReturnValue('0x9999999999999999999999999999999999999999'),
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
      } satisfies IntentQuoteRequest;

      it('should return a successful quote response', async () => {
        // Mock fetch response
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            quoted_amount: '950',
            uuid: 'a0dd7652-b360-4123-ab2d-78cfbcd20c6b',
          }),
        });

        const result = await sodax.solver.getQuote(quoteRequest);

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
              code: IntentErrorCode.NO_PATH_FOUND,
              message: 'Invalid request parameters',
            },
          }),
        });

        const result = await sodax.solver.getQuote(quoteRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
        }
      });

      it('should handle network errors', async () => {
        // Mock fetch throwing an error
        global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

        const result = await sodax.solver.getQuote(quoteRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
          expect(result.error.detail.code).toBe(IntentErrorCode.UNKNOWN);
        }
      });
    });

    describe('getFee', () => {
      it('should calculate fee correctly for given input amount', async () => {
        const inputAmount = 1000n;
        const expectedFee = 10n; // Assuming 1% fee

        const result = await sodax.solver.getFee(inputAmount);

        expect(result).toBe(expectedFee);
      });
    });

    describe('postExecution', () => {
      const executionRequest = {
        intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
      } satisfies IntentExecutionRequest;

      it('should return a successful post execution response', async () => {
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
          await sodax.solver.postExecution(executionRequest);

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
              code: IntentErrorCode.QUOTE_NOT_FOUND,
              message: 'Execution failed',
            },
          }),
        });

        const result = await sodax.solver.postExecution(executionRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe('getStatus', () => {
      const statusRequest = {
        intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
      } satisfies IntentStatusRequest;

      it('should return a successful status response', async () => {
        // Mock fetch response
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 3,
            intent_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
          }),
        });

        const result = await sodax.solver.getStatus(statusRequest);

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
              code: IntentErrorCode.NO_PATH_FOUND,
              message: 'Intent not found',
            },
          }),
        });

        const result = await sodax.solver.getStatus(statusRequest);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe('createAndSubmitIntent', () => {
      const mockCreateIntentParams = {
        inputToken: bscEthToken,
        outputToken: arbWbtcToken,
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
        inputToken: getHubAssetInfo(mockCreateIntentParams.srcChain, mockCreateIntentParams.inputToken)?.asset ?? '0x',
        outputToken:
          getHubAssetInfo(mockCreateIntentParams.dstChain, mockCreateIntentParams.outputToken)?.asset ?? '0x',
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
        feeAmount: partnerFeeAmount.amount,
      } satisfies Intent & FeeAmount;

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

      it('should successfully create and submit an intent', async () => {
        vi.spyOn(sodax.solver, 'createIntent').mockResolvedValueOnce({
          ok: true,
          value: [
            mockTxHash as TxReturnType<EvmSpokeProvider, false>,
            { ...mockIntent, feeAmount: partnerFeeAmount.amount },
          ],
        });
        vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
          mockEvmWalletProvider.getWalletAddressBytes(),
        );
        vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
          success: true,
          message: 'Transaction submitted successfully',
        });
        vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
          ok: true,
          value: mockPacketData,
        });
        vi.spyOn(sodax.solver, 'postExecution').mockResolvedValueOnce({
          ok: true,
          value: {
            answer: 'OK',
            intent_hash: mockTxHash,
          },
        });

        // const createIntentResult = await sodax.solver.createIntent(
        //   mockCreateIntentParams,
        //   mockBscSpokeProvider,
        //   partnerFeeAmount,
        //   true,
        // );

        const result = await sodax.solver.createAndSubmitIntent(
          mockCreateIntentParams,
          mockBscSpokeProvider,
          partnerFeeAmount,
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBeDefined();
          expect(result.value[0]).toBeDefined();
          expect(result.value[1]).toEqual(mockIntent);
        }
        expect(sodax.solver['createIntent']).toHaveBeenCalledWith(
          mockCreateIntentParams,
          mockBscSpokeProvider,
          partnerFeeAmount,
          false,
        );
        expect(sodax.solver['postExecution']).toHaveBeenCalledWith({
          intent_tx_hash: mockTxHash,
        });
        expect(IntentRelayApiService.submitTransaction).toHaveBeenCalled();
      });
    });

    describe('cancelIntent', () => {
      const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890';

      const mockCreateIntentParams = {
        inputToken: bscEthToken,
        outputToken: arbWbtcToken,
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
      const [, intent] = EvmSolverService.constructCreateIntentData(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        solverConfig,
        partnerFeeAmount,
      );

      it('should successfully cancel an intent for EVM chain', async () => {
        vi.spyOn(sodax.solver, 'cancelIntent').mockResolvedValueOnce(mockTxHash);
        const result = await sodax.solver.cancelIntent(intent, mockBscSpokeProvider, false);

        expect(result).toBe(mockTxHash);
      });

      it('should throw error for invalid spoke provider', async () => {
        const invalidSpokeProvider = {
          chainConfig: {
            chain: {
              type: 'evm',
            },
          },
          walletProvider: {
            getWalletAddressBytes: () => '0x1234567890123456789012345678901234567890',
          },
        } as unknown as SpokeProvider;

        await expect(sodax.solver.cancelIntent(intent, invalidSpokeProvider, false)).rejects.toThrow(
          'Invalid spoke provider',
        );
      });
    });

    describe('getIntent', () => {
      const mockCreateIntentParams = {
        inputToken: bscEthToken,
        outputToken: arbWbtcToken,
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
        inputToken: getHubAssetInfo(mockCreateIntentParams.srcChain, mockCreateIntentParams.inputToken)?.asset ?? '0x',
        outputToken:
          getHubAssetInfo(mockCreateIntentParams.dstChain, mockCreateIntentParams.outputToken)?.asset ?? '0x',
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
        const result = await sodax.solver.getIntent(mockTxHash);

        expect(result).toEqual(mockIntent);
      });
    });
  });
});
