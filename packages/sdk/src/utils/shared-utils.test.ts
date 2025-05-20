import { describe, expect, it } from 'vitest';
import { calculateFeeAmount, calculatePercentageFeeAmount } from './shared-utils.js';

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
});
