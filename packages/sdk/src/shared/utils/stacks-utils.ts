import type { Hex } from 'viem';

// Lazy load @stacks/transactions to avoid Next.js 16 Turbopack scope-hoisting cycle (issue #1070).
// The package is loaded on first stacks operation via dynamic import().
let _stacksTx: typeof import('@stacks/transactions') | undefined;

export async function loadStacksTransactions(): Promise<typeof import('@stacks/transactions')> {
  if (!_stacksTx) {
    _stacksTx = await import('@stacks/transactions');
  }
  return _stacksTx;
}

/** Synchronously access the cached @stacks/transactions module. Throws if not loaded yet. */
export function getStacksTransactions(): typeof import('@stacks/transactions') {
  if (!_stacksTx) {
    throw new Error(
      '@stacks/transactions not loaded. Call await loadStacksTransactions() before sync stacks operations.',
    );
  }
  return _stacksTx;
}

// Fire-and-forget eager preload at module init so synchronous callers (e.g. encodeAddress with
// stacks chain id) find the cache populated by the time they run. The Promise resolves in
// background; module init is non-blocking. If the load is genuinely needed before it completes,
// the throw above gives a clear error message.
void loadStacksTransactions().catch(() => {
  /* swallow — error surfaces at use site */
});

export async function waitForStacksTransaction(txid: string, rpc_url: string): Promise<boolean> {
  const url = `${rpc_url}/extended/v1/tx/${txid}`;

  for (let i = 1; i <= 5; i++) {
    const result = await (await fetch(url)).json();
    console.log('Waiting for transaction to be processed trying again', i);
    if (result.tx_status === 'success') {
      return true;
    }
    if (result.tx_status === 'abort_by_response') {
      console.log('Transaction aborted by response');
      return false;
    }

    if (result.tx_status === 'abort_by_post_condition') {
      console.log('Transaction aborted by post condition');
      return false;
    }

    await sleep(2 * i);
  }
  return false;
}

export function serializeAddressData(address: string): Hex {
  const { Cl, serializeCV } = getStacksTransactions();
  return `0x${serializeCV(Cl.principal(address))}` as Hex;
}

async function sleep(s: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 1000 * s);
  });
}
