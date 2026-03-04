import { describe, expect, it, vi } from 'vitest';
import {
  adjustAmountByFee,
  calculateFeeAmount,
  calculatePercentageFeeAmount,
  constructRawSpokeProvider,
  deriveUserWalletAddress,
  encodeAddress,
  hexToBigInt,
} from './shared-utils.js';
import {
  type IEvmWalletProvider,
  type SpokeChainConfig,
  type SpokeChainId,
  BSC_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  STELLAR_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
} from '@sodax/types';
import {
  EvmWalletAbstraction,
  getEvmViemChain,
  getHubChainConfig,
  IconRawSpokeProvider,
  InjectiveRawSpokeProvider,
  SolanaRawSpokeProvider,
  StellarRawSpokeProvider,
  type EvmHubProviderConfig,
  type InjectiveRawSpokeProviderConfig,
  type SolanaRawSpokeProviderConfig,
  type StellarRawSpokeProviderConfig,
  type SuiRawSpokeProviderConfig,
} from '../../index.js';
import { SuiRawSpokeProvider } from '../entities/sui/SuiSpokeProvider.js';
import { Sodax } from '../entities/Sodax.js';
import {
  EvmHubProvider,
  EvmRawSpokeProvider,
  SonicRawSpokeProvider,
  type EvmRawSpokeProviderConfig,
  type RawSpokeProviderConfig,
  type SonicRawSpokeProviderConfig,
} from '../entities/Providers.js';

import { EvmSpokeProvider, SonicSpokeProvider } from '../entities/Providers.js';
import invariant from 'tiny-invariant';
import type { IconRawSpokeProviderConfig } from '../entities/icon/IconSpokeProvider.js';
describe('calculatePercentageAmount', () => {
  const sodax = new Sodax();
  const address = '0x0000000000000000000000000000000000000001' as `0x${string}`;
  const mockHubWalletAddress = '0x1234567890123456789012345678901234567890';

  const mockEvmWalletProvider = {
    sendTransaction: vi.fn(),
    getWalletAddress: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999' as `0x${string}`),
    getWalletAddressBytes: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999' as `0x${string}`),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockBscSpokeProvider = new EvmSpokeProvider(mockEvmWalletProvider, spokeChainConfig[BSC_MAINNET_CHAIN_ID]);
  const mockSonicSpokeProvider = new SonicSpokeProvider(
    mockEvmWalletProvider,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
  );

  const mockHubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(),
  } satisfies EvmHubProviderConfig;

  const mockHubProvider = new EvmHubProvider({ config: mockHubConfig, configService: sodax.config });

  it('should calculate percentage amount correctly', () => {
    const testCases = [
      { amount: 1000n, percentage: 200, expected: 20n }, // 2% of 1000 = 20
      { amount: 5000n, percentage: 100, expected: 50n }, // 1% of 5000 = 50
      { amount: 10000n, percentage: 500, expected: 500n }, // 5% of 10000 = 500
      { amount: 1000000n, percentage: 50, expected: 5000n }, // 0.5% of 1000000 = 5000
      { amount: 1000000n, percentage: 10000, expected: 1000000n }, // 100% of 1000000 = 1000000
    ];

    testCases.forEach(({ amount, percentage, expected }) => {
      const result = calculatePercentageFeeAmount(amount, percentage);
      expect(result).toBe(expected);
    });
  });

  it('should calculate fee amount correctly for fixed amount fees', () => {
    const testCases = [
      { inputAmount: 1000n, fee: { amount: 100n, address }, expected: 100n },
      { inputAmount: 5000n, fee: { amount: 500n, address }, expected: 500n },
      { inputAmount: 10000n, fee: { amount: 0n, address }, expected: 0n },
    ];

    testCases.forEach(({ inputAmount, fee, expected }) => {
      const result = calculateFeeAmount(inputAmount, fee);
      expect(result).toBe(expected);
    });
  });

  it('should calculate fee amount correctly for percentage fees', () => {
    const testCases = [
      { inputAmount: 1000n, fee: { percentage: 200, address }, expected: 20n }, // 2%
      { inputAmount: 5000n, fee: { percentage: 100, address }, expected: 50n }, // 1%
      { inputAmount: 10000n, fee: { percentage: 500, address }, expected: 500n }, // 5%
      { inputAmount: 1000000n, fee: { percentage: 50, address }, expected: 5000n }, // 0.5%
      { inputAmount: 1000000n, fee: { percentage: 10000, address }, expected: 1000000n }, // 100%
    ];

    testCases.forEach(({ inputAmount, fee, expected }) => {
      const result = calculateFeeAmount(inputAmount, fee);
      expect(result).toBe(expected);
    });
  });

  it('should throw error when fixed fee amount is greater than input amount', () => {
    const inputAmount = 1000n;
    const fee = { amount: 2000n, address };

    expect(() => calculateFeeAmount(inputAmount, fee)).toThrow(
      'Fee amount must be greater than 0 and less than or equal to the input amount: 2000',
    );
  });

  it('should throw error when fixed fee amount is negative', () => {
    const inputAmount = 1000n;
    const fee = { amount: -100n, address };

    expect(() => calculateFeeAmount(inputAmount, fee)).toThrow(
      'Fee amount must be greater than 0 and less than or equal to the input amount: -100',
    );
  });

  it('should throw error when percentage fee is greater than 100%', () => {
    const inputAmount = 1000n;
    const fee = { percentage: 10001, address };

    expect(() => calculateFeeAmount(inputAmount, fee)).toThrow('Fee percentage must be between 0 and 10000');
  });

  it('should throw error when percentage fee is negative', () => {
    const inputAmount = 1000n;
    const fee = { percentage: -100, address };

    expect(() => calculateFeeAmount(inputAmount, fee)).toThrow('Fee percentage must be between 0 and 10000');
  });

  it('should encode address correctly', () => {
    const testCases: { spokeChainId: SpokeChainId; address: string; expected: string }[] = [
      {
        spokeChainId: '0xa86a.avax',
        address: '0x0000000000000000000000000000000000000001',
        expected: '0x0000000000000000000000000000000000000001',
      },
      {
        spokeChainId: '0x2105.base',
        address: '0x0000000000000000000000000000000000000001',
        expected: '0x0000000000000000000000000000000000000001',
      },
      {
        spokeChainId: '0xa.optimism',
        address: '0x0000000000000000000000000000000000000001',
        expected: '0x0000000000000000000000000000000000000001',
      },
      {
        spokeChainId: '0x38.bsc',
        address: '0x0000000000000000000000000000000000000001',
        expected: '0x0000000000000000000000000000000000000001',
      },
      {
        spokeChainId: '0x89.polygon',
        address: '0x0000000000000000000000000000000000000001',
        expected: '0x0000000000000000000000000000000000000001',
      },
      {
        spokeChainId: '0xa4b1.arbitrum',
        address: '0x0000000000000000000000000000000000000001',
        expected: '0x0000000000000000000000000000000000000001',
      },
      {
        spokeChainId: 'sonic',
        address: '0x0000000000000000000000000000000000000001',
        expected: '0x0000000000000000000000000000000000000001',
      },
      {
        spokeChainId: 'injective-1',
        address: 'inj1xwadvz0av4kljraemgqqtrze549967n0cwn8pj',
        expected: '0x696e6a3178776164767a306176346b6c6a7261656d67717174727a653534393936376e3063776e38706a',
      },
      {
        spokeChainId: '0x1.icon',
        address: 'hx0136a591b8bf330f129fd75686199ee34f09ebbd',
        expected: '0x000136a591b8bf330f129fd75686199ee34f09ebbd',
      },
      {
        spokeChainId: 'sui',
        address: '0x467984afa2e97fc683501e7ea3f31c2d48a40df2a7f5e4034b67996496d70834',
        expected: '0x467984afa2e97fc683501e7ea3f31c2d48a40df2a7f5e4034b67996496d70834',
      },
      {
        spokeChainId: 'solana',
        address: 'BsbfLJNfYGcZdCasYUYy9bnqVXLAD3SB48CFQukoVsH8',
        expected: '0xa18b19d6b7ccfc715c11a14deab8e40f2a815d53ed7e8ff308cf5351df7be24f',
      },
      {
        spokeChainId: 'stellar',
        address: 'GBOKX5FMDSEYOWNOMKVN45Y3KCEAYXAT4WFGX2MLORSTMLXUZIICUE5O',
        expected: '0x0000001200000000000000005cabf4ac1c898759ae62aade771b50880c5c13e58a6be98b7465362ef4ca102a',
      },
    ];

    testCases.forEach(({ spokeChainId, address, expected }) => {
      const result = encodeAddress(spokeChainId, address);
      expect(result).toBe(expected);
    });
  });

  it('should convert hex to bigint correctly', () => {
    expect(BigInt('0x1234567890abcdef')).toBe(hexToBigInt('0x1234567890abcdef'));
    expect(BigInt('0x1234567890abcdef')).toBe(hexToBigInt('1234567890abcdef'));
    expect(BigInt('0x1234567890abcdef1234567890abcdef')).toBe(hexToBigInt('0x1234567890abcdef1234567890abcdef'));
  });

  it('should adjust amount by fee correctly', () => {
    const testCases = [
      { amount: 1000n, fee: { amount: 100n, address }, quoteType: 'exact_input', expected: 900n },
    ] as const;

    for (const { amount, fee, quoteType, expected } of testCases) {
      const result = adjustAmountByFee(amount, fee, quoteType);
      expect(result).toBe(expected);
    }
  });

  it('should get hub wallet address for non hub spoke provider', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubWalletAddress);

    const walletAddress = await deriveUserWalletAddress(
      mockHubProvider,
      mockBscSpokeProvider.chainConfig.chain.id,
      mockHubWalletAddress,
    );

    expect(walletAddress).toBe(mockHubWalletAddress);
  });

  it('should get same wallet address for hub spoke provider', async () => {
    const walletAddress = await deriveUserWalletAddress(
      mockHubProvider,
      mockSonicSpokeProvider.chainConfig.chain.id,
      mockHubWalletAddress,
    );

    expect(walletAddress).toBe(mockHubWalletAddress);
  });

  describe('constructRawSpokeProvider', () => {
    it('should construct raw spoke provider correctly for evm chain', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[BSC_MAINNET_CHAIN_ID],
        rpcUrl: 'https://rpc.bsc.org',
      } satisfies EvmRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(EvmRawSpokeProvider);
      invariant(rawSpokeProvider instanceof EvmRawSpokeProvider, 'Raw spoke provider is not a EvmRawSpokeProvider');
      expect(rawSpokeProvider.publicClient.transport.url).toBe('https://rpc.bsc.org');
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(BSC_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
    });
    it('should construct raw spoke provider correctly for evm chain without rpc url', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[BSC_MAINNET_CHAIN_ID],
      } satisfies EvmRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(EvmRawSpokeProvider);
      invariant(rawSpokeProvider instanceof EvmRawSpokeProvider, 'Raw spoke provider is not a EvmRawSpokeProvider');
      expect(rawSpokeProvider.publicClient.transport.url).toBe(
        getEvmViemChain(BSC_MAINNET_CHAIN_ID).rpcUrls.default.http[0],
      );
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(BSC_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
    });
    it('should construct raw spoke provider correctly for Sonic evm chain', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
        rpcUrl: 'https://rpc.soniclabs.com',
      } satisfies SonicRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(SonicRawSpokeProvider);
      invariant(rawSpokeProvider instanceof SonicRawSpokeProvider, 'Raw spoke provider is not a SonicRawSpokeProvider');
      expect(rawSpokeProvider.publicClient.transport.url).toBe('https://rpc.soniclabs.com');
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(SONIC_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
    });
    it('should construct raw spoke provider correctly for Sonic evm chain without rpc url', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
      } satisfies SonicRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(SonicRawSpokeProvider);
      invariant(rawSpokeProvider instanceof SonicRawSpokeProvider, 'Raw spoke provider is not a SonicRawSpokeProvider');
      expect(rawSpokeProvider.publicClient.transport.url).toBe(
        getEvmViemChain(SONIC_MAINNET_CHAIN_ID).rpcUrls.default.http[0],
      );
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(SONIC_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
    });
    it('should construct raw spoke provider correctly for stellar chain', async () => {
      const config = {
        walletAddress: 'GBOKX5FMDSEYOWNOMKVN45Y3KCEAYXAT4WFGX2MLORSTMLXUZIICUE5O',
        chainConfig: spokeChainConfig[STELLAR_MAINNET_CHAIN_ID],
        rpcConfig: {
          horizonRpcUrl: 'https://horizon.stellar.org',
          sorobanRpcUrl: 'https://soroban-rpc.stellar.org',
        },
      } satisfies StellarRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(StellarRawSpokeProvider);
      invariant(
        rawSpokeProvider instanceof StellarRawSpokeProvider,
        'Raw spoke provider is not a StellarRawSpokeProvider',
      );
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(STELLAR_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        'GBOKX5FMDSEYOWNOMKVN45Y3KCEAYXAT4WFGX2MLORSTMLXUZIICUE5O',
      );
      expect(rawSpokeProvider.server.serverURL.toString()).toBe('https://horizon.stellar.org/');
      expect(rawSpokeProvider.sorobanServer.serverURL.toString()).toBe('https://soroban-rpc.stellar.org/');
    });
    it('should construct raw spoke provider correctly for stellar chain without rpc config', async () => {
      const config = {
        walletAddress: 'GBOKX5FMDSEYOWNOMKVN45Y3KCEAYXAT4WFGX2MLORSTMLXUZIICUE5O',
        chainConfig: spokeChainConfig[STELLAR_MAINNET_CHAIN_ID],
        rpcConfig: {},
      } satisfies StellarRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(StellarRawSpokeProvider);
      invariant(
        rawSpokeProvider instanceof StellarRawSpokeProvider,
        'Raw spoke provider is not a StellarRawSpokeProvider',
      );
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(STELLAR_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        'GBOKX5FMDSEYOWNOMKVN45Y3KCEAYXAT4WFGX2MLORSTMLXUZIICUE5O',
      );
      expect(rawSpokeProvider.server.serverURL.toString()).toBe(`${config.chainConfig.horizonRpcUrl}/`);
      expect(rawSpokeProvider.sorobanServer.serverURL.toString()).toBe(`${config.chainConfig.sorobanRpcUrl}`);
    });
    it('should construct raw spoke provider correctly for solana chain', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID],
        connection: {
          rpcUrl: 'https://rpc.solana.org',
        },
      } satisfies SolanaRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(SolanaRawSpokeProvider);
      invariant(
        rawSpokeProvider instanceof SolanaRawSpokeProvider,
        'Raw spoke provider is not a SolanaRawSpokeProvider',
      );
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(SOLANA_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
      expect(rawSpokeProvider.connection.rpcEndpoint.toString()).toBe('https://rpc.solana.org');
    });

    it('should construct raw spoke provider correctly for icon chain', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[ICON_MAINNET_CHAIN_ID],
      } satisfies IconRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(IconRawSpokeProvider);
      invariant(rawSpokeProvider instanceof IconRawSpokeProvider, 'Raw spoke provider is not a IconRawSpokeProvider');
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(ICON_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
      expect(rawSpokeProvider.debugRpcUrl).toBe('https://ctz.solidwallet.io/api/v3d');
    });

    it('should construct raw spoke provider correctly for injective chain', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID],
      } satisfies InjectiveRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(InjectiveRawSpokeProvider);
      invariant(
        rawSpokeProvider instanceof InjectiveRawSpokeProvider,
        'Raw spoke provider is not a InjectiveRawSpokeProvider',
      );
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(INJECTIVE_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
    });

    it('should construct raw spoke provider correctly for sui chain', async () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: spokeChainConfig[SUI_MAINNET_CHAIN_ID],
      } satisfies SuiRawSpokeProviderConfig;

      const rawSpokeProvider = constructRawSpokeProvider(config);
      expect(rawSpokeProvider).toBeInstanceOf(SuiRawSpokeProvider);
      invariant(rawSpokeProvider instanceof SuiRawSpokeProvider, 'Raw spoke provider is not a SuiRawSpokeProvider');
      expect(rawSpokeProvider.chainConfig.chain.id).toBe(SUI_MAINNET_CHAIN_ID);
      expect(await rawSpokeProvider.walletProvider.getWalletAddress()).toBe(
        '0x0000000000000000000000000000000000000001',
      );
    });

    it('should throw error when constructing raw spoke provider for unsupported chain', () => {
      const config = {
        walletAddress: '0x0000000000000000000000000000000000000001',
        chainConfig: {
          chain: {
            id: '0x0000000000000000000000000000000000000001',
            type: 'TEST',
          },
        } as unknown as SpokeChainConfig,
      } satisfies unknown as RawSpokeProviderConfig;

      expect(() => constructRawSpokeProvider(config)).toThrow('Unsupported chain type: TEST');
    });
  });
});
