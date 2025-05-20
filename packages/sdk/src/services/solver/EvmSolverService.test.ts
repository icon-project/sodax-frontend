import type { Address, Hex } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  type CreateIntentParams,
  EvmHubProvider,
  type EvmSpokeChainConfig,
  EvmSpokeProvider,
  EvmSpokeService,
  EvmWalletProvider,
  type Intent,
  SONIC_MAINNET_CHAIN_ID,
  type SolverConfig,
  getHubChainConfig,
  getIntentRelayChainId,
  spokeChainConfig,
} from '../../index.js';
import { EvmSolverService } from './EvmSolverService.js';

describe('EvmSolverService', () => {
  const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890' satisfies Address;
  const mockIntentsContract = '0x0987654321098765432109876543210987654321' satisfies Address;
  const mockInputToken = '0x1111111111111111111111111111111111111111' satisfies Address;
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
    srcChain: BSC_MAINNET_CHAIN_ID,
    dstChain: ARBITRUM_MAINNET_CHAIN_ID,
    srcAddress: mockSrcAddress,
    dstAddress: mockDstAddress,
    solver: mockSolver,
  };

  const mockIntent: Intent = {
    ...mockCreateIntentParams,
    intentId: 1234567890n,
    inputToken: mockCreateIntentParams.inputToken as Address,
    outputToken: mockCreateIntentParams.outputToken as Address,
    creator: mockCreatorHubWalletAddress,
    srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
    dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
  };

  const mockEvmWalletProvider = new EvmWalletProvider({
    chain: AVALANCHE_MAINNET_CHAIN_ID,
    privateKey: '0xe0a01496281934154fe895c31b352f19fa9250fc0ffa28a597335d26aeb2bbf9' as Hex, // NOTE: random private key for unit testing only
    provider: 'https://polygon.infura.io/v3/1234567890',
  });

  const mockHubProvider = new EvmHubProvider(mockEvmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

  const mockBscSpokeProvider = new EvmSpokeProvider(
    mockEvmWalletProvider,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID] as EvmSpokeChainConfig,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create intent correctly', async () => {
      // Mock the deposit function response
      vi.spyOn(EvmSpokeService, 'deposit').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const [result, intent] = await EvmSolverService.createIntentDeposit(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockBscSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');
      expect(intent).toBeDefined();
    });

    it('should create raw intent tx correctly', async () => {
      const [result] = await EvmSolverService.createIntentDeposit(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockBscSpokeProvider,
        mockHubProvider,
        true,
      );

      const expectedResult = {
        from: '0xD4FD2b80635493C7965522E113E2De0250D86e09',
        to: mockBscSpokeProvider.chainConfig.addresses.assetManager,
        value: 0n,
      };

      // NOTE: data is not predictable because Intent ID is random
      expect(result.from).toBe(expectedResult.from);
      expect(result.to).toBe(expectedResult.to);
      expect(result.value).toBe(expectedResult.value);
    });
  });

  describe('cancelIntent', () => {
    it('should cancel intent correctly', async () => {
      vi.spyOn(EvmSpokeService, 'callWallet').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const result = await EvmSolverService.cancelIntent(
        mockIntent,
        mockIntentConfig,
        mockBscSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');

      // Clear the mock after test
      vi.restoreAllMocks();
    });
  });

  describe('getIntentHash', () => {
    it('should return consistent hash for the same intent', () => {
      const hash1 = EvmSolverService.getIntentHash(mockIntent);
      const hash2 = EvmSolverService.getIntentHash(mockIntent);

      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different intents', () => {
      const modifiedIntent = {
        ...mockIntent,
        inputAmount: mockIntent.inputAmount + 1n,
      };

      const hash1 = EvmSolverService.getIntentHash(mockIntent);
      const hash2 = EvmSolverService.getIntentHash(modifiedIntent);

      expect(hash1).not.toBe(hash2);
    });

    it('should return a valid keccak256 hash', () => {
      const hash = EvmSolverService.getIntentHash(mockIntent);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('0x')).toBe(true);
      expect(hash.length).toBe(66); // 0x + 64 hex characters for keccak256
    });
  });

  describe('getIntentHash', () => {
    it('should get intent hash correctly', () => {
      const result = EvmSolverService.getIntentHash(mockIntent);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.startsWith('0x')).toBe(true);
      expect(result.length).toBe(66); // 0x + 64 hex characters
    });
  });

  describe('encodeCreateIntent', () => {
    it('should encode create intent correctly', () => {
      const result = EvmSolverService.encodeCreateIntent(mockIntent, mockIntentsContract);

      expect(result).toBeDefined();
      expect(result.address).toBe(mockIntentsContract);
      expect(result.value).toBe(0n);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.data.startsWith('0x')).toBe(true);
    });
  });

  describe('encodeCancelIntent', () => {
    it('should encode cancel intent correctly', () => {
      const result = EvmSolverService.encodeCancelIntent(mockIntent, mockIntentsContract);

      expect(result).toBeDefined();
      expect(result.address).toBe(mockIntentsContract);
      expect(result.value).toBe(0n);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.data.startsWith('0x')).toBe(true);
    });
  });
});
