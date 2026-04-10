import { encodeAddress, serializeAddressData, Sodax, StacksRawSpokeProvider } from '@sodax/sdk';
import { spokeChainConfig, STACKS_MAINNET_CHAIN_ID } from '@sodax/types';
import type { StacksSpokeChainConfig } from '@sodax/types';

// Server component — runs at SSR prerender during `next build`.
// Verifies that @stacks/transactions bundled into SDK dist does not
// trigger Turbopack scope-hoisting cycle (#1070).
export default function Page() {
  // 1. Sync: encodeAddress with stacks standard principal
  const encoded = encodeAddress('stacks', 'SP000000000000000000002Q6VF78');

  // 2. Sync: encodeAddress with stacks contract principal (full)
  const encodedContract = encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl');

  // 3. Sync: encodeAddress with just the address part (no contract name)
  const encodedAddressOnly = encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0');

  // 4. Sync: serializeAddressData directly
  const serialized = serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');

  // 5. Full SDK init: forces entire module graph to load
  const sdk = new Sodax();
  const sdkReady = sdk ? 'ok' : 'fail';

  // 6. StacksRawSpokeProvider instantiation (uses @stacks/network)
  const stacksConfig = spokeChainConfig[STACKS_MAINNET_CHAIN_ID] as StacksSpokeChainConfig;
  const provider = new StacksRawSpokeProvider('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX', stacksConfig);
  const providerReady = provider ? 'ok' : 'fail';

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — stacks integration test</h1>
      <p data-testid="encoded">encoded: {encoded}</p>
      <p data-testid="encoded-contract">encodedContract: {encodedContract}</p>
      <p data-testid="encoded-address-only">encodedAddressOnly: {encodedAddressOnly}</p>
      <p data-testid="serialized">serialized: {serialized}</p>
      <p data-testid="sdk">sdk: {sdkReady}</p>
      <p data-testid="provider">provider: {providerReady}</p>
    </main>
  );
}
