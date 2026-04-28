import type { BitcoinXConnector } from './BitcoinXConnector.js';

/** Bitcoin connectors that support BIP-322 message signing (Unisat, Xverse, OKX). */
export function hasSignBip322(
  c: BitcoinXConnector,
): c is BitcoinXConnector & { signBip322Message(msg: string): Promise<string> } {
  return 'signBip322Message' in c && typeof c.signBip322Message === 'function';
}

/** Bitcoin connectors that support legacy ECDSA message signing. */
export function hasSignEcdsa(
  c: BitcoinXConnector,
): c is BitcoinXConnector & { signEcdsaMessage(msg: string): Promise<string> } {
  return 'signEcdsaMessage' in c && typeof c.signEcdsaMessage === 'function';
}
