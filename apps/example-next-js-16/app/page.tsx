import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';

// Server component — runs at SSR prerender during `next build`.
// Imports entire SDK + types namespace to catch any Turbopack scope-hoisting
// cycle from any dependency, not just @stacks/transactions (#1070).
export default function Page() {
  // 1. Full namespace import forces Turbopack to resolve all SDK exports
  const sdkExports = Object.keys(SDK).length;
  const typesExports = Object.keys(Types).length;

  // 2. Stacks-specific: encodeAddress sync paths
  const encoded = SDK.encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
  const encodedContract = SDK.encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl');
  const encodedAddressOnly = SDK.encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0');
  const serialized = SDK.serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');

  // 3. SDK init: loads entire module graph (all spoke providers, services)
  const sdk = new SDK.Sodax();
  const sdkReady = sdk ? 'ok' : 'fail';

  // 4. StacksRawSpokeProvider instantiation (uses @stacks/network)
  const stacksConfig = Types.spokeChainConfig[Types.STACKS_MAINNET_CHAIN_ID] as Types.StacksSpokeChainConfig;
  const provider = new SDK.StacksRawSpokeProvider('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX', stacksConfig);
  const providerReady = provider ? 'ok' : 'fail';

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — SDK integration test</h1>
      <p data-testid="sdk-exports">sdkExports: {sdkExports}</p>
      <p data-testid="types-exports">typesExports: {typesExports}</p>
      <p data-testid="encoded">encoded: {encoded}</p>
      <p data-testid="encoded-contract">encodedContract: {encodedContract}</p>
      <p data-testid="encoded-address-only">encodedAddressOnly: {encodedAddressOnly}</p>
      <p data-testid="serialized">serialized: {serialized}</p>
      <p data-testid="sdk">sdk: {sdkReady}</p>
      <p data-testid="provider">provider: {providerReady}</p>
    </main>
  );
}
