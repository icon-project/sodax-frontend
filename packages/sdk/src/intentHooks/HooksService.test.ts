import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { HooksService, HookType, type HooksServiceConstructorParams } from './HooksService.js';
import type { PublicClient, WalletClient, Address } from 'viem';
import { SONIC_MAINNET_CHAIN_ID, type HookIntent, type FillHookIntentParams } from '@sodax/types';

// Mock @sodax/types config functions
vi.mock('@sodax/types', async () => {
  const actual = await vi.importActual('@sodax/types');
  return {
    ...actual,
    getSolverConfig: vi.fn().mockReturnValue({
      intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
      solverApiEndpoint: 'https://api.sodax.com/v1/intent',
    }),
    getMoneyMarketConfig: vi.fn().mockReturnValue({
      lendingPool: '0x553434896D39F867761859D0FE7189d2Af70514E',
      uiPoolDataProvider: '0xC04d746C38f1E51C8b3A3E2730250bbAC2F271bf',
      poolAddressesProvider: '0x036aDe0aBAA4c82445Cb7597f2d6d6130C118c7b',
      bnUSD: '0x94dC79ce9C515ba4AE4D195da8E6AB86c69BFc38',
      bnUSDAToken: '0xa2cDA49735e42f0905496E40a66B3C5475Ed69dF',
      bnUSDVault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    }),
    getHooksConfig: vi.fn().mockReturnValue({
      creditHookAddress: '0x1111111111111111111111111111111111111111',
      leverageHookAddress: '0x2222222222222222222222222222222222222222',
      debtSideLeverageHookAddress: '0x3333333333333333333333333333333333333333',
      deleverageHookAddress: '0x4444444444444444444444444444444444444444',
      liquidationHookAddress: '0x5555555555555555555555555555555555555555',
    }),
  };
});

// Mock hook addresses for test assertions
const mockHooksConfig = {
  creditHookAddress: '0x1111111111111111111111111111111111111111',
  leverageHookAddress: '0x2222222222222222222222222222222222222222',
  debtSideLeverageHookAddress: '0x3333333333333333333333333333333333333333',
  deleverageHookAddress: '0x4444444444444444444444444444444444444444',
  liquidationHookAddress: '0x5555555555555555555555555555555555555555',
};

describe('HooksService', () => {
  let hooksService: HooksService;
  let mockPublicClient: PublicClient;
  let mockWalletClient: WalletClient;

  const userAddress = '0x1234567890123456789012345678901234567890' as Address;
  const debtAsset = '0x1111111111111111111111111111111111111111' as Address;
  const collateralAsset = '0x2222222222222222222222222222222222222222' as Address;
  const debtTokenAddress = '0xDebtToken1234567890123456789012345678901' as Address;
  const aTokenAddress = '0xAToken123456789012345678901234567890123' as Address;

  const createMockPublicClient = (): PublicClient => {
    return {
      readContract: vi.fn(),
      waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
      getLogs: vi.fn(),
    } as unknown as PublicClient;
  };

  const createMockWalletClient = (): WalletClient => {
    return {
      getAddresses: vi.fn().mockResolvedValue([userAddress]),
      writeContract: vi
        .fn()
        .mockResolvedValue('0xTransactionHash123456789012345678901234567890123456789012345678901234'),
      chain: { id: 146 },
      account: {
        address: userAddress,
      },
    } as unknown as WalletClient;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPublicClient = createMockPublicClient();
    mockWalletClient = createMockWalletClient();

    const params: HooksServiceConstructorParams = {
      publicClient: mockPublicClient,
      walletClient: mockWalletClient,
      chainId: SONIC_MAINNET_CHAIN_ID,
    };

    hooksService = new HooksService(params);
  });

  describe('Constructor', () => {
    it('should create instance with publicClient only (read-only mode)', () => {
      const readOnlyService = new HooksService({
        publicClient: mockPublicClient,
        chainId: SONIC_MAINNET_CHAIN_ID,
      });

      expect(readOnlyService).toBeInstanceOf(HooksService);
    });

    it('should create instance with both publicClient and walletClient', () => {
      expect(hooksService).toBeInstanceOf(HooksService);
    });
  });

  describe('getHookAddress', () => {
    it('should return correct address for each hook type', () => {
      expect(hooksService.getHookAddress(HookType.Credit)).toBe(mockHooksConfig.creditHookAddress);
      expect(hooksService.getHookAddress(HookType.Leverage)).toBe(mockHooksConfig.leverageHookAddress);
      expect(hooksService.getHookAddress(HookType.DebtSideLeverage)).toBe(mockHooksConfig.debtSideLeverageHookAddress);
      expect(hooksService.getHookAddress(HookType.Deleverage)).toBe(mockHooksConfig.deleverageHookAddress);
      expect(hooksService.getHookAddress(HookType.Liquidation)).toBe(mockHooksConfig.liquidationHookAddress);
    });
  });

  describe('Shared Approval Methods', () => {
    describe('getCreditDelegationStatus', () => {
      it('should return credit delegation status for Credit hook', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockReserveData) // getReserveData
          .mockResolvedValueOnce(1000000n); // borrowAllowance

        const result = await hooksService.getCreditDelegationStatus(debtAsset, userAddress, HookType.Credit);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.delegated).toBe(true);
          expect(result.value.allowance).toBe('1000000');
        }
      });

      it('should return credit delegation status for Leverage hook', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockReserveData).mockResolvedValueOnce(2000000n);

        const result = await hooksService.getCreditDelegationStatus(debtAsset, userAddress, HookType.Leverage);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.delegated).toBe(true);
          expect(result.value.allowance).toBe('2000000');
        }
      });

      it('should return delegated: false when allowance is 0', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockReserveData).mockResolvedValueOnce(0n);

        const result = await hooksService.getCreditDelegationStatus(debtAsset, userAddress, HookType.Credit);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.delegated).toBe(false);
          expect(result.value.allowance).toBe('0');
        }
      });

      it('should return error on failure', async () => {
        (mockPublicClient.readContract as Mock).mockRejectedValueOnce(new Error('RPC error'));

        const result = await hooksService.getCreditDelegationStatus(debtAsset, userAddress, HookType.Credit);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });
    });

    describe('approveCreditDelegation', () => {
      it('should approve credit delegation for Credit hook', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockReserveData);

        const result = await hooksService.approveCreditDelegation(debtAsset, '1000000', HookType.Credit);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.approved).toBe(true);
          expect(result.value.txHash).toBeDefined();
        }
      });

      it('should approve credit delegation for Leverage hook', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockReserveData);

        const result = await hooksService.approveCreditDelegation(debtAsset, '1000000', HookType.Leverage);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.approved).toBe(true);
        }
      });

      it('should approve credit delegation for DebtSideLeverage hook', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockReserveData);

        const result = await hooksService.approveCreditDelegation(debtAsset, '1000000', HookType.DebtSideLeverage);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.approved).toBe(true);
        }
      });

      it('should return error when walletClient is not provided', async () => {
        const readOnlyService = new HooksService({
          publicClient: mockPublicClient,
          chainId: SONIC_MAINNET_CHAIN_ID,
        });

        const result = await readOnlyService.approveCreditDelegation(debtAsset, '1000000', HookType.Credit);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect((result.error as Error).message).toBe('Wallet client required');
        }
      });
    });

    describe('approveToken', () => {
      it('should approve token for DebtSideLeverage hook', async () => {
        const result = await hooksService.approveToken(debtAsset, '1000000', HookType.DebtSideLeverage);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.approved).toBe(true);
          expect(result.value.txHash).toBeDefined();
        }
      });

      it('should approve token for any hook type', async () => {
        const result = await hooksService.approveToken(collateralAsset, '2000000', HookType.Deleverage);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.approved).toBe(true);
        }
      });

      it('should return error when walletClient is not provided', async () => {
        const readOnlyService = new HooksService({
          publicClient: mockPublicClient,
          chainId: SONIC_MAINNET_CHAIN_ID,
        });

        const result = await readOnlyService.approveToken(debtAsset, '1000000', HookType.DebtSideLeverage);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect((result.error as Error).message).toBe('Wallet client required');
        }
      });
    });

    describe('approveAToken', () => {
      it('should approve aToken for Deleverage hook', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockReserveData);

        const result = await hooksService.approveAToken(collateralAsset, '1000000', HookType.Deleverage);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.approved).toBe(true);
          expect(result.value.txHash).toBeDefined();
        }
      });

      it('should return error when walletClient is not provided', async () => {
        const readOnlyService = new HooksService({
          publicClient: mockPublicClient,
          chainId: SONIC_MAINNET_CHAIN_ID,
        });

        const result = await readOnlyService.approveAToken(collateralAsset, '1000000', HookType.Deleverage);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect((result.error as Error).message).toBe('Wallet client required');
        }
      });
    });
  });

  describe('Credit Hook', () => {
    describe('createCreditIntent', () => {
      it('should create credit intent successfully', async () => {
        const params = {
          debtAsset: debtAsset,
          targetAsset: collateralAsset,
          maxPayment: '1500000000',
          minReceive: '1000000000000000000',
        };

        const result = await hooksService.createCreditIntent(params, 146);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.txHash).toBeDefined();
        }
        expect(mockWalletClient.writeContract).toHaveBeenCalled();
      });

      it('should return error when walletClient is not provided', async () => {
        const readOnlyService = new HooksService({
          publicClient: mockPublicClient,
          chainId: SONIC_MAINNET_CHAIN_ID,
        });

        const params = {
          debtAsset: debtAsset,
          targetAsset: collateralAsset,
          maxPayment: '1500000000',
          minReceive: '1000000000000000000',
        };

        const result = await readOnlyService.createCreditIntent(params, 146);

        expect(result.ok).toBe(false);
      });
    });
  });

  describe('Leverage Hook', () => {
    describe('createLeverageIntent', () => {
      it('should create leverage intent successfully', async () => {
        const params = {
          collateralAsset: collateralAsset,
          debtAsset: debtAsset,
          collateralAmount: '1000000000000000000',
          borrowAmount: '1500000000',
        };

        const result = await hooksService.createLeverageIntent(params, 146);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.txHash).toBeDefined();
        }
      });
    });
  });

  describe('Debt Side Leverage Hook', () => {
    describe('getDebtSideLeverageStatus', () => {
      it('should return debt side leverage status successfully', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockReserveData) // getReserveData
          .mockResolvedValueOnce(1000000n) // tokenAllowance
          .mockResolvedValueOnce(2000000n) // creditDelegation
          .mockResolvedValueOnce(500000n); // tokenBalance

        const result = await hooksService.getDebtSideLeverageStatus(debtAsset, userAddress);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.tokenAllowance).toBe('1000000');
          expect(result.value.creditDelegation).toBe('2000000');
          expect(result.value.tokenBalance).toBe('500000');
          expect(result.value.isReady).toBe(true);
        }
      });

      it('should return isReady: false when any value is 0', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockReserveData)
          .mockResolvedValueOnce(0n) // tokenAllowance = 0
          .mockResolvedValueOnce(2000000n)
          .mockResolvedValueOnce(500000n);

        const result = await hooksService.getDebtSideLeverageStatus(debtAsset, userAddress);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.isReady).toBe(false);
        }
      });
    });

    describe('createDebtSideLeverageIntent', () => {
      it('should create debt side leverage intent successfully', async () => {
        const params = {
          collateralAsset: collateralAsset,
          debtAsset: debtAsset,
          collateralAmount: '1000000000000000000',
          userProvidedAmount: '500000000',
          totalBorrowAmount: '1500000000',
        };

        const result = await hooksService.createDebtSideLeverageIntent(params, 146);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.txHash).toBeDefined();
        }
      });
    });
  });

  describe('Deleverage Hook', () => {
    describe('getATokenApprovalInfo', () => {
      it('should return aToken approval info successfully', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockReserveData) // getReserveData
          .mockResolvedValueOnce(2000000n); // allowance

        const result = await hooksService.getATokenApprovalInfo(collateralAsset, userAddress, '1000000', '100000');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.aTokenAddress).toBe(aTokenAddress);
          expect(result.value.aTokensNeeded).toBe('1100000'); // withdrawAmount + feeAmount
          expect(result.value.currentAllowance).toBe('2000000');
          expect(result.value.isApproved).toBe(true);
        }
      });

      it('should return isApproved: false when allowance is insufficient', async () => {
        const mockReserveData = {
          variableDebtTokenAddress: debtTokenAddress,
          aTokenAddress: aTokenAddress,
        };

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockReserveData).mockResolvedValueOnce(500000n); // allowance < aTokensNeeded

        const result = await hooksService.getATokenApprovalInfo(collateralAsset, userAddress, '1000000', '100000');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.isApproved).toBe(false);
        }
      });
    });

    describe('createDeleverageIntent', () => {
      it('should create deleverage intent successfully', async () => {
        const params = {
          collateralAsset: collateralAsset,
          debtAsset: debtAsset,
          withdrawAmount: '500000000000000000',
          repayAmount: '750000000',
        };

        const result = await hooksService.createDeleverageIntent(params, 146);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.txHash).toBeDefined();
        }
      });
    });
  });

  describe('Liquidation Hook', () => {
    describe('getLiquidationOpportunity', () => {
      it('should return liquidation opportunity for liquidatable position', async () => {
        const mockAccountData = [
          1000000n, // totalCollateralBase
          500000n, // totalDebtBase
          300000n, // availableBorrowsBase
          8000n, // currentLiquidationThreshold
          7500n, // ltv
          900000000000000000n, // healthFactor < 1e18
        ];

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockAccountData);

        const result = await hooksService.getLiquidationOpportunity(userAddress);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.isLiquidatable).toBe(true);
          expect(result.value.healthFactor).toBe('900000000000000000');
          expect(result.value.accountData.totalCollateralBase).toBe('1000000');
        }
      });

      it('should return non-liquidatable for healthy position', async () => {
        const mockAccountData = [
          1000000n,
          500000n,
          300000n,
          8000n,
          7500n,
          1500000000000000000n, // healthFactor > 1e18
        ];

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockAccountData);

        const result = await hooksService.getLiquidationOpportunity(userAddress);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.isLiquidatable).toBe(false);
        }
      });
    });

    describe('createLiquidationIntent', () => {
      it('should create liquidation intent for liquidatable position', async () => {
        const mockAccountData = [
          1000000n,
          500000n,
          300000n,
          8000n,
          7500n,
          900000000000000000n, // healthFactor < 1e18
        ];

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockAccountData);

        const params = {
          collateralAsset: collateralAsset,
          debtAsset: debtAsset,
          userToLiquidate: '0xLiquidatableUser12345678901234567890123' as Address,
          collateralAmount: '100000000',
          debtAmount: '10000000000',
        };

        const result = await hooksService.createLiquidationIntent(params, 146);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.txHash).toBeDefined();
        }
      });

      it('should return error when position is not liquidatable', async () => {
        const mockAccountData = [
          1000000n,
          500000n,
          300000n,
          8000n,
          7500n,
          1500000000000000000n, // healthFactor > 1e18
        ];

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockAccountData);

        const params = {
          collateralAsset: collateralAsset,
          debtAsset: debtAsset,
          userToLiquidate: '0xHealthyUser123456789012345678901234567' as Address,
          collateralAmount: '100000000',
          debtAmount: '10000000000',
        };

        const result = await hooksService.createLiquidationIntent(params, 146);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect((result.error as Error).message).toContain('Position is not liquidatable');
        }
      });

      it('should return error when walletClient is not provided', async () => {
        const readOnlyService = new HooksService({
          publicClient: mockPublicClient,
          chainId: SONIC_MAINNET_CHAIN_ID,
        });

        const params = {
          collateralAsset: collateralAsset,
          debtAsset: debtAsset,
          userToLiquidate: userAddress,
          collateralAmount: '100000000',
          debtAmount: '10000000000',
        };

        const result = await readOnlyService.createLiquidationIntent(params, 146);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect((result.error as Error).message).toBe('Wallet client required');
        }
      });
    });
  });

  describe('Intent Lifecycle', () => {
    const intentHash = '0xIntentHash1234567890123456789012345678901234567890123456789012345678' as const;
    const mockIntent: HookIntent = {
      intentId: 1n,
      creator: userAddress,
      inputToken: debtAsset,
      outputToken: collateralAsset,
      inputAmount: 1000000n,
      minOutputAmount: 500000n,
      deadline: 9999999999n,
      allowPartialFill: true,
      srcChain: 146n,
      dstChain: 146n,
      srcAddress: '0x' as const,
      dstAddress: '0x' as const,
      solver: '0x0000000000000000000000000000000000000000' as Address,
      data: '0x' as const,
    };

    describe('getIntentState', () => {
      it('should return intent state successfully', async () => {
        const mockState = [
          true, // exists
          800000n, // remainingInput
          200000n, // receivedOutput
          0n, // pendingPayment
        ];

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockState);

        const result = await hooksService.getIntentState(intentHash);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.exists).toBe(true);
          expect(result.value.remainingInput).toBe('800000');
          expect(result.value.receivedOutput).toBe('200000');
          expect(result.value.pendingPayment).toBe(0n);
        }
      });

      it('should return error on contract read failure', async () => {
        (mockPublicClient.readContract as Mock).mockRejectedValueOnce(new Error('RPC error'));

        const result = await hooksService.getIntentState(intentHash);

        expect(result.ok).toBe(false);
      });
    });

    describe('getPendingIntentState', () => {
      it('should return pending intent state successfully', async () => {
        const mockPendingState = [
          100000n, // pendingInput
          50000n, // pendingOutput
        ];

        (mockPublicClient.readContract as Mock).mockResolvedValueOnce(mockPendingState);

        const result = await hooksService.getPendingIntentState(intentHash);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.pendingInput).toBe('100000');
          expect(result.value.pendingOutput).toBe('50000');
        }
      });

      it('should return error on contract read failure', async () => {
        (mockPublicClient.readContract as Mock).mockRejectedValueOnce(new Error('RPC error'));

        const result = await hooksService.getPendingIntentState(intentHash);

        expect(result.ok).toBe(false);
      });
    });

    describe('isFillable', () => {
      it('should return true when intent is fillable', async () => {
        const mockState = [
          true, // exists
          800000n, // remainingInput
          200000n, // receivedOutput
          0n, // pendingPayment
        ];

        const mockPendingState = [
          0n, // pendingInput
          0n, // pendingOutput
        ];

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockState)
          .mockResolvedValueOnce(mockPendingState);

        const result = await hooksService.isFillable(intentHash);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should return false when intent does not exist', async () => {
        const mockState = [
          false, // exists
          0n, // remainingInput
          0n, // receivedOutput
          0n, // pendingPayment
        ];

        const mockPendingState = [
          0n, // pendingInput
          0n, // pendingOutput
        ];

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockState)
          .mockResolvedValueOnce(mockPendingState);

        const result = await hooksService.isFillable(intentHash);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should return false when there is pending payment', async () => {
        const mockState = [
          true, // exists
          800000n, // remainingInput
          200000n, // receivedOutput
          100000n, // pendingPayment
        ];

        const mockPendingState = [
          0n, // pendingInput
          0n, // pendingOutput
        ];

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockState)
          .mockResolvedValueOnce(mockPendingState);

        const result = await hooksService.isFillable(intentHash);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should return false when no available input', async () => {
        const mockState = [
          true, // exists
          100000n, // remainingInput
          0n, // receivedOutput
          0n, // pendingPayment
        ];

        const mockPendingState = [
          100000n, // pendingInput (All input is pending)
          0n, // pendingOutput
        ];

        (mockPublicClient.readContract as Mock)
          .mockResolvedValueOnce(mockState)
          .mockResolvedValueOnce(mockPendingState);

        const result = await hooksService.isFillable(intentHash);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should return error when getIntentState fails', async () => {
        (mockPublicClient.readContract as Mock).mockRejectedValueOnce(new Error('RPC error'));

        const result = await hooksService.isFillable(intentHash);

        expect(result.ok).toBe(false);
      });
    });

    describe('computeIntentHash', () => {
      it('should compute intent hash correctly', () => {
        const hash = hooksService.computeIntentHash(mockIntent);

        expect(hash).toBeDefined();
        expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      });

      it('should produce consistent hash for same intent', () => {
        const hash1 = hooksService.computeIntentHash(mockIntent);
        const hash2 = hooksService.computeIntentHash(mockIntent);

        expect(hash1).toBe(hash2);
      });

      it('should produce different hash for different intents', () => {
        const intent1 = { ...mockIntent, intentId: 1n };
        const intent2 = { ...mockIntent, intentId: 2n };

        const hash1 = hooksService.computeIntentHash(intent1);
        const hash2 = hooksService.computeIntentHash(intent2);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('cancelIntent', () => {
      it('should cancel intent successfully', async () => {
        const result = await hooksService.cancelIntent(mockIntent);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.cancelled).toBe(true);
          expect(result.value.txHash).toBeDefined();
        }
        expect(mockWalletClient.writeContract).toHaveBeenCalled();
        expect(mockPublicClient.waitForTransactionReceipt).toHaveBeenCalled();
      });

      it('should return error when walletClient is not provided', async () => {
        const readOnlyService = new HooksService({
          publicClient: mockPublicClient,
          chainId: SONIC_MAINNET_CHAIN_ID,
        });

        const result = await readOnlyService.cancelIntent(mockIntent);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect((result.error as Error).message).toBe('Wallet client required');
        }
      });

      it('should handle transaction errors', async () => {
        (mockWalletClient.writeContract as Mock).mockRejectedValueOnce(new Error('Transaction failed'));

        const result = await hooksService.cancelIntent(mockIntent);

        expect(result.ok).toBe(false);
      });
    });

    describe('fillIntent', () => {
      const fillParams: FillHookIntentParams = {
        intent: mockIntent,
        inputAmount: '500000',
        outputAmount: '250000',
      };

      it('should fill intent successfully', async () => {
        const result = await hooksService.fillIntent(fillParams);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.filled).toBe(true);
          expect(result.value.txHash).toBeDefined();
        }
        expect(mockWalletClient.writeContract).toHaveBeenCalled();
        expect(mockPublicClient.waitForTransactionReceipt).toHaveBeenCalled();
      });

      it('should fill intent with external fill ID', async () => {
        const paramsWithFillId: FillHookIntentParams = {
          ...fillParams,
          externalFillId: '12345',
        };

        const result = await hooksService.fillIntent(paramsWithFillId);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.filled).toBe(true);
        }
      });

      it('should include value when output token is native', async () => {
        const nativeOutputIntent = {
          ...mockIntent,
          outputToken: '0x0000000000000000000000000000000000000000' as Address,
        };

        const params: FillHookIntentParams = {
          intent: nativeOutputIntent,
          inputAmount: '500000',
          outputAmount: '250000',
        };

        const result = await hooksService.fillIntent(params);

        expect(result.ok).toBe(true);
        expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
          expect.objectContaining({
            value: 250000n,
          }),
        );
      });

      it('should return error when walletClient is not provided', async () => {
        const readOnlyService = new HooksService({
          publicClient: mockPublicClient,
          chainId: SONIC_MAINNET_CHAIN_ID,
        });

        const result = await readOnlyService.fillIntent(fillParams);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect((result.error as Error).message).toBe('Wallet client required');
        }
      });

      it('should handle transaction errors', async () => {
        (mockWalletClient.writeContract as Mock).mockRejectedValueOnce(new Error('Transaction failed'));

        const result = await hooksService.fillIntent(fillParams);

        expect(result.ok).toBe(false);
      });
    });
  });
});
