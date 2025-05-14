import type { Address, Hex } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  type CreateIntentParams,
  EvmHubProvider,
  EvmWalletProvider,
  type Intent,
  INJECTIVE_MAINNET_CHAIN_ID,
  CWSpokeProvider,
  type SolverConfig,
  getHubChainConfig,
  spokeChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type CosmosSpokeChainConfig,
  InjectiveWalletProvider,
  EvmWalletAbstraction,
  CosmosWalletProvider,
  ARCHWAY_TESTNET_CHAIN_ID,
  getIntentRelayChainId,
} from '../../index.js';
import { CWSolverService } from './CWSolverService.js';
import { CWSpokeService } from '../spoke/CWSpokeService.js';

describe('CWSolverService', () => {
  const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890' satisfies Address;
  const mockIntentsContract = '0x0987654321098765432109876543210987654321' satisfies Address;
  const mockInputToken = '0xd375590b4955f6ea5623f799153f9b787a3bd319' satisfies Address;
  const mockInputArchwayToken = '0xa4e0cbdf9a605ec54fc1d3e3089107fd55c3f064' satisfies Address;
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
    srcChain: INJECTIVE_MAINNET_CHAIN_ID,
    dstChain: ARBITRUM_MAINNET_CHAIN_ID,
    srcAddress: mockSrcAddress,
    dstAddress: mockDstAddress,
    solver: mockSolver,
  };

  const mockCreateIntentArchParams: CreateIntentParams = {
    inputToken: mockInputArchwayToken,
    outputToken: mockOutputToken,
    inputAmount: 1000n,
    minOutputAmount: 900n,
    deadline: 1234567890n,
    data: '0x',
    allowPartialFill: true,
    srcChain: ARCHWAY_TESTNET_CHAIN_ID,
    dstChain: ARBITRUM_MAINNET_CHAIN_ID,
    srcAddress: mockSrcAddress,
    dstAddress: mockDstAddress,
    solver: mockSolver,
  };

  const mockIntent: Intent = {
    ...mockCreateIntentParams,
    inputToken: mockCreateIntentParams.inputToken as Address,
    outputToken: mockCreateIntentParams.outputToken as Address,
    intentId: 1234567890n,
    creator: mockCreatorHubWalletAddress,
    srcChain: getIntentRelayChainId(mockCreateIntentParams.srcChain),
    dstChain: getIntentRelayChainId(mockCreateIntentParams.dstChain),
  };

  const mockEvmWalletProvider = new EvmWalletProvider({
    chain: AVALANCHE_MAINNET_CHAIN_ID,
    privateKey: '0xe0a01496281934154fe895c31b352f19fa9250fc0ffa28a597335d26aeb2bbf9' as Hex, // NOTE: random private key for unit testing only
    provider: 'https://polygon.infura.io/v3/1234567890',
  });

  const mockCWWalletProvider = new InjectiveWalletProvider({
    mnemonics:
      'noise trade cage potato foot gain prison fiber magic mandate pretty attend spin charge decade bunker wood pact grit depend suit doll volume analyst',
    network: 'TestNet',
    rpcUrl: 'https://testnet.sentry.tm.injective.network:443',
  });

  const mockCWArchWalletProvider = new CosmosWalletProvider({
    prefix: 'archway',
    mnemonics:
      'noise trade cage potato foot gain prison fiber magic mandate pretty attend spin charge decade bunker wood pact grit depend suit doll volume analyst',
    network: 'TestNet',
    rpcUrl: 'https://testnet.sentry.tm.injective.network:443',
    gasPrice: '1400',
  });
  mockCWArchWalletProvider.getWallet();

  const mockHubProvider = new EvmHubProvider(mockEvmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

  const mockCWSpokeProvider = new CWSpokeProvider(
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID] as CosmosSpokeChainConfig,
    mockCWWalletProvider,
  );

  const mockArchCWSpokeProvider = new CWSpokeProvider(
    spokeChainConfig[ARCHWAY_TESTNET_CHAIN_ID] as CosmosSpokeChainConfig,
    mockCWArchWalletProvider,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create intent correctly', async () => {
      // Mock the deposit function response
      vi.spyOn(CWSpokeService, 'deposit').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const [result, intent] = await CWSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockCWSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');
      expect(intent).toBeDefined();
    });

    it('should create raw intent tx correctly', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserWallet').mockResolvedValueOnce(
        '0x3333333333333333333333333333333333333333' as Address,
      );

      const [result] = await CWSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockCWSpokeProvider,
        mockHubProvider,
        true,
      );
      const expectedResult = {
        from: 'inj1mjfvtt83petu3pfdt4c23xmn3elf6g02uf5hpp',
        to: 'inj1eexvfglsptxwfj9hft96xcnsdrvr7d7dalcm8w',
      };

      // NOTE: data is not predictable because Intent ID is random
      expect(result.from).toBe(expectedResult.from);
    });
  });

  it('should create raw intent tx correctly on archway', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserWallet').mockResolvedValueOnce(
      '0x3333333333333333333333333333333333333333' as Address,
    );

    const [result] = await CWSolverService.createIntent(
      mockCreateIntentArchParams,
      mockCreatorHubWalletAddress,
      mockIntentConfig,
      mockArchCWSpokeProvider,
      mockHubProvider,
      true,
    );
    const expectedResult = {
      from: 'archway1ywtvgurt69ujpd2cpx76ufd9c98rjm8jm6f9mw',
      to: 'inj1eexvfglsptxwfj9hft96xcnsdrvr7d7dalcm8w',
    };

    // NOTE: data is not predictable because Intent ID is random
    expect(result.from).toBe(expectedResult.from);
  });

  describe('cancelIntent', () => {
    it('should cancel intent correctly', async () => {
      vi.spyOn(CWSpokeService, 'callWallet').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const result = await CWSolverService.cancelIntent(
        mockIntent,
        mockIntentConfig,
        mockCWSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');

      // Clear the mock after test
      vi.restoreAllMocks();
    });
  });
});
