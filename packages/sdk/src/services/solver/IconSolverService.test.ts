import type { Address, Hex } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  type CreateIntentParams,
  EvmHubProvider,
  EvmWalletProvider,
  ICON_TESTNET_CHAIN_ID,
  type IconRawTransaction,
  type IconSpokeChainConfig,
  IconSpokeProvider,
  IconWalletProvider,
  type Intent,
  SONIC_MAINNET_CHAIN_ID,
  type SolverConfig,
  getHubChainConfig,
  getIntentRelayChainId,
  spokeChainConfig,
} from '../../index.js';
import { IconSolverService } from './IconSolverService.js';
import { IconSpokeService } from '../spoke/IconSpokeService.js';

describe('IConSolverService', () => {
  const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890' satisfies Address;
  const mockIntentsContract = '0x0987654321098765432109876543210987654321' satisfies Address;
  const mockInputToken = '0x6acfc83bf253e8cfde6876cf1388a33dcf82b830' satisfies Address;
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
    srcChain: ICON_TESTNET_CHAIN_ID,
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

  const mockIconWalletProvider = new IconWalletProvider(
    'hx0ccddc9d1436cb4842fa1809fa760f53fdc699b1',
    'https://ctz.solidwallet.io/api/v3/',
  );

  const mockHubProvider = new EvmHubProvider(mockEvmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

  const mockIconSpokeProvider = new IconSpokeProvider(
    mockIconWalletProvider,
    spokeChainConfig[ICON_TESTNET_CHAIN_ID] as IconSpokeChainConfig,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create intent correctly', async () => {
      // Mock the deposit function response
      vi.spyOn(IconSpokeService, 'deposit').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const [result, intent] = await IconSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockIconSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');
      expect(intent).toBeDefined();
    });

    it('should create raw intent tx correctly', async () => {
      vi.spyOn(IconSpokeService, 'deposit').mockResolvedValueOnce({
        value: '0x0',
      } as IconRawTransaction);

      const [result] = await IconSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockIconSpokeProvider,
        mockHubProvider,
        true,
      );
      const expectedResult = {
        value: '0x0',
      };

      // NOTE: only using basic as this is mocked result
      expect(result.value).toBe(expectedResult.value);
    });
  });

  describe('cancelIntent', () => {
    it('should cancel intent correctly', async () => {
      vi.spyOn(IconSpokeService, 'callWallet').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const result = await IconSolverService.cancelIntent(
        mockIntent,
        mockIntentConfig,
        mockIconSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');

      // Clear the mock after test
      vi.restoreAllMocks();
    });
  });
});
