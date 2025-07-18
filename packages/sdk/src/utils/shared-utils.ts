import invariant from 'tiny-invariant';
import {
  DEFAULT_MAX_RETRY,
  DEFAULT_RETRY_DELAY_MS,
  FEE_PERCENTAGE_SCALE,
  isPartnerFeeAmount,
  isPartnerFeePercentage,
  type Hex,
  type PartnerFee,
  type SpokeChainId,
} from '../index.js';
import { toHex } from 'viem';
import { bcs } from '@mysten/sui/bcs';
import { PublicKey } from '@solana/web3.js';
import { Address } from '@stellar/stellar-sdk';

export async function retry<T>(
  action: (retryCount: number) => Promise<T>,
  retryCount: number = DEFAULT_MAX_RETRY,
  delayMs = DEFAULT_RETRY_DELAY_MS,
): Promise<T> {
  do {
    try {
      return await action(retryCount);
    } catch (e) {
      retryCount--;

      if (retryCount <= 0) {
        console.error(`Failed to perform operation even after ${DEFAULT_MAX_RETRY} attempts.. Throwing origin error..`);
        throw e;
      }
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  } while (retryCount > 0);

  throw new Error(`Retry exceeded MAX_RETRY_DEFAULT=${DEFAULT_MAX_RETRY}`);
}

export function getRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

export function randomUint256(): bigint {
  const bytes = getRandomBytes(32); // 256 bits
  let hex = '';

  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0') ?? '';
  }

  return BigInt(`0x${hex}`);
}

/**
 * Calculate the fee amount as a percentage of the input amount
 * @param {bigint} amount - The amount to calculate the fee for
 * @param {number} percentage - The percentage of the fee in basis points (e.g. 100 = 1%, 10000 = 100%)
 * @returns {bigint} The fee amount
 */
export function calculatePercentageFeeAmount(amount: bigint, percentage: number) {
  // Calculate fee as a percentage of the input amount
  return (amount * BigInt(percentage)) / FEE_PERCENTAGE_SCALE;
}

/**
 * Calculate the fee amount for a given input amount and fee
 * @param {bigint} inputAmount - The amount of input tokens
 * @param {PartnerFee} fee - The fee to calculate
 * @returns {bigint} The fee amount
 */
export function calculateFeeAmount(inputAmount: bigint, fee: PartnerFee | undefined): bigint {
  if (!fee) {
    return 0n;
  }

  invariant(inputAmount > 0n, 'Input amount must be greater than 0');

  let feeAmount = 0n;

  if (isPartnerFeeAmount(fee)) {
    invariant(
      fee.amount >= 0 && fee.amount <= inputAmount,
      `Fee amount must be greater than 0 and less than or equal to the input amount: ${fee.amount}`,
    );
    feeAmount = fee.amount;
  } else if (isPartnerFeePercentage(fee)) {
    invariant(
      fee.percentage >= 0 && fee.percentage <= FEE_PERCENTAGE_SCALE,
      `Fee percentage must be between 0 and ${FEE_PERCENTAGE_SCALE}}`,
    );

    feeAmount = calculatePercentageFeeAmount(inputAmount, fee.percentage);
  }

  return feeAmount;
}

export function BigIntToHex(value: bigint): Hex {
  return `0x${value.toString(16)}`;
}

export function encodeAddress(spokeChainId: SpokeChainId, address: string): Hex {
  switch (spokeChainId) {
    case '0xa86a.avax':
    case '0x2105.base':
    case '0xa.optimism':
    case '0x38.bsc':
    case '0x89.polygon':
    case '0xa4b1.arbitrum':
    case 'sonic':
      return address as Hex;

    case 'injective-1':
      return toHex(Buffer.from(address, 'utf-8'));

    case '0x1.icon':
      return toHex(Buffer.from(address.replace('cx', '01').replace('hx', '00') ?? 'f8', 'hex'));

    case 'sui':
      return toHex(bcs.Address.serialize(address).toBytes());

    case 'solana':
      return toHex(Buffer.from(new PublicKey(address).toBytes()));

    case 'stellar':
      return `0x${Address.fromString(address).toScVal().toXDR('hex')}`;

    default:
      return address as Hex;
  }
}
