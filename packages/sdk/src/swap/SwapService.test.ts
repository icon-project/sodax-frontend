import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CreateIntentParams,
  type Intent,
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
  SwapService,
  calculateFeeAmount,
  type SpokeProvider,
  DEFAULT_DEADLINE_OFFSET,
  DEFAULT_RELAY_TX_TIMEOUT,
  type ConfigService,
} from '../index.js';
import * as IntentRelayApiService from '../shared/services/intentRelay/IntentRelayApiService.js';
import type {
  IntentRelayRequest,
  WaitUntilIntentExecutedPayload,
} from '../shared/services/intentRelay/IntentRelayApiService.js';
import { EvmSolverService } from './EvmSolverService.js';
import { Erc20Service } from '../shared/services/erc-20/Erc20Service.js';
import type { EvmHubProvider, IWalletProvider } from '../shared/entities/Providers.js';
import {
  isSwapSupportedToken,
  ARBITRUM_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  type Address,
  getIntentRelayChainId,
  type SolverConfig,
  type Token,
  type SpokeChainId,
  type HttpUrl,
} from '@sodax/types';
import { DEFAULT_RELAYER_API_ENDPOINT } from '../shared/constants.js';
import {
  createTestEvmSpokeProvider,
  createTestSonicSpokeProvider,
  createTestEvmHubProviderInstance,
  createTestEvmHubProvider,
  createTestConfigService,
} from '../shared/test-utils/testInstances.js';
import { SONIC_MAINNET_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID, STELLAR_MAINNET_CHAIN_ID } from '@sodax/types';
import type { GetBlockReturnType } from 'viem';
import { SolverApiService } from './SolverApiService.js';
import { SpokeService } from '../shared/services/spoke/SpokeService.js';
import { SonicSpokeService } from '../shared/services/spoke/SonicSpokeService.js';
import type { CreateLimitOrderParams } from './SwapService.js';

describe('SwapService', async () => {
  // Constants shared across all tests
  const intentsContract = '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef' satisfies Address;
  const bnbOnBSC = '0x0000000000000000000000000000000000000000';
  const ETHOnBASE = '0x0000000000000000000000000000000000000000';
  const feeAmount = 1000n; // 1000 of input token
  const feePercentage = 100; // 1% fee
  const creatorHubWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

  const solverConfig = {
    intentsContract: intentsContract,
    solverApiEndpoint: 'https://api.sodax.com/v1/intent',
  } satisfies SolverConfig;

  const quoteRequest = {
    token_src: bnbOnBSC,
    token_dst: ETHOnBASE,
    token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
    token_dst_blockchain_id: BASE_MAINNET_CHAIN_ID,
    amount: 1_000_000_000_000_000_000n,
    quote_type: 'exact_input',
  } satisfies SolverIntentQuoteRequest;

  const packetData = {
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

  let testConfigService: ConfigService;
  let testHubProvider: ReturnType<typeof createTestEvmHubProvider>;
  let testSwapService: SwapService;
  let testSwapServiceWithPercentageFee: SwapService;
  let testSwapServiceWithAmountFee: SwapService;
  let testArbSpokeProvider: SpokeProvider;
  let testArbWalletProvider: IWalletProvider;

  beforeEach(() => {
    testConfigService = createTestConfigService();
    testHubProvider = createTestEvmHubProvider();
    testSwapService = new SwapService({
      configService: testConfigService,
      hubProvider: testHubProvider,
    });

    testSwapServiceWithPercentageFee = new SwapService({
      config: {
        ...solverConfig,
        partnerFee: {
          address: '0x0000000000000000000000000000000000000000',
          percentage: feePercentage,
        },
      },
      configService: testConfigService,
      hubProvider: testHubProvider,
    });

    testSwapServiceWithAmountFee = new SwapService({
      config: {
        ...solverConfig,
        partnerFee: {
          address: '0x0000000000000000000000000000000000000000',
          amount: feeAmount,
        },
      },
      configService: testConfigService,
      hubProvider: testHubProvider,
    });

    testArbSpokeProvider = createTestEvmSpokeProvider(ARBITRUM_MAINNET_CHAIN_ID);
    testArbWalletProvider = testArbSpokeProvider.walletProvider;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    let testHubProvider: ReturnType<typeof createTestEvmHubProvider>;
    let testConfigService: ReturnType<typeof createTestConfigService>;
    beforeEach(() => {
      testHubProvider = createTestEvmHubProvider();
      testConfigService = createTestConfigService();
    });

    describe('when config is undefined', () => {
      it('should use default solver config', () => {
        const service = new SwapService({
          configService: testConfigService,
          hubProvider: testHubProvider,
        });

        expect(service.config).toBeDefined();
        expect(service.config.intentsContract).toBe('0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef');
        expect(service.config.solverApiEndpoint).toBe('https://api.sodax.com/v1/intent');
        expect(service.config.partnerFee).toBeUndefined();
        expect(service.config.relayerApiEndpoint).toBe('https://xcall-relay.nw.iconblockchain.xyz');
        expect(service.configService).toBe(testConfigService);
        expect(service.hubProvider).toBe(testHubProvider);
      });

      it('should use provided relayerApiEndpoint when config is undefined', () => {
        const customRelayerEndpoint = 'https://custom-relayer.example.com' as HttpUrl;
        const service = new SwapService({
          configService: testConfigService,
          hubProvider: testHubProvider,
          relayerApiEndpoint: customRelayerEndpoint,
        });

        expect(service.config.relayerApiEndpoint).toBe(customRelayerEndpoint);
      });
    });

    describe('when config is a configured solver config', () => {
      it('should use the provided config with defaults', () => {
        const customConfig: SolverConfig = {
          intentsContract: '0x1234567890123456789012345678901234567890' as Address,
          solverApiEndpoint: 'https://custom-solver.example.com',
        };

        const service = new SwapService({
          config: customConfig,
          configService: testConfigService,
          hubProvider: testHubProvider,
        });

        expect(service.config.intentsContract).toBe(customConfig.intentsContract);
        expect(service.config.solverApiEndpoint).toBe(customConfig.solverApiEndpoint);
        expect(service.config.partnerFee).toBeUndefined();
        expect(service.config.relayerApiEndpoint).toBe(DEFAULT_RELAYER_API_ENDPOINT);
        expect(service.configService).toBe(testConfigService);
        expect(service.hubProvider).toBe(testHubProvider);
      });

      it('should use provided config with partnerFee when configured', () => {
        const customConfig: SolverConfig & { partnerFee?: PartnerFee } = {
          intentsContract: '0x1234567890123456789012345678901234567890' as Address,
          solverApiEndpoint: 'https://custom-solver.example.com',
          partnerFee: {
            address: '0x1111111111111111111111111111111111111111' as Address,
            amount: 1000n,
          },
        };

        const service = new SwapService({
          config: customConfig,
          configService: testConfigService,
          hubProvider: testHubProvider,
        });

        expect(service.config.intentsContract).toBe(customConfig.intentsContract);
        expect(service.config.solverApiEndpoint).toBe(customConfig.solverApiEndpoint);
        expect(service.config.partnerFee).toEqual(customConfig.partnerFee);
      });

      it('should use provided relayerApiEndpoint when config is configured', () => {
        const customRelayerEndpoint = 'https://custom-relayer.example.com' as HttpUrl;
        const customConfig: SolverConfig = {
          intentsContract: '0x1234567890123456789012345678901234567890' as Address,
          solverApiEndpoint: 'https://custom-solver.example.com',
        };

        const service = new SwapService({
          config: customConfig,
          configService: testConfigService,
          hubProvider: testHubProvider,
          relayerApiEndpoint: customRelayerEndpoint,
        });

        expect(service.config.relayerApiEndpoint).toBe(customRelayerEndpoint);
      });
    });

    describe('when config is a partial config (only partnerFee)', () => {
      it('should derive solver config from hub provider chain ID', () => {
        const partialConfig: { partnerFee: PartnerFee } = {
          partnerFee: {
            address: '0x2222222222222222222222222222222222222222' as Address,
            percentage: 50, // 0.5%
          },
        };

        const service = new SwapService({
          config: partialConfig,
          configService: testConfigService,
          hubProvider: testHubProvider,
        });

        // Should use solver config from hub provider's chain ID
        expect(service.config.intentsContract).toBe('0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef');
        expect(service.config.solverApiEndpoint).toBe('https://api.sodax.com/v1/intent');
        expect(service.config.partnerFee).toEqual(partialConfig.partnerFee);
        expect(service.config.relayerApiEndpoint).toBe('https://xcall-relay.nw.iconblockchain.xyz');
        expect(service.configService).toBe(testConfigService);
        expect(service.hubProvider).toBe(testHubProvider);
      });
    });
  });

  describe('swap configs', () => {
    it('should return the correct spoke chain configs', () => {
      const result = testConfigService.getSupportedSpokeChains();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return the correct supported swap tokens for a given spoke chain ID', () => {
      const supportedSwapTokensForChainId: readonly Token[] =
        testConfigService.getSupportedSwapTokensByChainId(ARBITRUM_MAINNET_CHAIN_ID);
      expect(Array.isArray(supportedSwapTokensForChainId)).toBe(true);
      expect(supportedSwapTokensForChainId.length).toBeGreaterThan(0);
    });

    it('should return the correct supported swap tokens for a given spoke chain ID', () => {
      const supportedSwapTokensPerChain: Record<SpokeChainId, readonly Token[]> =
        testSwapService.getSupportedSwapTokens();
      expect(supportedSwapTokensPerChain).toBeDefined();
      expect(Object.keys(supportedSwapTokensPerChain).length).toBeGreaterThan(0);
      expect(supportedSwapTokensPerChain[ARBITRUM_MAINNET_CHAIN_ID].length).toBeGreaterThan(0);
    });

    it('should check if token is swap supported', () => {
      const supportedSwapTokensForChainId: readonly Token[] =
        testSwapService.getSupportedSwapTokensByChainId(ARBITRUM_MAINNET_CHAIN_ID);
      const token = supportedSwapTokensForChainId[0];
      expect(token && isSwapSupportedToken(ARBITRUM_MAINNET_CHAIN_ID, token.address)).toBe(true);
    });
  });

  describe('getQuote', () => {
    let testConfigService: ConfigService;
    let hubProvider: EvmHubProvider;
    let swapService: SwapService;

    beforeEach(() => {
      testConfigService = createTestConfigService();
      hubProvider = createTestEvmHubProviderInstance();
    });

    // This test verifies that SwapService.getQuote calls SolverApiService.getQuote
    // with the correctly fee-adjusted amount, in accordance with quote_type and partner fee.
    it('should call SolverApiService.getQuote with amount adjusted by partner fee', async () => {
      const spyGetQuote = vi.spyOn(SolverApiService, 'getQuote');

      // Force using the fee (simulate a config with a specific partner fee)
      const partnerFee: PartnerFee = {
        address: '0x3333333333333333333333333333333333333333' as Address,
        percentage: 100, // 1%
      };
      swapService = new SwapService({
        config: { partnerFee },
        configService: testConfigService,
        hubProvider: hubProvider,
      });

      const testPayload: SolverIntentQuoteRequest = {
        ...quoteRequest,
        amount: 1000n,
      };

      // Expected adjusted amount: amount - 1% of amount
      const expectedAdjustedAmount = testPayload.amount - (testPayload.amount * 100n) / 10000n; // 1% fee

      swapService.getQuote(testPayload);

      expect(spyGetQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          ...quoteRequest,
          amount: expectedAdjustedAmount,
        }),
        expect.objectContaining(solverConfig),
        testConfigService,
      );
    });
  });

  describe('getPartnerFee', () => {
    it('should calculate fee correctly for given input amount', () => {
      const inputAmount = 1000n;
      const expectedFee = 10n; // Assuming 1% fee

      const result = testSwapServiceWithPercentageFee.getPartnerFee(inputAmount);

      expect(result).toBe(expectedFee);
    });

    it('should handle zero input amount', () => {
      const inputAmount = 0n;

      expect(() => testSwapServiceWithPercentageFee.getPartnerFee(inputAmount)).toThrow();
    });

    it('should handle very large input amount', () => {
      const inputAmount = 2n ** 128n - 1n;
      const result = testSwapServiceWithPercentageFee.getPartnerFee(inputAmount);

      expect(result).toBeDefined();
      expect(typeof result).toBe('bigint');
      expect(result).toBeGreaterThan(0n);
    });

    it('should handle negative input amount', () => {
      const inputAmount = -1000n;

      expect(() => testSwapServiceWithPercentageFee.getPartnerFee(inputAmount)).toThrow();
    });

    it('should handle undefined input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => testSwapServiceWithPercentageFee.getPartnerFee(undefined)).toThrow();
    });

    it('should handle null input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => testSwapServiceWithPercentageFee.getPartnerFee(null)).toThrow();
    });

    it('should handle fee amount', () => {
      const inputAmount = 1000n;
      const result = testSwapServiceWithAmountFee.getPartnerFee(inputAmount);

      expect(result).toBe(feeAmount);
    });

    it('should handle undefined input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => testSwapServiceWithAmountFee.getPartnerFee(undefined)).toThrow();
    });

    it('should handle null input amount', () => {
      // @ts-expect-error Testing invalid input
      expect(() => testSwapServiceWithAmountFee.getPartnerFee(null)).toThrow();
    });
  });

  describe('getSwapDeadline', () => {
    it('should return deadline with default 5-minute offset', async () => {
      const block = {
        timestamp: 1700000000n,
      } as GetBlockReturnType;

      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockResolvedValueOnce(block);

      const result = await testSwapService.getSwapDeadline();

      expect(result).toBe(1700000000n + 300n); // timestamp + 5 minutes (300 seconds)
      expect(testHubProvider.publicClient.getBlock).toHaveBeenCalledWith({
        includeTransactions: false,
        blockTag: 'latest',
      });
    });

    it('should return deadline with custom offset', async () => {
      const block = {
        timestamp: 1700000000n,
      } as GetBlockReturnType;

      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockResolvedValueOnce(block);

      const customDeadline = 600n; // 10 minutes
      const result = await testSwapService.getSwapDeadline(customDeadline);

      expect(result).toBe(1700000000n + 600n); // timestamp + 10 minutes
      expect(testHubProvider.publicClient.getBlock).toHaveBeenCalledWith({
        includeTransactions: false,
        blockTag: 'latest',
      });
    });

    it('should handle zero deadline offset', async () => {
      const block = {
        timestamp: 1700000000n,
      } as GetBlockReturnType;

      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockResolvedValueOnce(block);

      await expect(testSwapService.getSwapDeadline(0n)).rejects.toThrow('Deadline must be greater than 0');
    });

    it('should handle very large deadline offset', async () => {
      const block = {
        timestamp: 1700000000n,
      } as GetBlockReturnType;

      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockResolvedValueOnce(block);

      const largeDeadline = 2n ** 64n - 1n; // Very large deadline
      const result = await testSwapService.getSwapDeadline(largeDeadline);

      expect(result).toBe(1700000000n + largeDeadline);
    });

    it('should handle negative deadline offset', async () => {
      const block = {
        timestamp: 1700000000n,
      } as GetBlockReturnType;

      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockResolvedValueOnce(block);

      const negativeDeadline = -300n; // Negative deadline
      await expect(testSwapService.getSwapDeadline(negativeDeadline)).rejects.toThrow(
        'Deadline must be greater than 0',
      );
    });

    it('should handle hub provider errors', async () => {
      const error = new Error('Failed to get block');
      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockRejectedValueOnce(error);

      await expect(testSwapService.getSwapDeadline()).rejects.toThrow('Failed to get block');
      expect(testHubProvider.publicClient.getBlock).toHaveBeenCalledWith({
        includeTransactions: false,
        blockTag: 'latest',
      });
    });

    it('should handle undefined deadline parameter', async () => {
      const block = {
        timestamp: 1700000000n,
      } as GetBlockReturnType;

      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockResolvedValueOnce(block);

      const result = await testSwapService.getSwapDeadline(DEFAULT_DEADLINE_OFFSET);
      expect(result).toBe(block.timestamp + DEFAULT_DEADLINE_OFFSET);
    });

    it('should handle null deadline parameter', async () => {
      const block = {
        timestamp: 1700000000n,
      } as GetBlockReturnType;

      vi.spyOn(testHubProvider.publicClient, 'getBlock').mockResolvedValueOnce(block);

      // @ts-expect-error Testing null parameter
      await expect(testSwapService.getSwapDeadline(null)).rejects.toThrow('Deadline must be greater than 0');
    });
  });

  describe('getSolverFee', () => {
    it('should calculate 0.1% fee for a given positive input amount', () => {
      const inputAmount = 1_000_000n;
      // 0.1% of 1,000,000 is 1,000,000 * 10 / 10,000 = 1000n
      const expectedFee = 1000n;

      const result = testSwapService.getSolverFee(inputAmount);

      expect(result).toBe(expectedFee);
    });

    it('should handle zero input amount by returning zero fee', () => {
      const inputAmount = 0n;
      const result = testSwapService.getSolverFee(inputAmount);

      expect(result).toBe(0n);
    });

    it('should properly calculate fee for very large input', () => {
      const inputAmount = 2n ** 128n - 1n;
      const result = testSwapService.getSolverFee(inputAmount);

      expect(result).toBeGreaterThan(0n);
      expect(typeof result).toBe('bigint');
    });
  });

  describe('getStatus', () => {
    it('should call SolverApiService.getStatus with the correct parameters', async () => {
      const spyGetStatus = vi.spyOn(SolverApiService, 'getStatus');

      const statusRequest = {
        intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
      } satisfies SolverIntentStatusRequest;

      testSwapService.getStatus(statusRequest);

      expect(spyGetStatus).toHaveBeenCalledWith(statusRequest, expect.objectContaining(solverConfig));
    });
  });

  describe('postExecution', () => {
    const executionRequest = {
      intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
    } satisfies SolverExecutionRequest;

    it('should return a successful post execution response', async () => {
      const spyPostExecution = vi.spyOn(SolverApiService, 'postExecution').mockImplementation(
        async () =>
          ({
            ok: true,
            value: {
              answer: 'OK',
              intent_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
            } satisfies SolverExecutionResponse,
          }) satisfies Result<SolverExecutionResponse, SolverErrorResponse>,
      );

      await testSwapService.postExecution(executionRequest);

      expect(spyPostExecution).toHaveBeenCalledWith(executionRequest, expect.objectContaining(solverConfig));
    });
  });

  describe('createAndSubmitIntent', () => {
    it('should call createAndSubmitIntent with correct parameters when swap is called', async () => {
      // Arrange
      const intentParams = {
        inputToken: '0xTestInputToken',
        outputToken: '0xTestOutputToken',
        inputAmount: 1234n,
        minOutputAmount: 1000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: '0x38.bsc',
        dstChain: '0xa4b1.arbitrum',
        srcAddress: '0xSRCADDRESS',
        dstAddress: '0xDSTADDRESS',
        solver: '0xSOLVERADDRESS',
        data: '0x',
      } satisfies CreateIntentParams;

      const expectedFee = testSwapService.config.partnerFee;
      const expectedTimeout = 60000;
      const expectedSkipSimulation = false;

      // @ts-expect-error Testing mock
      const spyCreateAndSubmitIntent = vi.spyOn(testSwapService, 'createAndSubmitIntent').mockResolvedValueOnce(() => ({
        ok: true,
        value: [],
      }));

      await testSwapService.swap({
        intentParams,
        spokeProvider: testArbSpokeProvider,
        timeout: expectedTimeout,
      });

      // Assert
      expect(spyCreateAndSubmitIntent).toHaveBeenCalledWith({
        intentParams,
        spokeProvider: testArbSpokeProvider,
        fee: expectedFee,
        timeout: expectedTimeout,
        skipSimulation: expectedSkipSimulation,
      });
    });
  });

  describe('isAllowanceValid', () => {
    const createIntentParams = async (): Promise<CreateIntentParams> => {
      const srcAddress = await testArbWalletProvider.getWalletAddress();
      const dstAddress = await testArbWalletProvider.getWalletAddress();
      return {
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
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

    it('should call Erc20Service.isAllowanceValid function internally', async () => {
      const testIntentParams = await createIntentParams();

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
        ok: true,
        value: true,
      });

      const result = await testSwapService.isAllowanceValid({
        intentParams: testIntentParams,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        testIntentParams.inputToken,
        testIntentParams.inputAmount +
          calculateFeeAmount(testIntentParams.inputAmount, testSwapService.config.partnerFee),
        await testArbWalletProvider.getWalletAddress(),
        testArbSpokeProvider.chainConfig.addresses.assetManager,
        testArbSpokeProvider,
      );
    });

    it('should return false when allowance is insufficient for EVM chain', async () => {
      const testIntentParams = await createIntentParams();

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
        ok: true,
        value: false,
      });

      const result = await testSwapService.isAllowanceValid({
        intentParams: testIntentParams,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it('should return true for non-EVM chains', async () => {
      const testIntentParams = await createIntentParams();
      const nonEvmSpokeProvider = {
        chainConfig: {
          chain: {
            type: 'NON_EVM',
          },
        },
        walletProvider: {
          getWalletAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        },
      } as unknown as SpokeProvider;

      const result = await testSwapService.isAllowanceValid({
        intentParams: testIntentParams,
        spokeProvider: nonEvmSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it('should handle errors from Erc20Service', async () => {
      const testIntentParams = await createIntentParams();
      const error = new Error('ERC20 service error');

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
        ok: false,
        error: error,
      });

      const result = await testSwapService.isAllowanceValid({
        intentParams: testIntentParams,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    it('should handle exceptions', async () => {
      const testIntentParams = await createIntentParams();
      const error = new Error('Unexpected error');

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockRejectedValueOnce(error);

      const result = await testSwapService.isAllowanceValid({
        intentParams: testIntentParams,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    it('should handle Sonic spoke provider type', async () => {
      const testIntentParams = await createIntentParams();
      const sonicSpokeProvider = createTestSonicSpokeProvider();

      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
        ok: true,
        value: true,
      });

      const result = await testSwapService.isAllowanceValid({
        intentParams: testIntentParams,
        spokeProvider: sonicSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        testIntentParams.inputToken,
        testIntentParams.inputAmount,
        expect.any(String),
        expect.any(String),
        sonicSpokeProvider,
      );
    });
  });

  describe('getIntent', () => {
    it('should successfully call EVMSolverService.getIntent function internally', async () => {
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      const spyGetIntent = vi.spyOn(EvmSolverService, 'getIntent');
      testSwapService.getIntent(txHash);

      expect(spyGetIntent).toHaveBeenCalledWith(txHash, expect.objectContaining(solverConfig), testHubProvider);
    });
  });

  describe('getIntentHash', () => {
    it('should successfully call EVMSolverService.getIntentHash function internally', async () => {
      const intent = {
        intentId: 1n,
        creator: '0x1234567890123456789012345678901234567890',
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x0000000000000000000000000000000000000000',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId('0x38.bsc'),
        dstChain: getIntentRelayChainId('0xa4b1.arbitrum'),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      const spyGetIntentHash = vi.spyOn(EvmSolverService, 'getIntentHash');
      testSwapService.getIntentHash(intent);

      expect(spyGetIntentHash).toHaveBeenCalledWith(expect.objectContaining(intent));
    });
  });

  describe('getFilledIntent', () => {
    it('should successfully call EVMSolverService.getFilledIntent function internally', async () => {
      const txHash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef';

      const spyGetFilledIntent = vi.spyOn(EvmSolverService, 'getFilledIntent');
      testSwapService.getFilledIntent(txHash);

      expect(spyGetFilledIntent).toHaveBeenCalledWith(txHash, expect.objectContaining(solverConfig), testHubProvider);
    });
  });

  describe('getSolvedIntentPacket', () => {
    it('should call waitUntilIntentExecuted with the expected parameters', async () => {
      const chainId = '0xa4b1.arbitrum';
      const fillTxHash = '0x1234123412341234123412341234123412341234123412341234123412341234';
      const timeout = 80000;

      // Mock waitUntilIntentExecuted to return a resolved Promise
      const waitSpy = vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
        ok: true,
        value: {
          src_chain_id: Number(getIntentRelayChainId(BSC_MAINNET_CHAIN_ID)),
          src_tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          src_address: '0x1234567890123456789012345678901234567890',
          status: 'executed' satisfies RelayTxStatus,
          dst_chain_id: Number(getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID)),
          conn_sn: 1,
          dst_address: '0x1234567890123456789012345678901234567890',
          dst_tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signatures: ['0x1234567890123456789012345678901234567890'],
          payload: '0x',
        } satisfies PacketData,
      });

      // Access config data for relayer endpoint
      const relayerApiEndpoint = testSwapService.config?.relayerApiEndpoint ?? expect.any(String);

      await testSwapService.getSolvedIntentPacket({ chainId, fillTxHash, timeout });

      expect(waitSpy).toHaveBeenCalled();
      expect(waitSpy).toHaveBeenCalledWith({
        intentRelayChainId: getIntentRelayChainId(chainId).toString(),
        spokeTxHash: fillTxHash,
        timeout: timeout,
        apiUrl: relayerApiEndpoint,
      });
    });
  });

  describe('estimateGas', () => {
    it('should call SpokeService.estimateGas with correct parameters', async () => {
      const rawTx = {
        from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
        value: 1000000000000000000n,
        data: '0x' as `0x${string}`,
      };

      const spyEstimateGas = vi.spyOn(SpokeService, 'estimateGas').mockResolvedValueOnce(21000n);

      await SwapService.estimateGas(rawTx, testArbSpokeProvider);

      expect(spyEstimateGas).toHaveBeenCalledWith(rawTx, testArbSpokeProvider);
    });
  });

  describe('submitIntent', () => {
    const submitPayload = {
      action: 'submit',
      params: {
        chain_id: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID).toString(),
        tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
      },
    } satisfies IntentRelayRequest<'submit'>;

    it('should successfully submit intent transaction', async () => {
      const mockSubmitResponse = {
        success: true,
        message: 'Transaction submitted successfully',
      };

      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce(mockSubmitResponse);

      const result = await testSwapService.submitIntent(submitPayload);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockSubmitResponse);
      }
      expect(IntentRelayApiService.submitTransaction).toHaveBeenCalledWith(
        submitPayload,
        testSwapService.config.relayerApiEndpoint,
      );
    });

    it('should return error when submitTransaction fails', async () => {
      const mockSubmitResponse = {
        success: false,
        message: 'Transaction submission failed',
      };

      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce(mockSubmitResponse);

      const result = await testSwapService.submitIntent(submitPayload);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('SUBMIT_TX_FAILED');
        expect(result.error.data.payload).toEqual(submitPayload);
      }
    });

    it('should handle exceptions from submitTransaction', async () => {
      const error = new Error('Network error');
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockRejectedValueOnce(error);

      const result = await testSwapService.submitIntent(submitPayload);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('SUBMIT_TX_FAILED');
        expect(result.error.data.error).toBe(error);
      }
    });

    it('should handle submit with Solana data', async () => {
      const submitPayloadWithData = {
        action: 'submit',
        params: {
          chain_id: getIntentRelayChainId(SOLANA_MAINNET_CHAIN_ID).toString(),
          tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af',
          data: {
            address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
            payload: '0xabcdef' as `0x${string}`,
          },
        },
      } satisfies IntentRelayRequest<'submit'>;

      const mockSubmitResponse = {
        success: true,
        message: 'Transaction submitted successfully',
      };

      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce(mockSubmitResponse);

      const result = await testSwapService.submitIntent(submitPayloadWithData);

      expect(result.ok).toBe(true);
      expect(IntentRelayApiService.submitTransaction).toHaveBeenCalledWith(
        submitPayloadWithData,
        testSwapService.config.relayerApiEndpoint,
      );
    });
  });

  describe('createAndSubmitIntent', () => {
    const createIntentParams = async (): Promise<CreateIntentParams> => {
      const srcAddress = await testArbWalletProvider.getWalletAddress();
      const dstAddress = await testArbWalletProvider.getWalletAddress();
      return {
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
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

    it('should successfully create and submit intent', async () => {
      const params = await createIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockDstTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockIntent = {
        intentId: 1n,
        creator: creatorHubWalletAddress,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
        dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      vi.spyOn(testSwapService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: 0n }, '0x'],
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
        success: true,
        message: 'Transaction submitted successfully',
      });
      vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
        ok: true,
        value: {
          ...packetData,
          dst_tx_hash: mockDstTxHash,
        },
      });
      vi.spyOn(testSwapService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockDstTxHash,
        } satisfies SolverExecutionResponse,
      });

      const result = await testSwapService.createAndSubmitIntent({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const [executionResponse, intent, deliveryInfo] = result.value;
        expect(executionResponse.intent_hash).toBe(mockDstTxHash);
        expect(intent).toBeDefined();
        expect(deliveryInfo.srcTxHash).toBe(mockTxHash);
        expect(deliveryInfo.dstTxHash).toBe(mockDstTxHash);
      }
    });

    it('should return error when createIntent fails', async () => {
      const params = await createIntentParams();
      const error = new Error('Creation failed');

      vi.spyOn(testSwapService, 'createIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'CREATION_FAILED',
          data: {
            payload: params,
            error,
          },
        },
      });

      const result = await testSwapService.createAndSubmitIntent({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATION_FAILED');
      }
    });

    it('should return error when verifyTxHash fails', async () => {
      const params = await createIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = {
        intentId: 1n,
        creator: creatorHubWalletAddress,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
        dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      vi.spyOn(testSwapService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: 0n }, '0x'],
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({
        ok: false,
        error: new Error('Transaction not found'),
      });

      const result = await testSwapService.createAndSubmitIntent({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATION_FAILED');
      }
    });

    it('should handle hub chain (no relay needed)', async () => {
      const params = await createIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = {
        intentId: 1n,
        creator: creatorHubWalletAddress,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID),
        dstChain: getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      const sonicSpokeProvider = createTestSonicSpokeProvider();
      sonicSpokeProvider.chainConfig.chain.id = testHubProvider.chainConfig.chain.id;

      vi.spyOn(testSwapService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: 0n }, '0x'],
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      vi.spyOn(testSwapService, 'postExecution').mockResolvedValueOnce({
        ok: true,
        value: {
          answer: 'OK',
          intent_hash: mockTxHash,
        } satisfies SolverExecutionResponse,
      });

      const result = await testSwapService.createAndSubmitIntent({
        intentParams: {
          ...params,
          srcChain: SONIC_MAINNET_CHAIN_ID,
          dstChain: SONIC_MAINNET_CHAIN_ID,
        },
        spokeProvider: sonicSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[2].dstTxHash).toBe(mockTxHash);
      }
    });
  });

  describe('approve', () => {
    const createIntentParams = async (): Promise<CreateIntentParams> => {
      const srcAddress = await testArbWalletProvider.getWalletAddress();
      const dstAddress = await testArbWalletProvider.getWalletAddress();
      return {
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
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

    it('should successfully approve for EVM chain', async () => {
      const params = await createIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

      const result = await testSwapService.approve({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockTxHash);
      }
      expect(Erc20Service.approve).toHaveBeenCalledWith(
        params.inputToken,
        params.inputAmount,
        testArbSpokeProvider.chainConfig.addresses.assetManager,
        testArbSpokeProvider,
        undefined,
      );
    });

    it('should return raw transaction when raw is true', async () => {
      const params = await createIntentParams();
      const mockRawTx = {
        from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
        value: 0n,
        data: '0xabcdef' as `0x${string}`,
      };

      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockRawTx);

      const result = await testSwapService.approve({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
        raw: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockRawTx);
      }
    });

    it('should handle errors from Erc20Service', async () => {
      const params = await createIntentParams();
      const error = new Error('Approval failed');

      vi.spyOn(Erc20Service, 'approve').mockRejectedValueOnce(error);

      const result = await testSwapService.approve({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    it('should return error for unsupported chain types', async () => {
      const params = await createIntentParams();
      const unsupportedProvider = {
        chainConfig: {
          chain: {
            type: 'UNSUPPORTED',
          },
        },
      } as unknown as SpokeProvider;

      const result = await testSwapService.approve({
        intentParams: params,
        spokeProvider: unsupportedProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain('Approve only supported');
      }
    });

    it('should handle Sonic spoke provider type', async () => {
      const params = await createIntentParams();
      const sonicSpokeProvider = createTestSonicSpokeProvider();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

      const result = await testSwapService.approve({
        intentParams: params,
        spokeProvider: sonicSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockTxHash);
      }
      expect(Erc20Service.approve).toHaveBeenCalledWith(
        params.inputToken,
        params.inputAmount,
        expect.any(String),
        sonicSpokeProvider,
        undefined,
      );
    });
  });

  describe('createIntent', () => {
    const createIntentParams = async (): Promise<CreateIntentParams> => {
      const srcAddress = await testArbWalletProvider.getWalletAddress();
      const dstAddress = await testArbWalletProvider.getWalletAddress();
      return {
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
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

    it('should successfully create intent for EVM chain', async () => {
      const params = await createIntentParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = {
        intentId: 1n,
        creator: creatorHubWalletAddress,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
        dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      vi.spyOn(EvmSolverService, 'constructCreateIntentData').mockReturnValue([
        '0xabcdef' as `0x${string}`,
        mockIntent,
        0n,
      ]);
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);
      vi.spyOn(testArbWalletProvider, 'getWalletAddress').mockResolvedValueOnce(params.srcAddress);

      const result = await testSwapService.createIntent({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const [txHash, intent, data] = result.value;
        expect(txHash).toBe(mockTxHash);
        expect(intent).toBeDefined();
        expect(data).toBe('0xabcdef');
      }
    });

    it('should return error when createIntent fails', async () => {
      const params = await createIntentParams();
      const error = new Error('Deposit failed');

      vi.spyOn(testArbWalletProvider, 'getWalletAddress').mockResolvedValueOnce(params.srcAddress);
      vi.spyOn(EvmSolverService, 'constructCreateIntentData').mockReturnValue([
        '0xabcdef' as `0x${string}`,
        {} as Intent,
        0n,
      ]);
      vi.spyOn(SpokeService, 'deposit').mockRejectedValueOnce(error);

      const result = await testSwapService.createIntent({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATION_FAILED');
        expect(result.error.data.payload).toEqual(params);
      }
    });

    it('should handle hub chain with Sonic spoke provider', async () => {
      const params = {
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x6047828dc181963ba44974801FF68e538dA5eaF9',
        inputAmount: BigInt(1000000),
        minOutputAmount: BigInt(900000),
        deadline: BigInt(0),
        allowPartialFill: false,
        srcChain: SONIC_MAINNET_CHAIN_ID,
        dstChain: SONIC_MAINNET_CHAIN_ID,
        srcAddress: await testArbWalletProvider.getWalletAddress(),
        dstAddress: await testArbWalletProvider.getWalletAddress(),
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } satisfies CreateIntentParams;

      const sonicSpokeProvider = createTestSonicSpokeProvider();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = {
        intentId: 1n,
        creator: creatorHubWalletAddress,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x6047828dc181963ba44974801FF68e538dA5eaF9',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID),
        dstChain: getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      vi.spyOn(sonicSpokeProvider.walletProvider, 'getWalletAddress').mockResolvedValueOnce(
        params.srcAddress as `0x${string}`,
      );
      vi.spyOn(SonicSpokeService, 'createSwapIntent').mockResolvedValueOnce([
        mockTxHash as `0x${string}`,
        mockIntent,
        0n,
        '0xabcdef' as `0x${string}`,
      ]);

      const result = await testSwapService.createIntent({
        intentParams: {
          ...params,
          srcChain: SONIC_MAINNET_CHAIN_ID,
          dstChain: SONIC_MAINNET_CHAIN_ID,
        },
        spokeProvider: sonicSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const [txHash, intent, data] = result.value;
        expect(txHash).toBe(mockTxHash);
        expect(intent).toBeDefined();
        expect(data).toBe('0xabcdef');
      }
      expect(SonicSpokeService.createSwapIntent).toHaveBeenCalled();
    });
  });

  describe('createLimitOrder', () => {
    const createLimitOrderParams = async () => {
      const srcAddress = await testArbWalletProvider.getWalletAddress();
      const dstAddress = await testArbWalletProvider.getWalletAddress();
      return {
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: BigInt(1000000),
        minOutputAmount: BigInt(900000),
        allowPartialFill: false,
        srcChain: BSC_MAINNET_CHAIN_ID as SpokeChainId,
        dstChain: ARBITRUM_MAINNET_CHAIN_ID as SpokeChainId,
        srcAddress,
        dstAddress,
        solver: '0x0000000000000000000000000000000000000000' as Address,
        data: '0x' as `0x${string}`,
      };
    };

    it('should call createAndSubmitIntent with deadline set to 0n', async () => {
      const params = await createLimitOrderParams();
      const mockExecutionResponse = {
        answer: 'OK',
        intent_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      } satisfies SolverExecutionResponse;
      const mockIntent = {
        intentId: 1n,
        creator: creatorHubWalletAddress,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
        dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      const spyCreateAndSubmitIntent = vi.spyOn(testSwapService, 'createAndSubmitIntent').mockResolvedValueOnce({
        ok: true,
        value: [
          mockExecutionResponse,
          mockIntent,
          {
            srcChainId: BSC_MAINNET_CHAIN_ID,
            srcTxHash: '0x123',
            srcAddress: params.srcAddress,
            dstChainId: ARBITRUM_MAINNET_CHAIN_ID,
            dstTxHash: '0x456',
            dstAddress: params.dstAddress,
          },
        ],
      });

      const result = await testSwapService.createLimitOrder({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      expect(spyCreateAndSubmitIntent).toHaveBeenCalledWith({
        intentParams: {
          ...params,
          deadline: 0n,
        },
        spokeProvider: testArbSpokeProvider,
        fee: testSwapService.config.partnerFee,
        timeout: DEFAULT_RELAY_TX_TIMEOUT,
        skipSimulation: false,
      });
    });
  });

  describe('createLimitOrderIntent', () => {
    const createLimitOrderParams = async () => {
      const srcAddress = await testArbWalletProvider.getWalletAddress();
      const dstAddress = await testArbWalletProvider.getWalletAddress();
      return {
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: BigInt(1000000),
        minOutputAmount: BigInt(900000),
        allowPartialFill: false,
        srcChain: BSC_MAINNET_CHAIN_ID as SpokeChainId,
        dstChain: ARBITRUM_MAINNET_CHAIN_ID as SpokeChainId,
        srcAddress,
        dstAddress,
        solver: '0x0000000000000000000000000000000000000000' as Address,
        data: '0x' as `0x${string}`,
      } satisfies CreateLimitOrderParams;
    };

    it('should call createIntent with deadline set to 0n', async () => {
      const params = await createLimitOrderParams();
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockIntent = {
        intentId: 1n,
        creator: creatorHubWalletAddress,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
        inputAmount: 1000000n,
        minOutputAmount: 900000n,
        deadline: 0n,
        allowPartialFill: false,
        srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
        dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
        srcAddress: '0x1234567890123456789012345678901234567890',
        dstAddress: '0x1234567890123456789012345678901234567890',
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } as Intent;

      const spyCreateIntent = vi.spyOn(testSwapService, 'createIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockTxHash, { ...mockIntent, feeAmount: 0n }, '0x'],
      });

      const result = await testSwapService.createLimitOrderIntent({
        intentParams: params,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      expect(spyCreateIntent).toHaveBeenCalledWith({
        intentParams: {
          ...params,
          deadline: 0n,
        } as CreateIntentParams,
        spokeProvider: testArbSpokeProvider,
        fee: testSwapService.config.partnerFee,
        raw: undefined,
        skipSimulation: false,
      });
    });
  });

  describe('cancelIntent', () => {
    const mockIntent = {
      intentId: 1n,
      creator: creatorHubWalletAddress,
      inputToken: '0x0000000000000000000000000000000000000000',
      outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
      inputAmount: 1000000n,
      minOutputAmount: 900000n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
      dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
      srcAddress: '0x1234567890123456789012345678901234567890',
      dstAddress: '0x1234567890123456789012345678901234567890',
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } as Intent;

    it('should successfully cancel intent', async () => {
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockContractCall = {
        address: intentsContract as `0x${string}`,
        value: 0n,
        data: '0xabcdef' as `0x${string}`,
      };

      vi.spyOn(EvmSolverService, 'encodeCancelIntent').mockReturnValue(mockContractCall);
      vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce(mockTxHash);
      vi.spyOn(testArbWalletProvider, 'getWalletAddress').mockResolvedValueOnce(
        '0x1234567890123456789012345678901234567890',
      );

      const result = await testSwapService.cancelIntent(mockIntent, testArbSpokeProvider);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockTxHash);
      }
      expect(EvmSolverService.encodeCancelIntent).toHaveBeenCalledWith(mockIntent, intentsContract);
    });

    it('should return error when cancelIntent fails', async () => {
      const error = new Error('Cancel failed');

      vi.spyOn(testArbWalletProvider, 'getWalletAddress').mockResolvedValueOnce(
        '0x1234567890123456789012345678901234567890',
      );
      vi.spyOn(EvmSolverService, 'encodeCancelIntent').mockReturnValue({
        address: intentsContract as `0x${string}`,
        value: 0n,
        data: '0xabcdef' as `0x${string}`,
      });
      vi.spyOn(SpokeService, 'callWallet').mockRejectedValueOnce(error);

      const result = await testSwapService.cancelIntent(mockIntent, testArbSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CANCEL_FAILED');
        expect(result.error.data.payload).toEqual(mockIntent);
      }
    });
  });

  describe('cancelAndSubmitIntent', () => {
    const mockIntent = {
      intentId: 1n,
      creator: creatorHubWalletAddress,
      inputToken: '0x0000000000000000000000000000000000000000',
      outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
      inputAmount: 1000000n,
      minOutputAmount: 900000n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
      dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
      srcAddress: '0x1234567890123456789012345678901234567890',
      dstAddress: '0x1234567890123456789012345678901234567890',
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } as Intent;

    it('should successfully cancel and submit intent', async () => {
      const mockCancelTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockDstTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      vi.spyOn(testSwapService, 'cancelIntent').mockResolvedValueOnce({
        ok: true,
        value: mockCancelTxHash,
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      vi.spyOn(IntentRelayApiService, 'submitTransaction').mockResolvedValueOnce({
        success: true,
        message: 'Transaction submitted successfully',
      });
      vi.spyOn(IntentRelayApiService, 'waitUntilIntentExecuted').mockResolvedValueOnce({
        ok: true,
        value: {
          ...packetData,
          dst_tx_hash: mockDstTxHash,
        },
      });

      const result = await testSwapService.cancelAndSubmitIntent({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const [cancelTxHash, dstTxHash] = result.value;
        expect(cancelTxHash).toBe(mockCancelTxHash);
        expect(dstTxHash).toBe(mockDstTxHash);
      }
    });

    it('should return error when cancelIntent fails', async () => {
      vi.spyOn(testSwapService, 'cancelIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'CANCEL_FAILED',
          data: {
            payload: mockIntent,
            error: new Error('Cancel failed'),
          },
        },
      });

      const result = await testSwapService.cancelAndSubmitIntent({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CANCEL_FAILED');
      }
    });

    it('should return error when verifyTxHash fails', async () => {
      const mockCancelTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      vi.spyOn(testSwapService, 'cancelIntent').mockResolvedValueOnce({
        ok: true,
        value: mockCancelTxHash,
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({
        ok: false,
        error: new Error('Transaction not found'),
      });

      const result = await testSwapService.cancelAndSubmitIntent({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok && result.error.code === 'CANCEL_FAILED') {
        expect(result.error.code).toBe('CANCEL_FAILED');
        const cancelError = result.error as IntentError<'CANCEL_FAILED'>;
        expect(cancelError.data.payload).toEqual(mockIntent);
      }
    });

    it('should return error when submitIntent fails', async () => {
      const mockCancelTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      vi.spyOn(testSwapService, 'cancelIntent').mockResolvedValueOnce({
        ok: true,
        value: mockCancelTxHash,
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      vi.spyOn(testSwapService, 'submitIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'SUBMIT_TX_FAILED',
          data: {
            payload: {} as IntentRelayRequest<'submit'>,
            error: new Error('Submit failed'),
          },
        },
      });

      const result = await testSwapService.cancelAndSubmitIntent({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('SUBMIT_TX_FAILED');
      }
    });

    it('should return error when waitUntilIntentExecuted fails', async () => {
      const mockCancelTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      vi.spyOn(testSwapService, 'cancelIntent').mockResolvedValueOnce({
        ok: true,
        value: mockCancelTxHash,
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      vi.spyOn(testSwapService, 'submitIntent').mockResolvedValueOnce({
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
            payload: {} as WaitUntilIntentExecutedPayload,
            error: new Error('Timeout'),
          },
        },
      });

      const result = await testSwapService.cancelAndSubmitIntent({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('RELAY_TIMEOUT');
      }
    });

    it('should handle exceptions in cancelAndSubmitIntent', async () => {
      const error = new Error('Unexpected error');

      vi.spyOn(testSwapService, 'cancelIntent').mockRejectedValueOnce(error);

      const result = await testSwapService.cancelAndSubmitIntent({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok && result.error.code === 'CANCEL_FAILED') {
        expect(result.error.code).toBe('CANCEL_FAILED');
        const cancelError = result.error as IntentError<'CANCEL_FAILED'>;
        expect(cancelError.data.payload).toEqual(mockIntent);
        expect(cancelError.data.error).toBe(error);
      }
    });

    it('should handle hub chain (no relay needed)', async () => {
      const mockCancelTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const sonicSpokeProvider = createTestSonicSpokeProvider();
      sonicSpokeProvider.chainConfig.chain.id = testHubProvider.chainConfig.chain.id;

      vi.spyOn(testSwapService, 'cancelIntent').mockResolvedValueOnce({
        ok: true,
        value: mockCancelTxHash,
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await testSwapService.cancelAndSubmitIntent({
        intent: {
          ...mockIntent,
          srcChain: getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID),
          dstChain: getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID),
        },
        spokeProvider: sonicSpokeProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const [cancelTxHash, dstTxHash] = result.value;
        expect(cancelTxHash).toBe(mockCancelTxHash);
        expect(dstTxHash).toBe(mockCancelTxHash);
      }
    });
  });

  describe('cancelLimitOrder', () => {
    const mockIntent = {
      intentId: 1n,
      creator: creatorHubWalletAddress,
      inputToken: '0x0000000000000000000000000000000000000000',
      outputToken: '0x5979D7b546E38E414F7E9822514be443A4800529',
      inputAmount: 1000000n,
      minOutputAmount: 900000n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: getIntentRelayChainId(BSC_MAINNET_CHAIN_ID),
      dstChain: getIntentRelayChainId(ARBITRUM_MAINNET_CHAIN_ID),
      srcAddress: '0x1234567890123456789012345678901234567890',
      dstAddress: '0x1234567890123456789012345678901234567890',
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } as Intent;

    it('should call cancelAndSubmitIntent with correct parameters', async () => {
      const mockCancelTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockDstTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const spyCancelAndSubmitIntent = vi.spyOn(testSwapService, 'cancelAndSubmitIntent').mockResolvedValueOnce({
        ok: true,
        value: [mockCancelTxHash, mockDstTxHash],
      });

      const result = await testSwapService.cancelLimitOrder({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
        timeout: 60000,
      });

      expect(result.ok).toBe(true);
      expect(spyCancelAndSubmitIntent).toHaveBeenCalledWith({
        intent: mockIntent,
        spokeProvider: testArbSpokeProvider,
        timeout: 60000,
      });
    });
  });
});
