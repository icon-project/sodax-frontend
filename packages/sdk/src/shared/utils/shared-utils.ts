import invariant from 'tiny-invariant';
import { isPartnerFeeAmount, isPartnerFeePercentage } from '../guards.js';
import {
  type SpokeChainKey,
  type Hex,
  getChainType,
  DEFAULT_MAX_RETRY,
  DEFAULT_RETRY_DELAY_MS,
  FEE_PERCENTAGE_SCALE,
  type PartnerFee,
  type QuoteType,
} from '@sodax/types';
import { hexToBytes, toHex } from 'viem';
import { bcs } from '@mysten/sui/bcs';
import { PublicKey } from '@solana/web3.js';
import { Address as StellarAddress, xdr } from '@stellar/stellar-sdk';
import { Cl, cvToString, deserializeCV, serializeCV } from '@stacks/transactions';

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

/**
 * Adjust the amount by the fee amount based on the quote type
 * @param {bigint} amount - The amount to adjust
 * @param {PartnerFee | undefined} fee - The fee to adjust
 * @param {QuoteType} quoteType - The quote type
 * @returns {bigint} The adjusted amount
 */
export function adjustAmountByFee(amount: bigint, fee: PartnerFee | undefined, quoteType: QuoteType): bigint {
  invariant(amount > 0n, 'Amount must be greater than 0');
  invariant(quoteType === 'exact_input', 'Invalid quote type');

  if (quoteType === 'exact_input') {
    return amount - calculateFeeAmount(amount, fee);
  }

  throw new Error('Invalid quote type');
}

export function BigIntToHex(value: bigint): Hex {
  return `0x${value.toString(16)}`;
}

export function encodeAddress(spokeChainId: SpokeChainKey, address: string): Hex {
  const chainType = getChainType(spokeChainId);
  switch (chainType) {
    case 'EVM':
      return address as Hex;
    case 'ICON':
      return toHex(Buffer.from(address.replace('cx', '01').replace('hx', '00') ?? 'f8', 'hex'));
    case 'SUI':
      return toHex(bcs.Address.serialize(address).toBytes());
    case 'SOLANA':
      return toHex(Buffer.from(new PublicKey(address).toBytes()));
    case 'STELLAR':
      return `0x${StellarAddress.fromString(address).toScVal().toXDR('hex')}`;
    case 'STACKS':
      return `0x${serializeCV(Cl.principal(address))}`;
    case 'BITCOIN':
    case 'NEAR':
    case 'INJECTIVE':
      return toHex(Buffer.from(address, 'utf-8'));
    default: {
      const exhaustiveCheck: never = chainType;
      throw new Error(`Invalid spoke chain id: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Decode a hub-style hex address produced by {@link encodeAddress} back to the chain-native string form.
 */
export function reverseEncodeAddress(spokeChainId: SpokeChainKey, encoded: Hex): string {
  const chainType = getChainType(spokeChainId);
  switch (chainType) {
    case 'EVM':
      return encoded;
    case 'ICON': {
      const raw = encoded.startsWith('0x') ? encoded.slice(2) : encoded;
      if (raw.length !== 42) {
        throw new Error(
          `Invalid ICON encoded address length: expected 21 bytes (42 hex chars), got ${raw.length / 2} bytes`,
        );
      }
      const version = raw.slice(0, 2);
      const body = raw.slice(2);
      if (version === '00') {
        return `hx${body}`;
      }
      if (version === '01') {
        return `cx${body}`;
      }
      throw new Error(`Invalid ICON address version byte: 0x${version}`);
    }
    case 'SUI':
      return bcs.Address.parse(hexToBytes(encoded));
    case 'SOLANA':
      return new PublicKey(hexToBytes(encoded)).toBase58();
    case 'STELLAR': {
      const rawHex = encoded.startsWith('0x') ? encoded.slice(2) : encoded;
      const scVal = xdr.ScVal.fromXDR(rawHex, 'hex');
      return StellarAddress.fromScVal(scVal).toString();
    }
    case 'STACKS': {
      const rawHex = encoded.startsWith('0x') ? encoded.slice(2) : encoded;
      const cv = deserializeCV(hexToBytes(`0x${rawHex}`));
      return cvToString(cv);
    }
    case 'BITCOIN':
    case 'NEAR':
    case 'INJECTIVE':
      return Buffer.from(hexToBytes(encoded)).toString('utf8');
    default: {
      const exhaustiveCheck: never = chainType;
      throw new Error(`Invalid spoke chain id: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Convert a valid hexadecimal string (with or without "0x") to BigInt.
 * Throws on invalid hex.
 */
export function hexToBigInt(hex: string): bigint {
  const trimmed = hex.trim().toLowerCase();

  // Validate hex: only digits 0-9 and letters a-f, optional 0x prefix
  const isValid = /^(0x)?[0-9a-f]+$/.test(trimmed);
  if (!isValid) {
    throw new Error(`Invalid hex string: "${hex}"`);
  }

  // Normalize with 0x prefix to make BigInt parse it as hexadecimal
  const normalized = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  return BigInt(normalized);
}

export function parseToStroops(amount: string): bigint {
  // Scale decimal string to integer stroops (1e7 multiplier)
  return BigInt(Math.round(Number.parseFloat(amount) * 1e7));
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
