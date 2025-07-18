import { describe, expect, it } from 'vitest';
import { calculateFeeAmount, calculatePercentageFeeAmount, encodeAddress } from './shared-utils.js';
import type { SpokeChainId } from '@sodax/types';

describe('calculatePercentageAmount', () => {
  const address = '0x0000000000000000000000000000000000000001' as `0x${string}`;

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
});
