import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';
import * as WalletCore from '@sodax/wallet-sdk-core';
export default function Page() {
  const sdkExports = Object.keys(SDK).length;
  const typesExports = Object.keys(Types).length;
  const walletCoreExports = Object.keys(WalletCore).length;


  // Stacks-specific: encodeAddress sync paths
  const encoded = SDK.encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
  const encodedContract = SDK.encodeAddress('stacks', 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl');
  const serialized = SDK.serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');

  // Full SDK init
  const sdk = new SDK.Sodax();
  const sdkReady = sdk ? 'ok' : 'fail';

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — full SDK integration test</h1>
      <p data-testid="sdk-exports">sdkExports: {sdkExports}</p>
      <p data-testid="types-exports">typesExports: {typesExports}</p>
      <p data-testid="wallet-core-exports">walletCoreExports: {walletCoreExports}</p>
      <p data-testid="encoded">encoded: {encoded}</p>
      <p data-testid="encoded-contract">encodedContract: {encodedContract}</p>
      <p data-testid="serialized">serialized: {serialized}</p>
      <p data-testid="sdk">sdk: {sdkReady}</p>
    </main>
  );
}
