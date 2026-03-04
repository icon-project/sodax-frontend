// Utility to extract a transaction hash from SDK mutation results.
// Handles different response formats: direct hash fields, or Money Market's [spokeTxHash, hubTxHash] array pattern.

export function extractTxHash(result: unknown): `0x${string}` | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  const directCandidate =
    (result as { txHash?: `0x${string}`; hash?: `0x${string}` }).txHash ??
    (result as { txHash?: `0x${string}`; hash?: `0x${string}` }).hash;

  if (typeof directCandidate === 'string' && directCandidate.startsWith('0x')) {
    return directCandidate;
  }

  // Money Market pattern: { ok: true, value: [spokeTxHash, hubTxHash] }
  if ('value' in result) {
    const value = (result as { value?: unknown }).value;
    if (Array.isArray(value)) {
      const [spokeTxHash, hubTxHash] = value as [unknown, unknown];

      if (typeof spokeTxHash === 'string' && spokeTxHash.startsWith('0x')) {
        return spokeTxHash as `0x${string}`;
      }

      if (typeof hubTxHash === 'string' && hubTxHash.startsWith('0x')) {
        return hubTxHash as `0x${string}`;
      }
    }
  }

  return undefined;
}
