import type { Hex } from 'viem';

export function getIconAddressBytes(address: string): Hex {
  return `0x${Buffer.from(address.replace('cx', '01').replace('hx', '00') ?? 'f8', 'hex').toString('hex')}`;
}
