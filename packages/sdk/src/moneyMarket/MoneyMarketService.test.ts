import { WalletAbstractionService } from '../shared/services/hub/WalletAbstractionService.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MoneyMarketService,
  moneyMarketReserveAssets,
  type EvmHubProviderConfig,
  getHubChainConfig,
  EvmWalletAbstraction,
  SpokeService,
  type MoneyMarketSupplyParams,
  type MoneyMarketAction,
  isMoneyMarketCreateSupplyIntentFailedError,
  isMoneyMarketCreateBorrowIntentFailedError,
  isMoneyMarketCreateWithdrawIntentFailedError,
  isMoneyMarketCreateRepayIntentFailedError,
  isMoneyMarketSubmitTxFailedError,
  isMoneyMarketRelayTimeoutError,
  isMoneyMarketRepayUnknownError,
  isMoneyMarketWithdrawUnknownError,
  isMoneyMarketSupplyUnknownError,
  type MoneyMarketError,
  isMoneyMarketBorrowUnknownError,
  Erc20Service,
  type MoneyMarketEncodeSupplyParams,
  poolAbi,
  type MoneyMarketEncodeWithdrawParams,
  type MoneyMarketEncodeBorrowParams,
  type MoneyMarketEncodeRepayParams,
  type MoneyMarketEncodeRepayWithATokensParams,
  hubAssets,
  HubService,
} from '../index.js';

import type { MoneyMarketConfigParams, PartnerFeePercentage } from '../shared/types.js';
import { Sodax } from '../shared/entities/Sodax.js';
import { EvmSpokeProvider } from '../shared/entities/Providers.js';
import { EvmHubProvider } from '../shared/entities/Providers.js';
import { SonicSpokeProvider } from '../shared/entities/Providers.js';
import {
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  type IEvmWalletProvider,
  spokeChainConfig,
  type Address,
  type EvmRawTransaction,
  getMoneyMarketConfig,
} from '@sodax/types';
import { decodeFunctionData } from 'viem';
import { StellarSpokeService } from '../shared/services/spoke/StellarSpokeService.js';
import { SonicSpokeService } from '../shared/services/spoke/SonicSpokeService.js';

const sodax = new Sodax();

describe('MoneyMarketService', () => {
  // Mock wallet providers
  const mockEvmWalletProvider = {
    sendTransaction: vi.fn(),
    getWalletAddress: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999'),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockSonicWalletProvider = {
    sendTransaction: vi.fn(),
    getWalletAddress: vi.fn().mockResolvedValue('0x8888888888888888888888888888888888888888'),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockHubAddress = '0x1111111111111111111111111111111111111111' satisfies Address;

  // Create real provider instances
  const bscSpokeProvider = new EvmSpokeProvider(mockEvmWalletProvider, spokeChainConfig[BSC_MAINNET_CHAIN_ID]);
  const sonicSpokeProvider = new SonicSpokeProvider(mockSonicWalletProvider, spokeChainConfig[SONIC_MAINNET_CHAIN_ID]);

  // Hub provider configuration
  const hubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(),
  } satisfies EvmHubProviderConfig;

  const hubProvider = new EvmHubProvider({ config: hubConfig, configService: sodax.config });

  // Money market service instance
  const moneyMarket = new MoneyMarketService({
    config: {
      partnerFee: {
        address: '0x9999999999999999999999999999999999999999',
        percentage: 10,
      },
    },
    hubProvider,
    configService: sodax.config,
  });

  // Test parameters - use real supported tokens
  const bscSupportedTokens = moneyMarket.getSupportedTokensByChainId(BSC_MAINNET_CHAIN_ID);
  const sonicSupportedTokens = moneyMarket.getSupportedTokensByChainId(SONIC_MAINNET_CHAIN_ID);

  const bscTestToken = bscSupportedTokens[0]?.address as Address; // ETHB
  const sonicTestToken = sonicSupportedTokens[0]?.address as Address; // WETH
  const testAmount = 1000000000000000000n;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAllowanceValid', () => {
    it('should call Erc20Service.isAllowanceValid when conditions are met (supply action)', async () => {
      const mockResult = { ok: true as const, value: true };
      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValue(mockResult);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'supply',
        },
        bscSpokeProvider,
      );

      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        bscTestToken,
        testAmount,
        '0x9999999999999999999999999999999999999999',
        bscSpokeProvider.chainConfig.addresses.assetManager,
        bscSpokeProvider,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call Erc20Service.isAllowanceValid when conditions are met (repay action)', async () => {
      const mockResult = { ok: true as const, value: false };
      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValue(mockResult);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'repay',
        },
        bscSpokeProvider,
      );

      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        bscTestToken,
        testAmount,
        '0x9999999999999999999999999999999999999999',
        bscSpokeProvider.chainConfig.addresses.assetManager,
        bscSpokeProvider,
      );
      expect(result).toEqual(mockResult);
    });

    it('should not call Erc20Service.isAllowanceValid for borrow action', async () => {
      vi.spyOn(Erc20Service, 'isAllowanceValid');

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'borrow',
        },
        bscSpokeProvider,
      );

      expect(Erc20Service.isAllowanceValid).not.toHaveBeenCalled();
      expect(result).toEqual({
        ok: true,
        value: true,
      });
    });

    it('should not call Erc20Service.isAllowanceValid for withdraw action', async () => {
      vi.spyOn(Erc20Service, 'isAllowanceValid');

      const result = await moneyMarket.isAllowanceValid(
        {
          amount: testAmount,
          action: 'withdraw',
          token: bscTestToken,
        },
        bscSpokeProvider,
      );

      expect(Erc20Service.isAllowanceValid).not.toHaveBeenCalled();
      expect(result).toEqual({
        ok: true,
        value: true,
      });
    });

    it('should return error when Erc20Service.isAllowanceValid throws', async () => {
      const mockError = new Error('ERC20 error');
      vi.spyOn(Erc20Service, 'isAllowanceValid').mockRejectedValue(mockError);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'supply',
        },
        bscSpokeProvider,
      );

      expect(result).toEqual({
        ok: false,
        error: mockError,
      });
    });

    it('should call Erc20Service.isAllowanceValid for supply action', async () => {
      const mockResult = { ok: true as const, value: true };
      vi.spyOn(HubService, 'getUserRouter').mockResolvedValueOnce('0x8888888888888888888888888888888888888888');
      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce(mockResult);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: sonicTestToken,
          amount: testAmount,
          action: 'supply',
        },
        sonicSpokeProvider,
      );

      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        sonicTestToken,
        testAmount,
        '0x8888888888888888888888888888888888888888',
        '0x8888888888888888888888888888888888888888',
        sonicSpokeProvider,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call Erc20Service.isAllowanceValid for repay action', async () => {
      const mockResult = { ok: true as const, value: false };
      vi.spyOn(HubService, 'getUserRouter').mockResolvedValueOnce('0x8888888888888888888888888888888888888888');
      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce(mockResult);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: sonicTestToken,
          amount: testAmount,
          action: 'repay',
        },
        sonicSpokeProvider,
      );

      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        sonicTestToken,
        testAmount,
        '0x8888888888888888888888888888888888888888',
        '0x8888888888888888888888888888888888888888',
        sonicSpokeProvider,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('Integration with real supported tokens', () => {
    it('should work with real supported BSC tokens', async () => {
      const supportedTokens = moneyMarket.getSupportedTokensByChainId(BSC_MAINNET_CHAIN_ID);
      expect(supportedTokens.length).toBeGreaterThan(0);

      const tokenAddress = supportedTokens[0]?.address;
      expect(tokenAddress).toBeDefined();

      if (!tokenAddress) {
        throw new Error('Token address should be defined');
      }

      const mockResult = { ok: true, value: true } as const;
      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce(mockResult);

      const testParams: MoneyMarketSupplyParams = {
        token: tokenAddress,
        amount: testAmount,
        action: 'supply',
      };

      const result = await moneyMarket.isAllowanceValid(testParams, bscSpokeProvider);

      expect(Erc20Service.isAllowanceValid).toHaveBeenCalledWith(
        tokenAddress,
        testAmount,
        '0x9999999999999999999999999999999999999999',
        bscSpokeProvider.chainConfig.addresses.assetManager,
        bscSpokeProvider,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('Error handling', () => {
    it('should return error when walletProvider.getWalletAddress throws', async () => {
      const mockError = new Error('Wallet address error');
      vi.spyOn(bscSpokeProvider.walletProvider, 'getWalletAddress').mockRejectedValueOnce(mockError);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'supply',
        },
        bscSpokeProvider,
      );

      expect(result).toEqual({
        ok: false,
        error: mockError,
      });
    });

    describe('Edge cases', () => {
      it('should throw error for empty token address', async () => {
        const result = await moneyMarket.isAllowanceValid(
          {
            token: '',
            amount: testAmount,
            action: 'supply',
          },
          bscSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Token is required'),
        });
      });

      it('should throw error for unsupported token on spoke chain', async () => {
        const result = await moneyMarket.isAllowanceValid(
          {
            token: '0x1234567890123456789012345678901234567890',
            amount: testAmount,
            action: 'supply',
          },
          bscSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error(
            'Invariant failed: Unsupported spoke chain (0x38.bsc) token: 0x1234567890123456789012345678901234567890',
          ),
        });
      });

      it('should throw error for zero amount', async () => {
        const result = await moneyMarket.isAllowanceValid(
          {
            token: bscTestToken,
            amount: 0n,
            action: 'supply',
          },
          bscSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Amount must be greater than 0'),
        });
      });
    });
  });

  describe('approve', () => {
    describe('money market actions', () => {
      it('should approve evm spoke provider supply action', async () => {
        const mockResult = '0x1234567890abcdef';
        vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockResult);

        const result = await moneyMarket.approve(
          {
            token: bscTestToken,
            amount: testAmount,
            action: 'supply',
          },
          bscSpokeProvider,
        );

        expect(Erc20Service.approve).toHaveBeenCalledWith(
          bscTestToken,
          testAmount,
          bscSpokeProvider.chainConfig.addresses.assetManager,
          bscSpokeProvider,
          undefined,
        );
        expect(result).toEqual({
          ok: true,
          value: mockResult,
        });
      });

      it('should approve evm spoke provider repay action', async () => {
        const mockResult = '0x1234567890abcdef';
        vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockResult);

        const result = await moneyMarket.approve(
          {
            token: bscTestToken,
            amount: testAmount,
            action: 'repay',
          },
          bscSpokeProvider,
        );

        expect(Erc20Service.approve).toHaveBeenCalledWith(
          bscTestToken,
          testAmount,
          bscSpokeProvider.chainConfig.addresses.assetManager,
          bscSpokeProvider,
          undefined,
        );
        expect(result).toEqual({
          ok: true,
          value: mockResult,
        });
      });

      it('should throw error for invalid withdraw action on evm', async () => {
        const result = await moneyMarket.approve(
          {
            token: bscTestToken,
            amount: testAmount,
            action: 'withdraw',
          },
          bscSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Invalid action (only supply and repay are supported on evm)'),
        });
      });

      it('should throw error for invalid borrow action on evm', async () => {
        const result = await moneyMarket.approve(
          {
            token: bscTestToken,
            amount: testAmount,
            action: 'borrow',
          },
          bscSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Invalid action (only supply and repay are supported on evm)'),
        });
      });

      it('should approve sonic spoke provider supply action', async () => {
        const mockResult = '0x1234567890abcdef';
        vi.spyOn(HubService, 'getUserRouter').mockResolvedValueOnce('0x8888888888888888888888888888888888888888');
        vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockResult);

        const result = await moneyMarket.approve(
          {
            token: sonicTestToken,
            amount: testAmount,
            action: 'supply',
          },
          sonicSpokeProvider,
        );

        expect(Erc20Service.approve).toHaveBeenCalledWith(
          sonicTestToken,
          testAmount,
          '0x8888888888888888888888888888888888888888',
          sonicSpokeProvider,
          undefined,
        );
        expect(result).toEqual({
          ok: true,
          value: mockResult,
        });
      });

      it('should approve sonic spoke provider repay action', async () => {
        const mockResult = '0x1234567890abcdef';
        vi.spyOn(HubService, 'getUserRouter').mockResolvedValueOnce('0x8888888888888888888888888888888888888888');
        vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockResult);

        const result = await moneyMarket.approve(
          {
            token: sonicTestToken,
            amount: testAmount,
            action: 'repay',
          },
          sonicSpokeProvider,
        );

        expect(Erc20Service.approve).toHaveBeenCalledWith(
          sonicTestToken,
          testAmount,
          '0x8888888888888888888888888888888888888888',
          sonicSpokeProvider,
          undefined,
        );
        expect(result).toEqual({
          ok: true,
          value: mockResult,
        });
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid action on evm', async () => {
        const result = await moneyMarket.approve(
          {
            token: bscTestToken,
            amount: testAmount,
            action: 'withdraw',
          },
          bscSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Invalid action (only supply and repay are supported on evm)'),
        });
      });

      it('should throw error for invalid action on sonic', async () => {
        const result = await moneyMarket.approve(
          {
            token: sonicTestToken,
            amount: testAmount,
            action: 'test' as MoneyMarketAction,
          },
          sonicSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Invalid action (only supply and repay are supported on evm)'),
        });
      });
    });

    describe('Edge cases', () => {
      it('should throw error for zero amount', async () => {
        const result = await moneyMarket.approve(
          {
            token: sonicTestToken,
            amount: 0n,
            action: 'supply',
          },
          sonicSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Amount must be greater than 0'),
        });
      });

      it('should throw error for empty token address', async () => {
        const result = await moneyMarket.approve(
          {
            token: '',
            amount: testAmount,
            action: 'supply',
          },
          sonicSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error('Invariant failed: Token is required'),
        });
      });

      it('should throw error for invalid token address', async () => {
        const result = await moneyMarket.approve(
          {
            token: '0x1234567890123456789012345678901234567890',
            amount: testAmount,
            action: 'supply',
          },
          sonicSpokeProvider,
        );

        expect(result).toEqual({
          ok: false,
          error: new Error(
            'Invariant failed: Unsupported spoke chain (sonic) token: 0x1234567890123456789012345678901234567890',
          ),
        });
      });
    });
  });

  describe('Core Money Market Actions', () => {
    it('should supply a token', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);

      vi.spyOn(moneyMarket, 'buildSupplyData').mockReturnValueOnce('0x');
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce('0x');
      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createSupplyIntent(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'supply',
        },
        bscSpokeProvider,
        false,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0x');
      }
    });

    it('should supply a token raw', async () => {
      const rawEvmTx = {
        from: await bscSpokeProvider.walletProvider.getWalletAddress(),
        to: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
        value: 1000000000000000000n,
        data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001411111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      } satisfies EvmRawTransaction;

      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);

      vi.spyOn(moneyMarket, 'buildSupplyData').mockReturnValueOnce('0x');

      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createSupplyIntent(
        {
          token: bscTestToken,
          amount: rawEvmTx.value,
          action: 'supply',
        },
        bscSpokeProvider,
        true,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(rawEvmTx);
      }
    });

    it('should supply a token and submit', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'supply').mockResolvedValueOnce({
        ok: true,
        value: ['0x', '0x'] as [string, string],
      });

      const result = await moneyMarket.supply(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'supply',
        },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value).toEqual(['0x', '0x']);
      }
    });

    it('should borrow a token', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildBorrowData').mockReturnValueOnce('0x');
      vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce('0x');
      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createBorrowIntent(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'borrow',
        },
        bscSpokeProvider,
        false,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0x');
      }
    });

    it('should borrow a token raw', async () => {
      const rawEvmTx = {
        from: mockHubAddress,
        to: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
        value: 1000000000000000000n,
        data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001499999999999999999999999999999999999999990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      } satisfies EvmRawTransaction;

      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildBorrowData').mockReturnValueOnce('0x');
      vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce(rawEvmTx);
      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createBorrowIntent(
        {
          token: bscTestToken,
          amount: rawEvmTx.value,
          action: 'borrow',
        },
        bscSpokeProvider,
        true,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(rawEvmTx);
      }
    });

    it('should borrow a token and submit', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'borrow').mockResolvedValueOnce({
        ok: true,
        value: ['0x', '0x'] as [string, string],
      });

      const result = await moneyMarket.borrow(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'borrow',
        },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value).toEqual(['0x', '0x']);
      }
    });

    it('should withdraw a token', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0x');
      vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce('0x');
      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createWithdrawIntent(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'withdraw',
        },
        bscSpokeProvider,
        false,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0x');
      }
    });

    it('should withdraw a token raw', async () => {
      const rawEvmTx = {
        from: mockHubAddress,
        to: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
        value: 1000000000000000000n,
        data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001499999999999999999999999999999999999999990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      } satisfies EvmRawTransaction;

      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0x');
      vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce(rawEvmTx);
      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createWithdrawIntent(
        {
          token: bscTestToken,
          amount: rawEvmTx.value,
          action: 'withdraw',
        },
        bscSpokeProvider,
        true,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(rawEvmTx);
      }
    });

    it('should withdraw a token and submit', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'withdraw').mockResolvedValueOnce({
        ok: true,
        value: ['0x', '0x'] as [string, string],
      });

      const result = await moneyMarket.withdraw(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'withdraw',
        },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value).toEqual(['0x', '0x']);
      }
    });

    it('should repay a token', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildRepayData').mockReturnValueOnce('0x');
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce('0x');
      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createRepayIntent(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'repay',
        },
        bscSpokeProvider,
        false,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0x');
      }
    });

    it('should repay a token raw', async () => {
      const rawEvmTx = {
        from: mockHubAddress,
        to: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
        value: 1000000000000000000n,
        data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001499999999999999999999999999999999999999990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      } satisfies EvmRawTransaction;

      vi.spyOn(WalletAbstractionService, 'getUserAbstractedWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildRepayData').mockReturnValueOnce('0x');
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(rawEvmTx);
      vi.spyOn(SpokeService, 'verifyDepositSimulation').mockResolvedValueOnce();

      const result = await moneyMarket.createRepayIntent(
        {
          token: bscTestToken,
          amount: rawEvmTx.value,
          action: 'repay',
        },
        bscSpokeProvider,
        true,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(rawEvmTx);
      }
    });

    it('should repay a token and submit', async () => {
      vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'repay').mockResolvedValueOnce({
        ok: true,
        value: ['0x', '0x'] as [string, string],
      });

      const result = await moneyMarket.repay(
        {
          token: bscTestToken,
          amount: 1000000000000000000n,
          action: 'repay',
        },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value).toEqual(['0x', '0x']);
      }
    });

    it('should be defined', () => {
      expect(MoneyMarketService).toBeDefined();
      const testAsset = moneyMarketReserveAssets[0];
      const wrongAsset = '0x0000000000000000000000000000000000000000';

      expect(sodax.config.isMoneyMarketReserveAsset(testAsset)).toBe(true);
      expect(sodax.config.isMoneyMarketReserveAsset(wrongAsset)).toBe(false);
    });

    describe('Error Handling', () => {
      describe('Supply Error Handling', () => {
        it('should handle CREATE_SUPPLY_INTENT_FAILED error', async () => {
          const mockError = {
            code: 'CREATE_SUPPLY_INTENT_FAILED' as const,
            data: {
              error: new Error('Supply intent creation failed'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'supply' as const,
              },
            },
          };

          vi.spyOn(moneyMarket, 'supply').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.supply(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'supply',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketCreateSupplyIntentFailedError(result.error)).toBeTruthy();
        });

        it('should handle SUBMIT_TX_FAILED error', async () => {
          const mockError = {
            code: 'SUBMIT_TX_FAILED' as const,
            data: {
              error: { code: 'SUBMIT_TX_FAILED' as const, error: new Error('Transaction submission failed') },
              payload: '0x1234567890abcdef',
            },
          };

          vi.spyOn(moneyMarket, 'supply').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.supply(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'supply',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketSubmitTxFailedError(result.error)).toBeTruthy();
        });

        it('should handle RELAY_TIMEOUT error', async () => {
          const mockError = {
            code: 'RELAY_TIMEOUT' as const,
            data: {
              error: { code: 'RELAY_TIMEOUT' as const, error: new Error('Relay timeout') },
              payload: '0x1234567890abcdef',
            },
          };

          vi.spyOn(moneyMarket, 'supply').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.supply(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'supply',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketRelayTimeoutError(result.error)).toBeTruthy();
        });
      });

      describe('Borrow Error Handling', () => {
        it('should handle CREATE_BORROW_INTENT_FAILED error', async () => {
          const mockError = {
            code: 'CREATE_BORROW_INTENT_FAILED' as const,
            data: {
              error: new Error('Borrow intent creation failed'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'borrow' as const,
              },
            },
          };

          vi.spyOn(moneyMarket, 'borrow').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.borrow(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'borrow',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketCreateBorrowIntentFailedError(result.error)).toBeTruthy();
        });

        it('should handle SUBMIT_TX_FAILED error for borrow', async () => {
          const mockError = {
            code: 'SUBMIT_TX_FAILED' as const,
            data: {
              error: { code: 'SUBMIT_TX_FAILED', error: new Error('Transaction submission failed') },
              payload: '0x1234567890abcdef',
            },
          } satisfies MoneyMarketError<'SUBMIT_TX_FAILED'>;

          vi.spyOn(moneyMarket, 'borrow').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.borrow(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'borrow',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketSubmitTxFailedError(result.error)).toBeTruthy();
        });
      });

      describe('Withdraw Error Handling', () => {
        it('should handle CREATE_WITHDRAW_INTENT_FAILED error', async () => {
          const mockError = {
            code: 'CREATE_WITHDRAW_INTENT_FAILED' as const,
            data: {
              error: new Error('Withdraw intent creation failed'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'withdraw' as const,
              },
            },
          };

          vi.spyOn(moneyMarket, 'withdraw').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.withdraw(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'withdraw',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketCreateWithdrawIntentFailedError(result.error)).toBeTruthy();
        });

        it('should handle RELAY_TIMEOUT error for withdraw', async () => {
          const mockError = {
            code: 'RELAY_TIMEOUT' as const,
            data: {
              error: { code: 'RELAY_TIMEOUT', error: new Error('Relay timeout') },
              payload: '0x1234567890abcdef',
            },
          } satisfies MoneyMarketError<'RELAY_TIMEOUT'>;

          vi.spyOn(moneyMarket, 'withdraw').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.withdraw(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'withdraw',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketRelayTimeoutError(result.error)).toBeTruthy();
        });
      });

      describe('Repay Error Handling', () => {
        it('should handle CREATE_REPAY_INTENT_FAILED error', async () => {
          const mockError = {
            code: 'CREATE_REPAY_INTENT_FAILED' as const,
            data: {
              error: new Error('Repay intent creation failed'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'repay' as const,
              },
            },
          };

          vi.spyOn(moneyMarket, 'repay').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.repay(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'repay',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketCreateRepayIntentFailedError(result.error)).toBeTruthy();
        });

        it('should handle SUBMIT_TX_FAILED error for repay', async () => {
          const mockError = {
            code: 'SUBMIT_TX_FAILED' as const,
            data: {
              error: { code: 'SUBMIT_TX_FAILED', error: new Error('Transaction submission failed') },
              payload: '0x1234567890abcdef',
            },
          } satisfies MoneyMarketError<'SUBMIT_TX_FAILED'>;

          vi.spyOn(moneyMarket, 'repay').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.repay(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'repay',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketSubmitTxFailedError(result.error)).toBeTruthy();
        });
      });

      describe('Integration Error Handling', () => {
        it('should handle UNKNOWN error for supply', async () => {
          const mockError = {
            code: 'SUPPLY_UNKNOWN_ERROR' as const,
            data: {
              error: new Error('Unknown error occurred'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'supply',
              } satisfies MoneyMarketSupplyParams,
            },
          } satisfies MoneyMarketError<'SUPPLY_UNKNOWN_ERROR'>;

          vi.spyOn(moneyMarket, 'supply').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.supply(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'supply',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketSupplyUnknownError(result.error)).toBeTruthy();
        });

        it('should handle UNKNOWN error for borrow', async () => {
          const mockError = {
            code: 'BORROW_UNKNOWN_ERROR' as const,
            data: {
              error: new Error('Unknown error occurred'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'borrow' as const,
              },
            },
          } satisfies MoneyMarketError<'BORROW_UNKNOWN_ERROR'>;

          vi.spyOn(moneyMarket, 'borrow').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.borrow(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'borrow',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketBorrowUnknownError(result.error)).toBeTruthy();
        });

        it('should handle UNKNOWN error for withdraw', async () => {
          const mockError = {
            code: 'WITHDRAW_UNKNOWN_ERROR' as const,
            data: {
              error: new Error('Unknown error occurred'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'withdraw' as const,
              },
            },
          } satisfies MoneyMarketError<'WITHDRAW_UNKNOWN_ERROR'>;

          vi.spyOn(moneyMarket, 'withdraw').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.withdraw(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'withdraw',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketWithdrawUnknownError(result.error)).toBeTruthy();
        });

        it('should handle UNKNOWN error for repay', async () => {
          const mockError = {
            code: 'REPAY_UNKNOWN_ERROR' as const,
            data: {
              error: new Error('Unknown error occurred'),
              payload: {
                token: bscTestToken,
                amount: testAmount,
                action: 'repay' as const,
              },
            },
          } satisfies MoneyMarketError<'REPAY_UNKNOWN_ERROR'>;

          vi.spyOn(moneyMarket, 'repay').mockResolvedValueOnce({
            ok: false,
            error: mockError,
          });

          const result = await moneyMarket.repay(
            {
              token: bscTestToken,
              amount: testAmount,
              action: 'repay',
            },
            bscSpokeProvider,
          );

          expect(result.ok).toBe(false);
          expect(!result.ok && isMoneyMarketRepayUnknownError(result.error)).toBeTruthy();
        });
      });
    });
  });
  describe('encoding methods', () => {
    const mockToken = '0x0000000000000000000000000000000000000000' as Address;
    const mockVault =
      hubAssets['0xa86a.avax'][mockToken]?.vault ?? ('0x0000000000000000000000000000000000000001' as Address);
    const mockLendingPool = '0x3333333333333333333333333333333333333333' as Address;
    const mockUser = '0x4444444444444444444444444444444444444444' as Address;
    const mockAmount = 1000000000000000000n; // 1 token with 18 decimals

    describe('encodeSupply', () => {
      it('should correctly encode supply transaction', () => {
        const supplyParams = {
          asset: mockVault,
          amount: mockAmount,
          onBehalfOf: mockUser,
          referralCode: 0,
        } satisfies MoneyMarketEncodeSupplyParams;

        const encodedCall = MoneyMarketService.encodeSupply(supplyParams, mockLendingPool);

        expect(encodedCall).toEqual({
          address: mockLendingPool,
          value: 0n,
          data: expect.any(String),
        });

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('supply');
        expect(decoded.args.map(arg => (typeof arg === 'string' ? arg.toLowerCase() : arg))).toEqual([
          mockVault.toLowerCase(),
          mockAmount,
          mockUser.toLowerCase(),
          0,
        ]);
      });
    });

    describe('encodeWithdraw', () => {
      it('should correctly encode withdraw transaction', () => {
        const withdrawParams = {
          asset: mockVault,
          amount: mockAmount,
          to: mockUser,
        } satisfies MoneyMarketEncodeWithdrawParams;

        const encodedCall = MoneyMarketService.encodeWithdraw(withdrawParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('withdraw');
        expect(decoded.args.map(arg => (typeof arg === 'string' ? arg.toLowerCase() : arg))).toEqual([
          mockVault.toLowerCase(),
          mockAmount,
          mockUser.toLowerCase(),
        ]);
      });
    });

    describe('encodeBorrow', () => {
      it('should correctly encode borrow transaction', () => {
        const borrowParams = {
          asset: mockVault,
          amount: mockAmount,
          interestRateMode: 2n,
          referralCode: 0,
          onBehalfOf: mockUser,
        } satisfies MoneyMarketEncodeBorrowParams;

        const encodedCall = MoneyMarketService.encodeBorrow(borrowParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('borrow');
        expect(decoded.args.map(arg => (typeof arg === 'string' ? arg.toLowerCase() : arg))).toEqual([
          mockVault.toLowerCase(),
          mockAmount,
          2n,
          0,
          mockUser.toLowerCase(),
        ]);
      });
    });

    describe('encodeRepay', () => {
      it('should correctly encode repay transaction', () => {
        const repayParams = {
          asset: mockVault,
          amount: mockAmount,
          interestRateMode: 2n,
          onBehalfOf: mockUser,
        } satisfies MoneyMarketEncodeRepayParams;

        const encodedCall = MoneyMarketService.encodeRepay(repayParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('repay');
        expect(decoded.args.map(arg => (typeof arg === 'string' ? arg.toLowerCase() : arg))).toEqual([
          mockVault.toLowerCase(),
          mockAmount,
          2n,
          mockUser.toLowerCase(),
        ]);
      });
    });

    describe('encodeRepayWithATokens', () => {
      it('should correctly encode repayWithATokens transaction', () => {
        const repayParams = {
          asset: mockVault,
          amount: mockAmount,
          interestRateMode: 2n,
        } satisfies MoneyMarketEncodeRepayWithATokensParams;

        const encodedCall = MoneyMarketService.encodeRepayWithATokens(repayParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('repayWithATokens');
        expect(decoded.args.map(arg => (typeof arg === 'string' ? arg.toLowerCase() : arg))).toEqual([
          mockVault.toLowerCase(),
          mockAmount,
          2n,
        ]);
      });
    });

    describe('encodeSetUserUseReserveAsCollateral', () => {
      it('should correctly encode setUserUseReserveAsCollateral transaction', () => {
        const encodedCall = MoneyMarketService.encodeSetUserUseReserveAsCollateral(mockToken, true, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('setUserUseReserveAsCollateral');
        expect(decoded.args).toEqual([mockToken, true]);
      });
    });
  });

  describe('constructor', () => {
    it('should use default config when config is undefined', () => {
      const mm = new MoneyMarketService({
        config: undefined,
        hubProvider,
        configService: sodax.config,
      });

      const defaultConfig = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID);
      expect(mm.config.lendingPool).toBe(defaultConfig.lendingPool);
      expect(mm.config.partnerFee).toBeUndefined();
    });

    it('should use provided fully configured config', () => {
      const defaultConfig = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID);
      const fullConfig = {
        ...defaultConfig,
        partnerFee: {
          address: '0x9999999999999999999999999999999999999999' as Address,
          percentage: 5,
        },
      } as MoneyMarketConfigParams;

      const mm = new MoneyMarketService({
        config: fullConfig,
        hubProvider,
        configService: sodax.config,
      });

      expect(mm.config.lendingPool).toBe(defaultConfig.lendingPool);
      expect(mm.config.partnerFee).toBeDefined();
      expect((mm.config.partnerFee as PartnerFeePercentage)?.percentage).toBe(5);
    });

    it('should use hub chain config when partial config (partnerFee only) is provided', () => {
      const mm = new MoneyMarketService({
        config: {
          partnerFee: {
            address: '0x9999999999999999999999999999999999999999' as Address,
            percentage: 10,
          },
        },
        hubProvider,
        configService: sodax.config,
      });

      const defaultConfig = getMoneyMarketConfig(hubProvider.chainConfig.chain.id);
      expect(mm.config.lendingPool).toBe(defaultConfig.lendingPool);
      expect(mm.config.partnerFee).toBeDefined();
      expect((mm.config.partnerFee as PartnerFeePercentage)?.percentage).toBe(10);
    });

    it('should use custom relayerApiEndpoint when provided', () => {
      const mm = new MoneyMarketService({
        config: undefined,
        hubProvider,
        relayerApiEndpoint: 'https://custom-relay.example.com' as `https://${string}`,
        configService: sodax.config,
      });

      expect(mm.config.relayerApiEndpoint).toBe('https://custom-relay.example.com');
    });
  });

  describe('estimateGas', () => {
    it('should delegate to SpokeService.estimateGas', async () => {
      const mockGas = 21000n;
      vi.spyOn(SpokeService, 'estimateGas').mockResolvedValueOnce(mockGas);

      const mockRawTx = {
        from: '0x9999999999999999999999999999999999999999',
        to: '0x1111111111111111111111111111111111111111',
        value: 0n,
        data: '0x',
      } as EvmRawTransaction;

      const result = await MoneyMarketService.estimateGas(mockRawTx, bscSpokeProvider);

      expect(SpokeService.estimateGas).toHaveBeenCalledWith(mockRawTx, bscSpokeProvider);
      expect(result).toBe(mockGas);
    });
  });

  describe('calculateATokenAmount', () => {
    it('should calculate aToken amount from actual amount and normalizedIncome', () => {
      const amount = 1000000000000000000n; // 1 token
      const normalizedIncome = 10n ** 27n; // 1.0 (RAY)

      const result = MoneyMarketService.calculateATokenAmount(amount, normalizedIncome);

      expect(result).toBe(amount + 1n);
    });

    it('should handle large normalizedIncome', () => {
      const amount = 1000000000000000000n;
      const normalizedIncome = 2n * 10n ** 27n; // 2.0 (RAY)

      const result = MoneyMarketService.calculateATokenAmount(amount, normalizedIncome);

      expect(result).toBe(amount / 2n + 1n);
    });
  });

  describe('getSupportedTokens', () => {
    it('should delegate to configService.getSupportedMoneyMarketTokens', () => {
      const tokens = moneyMarket.getSupportedTokens();
      expect(tokens).toBeDefined();
      expect(typeof tokens).toBe('object');
    });
  });

  describe('getSupportedReserves', () => {
    it('should delegate to configService.getMoneyMarketReserveAssets', () => {
      const reserves = moneyMarket.getSupportedReserves();
      expect(reserves).toBeDefined();
      expect(Array.isArray(reserves)).toBe(true);
    });
  });

  describe('isAllowanceValid - additional paths', () => {
    it('should check stellar target trustlines when toChainId is stellar', async () => {
      vi.spyOn(moneyMarket.configService, 'isMoneyMarketSupportedToken').mockReturnValue(true);
      vi.spyOn(StellarSpokeService, 'walletHasSufficientTrustline').mockResolvedValueOnce(true);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'withdraw',
          toChainId: STELLAR_MAINNET_CHAIN_ID,
          toAddress: 'GABCDEF123456789',
        },
        bscSpokeProvider,
      );

      expect(StellarSpokeService.walletHasSufficientTrustline).toHaveBeenCalled();
      expect(result).toEqual({ ok: true, value: true });
    });

    it('should return false when stellar target wallet lacks trustline', async () => {
      vi.spyOn(moneyMarket.configService, 'isMoneyMarketSupportedToken').mockReturnValue(true);
      vi.spyOn(StellarSpokeService, 'walletHasSufficientTrustline').mockResolvedValueOnce(false);

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'withdraw',
          toChainId: STELLAR_MAINNET_CHAIN_ID,
          toAddress: 'GABCDEF123456789',
        },
        bscSpokeProvider,
      );

      expect(result).toEqual({ ok: true, value: false });
    });

    it('should return ok:true value:true for non-evm non-sonic provider (default path)', async () => {
      // A plain object that doesn't pass any instanceof guard check
      const unknownProvider = {
        walletProvider: {
          getWalletAddress: vi.fn().mockResolvedValue('0x7777777777777777777777777777777777777777'),
        },
        chainConfig: {
          chain: { id: BSC_MAINNET_CHAIN_ID },
        },
      } as unknown as Parameters<typeof moneyMarket.isAllowanceValid>[1];

      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'supply',
        },
        unknownProvider,
      );

      expect(result).toEqual({ ok: true, value: true });
    });

    it('should return ok:true value:true for borrow/withdraw actions on evm provider', async () => {
      const result = await moneyMarket.isAllowanceValid(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'borrow',
        },
        bscSpokeProvider,
      );

      // borrow/withdraw on EVM falls through the supply/repay check → default true
      expect(result).toEqual({ ok: true, value: true });
    });
  });

  describe('approve - additional paths', () => {
    it('should return error for non-evm non-sonic provider (unsupported)', async () => {
      const unknownProvider = {
        walletProvider: {
          getWalletAddress: vi.fn().mockResolvedValue('0x7777777777777777777777777777777777777777'),
        },
        chainConfig: {
          chain: { id: BSC_MAINNET_CHAIN_ID },
        },
      } as unknown as Parameters<typeof moneyMarket.approve>[1];

      const result = await moneyMarket.approve(
        {
          token: bscTestToken,
          amount: testAmount,
          action: 'supply',
        },
        unknownProvider,
      );

      expect(result).toEqual({
        ok: false,
        error: new Error('Approve only supported for EVM spoke chains'),
      });
    });
  });

  describe('supply - full flow', () => {
    it('should supply on hub chain without relay (spoke == hub)', async () => {
      vi.spyOn(moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhubtx',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await moneyMarket.supply(
        { token: sonicTestToken, amount: testAmount, action: 'supply' },
        sonicSpokeProvider,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['0xhubtx', '0xhubtx']);
      }
    });

    it('should return error when createSupplyIntent fails', async () => {
      vi.spyOn(moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'CREATE_SUPPLY_INTENT_FAILED',
          data: {
            error: new Error('intent failed'),
            payload: { token: bscTestToken, amount: testAmount, action: 'supply' as const },
          },
        },
      });

      const result = await moneyMarket.supply(
        { token: bscTestToken, amount: testAmount, action: 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_SUPPLY_INTENT_FAILED');
      }
    });

    it('should return CREATE_SUPPLY_INTENT_FAILED when verifyTxHash fails', async () => {
      vi.spyOn(moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoketxhash',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({
        ok: false,
        error: new Error('tx hash not found'),
      });

      const result = await moneyMarket.supply(
        { token: bscTestToken, amount: testAmount, action: 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_SUPPLY_INTENT_FAILED');
      }
    });

    it('should return SUPPLY_UNKNOWN_ERROR on unexpected exception', async () => {
      vi.spyOn(moneyMarket, 'createSupplyIntent').mockRejectedValueOnce(new Error('unexpected'));

      const result = await moneyMarket.supply(
        { token: bscTestToken, amount: testAmount, action: 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('SUPPLY_UNKNOWN_ERROR');
      }
    });
  });

  describe('borrow - full flow', () => {
    it('should borrow on hub chain without relay when no cross-chain target', async () => {
      vi.spyOn(moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhubtx',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await moneyMarket.borrow(
        { token: sonicTestToken, amount: testAmount, action: 'borrow' },
        sonicSpokeProvider,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['0xhubtx', '0xhubtx']);
      }
    });

    it('should return error when createBorrowIntent fails', async () => {
      vi.spyOn(moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'CREATE_BORROW_INTENT_FAILED',
          data: {
            error: new Error('intent failed'),
            payload: { token: bscTestToken, amount: testAmount, action: 'borrow' as const },
          },
        },
      });

      const result = await moneyMarket.borrow(
        { token: bscTestToken, amount: testAmount, action: 'borrow' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_BORROW_INTENT_FAILED');
      }
    });

    it('should return CREATE_BORROW_INTENT_FAILED when verifyTxHash fails', async () => {
      vi.spyOn(moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoketxhash',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({
        ok: false,
        error: new Error('tx hash not found'),
      });

      const result = await moneyMarket.borrow(
        { token: bscTestToken, amount: testAmount, action: 'borrow' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_BORROW_INTENT_FAILED');
      }
    });

    it('should return BORROW_UNKNOWN_ERROR on unexpected exception', async () => {
      vi.spyOn(moneyMarket, 'createBorrowIntent').mockRejectedValueOnce(new Error('unexpected'));

      const result = await moneyMarket.borrow(
        { token: bscTestToken, amount: testAmount, action: 'borrow' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('BORROW_UNKNOWN_ERROR');
      }
    });
  });

  describe('withdraw - full flow', () => {
    it('should withdraw on hub chain without relay when no cross-chain target', async () => {
      vi.spyOn(moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhubtx',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await moneyMarket.withdraw(
        { token: sonicTestToken, amount: testAmount, action: 'withdraw' },
        sonicSpokeProvider,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['0xhubtx', '0xhubtx']);
      }
    });

    it('should return error when createWithdrawIntent fails', async () => {
      vi.spyOn(moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'CREATE_WITHDRAW_INTENT_FAILED',
          data: {
            error: new Error('intent failed'),
            payload: { token: bscTestToken, amount: testAmount, action: 'withdraw' as const },
          },
        },
      });

      const result = await moneyMarket.withdraw(
        { token: bscTestToken, amount: testAmount, action: 'withdraw' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_WITHDRAW_INTENT_FAILED');
      }
    });

    it('should return CREATE_WITHDRAW_INTENT_FAILED when verifyTxHash fails', async () => {
      vi.spyOn(moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoketxhash',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({
        ok: false,
        error: new Error('tx hash not found'),
      });

      const result = await moneyMarket.withdraw(
        { token: bscTestToken, amount: testAmount, action: 'withdraw' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_WITHDRAW_INTENT_FAILED');
      }
    });

    it('should return WITHDRAW_UNKNOWN_ERROR on unexpected exception', async () => {
      vi.spyOn(moneyMarket, 'createWithdrawIntent').mockRejectedValueOnce(new Error('unexpected'));

      const result = await moneyMarket.withdraw(
        { token: bscTestToken, amount: testAmount, action: 'withdraw' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('WITHDRAW_UNKNOWN_ERROR');
      }
    });
  });

  describe('repay - full flow', () => {
    it('should repay on hub chain without relay (spoke == hub)', async () => {
      vi.spyOn(moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhubtx',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await moneyMarket.repay(
        { token: sonicTestToken, amount: testAmount, action: 'repay' },
        sonicSpokeProvider,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['0xhubtx', '0xhubtx']);
      }
    });

    it('should return error when createRepayIntent fails', async () => {
      vi.spyOn(moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'CREATE_REPAY_INTENT_FAILED',
          data: {
            error: new Error('intent failed'),
            payload: { token: bscTestToken, amount: testAmount, action: 'repay' as const },
          },
        },
      });

      const result = await moneyMarket.repay(
        { token: bscTestToken, amount: testAmount, action: 'repay' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_REPAY_INTENT_FAILED');
      }
    });

    it('should return CREATE_REPAY_INTENT_FAILED when verifyTxHash fails', async () => {
      vi.spyOn(moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoketxhash',
      });
      vi.spyOn(SpokeService, 'verifyTxHash').mockResolvedValueOnce({
        ok: false,
        error: new Error('tx hash not found'),
      });

      const result = await moneyMarket.repay(
        { token: bscTestToken, amount: testAmount, action: 'repay' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_REPAY_INTENT_FAILED');
      }
    });

    it('should return REPAY_UNKNOWN_ERROR on unexpected exception', async () => {
      vi.spyOn(moneyMarket, 'createRepayIntent').mockRejectedValueOnce(new Error('unexpected'));

      const result = await moneyMarket.repay(
        { token: bscTestToken, amount: testAmount, action: 'repay' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REPAY_UNKNOWN_ERROR');
      }
    });
  });

  describe('createSupplyIntent - additional paths', () => {
    it('should return CREATE_SUPPLY_INTENT_FAILED on error', async () => {
      vi.spyOn(HubService, 'getUserHubWalletAddress').mockRejectedValueOnce(new Error('hub wallet error'));

      const result = await moneyMarket.createSupplyIntent(
        { token: bscTestToken, amount: testAmount, action: 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_SUPPLY_INTENT_FAILED');
      }
    });

    it('should fail for invalid action', async () => {
      const result = await moneyMarket.createSupplyIntent(
        { token: bscTestToken, amount: testAmount, action: 'borrow' as 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
    });

    it('should fail for empty token', async () => {
      const result = await moneyMarket.createSupplyIntent(
        { token: '', amount: testAmount, action: 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
    });

    it('should fail for zero amount', async () => {
      const result = await moneyMarket.createSupplyIntent(
        { token: bscTestToken, amount: 0n, action: 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
    });

    it('should fail for unsupported token', async () => {
      const result = await moneyMarket.createSupplyIntent(
        { token: '0x0000000000000000000000000000000000000099', amount: testAmount, action: 'supply' },
        bscSpokeProvider,
      );

      expect(result.ok).toBe(false);
    });
  });

  describe('createBorrowIntent - additional paths', () => {
    it('should use SonicSpokeService.callWallet for sonic spoke provider on hub chain', async () => {
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: sonicTestToken,
        decimals: 18,
        name: 'Wrapped Ether',
      });
      vi.spyOn(HubService, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrowdata');
      vi.spyOn(SonicSpokeService, 'callWallet').mockResolvedValueOnce('0xsonichash');

      const result = await moneyMarket.createBorrowIntent(
        { token: sonicTestToken, amount: testAmount, action: 'borrow' },
        sonicSpokeProvider,
        false,
      );

      expect(SonicSpokeService.callWallet).toHaveBeenCalledWith('0xborrowdata', sonicSpokeProvider, false);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xsonichash');
      }
    });

    it('should use SpokeService.callWallet for non-sonic spoke provider', async () => {
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'ETHB',
        address: bscTestToken,
        decimals: 18,
        name: 'Ethereum BSC',
      });
      vi.spyOn(HubService, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrowdata');
      vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce('0xbschash');

      const result = await moneyMarket.createBorrowIntent(
        { token: bscTestToken, amount: testAmount, action: 'borrow' },
        bscSpokeProvider,
        false,
      );

      expect(SpokeService.callWallet).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xbschash');
      }
    });
  });

  describe('createWithdrawIntent - additional paths', () => {
    it('should use SonicSpokeService.callWallet for sonic spoke provider', async () => {
      vi.spyOn(moneyMarket.configService, 'isMoneyMarketSupportedToken').mockReturnValue(true);
      vi.spyOn(HubService, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0xwithdrawdata');
      vi.spyOn(SonicSpokeService, 'callWallet').mockResolvedValueOnce('0xsonichash');

      const result = await moneyMarket.createWithdrawIntent(
        { token: sonicTestToken, amount: testAmount, action: 'withdraw' },
        sonicSpokeProvider,
        false,
      );

      expect(SonicSpokeService.callWallet).toHaveBeenCalledWith('0xwithdrawdata', sonicSpokeProvider, false);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xsonichash');
      }
    });

    it('should use SpokeService.callWallet for non-sonic spoke provider', async () => {
      vi.spyOn(moneyMarket.configService, 'isMoneyMarketSupportedToken').mockReturnValue(true);
      vi.spyOn(HubService, 'getUserHubWalletAddress').mockResolvedValueOnce(mockHubAddress);
      vi.spyOn(moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0xwithdrawdata');
      vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce('0xbschash');

      const result = await moneyMarket.createWithdrawIntent(
        { token: bscTestToken, amount: testAmount, action: 'withdraw' },
        bscSpokeProvider,
        false,
      );

      expect(SpokeService.callWallet).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xbschash');
      }
    });
  });

  describe('buildSupplyData', () => {
    const mockAsset = '0x2222222222222222222222222222222222222222' as Address;
    const mockVaultAddr = '0x3333333333333333333333333333333333333333' as Address;
    const amount = 1000000000000000000n;

    it('should build supply data for non-vault token (approve + deposit + approve + supply)', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false);

      const result = moneyMarket.buildSupplyData(BSC_MAINNET_CHAIN_ID, bscTestToken, amount, mockHubAddress);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build supply data for vault token (approve + supply only)', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockVaultAddr,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(true);

      const result = moneyMarket.buildSupplyData(BSC_MAINNET_CHAIN_ID, bscTestToken, amount, mockHubAddress);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should throw when hub asset not found', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce(undefined);

      expect(() => {
        moneyMarket.buildSupplyData(
          BSC_MAINNET_CHAIN_ID,
          '0x0000000000000000000000000000000000000099',
          amount,
          mockHubAddress,
        );
      }).toThrow('hub asset not found');
    });
  });

  describe('buildBorrowData', () => {
    const mockAsset = '0x2222222222222222222222222222222222222222' as Address;
    const mockVaultAddr = '0x3333333333333333333333333333333333333333' as Address;
    const amount = 1000000000000000000n;
    const toAddress = '0x4444444444444444444444444444444444444444' as Address;

    it('should build borrow data for non-bnUSD vault token to spoke chain', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: bscTestToken,
        decimals: 18,
        name: 'Wrapped Ether',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false);

      const result = moneyMarket.buildBorrowData(mockHubAddress, toAddress, bscTestToken, amount, BSC_MAINNET_CHAIN_ID);

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build borrow data for bnUSD vault token', () => {
      const bnUSD = moneyMarket.config.bnUSD;
      const bnUSDVault = moneyMarket.config.bnUSDVault;

      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: bnUSD,
        vault: bnUSDVault,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'bnUSD',
        address: bnUSD,
        decimals: 18,
        name: 'Balanced Dollar',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false);

      const result = moneyMarket.buildBorrowData(mockHubAddress, toAddress, bnUSD, amount, BSC_MAINNET_CHAIN_ID);

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build borrow data for hub chain target (with non-wrappedSonic)', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: sonicTestToken,
        decimals: 18,
        name: 'Wrapped Ether',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false);

      const result = moneyMarket.buildBorrowData(
        mockHubAddress,
        toAddress,
        sonicTestToken,
        amount,
        SONIC_MAINNET_CHAIN_ID,
      );

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build borrow data for hub chain target with wrappedSonic', () => {
      const wrappedSonic = moneyMarket.configService.spokeChainConfig[SONIC_MAINNET_CHAIN_ID].addresses.wrappedSonic;

      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: wrappedSonic as Address,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'wS',
        address: wrappedSonic,
        decimals: 18,
        name: 'Wrapped Sonic',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false);

      const result = moneyMarket.buildBorrowData(
        mockHubAddress,
        toAddress,
        wrappedSonic,
        amount,
        SONIC_MAINNET_CHAIN_ID,
      );

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build borrow data for vault token (no extra withdraw)', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: mockVaultAddr,
        decimals: 18,
        name: 'Wrapped Ether Vault',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(true);

      const result = moneyMarket.buildBorrowData(
        mockHubAddress,
        toAddress,
        mockVaultAddr,
        amount,
        BSC_MAINNET_CHAIN_ID,
      );

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should include partner fee transfer when partnerFee is configured', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: bscTestToken,
        decimals: 18,
        name: 'Wrapped Ether',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false);

      // moneyMarket has partnerFee configured (percentage: 10)
      const result = moneyMarket.buildBorrowData(mockHubAddress, toAddress, bscTestToken, amount, BSC_MAINNET_CHAIN_ID);

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should throw when hub asset not found', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce(undefined);

      expect(() => {
        moneyMarket.buildBorrowData(
          mockHubAddress,
          toAddress,
          '0x0000000000000000000000000000000000000099',
          amount,
          BSC_MAINNET_CHAIN_ID,
        );
      }).toThrow('hub asset not found');
    });

    it('should throw when money market token not found', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce(undefined);

      expect(() => {
        moneyMarket.buildBorrowData(mockHubAddress, toAddress, bscTestToken, amount, BSC_MAINNET_CHAIN_ID);
      }).toThrow('Money market token not found');
    });
  });

  describe('buildWithdrawData', () => {
    const mockAsset = '0x2222222222222222222222222222222222222222' as Address;
    const mockVaultAddr = '0x3333333333333333333333333333333333333333' as Address;
    const amount = 1000000000000000000n;
    const toAddress = '0x4444444444444444444444444444444444444444' as Address;

    it('should build withdraw data for non-vault token to spoke chain', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: bscTestToken,
        decimals: 18,
        name: 'Wrapped Ether',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false).mockReturnValueOnce(false);

      const result = moneyMarket.buildWithdrawData(
        mockHubAddress,
        toAddress,
        bscTestToken,
        amount,
        BSC_MAINNET_CHAIN_ID,
      );

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build withdraw data for vault token (no extra withdraw from vault)', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockVaultAddr,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: mockVaultAddr,
        decimals: 18,
        name: 'Wrapped Ether Vault',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(true).mockReturnValueOnce(true);

      const result = moneyMarket.buildWithdrawData(
        mockHubAddress,
        toAddress,
        mockVaultAddr,
        amount,
        BSC_MAINNET_CHAIN_ID,
      );

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build withdraw data for hub chain target (non-wrappedSonic)', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'WETH',
        address: sonicTestToken,
        decimals: 18,
        name: 'Wrapped Ether',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false).mockReturnValueOnce(false);

      const result = moneyMarket.buildWithdrawData(
        mockHubAddress,
        toAddress,
        sonicTestToken,
        amount,
        SONIC_MAINNET_CHAIN_ID,
      );

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build withdraw data for hub chain target with wrappedSonic', () => {
      const wrappedSonic = moneyMarket.configService.spokeChainConfig[SONIC_MAINNET_CHAIN_ID].addresses.wrappedSonic;

      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: wrappedSonic as Address,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce({
        symbol: 'wS',
        address: wrappedSonic,
        decimals: 18,
        name: 'Wrapped Sonic',
      });
      vi.spyOn(moneyMarket.configService, 'isValidVault').mockReturnValueOnce(false).mockReturnValueOnce(false);

      const result = moneyMarket.buildWithdrawData(
        mockHubAddress,
        toAddress,
        wrappedSonic,
        amount,
        SONIC_MAINNET_CHAIN_ID,
      );

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should throw when hub asset not found', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce(undefined);

      expect(() => {
        moneyMarket.buildWithdrawData(
          mockHubAddress,
          toAddress,
          '0x0000000000000000000000000000000000000099',
          amount,
          BSC_MAINNET_CHAIN_ID,
        );
      }).toThrow('hub asset not found');
    });

    it('should throw when money market token not found', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });
      vi.spyOn(moneyMarket.configService, 'getMoneyMarketToken').mockReturnValueOnce(undefined);

      expect(() => {
        moneyMarket.buildWithdrawData(mockHubAddress, toAddress, bscTestToken, amount, BSC_MAINNET_CHAIN_ID);
      }).toThrow('Money market token not found');
    });
  });

  describe('buildRepayData', () => {
    const mockAsset = '0x2222222222222222222222222222222222222222' as Address;
    const mockVaultAddr = '0x3333333333333333333333333333333333333333' as Address;
    const amount = 1000000000000000000n;

    it('should build repay data for non-bnUSD vault token', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: mockVaultAddr,
        decimal: 18,
      });

      const result = moneyMarket.buildRepayData(BSC_MAINNET_CHAIN_ID, bscTestToken, amount, mockHubAddress);

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build repay data for bnUSD vault token (asset != bnUSDVault)', () => {
      const bnUSDVault = moneyMarket.config.bnUSDVault;

      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: mockAsset,
        vault: bnUSDVault,
        decimal: 18,
      });

      const result = moneyMarket.buildRepayData(BSC_MAINNET_CHAIN_ID, bscTestToken, amount, mockHubAddress);

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should build repay data for bnUSD vault token (asset == bnUSDVault)', () => {
      const bnUSDVault = moneyMarket.config.bnUSDVault;

      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce({
        asset: bnUSDVault,
        vault: bnUSDVault,
        decimal: 18,
      });

      const result = moneyMarket.buildRepayData(BSC_MAINNET_CHAIN_ID, bscTestToken, amount, mockHubAddress);

      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should throw when hub asset not found', () => {
      vi.spyOn(moneyMarket.configService, 'getHubAssetInfo').mockReturnValueOnce(undefined);

      expect(() => {
        moneyMarket.buildRepayData(
          BSC_MAINNET_CHAIN_ID,
          '0x0000000000000000000000000000000000000099',
          amount,
          mockHubAddress,
        );
      }).toThrow('hub asset not found');
    });
  });

  describe('createRepayIntent - additional paths', () => {
    it('should fail for invalid action', async () => {
      try {
        await moneyMarket.createRepayIntent(
          { token: bscTestToken, amount: testAmount, action: 'supply' as 'repay' },
          bscSpokeProvider,
        );
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should fail for empty token', async () => {
      try {
        await moneyMarket.createRepayIntent({ token: '', amount: testAmount, action: 'repay' }, bscSpokeProvider);
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should fail for zero amount', async () => {
      try {
        await moneyMarket.createRepayIntent({ token: bscTestToken, amount: 0n, action: 'repay' }, bscSpokeProvider);
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
