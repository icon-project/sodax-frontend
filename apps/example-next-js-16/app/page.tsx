import { encodeAddress, loadStacksTransactions } from '@sodax/sdk';

// Server component — runs at SSR prerender during `next build`.
// Exercises BOTH stacks code paths through Turbopack's bundle:
//
//   (A) Sync encodeAddress('stacks', …)
//       Now dependency-free (inline c32check + Clarity principal serialize).
//       Verifies the sync path no longer needs @stacks/transactions at all.
//
//   (B) Async loadStacksTransactions()
//       The lazy `await import('@stacks/transactions')` used by
//       StacksSpokeProvider/Service for real on-chain operations. Verifies
//       Turbopack can actually code-split and resolve that dynamic import at
//       runtime — the original failure mode in #1070.
//
// verify-build.mjs greps the rendered HTML for both markers below.
export default async function Page() {
  // (A) sync path
  let syncEncoded: string;
  try {
    syncEncoded = encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
  } catch (e) {
    syncEncoded = `SYNC_FAILED: ${String(e)}`;
  }

  // (B) async lazy path — re-serialize via the real @stacks/transactions module
  let asyncEncoded: string;
  try {
    const m = await loadStacksTransactions();
    asyncEncoded = `0x${m.serializeCV(m.Cl.principal('SP000000000000000000002Q6VF78'))}`;
  } catch (e) {
    asyncEncoded = `ASYNC_FAILED: ${String(e)}`;
  }

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — stacks paths test</h1>
      <p data-testid="sync-encoded">sync: {syncEncoded}</p>
      <p data-testid="async-encoded">async: {asyncEncoded}</p>
    </main>
  );
}
