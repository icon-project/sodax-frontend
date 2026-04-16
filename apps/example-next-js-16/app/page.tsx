import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';
import * as WalletCore from '@sodax/wallet-sdk-core';
import ClientWalletSection from './_components/ClientWalletSection';

export default function Page() {
  const sdkExports = Object.keys(SDK).length;
  const typesExports = Object.keys(Types).length;
  const walletCoreExports = Object.keys(WalletCore).length;

  // Stacks-specific: encodeAddress sync paths run at SSR render time,
  // proving @sodax/libs/stacks/core loaded without Turbopack crashing.
  const encoded = SDK.encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
  const encodedContract = SDK.encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl');
  const serialized = SDK.serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');

  // Full SDK init at SSR — exercises the full module graph on the server.
  const sdk = new SDK.Sodax();
  const sdkReady = sdk ? 'ok' : 'fail';

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — SDK + providers integration test</h1>
      <p data-testid="sdk-exports">sdkExports: {sdkExports}</p>
      <p data-testid="types-exports">typesExports: {typesExports}</p>
      <p data-testid="wallet-core-exports">walletCoreExports: {walletCoreExports}</p>
      <p data-testid="encoded">encoded: {encoded}</p>
      <p data-testid="encoded-contract">encodedContract: {encodedContract}</p>
      <p data-testid="serialized">serialized: {serialized}</p>
      <p data-testid="sdk">sdk: {sdkReady}</p>

      <hr style={{ margin: '24px 0' }} />
      <ClientWalletSection />
    </main>
  );
}
