import type { Address, Hex } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  type CreateIntentParams,
  EvmHubProvider,
  EvmWalletProvider,
  type Intent,
  SOLANA_TESTNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  type SolanaChainConfig,
  type SolanaRawTransaction,
  SolanaSpokeProvider,
  SolanaWalletProvider,
  type SolverConfig,
  getHubChainConfig,
  getIntentRelayChainId,
  spokeChainConfig,
} from '../../index.js';
import { SolanaSolverService } from './SolanaSolverService.js';
import { SolanaSpokeService } from '../spoke/SolanaSpokeService.js';
import { PublicKey } from '@solana/web3.js';

describe('SolanaSolverService', () => {
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
    srcChain: SOLANA_TESTNET_CHAIN_ID,
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

  const mockSolanaWalletProvider = new SolanaWalletProvider(
    {
      privateKey: Buffer.from(
        'd8298ee630ccec5939e3a665c463c37b253d3eed1800c4b21f4cb8c193f0eab2ae76b704ded4b3507f61aed9cd895dc9b6553203b77241b8d3391de2eaa4e736',
        'hex',
      ),
    },
    'https://solana-rpc.publicnode.com',
  );

  const mockHubProvider = new EvmHubProvider(mockEvmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

  const mockSolanaSpokeProvider = new SolanaSpokeProvider(
    mockSolanaWalletProvider,
    spokeChainConfig[SOLANA_TESTNET_CHAIN_ID] as SolanaChainConfig,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create intent correctly', async () => {
      // Mock the deposit function response
      vi.spyOn(SolanaSpokeService, 'deposit').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const [result, intent] = await SolanaSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockSolanaSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');
      expect(intent).toBeDefined();
    });

    it('should create raw intent tx correctly', async () => {
      vi.spyOn(SolanaSpokeService, 'deposit').mockResolvedValueOnce({
        from: new PublicKey(mockSolanaSpokeProvider.chainConfig.walletAddress),
        to: new PublicKey(mockSolanaSpokeProvider.chainConfig.addresses.assetManager),
        value: 0n,
      } as SolanaRawTransaction);

      const [result] = await SolanaSolverService.createIntent(
        mockCreateIntentParams,
        mockCreatorHubWalletAddress,
        mockIntentConfig,
        mockSolanaSpokeProvider,
        mockHubProvider,
        true,
      );
      const expectedResult = {
        from: '14YCFqCF9rQ1BEmPegwZKjKwsGoP5d1AZmJmUXZTTEA5',
        to: mockSolanaSpokeProvider.chainConfig.addresses.assetManager,
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
      vi.spyOn(SolanaSpokeService, 'callWallet').mockResolvedValueOnce('0xmockedtransactionhash' as Hex);

      const result = await SolanaSolverService.cancelIntent(
        mockIntent,
        mockIntentConfig,
        mockSolanaSpokeProvider,
        mockHubProvider,
      );

      expect(result).toBe('0xmockedtransactionhash');

      // Clear the mock after test
      vi.restoreAllMocks();
    });
  });
});
