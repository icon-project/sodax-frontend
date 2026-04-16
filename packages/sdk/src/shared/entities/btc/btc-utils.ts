import type { BtcAddressType } from '@sodax/types';
import type { BtcPayload } from '../../services/spoke/BitcoinSpokeService.js';

/**
 * Estimate transaction size in vbytes.
 * @param addressType — caller's address type for accurate per-input weight.
 *   P2PKH ≈ 148 vB, P2SH-P2WPKH ≈ 91 vB, P2WPKH ≈ 68 vB, P2TR ≈ 58 vB.
 *   Defaults to P2WPKH (68 vB) when omitted.
 */
export function estimateBitcoinTxSize(inputCount: number, outputCount: number, addressType?: BtcAddressType): number {
  // 10.5 vB fixed overhead
  // +44 vB for one OP_RETURN (~33-byte payload), not included in outputCount
  // 31 vB per non-OP_RETURN output
  let inputWeight: number;
  switch (addressType) {
    case 'P2PKH':
      inputWeight = 148;
      break;
    case 'P2SH':
      inputWeight = 91;
      break;
    case 'P2TR':
      inputWeight = 58;
      break;
    default:
      inputWeight = 68;
      break;
  }
  return Math.ceil(10.5 + 44 + inputCount * inputWeight + outputCount * 31);
}

export function encodeBtcPayloadToBytes(payload: BtcPayload): string {
  return JSON.stringify({
    src_address: payload.src_address.toLowerCase(),
    data: payload.data.toLowerCase(),
    src_chain_id: payload.src_chain_id,
    dst_chain_id: payload.dst_chain_id,
    wallet_used: payload.wallet_used,
    timestamp: payload.timestamp,
    address_type: payload.address_type,
  });
}

/**
 * Normalize a signed PSBT to base64 format.
 * Unisat/OKX wallets return hex, Xverse returns base64.
 * Radfi API expects base64.
 */
export function normalizePsbtToBase64(signedPsbt: string): string {
  const isHex = /^[0-9a-fA-F]+$/.test(signedPsbt);
  return isHex ? Buffer.from(signedPsbt, 'hex').toString('base64') : signedPsbt;
}
