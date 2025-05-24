import { type Address, decodeFunctionData } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { poolAbi } from '../../../abis/pool.abi.js';
import { hubAssets } from '../../../constants.js';
import {
  type MoneyMarketBorrowParams,
  type MoneyMarketRepayParams,
  type MoneyMarketRepayWithATokensParams,
  MoneyMarketService,
  type MoneyMarketSupplyParams,
  type MoneyMarketWithdrawParams,
} from '../../../index.js';

describe('MoneyMarketService', () => {
  const mockToken = '0x0000000000000000000000000000000000000000' as Address;
  const mockVault =
    hubAssets['0xa869.fuji'][mockToken]?.vault ?? ('0x0000000000000000000000000000000000000001' as Address);
  const mockLendingPool = '0x3333333333333333333333333333333333333333' as Address;
  const mockUser = '0x4444444444444444444444444444444444444444' as Address;
  const mockAmount = 1000000000000000000n; // 1 token with 18 decimals

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mock('../../../utils/evm-utils.js', () => ({
      encodeContractCalls: vi.fn().mockReturnValue('0xencoded'),
    }));
  });

  describe('encoding methods', () => {
    describe('encodeSupply', () => {
      it('should correctly encode supply transaction', () => {
        const supplyParams = {
          asset: mockVault,
          amount: mockAmount,
          onBehalfOf: mockUser,
          referralCode: 0,
        } satisfies MoneyMarketSupplyParams;

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
        expect(decoded.args).toEqual([mockVault, mockAmount, mockUser, 0]);
      });
    });

    describe('encodeWithdraw', () => {
      it('should correctly encode withdraw transaction', () => {
        const withdrawParams = {
          asset: mockVault,
          amount: mockAmount,
          to: mockUser,
        } satisfies MoneyMarketWithdrawParams;

        const encodedCall = MoneyMarketService.encodeWithdraw(withdrawParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('withdraw');
        expect(decoded.args).toEqual([mockVault, mockAmount, mockUser]);
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
        } satisfies MoneyMarketBorrowParams;

        const encodedCall = MoneyMarketService.encodeBorrow(borrowParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('borrow');
        expect(decoded.args).toEqual([mockVault, mockAmount, 2n, 0, mockUser]);
      });
    });

    describe('encodeRepay', () => {
      it('should correctly encode repay transaction', () => {
        const repayParams = {
          asset: mockVault,
          amount: mockAmount,
          interestRateMode: 2n,
          onBehalfOf: mockUser,
        } satisfies MoneyMarketRepayParams;

        const encodedCall = MoneyMarketService.encodeRepay(repayParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('repay');
        expect(decoded.args).toEqual([mockVault, mockAmount, 2n, mockUser]);
      });
    });

    describe('encodeRepayWithATokens', () => {
      it('should correctly encode repayWithATokens transaction', () => {
        const repayParams = {
          asset: mockVault,
          amount: mockAmount,
          interestRateMode: 2n,
        } satisfies MoneyMarketRepayWithATokensParams;

        const encodedCall = MoneyMarketService.encodeRepayWithATokens(repayParams, mockLendingPool);

        const decoded = decodeFunctionData({
          abi: poolAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('repayWithATokens');
        expect(decoded.args).toEqual([mockVault, mockAmount, 2n]);
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
});
