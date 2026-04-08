import { encodeAddress } from '@sodax/sdk';

// Server component — runs at SSR prerender during `next build`.
// This exercises the full lazy stacks-loading chain inside SDK:
//   1. SDK module init kicks off fire-and-forget loadStacksTransactions().
//   2. The dynamic await import('@stacks/transactions') resolves on a microtask.
//   3. Sync encodeAddress('stacks', ...) reads the populated cache and returns hex.
// If the lazy path is broken in Turbopack-bundled context, the retry loop exhausts
// and the page renders FAILED, which the build verify script greps for.
export default async function Page() {
  let encoded: string | undefined;
  let attempts = 0;
  let lastError: unknown;
  for (; attempts < 50; attempts++) {
    try {
      encoded = encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
      break;
    } catch (e) {
      lastError = e;
      await new Promise(r => setTimeout(r, 10));
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — stacks lazy path test</h1>
      <p data-testid="encoded">
        encoded: {encoded ?? `FAILED after ${attempts} retries: ${String(lastError)}`}
      </p>
    </main>
  );
}
