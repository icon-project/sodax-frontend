import { describe, it, expect } from 'vitest';
import { decodeFunctionData, type Address } from 'viem';
import { vaultTokenAbi } from '../../../abis/index.js';
import { EvmVaultTokenService } from '../../../services/index.js';

describe('EvmVaultTokenService', () => {
  const mockVault = '0x1234567890123456789012345678901234567890' as Address;
  const mockToken = '0x0987654321098765432109876543210987654321' as Address;
  const mockAmount = 1000000000000000000n; // 1 token with 18 decimals

  describe('encoding methods', () => {
    describe('encodeDeposit', () => {
      it('should correctly encode deposit transaction data', () => {
        const encodedCall = EvmVaultTokenService.encodeDeposit(mockVault, mockToken, mockAmount);

        expect(encodedCall).toEqual({
          address: mockVault,
          value: 0n,
          data: expect.any(String),
        });

        const decoded = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('deposit');
        expect(decoded.args).toEqual([mockToken, mockAmount]);
      });

      it('should maintain data precision for large numbers', () => {
        const largeAmount = 2n ** 128n;
        const encodedCall = EvmVaultTokenService.encodeDeposit(mockVault, mockToken, largeAmount);

        const decoded = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedCall.data,
        });

        expect(decoded.args?.[1]).toBe(largeAmount);
      });
    });

    describe('encodeWithdraw', () => {
      it('should correctly encode withdraw transaction data', () => {
        const encodedCall = EvmVaultTokenService.encodeWithdraw(mockVault, mockToken, mockAmount);

        expect(encodedCall).toEqual({
          address: mockVault,
          value: 0n,
          data: expect.any(String),
        });

        const decoded = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedCall.data,
        });

        expect(decoded.functionName).toBe('withdraw');
        expect(decoded.args).toEqual([mockToken, mockAmount]);
      });

      it('should maintain data precision for large numbers', () => {
        const largeAmount = 2n ** 128n;
        const encodedCall = EvmVaultTokenService.encodeWithdraw(mockVault, mockToken, largeAmount);

        const decoded = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedCall.data,
        });

        expect(decoded.args?.[1]).toBe(largeAmount);
      });
    });

    describe('edge cases', () => {
      it('should handle zero amount', () => {
        const encodedDeposit = EvmVaultTokenService.encodeDeposit(mockVault, mockToken, 0n);
        const decodedDeposit = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedDeposit.data,
        });
        expect(decodedDeposit.args).toEqual([mockToken, 0n]);

        const encodedWithdraw = EvmVaultTokenService.encodeWithdraw(mockVault, mockToken, 0n);
        const decodedWithdraw = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedWithdraw.data,
        });
        expect(decodedWithdraw.args).toEqual([mockToken, 0n]);
      });

      it('should handle maximum uint256 amount', () => {
        const maxUint256 = 2n ** 256n - 1n;

        const encodedDeposit = EvmVaultTokenService.encodeDeposit(mockVault, mockToken, maxUint256);
        const decodedDeposit = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedDeposit.data,
        });
        expect(decodedDeposit.args).toEqual([mockToken, maxUint256]);

        const encodedWithdraw = EvmVaultTokenService.encodeWithdraw(mockVault, mockToken, maxUint256);
        const decodedWithdraw = decodeFunctionData({
          abi: vaultTokenAbi,
          data: encodedWithdraw.data,
        });
        expect(decodedWithdraw.args).toEqual([mockToken, maxUint256]);
      });

      it('should generate different data for deposit and withdraw with same parameters', () => {
        const depositCall = EvmVaultTokenService.encodeDeposit(mockVault, mockToken, mockAmount);
        const withdrawCall = EvmVaultTokenService.encodeWithdraw(mockVault, mockToken, mockAmount);

        expect(depositCall.data).not.toBe(withdrawCall.data);
      });
    });
  });
});
