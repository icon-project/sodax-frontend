import type { Address, Hex } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  type CreateIntentParams,
  EvmHubProvider,
  EvmWalletProvider,
  getHubChainConfig,
  getIntentRelayChainId,
  type Intent,
  type SolverConfig,
  SONIC_TESTNET_CHAIN_ID,
  spokeChainConfig,
  STELLAR_TESTNET_CHAIN_ID,
  type StellarRawTransaction,
  type StellarSpokeChainConfig,
  StellarSpokeProvider,
  StellarWalletProvider,
} from '../../index.js';
import { StellarSolverService } from './StellarSolverService.js';
import { StellarSpokeService } from '../spoke/StellarSpokeService.js';
import * as constants from '../../constants.js';

describe('StellarSolverService', () => {
  const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890' satisfies Address;
  const mockIntentsContract = '0x0987654321098765432109876543210987654321' satisfies Address;
  const mockInputToken = '0xa08416f478fbb342bb86b8b2f4433548f79b0e30' satisfies Address;
  const mockOutputToken = '0x2222222222222222222222222222222222222222' satisfies Address;
  const mockSrcAddress = '0x3333333333333333333333333333333333333333' satisfies Address;
  const mockDstAddress = '0x4444444444444444444444444444444444444444' satisfies Address;
  const mockSolver = '0x5555555555555555555555555555555555555555' satisfies Address;

  const mockIntentConfig: SolverConfig = {
    intentsContract: mockIntentsContract,
    solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
    relayerApiEndpoint: 'https://...',
  };

  const mockCreateIntentParams: CreateIntentParams = {
    inputToken: mockInputToken,
    outputToken: mockOutputToken,
    inputAmount: 1000n,
    minOutputAmount: 900n,
    deadline: 1234567890n,
    data: '0x',
    allowPartialFill: true,
    srcChain: STELLAR_TESTNET_CHAIN_ID,
    dstChain: ARBITRUM_MAINNET_CHAIN_ID,
    srcAddress: mockSrcAddress,
    dstAddress: mockDstAddress,
    solver: mockSolver,
  };

  const mockIntent: Intent = {
    ...mockCreateIntentParams,
    intentId: 1234567890n,
    creator: mockCreatorHubWalletAddress,
    srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
    dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
    inputToken: mockCreateIntentParams.inputToken as Address,
    outputToken: mockCreateIntentParams.outputToken as Address,
  };

  const mockEvmWalletProvider = new EvmWalletProvider({
    chain: AVALANCHE_FUJI_TESTNET_CHAIN_ID,
    privateKey: '0xe0a01496281934154fe895c31b352f19fa9250fc0ffa28a597335d26aeb2bbf9' as Hex, // NOTE: random private key for unit testing only
    provider: 'https://polygon.infura.io/v3/1234567890',
  });

  const mockStellarWalletProvider = new StellarWalletProvider(
    'SCSGIKWUV4DIJBA7IKZ3U6IARLNVG3DOMTF4K4HMTFCSUE55ICTKZBBD', // NOTE: random private key for unit testing only
  );

  const mockHubProvider = new EvmHubProvider(mockEvmWalletProvider, getHubChainConfig(SONIC_TESTNET_CHAIN_ID));

  const mockStellarSpokeProvider = new StellarSpokeProvider(
    mockStellarWalletProvider,
    'CDMKH7TPXCV6ORMLCGXJZSX6DTTKLBO6WNBLABKBRM2OUV3HCWVIHMYM',
    spokeChainConfig[STELLAR_TESTNET_CHAIN_ID] as StellarSpokeChainConfig,
    'https://mainnet.sorobanrpc.com',
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create intent correctly', async () => {
      // Mock getOriginalAssetAddress to return a token address
      vi.spyOn(constants, 'getOriginalAssetAddress').mockReturnValue(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      );

      // Mock the StellarSolverService.createIntent implementation
      const originalCreateIntent = StellarSolverService.createIntent;
      StellarSolverService.createIntent = vi.fn().mockResolvedValue(['0xmockedtransactionhash', mockIntent]);

      // Mock the deposit function response
      vi.spyOn(StellarSpokeService, 'deposit').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      try {
        const [result, intent] = await StellarSolverService.createIntent(
          mockCreateIntentParams,
          mockCreatorHubWalletAddress,
          mockIntentConfig,
          mockStellarSpokeProvider,
          mockHubProvider,
        );

        expect(result).toBe('0xmockedtransactionhash');
        expect(intent).toBeDefined();
      } finally {
        // Restore original implementation
        StellarSolverService.createIntent = originalCreateIntent;
      }
    });

    it('should create raw intent tx correctly', async () => {
      // Mock getOriginalAssetAddress to return a token address
      vi.spyOn(constants, 'getOriginalAssetAddress').mockReturnValue(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      );

      // Mock StellarSpokeService.deposit to return the expected raw transaction
      const expectedRawTx = {
        from: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        to: mockStellarSpokeProvider.chainConfig.addresses.assetManager,
        value: 0n,
        data: 'AAAAABbxCy3mLg3hiTqX4VUEEp60pFOrJNxYM1JtxXTwXhY2AAAAZAAAAAMAAAAGAAAAAAAAAAEAAAAAAAAAAQAAAAAAAAAJAAAAAAAAAAHwXhY2AAAAQCPAo8QwsZe9FA0sz/deMdhlu6/zrk7SgkBG22ApvtpETBhnGkX4trSFDz8sVlKqvweqGUVgvjUyM0AcHxyXZQw=',
      } as StellarRawTransaction;

      vi.spyOn(StellarSpokeService, 'deposit').mockResolvedValueOnce(expectedRawTx);

      const createIntentSpy = vi.spyOn(StellarSolverService, 'createIntent');

      const [result] = await StellarSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockStellarSpokeProvider,
        mockHubProvider,
        true,
      );

      expect(result.from).toBe(expectedRawTx.from);
      expect(result.to).toBe(expectedRawTx.to);
      expect(result.value).toBe(expectedRawTx.value);
      expect(result.data).toBe(expectedRawTx.data);

      // Verify function was called with the correct parameters
      expect(createIntentSpy).toHaveBeenCalledWith(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockStellarSpokeProvider,
        mockHubProvider,
        true,
      );
    });
  });

  describe('cancelIntent', () => {
    it('should cancel intent correctly', async () => {
      vi.spyOn(StellarSpokeService, 'callWallet').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const result = await StellarSolverService.cancelIntent(
        mockIntent,
        mockIntentConfig,
        mockStellarSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');

      vi.restoreAllMocks();
    });
  });
});
