import type { Address, Hex } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  type CreateIntentParams,
  EvmHubProvider,
  EvmWalletProvider,
  type Intent,
  SUI_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  type SuiRawTransaction,
  SuiSpokeProvider,
  SuiWalletProvider,
  type SolverConfig,
  getHubChainConfig,
  spokeChainConfig,
  type SuiSpokeChainConfig,
  getIntentRelayChainId,
} from '../../index.js';
import { SuiSolverService } from './SuiSolverService.js';
import { SuiSpokeService } from '../spoke/SuiSpokeService.js';
import { EvmSolverService } from './EvmSolverService.js';

describe('SuiSolverService', () => {
  const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890' satisfies Address;
  const mockIntentsContract = '0x0987654321098765432109876543210987654321' satisfies Address;
  const mockInputToken = '0x4676b2a551b25c04e235553c1c81019337384673' satisfies Address;
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
    srcChain: SUI_MAINNET_CHAIN_ID,
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
    chain: AVALANCHE_MAINNET_CHAIN_ID,
    privateKey: '0xe0a01496281934154fe895c31b352f19fa9250fc0ffa28a597335d26aeb2bbf9' as Hex, // NOTE: random private key for unit testing only
    provider: 'https://polygon.infura.io/v3/1234567890',
  });

  const mockSuiWalletProvider = new SuiWalletProvider(
    'https://sui-rpc.publicnode.com',
    'label brass movie course adult slender crisp response wing resource ugly inmate',
  );

  const mockHubProvider = new EvmHubProvider(mockEvmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

  const mockSuiSpokeProvider = new SuiSpokeProvider(
    spokeChainConfig[SUI_MAINNET_CHAIN_ID] as SuiSpokeChainConfig,
    mockSuiWalletProvider,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create intent correctly', async () => {
      // Mock the deposit function response
      vi.spyOn(SuiSpokeService, 'deposit').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const [result, intent] = await SuiSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockSuiSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');
      expect(intent).toBeDefined();
    });

    it('should create raw intent tx correctly', async () => {
      vi.spyOn(EvmSolverService, 'constructCreateIntentData').mockReturnValue(['0xasdf', mockIntent] as [Hex, Intent]);
      vi.spyOn(SuiSpokeService, 'deposit').mockResolvedValueOnce({
        from: mockSuiWalletProvider.getWalletAddressBytes(),
        to: mockSuiSpokeProvider.chainConfig.addresses.assetManager,
        value: 0n,
        data: '0x',
      } as SuiRawTransaction);

      const [result] = await SuiSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockSuiSpokeProvider,
        mockHubProvider,
        true,
      );
      const expectedResult = {
        from: mockSuiWalletProvider.getWalletAddressBytes(),
        to: mockSuiSpokeProvider.chainConfig.addresses.assetManager,
        value: 0n,
      };

      // NOTE: data is not predictable because Intent ID is random
      expect(result.from.toString()).toBe(expectedResult.from.toString());
      expect(result.to.toString()).toBe(expectedResult.to.toString());
      expect(result.value).toBe(expectedResult.value);
    });
  });

  describe('cancelIntent', () => {
    it('should cancel intent correctly', async () => {
      vi.spyOn(SuiSpokeService, 'callWallet').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const result = await SuiSolverService.cancelIntent(
        mockIntent,
        mockIntentConfig,
        mockSuiSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');

      // Clear the mock after test
      vi.restoreAllMocks();
    });
  });
});
