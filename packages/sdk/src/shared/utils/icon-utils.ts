import type { HttpUrl } from '@sodax/types';
import type { IconRawTransaction } from '../types.js';
import { hexToBigInt } from './shared-utils.js';

export async function estimateStepCost(rawTx: IconRawTransaction, debugRpcUrl: HttpUrl): Promise<bigint> {
  try {
    const tmpRawTx = { ...rawTx };
    delete tmpRawTx['stepLimit'];

    const response = await fetch(debugRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'debug_estimateStep',
        id: 1234,
        params: tmpRawTx,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch step cost: ${response.statusText}`);
    }

    const data = await response.json();

    return hexToBigInt(data.result);
  } catch (e) {
    console.error('estimateStepCost error:', e);
    throw e;
  }
}
