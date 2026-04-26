/**
 * SODAX Swap Feature Migration Summary (v1 → v2 SDK)
 * ===================================================
 *
 * React-side migration playbook for moving a swap-feature consumer (e.g. `apps/demo`) from the v1
 * SDK shape (per-chain `*SpokeProvider` instances) to the v2 SDK shape (chain-key + chain-narrowed
 * wallet provider).
 *
 * For the upstream SDK rationale and concept definitions, see:
 *   - `packages/sdk/docs/ARCHITECTURE_REFACTOR_SUMMARY.md` — Concepts 1-6 + types-package breaking
 *     changes.
 *   - `packages/sdk/CHAIN_ID_MIGRATION.md` — full `*_MAINNET_CHAIN_ID` → `ChainKeys.*` mapping table.
 *
 * Diff scope: `sdk-v2-main..HEAD` for `apps/demo/src/{components/solver,components/bitcoin,
 * constants.ts,providers.tsx,zustand/useAppStore.tsx,lib/{utils,chains}.ts}` and
 * `packages/dapp-kit/src/hooks`. Surface-reduction commenting is excluded.
 */

const SUMMARY = String.raw`
# SODAX Swap Feature: v1 → v2 Migration Playbook

## TL;DR

The v2 SDK eliminates per-chain \`*SpokeProvider\` classes and unifies chain identifiers under a single
\`ChainKeys\` namespace. Frontend code that used \`useSpokeProvider\` now passes
\`(srcChainKey, walletProvider)\` directly. Wallet-provider type narrowing flows from the chain key
via \`GetWalletProviderType<K>\`. SDK methods take a discriminated union: \`{ raw: false, walletProvider }\`
for signed execution, \`{ raw: true }\` for raw-tx building. All async SDK methods return
\`Promise<Result<T>>\`; per-module error unions and their type-guards are deleted.

The four mechanical things you need to do:

1. Replace \`*_MAINNET_CHAIN_ID\` constants with \`ChainKeys.*\` (see \`packages/sdk/CHAIN_ID_MIGRATION.md\`).
2. Type renames: \`SpokeChainId\`/\`ChainId\` → \`SpokeChainKey\`; \`Token\` → \`XToken\`; \`xChainId\` → \`chainKey\`.
3. Drop \`useSpokeProvider\`; pass \`(chainKey, walletProvider)\` from \`useWalletProvider(chainKey)\` directly.
4. Add the \`raw: false\` discriminator to every service call shape that previously took
   \`{ intentParams, spokeProvider }\`. New shape: \`{ params, raw: false, walletProvider }\`.

The one new pattern worth understanding: **cast-at-boundary** for chain-narrowing. Where a hook needs
\`IBitcoinWalletProvider\` (or \`IStellarWalletProvider\`) but the consumer holds the broad
\`IWalletProvider | undefined\` from \`useWalletProvider\`, narrow with the chain-key guard at the
binding site:

\`\`\`tsx
const sourceBitcoinWallet =
  src.chain === ChainKeys.BITCOIN_MAINNET
    ? (sourceWalletProvider as GetWalletProviderType<typeof ChainKeys.BITCOIN_MAINNET> | undefined)
    : undefined;
\`\`\`

The cast is local and provably correct given the guard. Don't propagate the cast — use the narrowed
binding everywhere downstream. Alternative: \`walletProvider.chainType === 'BITCOIN'\` is a runtime
discriminator on every \`I*WalletProvider\` (no \`as\` needed) when you don't have the chain key in scope.

## Type / Symbol Rename Cheat Sheet

For full upstream rationale, see \`ARCHITECTURE_REFACTOR_SUMMARY.md\` "Types package: most significant
breaking changes" and Concepts 1, 4. Demo-specific deltas:

### Field-level renames (the easy-to-miss kind)

| Type | Old field | New field | Notes |
|---|---|---|---|
| \`CreateIntentParams<K>\` (request) | \`srcChain\`, \`dstChain\` | \`srcChainKey\`, \`dstChainKey\` | Generic \`K\` carries the literal chain key for inference. |
| \`CreateLimitOrderParams<K>\` (request) | \`srcChain\`, \`dstChain\` | \`srcChainKey\`, \`dstChainKey\` | \`Omit<CreateIntentParams<K>, 'deadline'>\`. |
| \`SubmitSwapTxRequest\` (backend) | \`srcChainId\` | \`srcChainKey\` | \`packages/types/src/backend/backendApi.ts\`. |
| \`Intent\` (read shape) | \`srcChain\`, \`dstChain\` (KEEP) | unchanged | These remain \`IntentRelayChainId\` (bigint). **A blanket grep-replace on \`srcChain\`→\`srcChainKey\` will break Intent reads.** |
| \`XToken\` | \`xChainId\` | \`chainKey\` | Type renamed from \`Token\` → \`XToken\`. |

### Deleted symbols (replace, don't shim)

- \`*SpokeProvider\` classes (\`BitcoinSpokeProvider\`, \`StellarSpokeProvider\`, etc.) and the union
  \`SpokeProvider\` — pass \`(srcChainKey, walletProvider)\` instead.
- \`isBitcoinSpokeProvider(provider)\` — replace with chain-key guard
  (\`chainKey === ChainKeys.BITCOIN_MAINNET\` or \`isBitcoinChainKey(chainKey)\` from \`@sodax/types\`).
- \`hubAssets\` — use \`sodax.config.getOriginalAssetAddress()\` /
  \`sodax.config.getSupportedTokensPerChain()\` instead.
- \`CustomProvider\` (Hana wallet shim) — gone. Window declaration becomes \`unknown\` or imports from
  the wallet vendor directly.
- \`IntentError<Code>\` and the rest of the module-error type-guard family — branch on
  \`error.message\` (e.g. \`'SUBMIT_TX_FAILED'\`) and/or \`error.cause\`. SDK CLAUDE.md "Error message
  convention" has the canonical taxonomy.

### New v2 types worth knowing about (defined in \`@sodax/types\`)

| Type | Purpose |
|---|---|
| \`ChainKeys\` const + \`ChainKey\` union | Replaces 20 individual \`*_MAINNET_CHAIN_ID\` constants. |
| \`GetWalletProviderType<K>\` | Conditional type → chain-specific wallet-provider interface (\`IEvmWalletProvider\`, \`IBitcoinWalletProvider\`, etc.). |
| \`GetChainType<K>\` | Chain-family discriminator (\`'EVM' | 'BITCOIN' | …\`). |
| \`WalletProviderSlot<K, Raw>\` | Discriminated union: \`raw: true\` forbids \`walletProvider\`, \`raw: false\` requires the chain-narrowed one. Defined in \`packages/types/src/common/common.ts\`. |
| \`TxReturnType<K, Raw>\` | Service return shape: \`Raw=false\` → tx-hash string; \`Raw=true\` → chain-specific raw-tx payload. |
| \`DeepPartial<T>\` | Used for \`SodaxConfig\` overrides; \`new Sodax(config?: DeepPartial<SodaxConfig>)\`. |
| \`I*WalletProvider.chainType\` | Each wallet-provider interface now declares a \`readonly chainType: '<CHAIN>'\` literal — usable for runtime narrowing without \`instanceof\`. |

### Other impacts

- \`RpcConfig\` is now keyed by \`ChainKey\` values (\`rpcConfig[ChainKeys.SONIC_MAINNET]\`).
  \`BitcoinRpcConfig\` for Bitcoin (Radfi endpoints), \`StellarRpcConfig\` for Stellar, \`string\` for
  EVM URLs.
- \`IConfigApi\` methods now return \`Promise<Result<T>>\` (every method).
- Bitcoin types live under \`@sodax/types\`'s \`bitcoin\` sub-path (was \`btc\`).
- \`AddressType\` renamed to \`BtcAddressType\` (Bitcoin-specific union: \`'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2TR'\`).

## The Spoke-Provider Elimination Pattern

### v1 (before)

\`\`\`tsx
const sourceWalletProvider = useWalletProvider(sourceChain);
const sourceProvider = useSpokeProvider(sourceChain, sourceWalletProvider);

const { mutateAsync: swap } = useSwap(sourceProvider);
const { approve } = useSwapApprove(intentParams, sourceProvider);
const { data: hasAllowed } = useSwapAllowance(intentParams, sourceProvider);

useStellarTrustlineCheck(token, amount, destProvider, dstChainId);

useTradingWalletBalance(
  src === BITCOIN_MAINNET_CHAIN_ID && isBitcoinSpokeProvider(sourceProvider) ? sourceProvider : undefined,
  tradingAddress,
);

await sodax.swaps.createIntent({ intentParams, spokeProvider: sourceProvider });
await requestTrustline({ token, amount, spokeProvider: destProvider });
\`\`\`

### v2 (after)

\`\`\`tsx
const sourceWalletProvider = useWalletProvider(sourceChain);   // no shim
const destWalletProvider   = useWalletProvider(destChain);

const { mutateAsync: swap } = useSwap(sourceChain, sourceWalletProvider);
const { approve } = useSwapApprove(intentParams, sourceChain, sourceWalletProvider);
const { data: hasAllowed } = useSwapAllowance(intentParams, sourceChain, sourceWalletProvider);

useStellarTrustlineCheck(
  token,
  amount,
  intentParams?.dstChainKey,                                     // chainId moved before walletProvider
  dst === ChainKeys.STELLAR_MAINNET
    ? (destWalletProvider as GetWalletProviderType<typeof ChainKeys.STELLAR_MAINNET> | undefined)
    : undefined,
);

const sourceBitcoinWallet =
  src === ChainKeys.BITCOIN_MAINNET
    ? (sourceWalletProvider as GetWalletProviderType<typeof ChainKeys.BITCOIN_MAINNET> | undefined)
    : undefined;
useTradingWalletBalance(sourceBitcoinWallet, tradingAddress);

// Discriminator + chain-narrowed wallet provider:
await sodax.swaps.createIntent({ params: intentParams, raw: false, walletProvider: sourceWalletProvider });

await requestTrustline({
  token,
  amount,
  srcChainKey: dstChain as StellarChainKey,
  walletProvider: destWalletProvider as IStellarWalletProvider,
});
\`\`\`

The mechanism (Concepts 1 + 3): \`CreateIntentParams<K>\` carries the literal chain key as a generic;
\`SwapService.swap<K>\` accepts \`SwapActionParams<K, false>\`, which intersects with
\`WalletProviderSlot<K, false> = { raw: false; walletProvider: GetWalletProviderType<K> }\`. With \`K\`
flowing from the call-site literal, TypeScript narrows the wallet-provider parameter to the
chain-specific interface.

## Dapp-kit Hook API Contract (v2)

The exact signatures live in source — link rather than transcribe so this doc doesn't drift:

- \`packages/dapp-kit/src/hooks/swap/useSwap.ts\` — generic \`<K extends SpokeChainKey>\`, takes \`(srcChainKey, walletProvider)\`, mutation input is \`CreateIntentParams\`.
- \`packages/dapp-kit/src/hooks/swap/useSwapApprove.ts\` — generic \`<K>\`, takes \`(params, srcChainKey, walletProvider)\`, returns \`{ approve, isLoading, error, resetError }\`.
- \`packages/dapp-kit/src/hooks/swap/useSwapAllowance.ts\` — generic \`<K>\`, takes \`(params, srcChainKey, walletProvider)\`, polls every 2s.
- \`packages/dapp-kit/src/hooks/swap/useCreateLimitOrder.ts\` — generic \`<K>\`, same shape as \`useSwap\`.
- \`packages/dapp-kit/src/hooks/swap/useCancelLimitOrder.ts\` and \`.../useCancelSwap.ts\` — **no hook-time params**. The mutation input is \`CancelLimitOrderParams<K>\` / \`CancelIntentParams<K>\` carrying \`{ srcChainKey: K, walletProvider: GetWalletProviderType<K>, intent }\`. Per-call generic — pass the narrowed key + wallet at the cancel site.
- \`packages/dapp-kit/src/hooks/shared/useStellarTrustlineCheck.ts\` — \`(token, amount, chainId, walletProvider: IStellarWalletProvider | undefined)\`. The chain-id arg moved before wallet-provider in v2.
- \`packages/dapp-kit/src/hooks/shared/useRequestTrustline.ts\` — mutation input is \`{ token, amount, srcChainKey: StellarChainKey, walletProvider: IStellarWalletProvider }\`.
- \`packages/dapp-kit/src/hooks/bitcoin/*\` — every Bitcoin hook (\`useRadfiAuth\`, \`useRadfiSession\`, \`useTradingWalletBalance\`, \`useFundTradingWallet\`, \`useExpiredUtxos\`, \`useRenewUtxos\`, \`useRadfiWithdraw\`) takes \`walletProvider: IBitcoinWalletProvider | undefined\` directly. Note the asymmetry: \`useFundTradingWallet\` mutation input is \`bigint\` (sat amount), but \`useRadfiWithdraw\` mutation input is \`{ amount: string; tokenId: string; withdrawTo: string }\` — \`amount\` is a string here, not a bigint.

## Worked Example: full \`handleSubmitTxSwap\` migration

**Before (v1):**

\`\`\`tsx
const handleSubmitTxSwap = async (intentOrderPayload: CreateIntentParams) => {
  if (!sourceProvider) return;

  const createIntentResult = await sodax.swaps.createIntent({
    intentParams: intentOrderPayload,
    spokeProvider: sourceProvider,
  });
  if (!createIntentResult.ok) return;

  const [spokeTxHash, intent, relayData] = createIntentResult.value;

  const swapIntentData: SwapIntentData = {
    /* … */
    srcChain: Number(intent.srcChain),
    dstChain: Number(intent.dstChain),
  };

  const request: SubmitSwapTxRequest = {
    txHash: spokeTxHash,
    srcChainId: sourceChain,                          // v1 field name
    walletAddress: sourceAccount.address ?? '',
    intent: swapIntentData,
    relayData,
  };
  await submitSwapTx(request);
};
\`\`\`

**After (v2):**

\`\`\`tsx
const handleSubmitTxSwap = async (intentOrderPayload: CreateIntentParams) => {
  if (!sourceWalletProvider) return;

  // sourceWalletProvider is IWalletProvider | undefined here. createIntent accepts it as the
  // walletProvider slot because K defaults to the broad SpokeChainKey union, which makes
  // GetWalletProviderType<K> resolve to the IWalletProvider union — assignable from itself.
  // For tighter narrowing, apply the cast-at-boundary pattern (above) before this handler.
  const createIntentResult = await sodax.swaps.createIntent({
    params: intentOrderPayload,
    raw: false,                                       // discriminator: signed execution
    walletProvider: sourceWalletProvider,
  });
  if (!createIntentResult.ok) return;

  const [spokeTxHash, intent, relayData] = createIntentResult.value;
  // spokeTxHash: TxReturnType<K, false> — string for raw=false (EVM hash, Solana sig, etc.)

  const swapIntentData: SwapIntentData = {
    /* … */
    srcChain: Number(intent.srcChain),                // Intent.srcChain unchanged (relay chain id)
    dstChain: Number(intent.dstChain),
  };

  const request: SubmitSwapTxRequest = {
    txHash: spokeTxHash as string,                    // narrow the union
    srcChainKey: src.chain,                           // v2 field name
    walletAddress: sourceAccount.address ?? '',
    intent: swapIntentData,
    relayData,
  };
  await submitSwapTx(request);
};
\`\`\`

The four meaningful diffs:
1. \`sourceProvider\` → \`sourceWalletProvider\` (no \`.walletProvider\` access).
2. \`{ intentParams, spokeProvider }\` → \`{ params, raw: false, walletProvider }\`.
3. \`SubmitSwapTxRequest.srcChainId\` → \`srcChainKey\`.
4. \`spokeTxHash\` is \`TxReturnType<K, Raw>\` — narrow with \`as string\` when \`Raw\` is \`false\`.

The \`Intent\` literal's \`srcChain\`/\`dstChain\` field names are **unchanged**.

## Per-file Migration Checklist (apps/demo)

These files are independent — migrate in any order. Only \`providers.tsx\` must be done before
runtime smoke-test (config wiring).

- **\`components/solver/SwapCard.tsx\`** — biggest churn. Drop \`useSpokeProvider\`. Apply field renames on \`CreateIntentParams\`. Add \`raw: false\` to \`createIntent\`. Replace \`isBitcoinSpokeProvider\` with chain-key guard. Replace \`destProvider instanceof StellarSpokeProvider\` with \`destChain === ChainKeys.STELLAR_MAINNET\` guard. Narrow \`spokeTxHash\` with \`as string\` for \`SubmitSwapTxRequest.txHash\`. (Demo also collapsed \`{sourceChain, sourceToken}\` and \`{destChain, destToken}\` into \`{src, dst}\` records — a UX-side cleanup, not a migration requirement.)
- **\`components/solver/LimitOrderCard.tsx\`** — same patterns as SwapCard, no backend submit-tx.
- **\`components/solver/LimitOrderItem.tsx\`** — gotcha: the \`Intent\` object literal you build for \`cancelLimitOrder\` keeps \`srcChain\`/\`dstChain\` (those are \`IntentRelayChainId\` bigints, not chain keys). Method renamed: \`sodax.config.getSpokeChainIdFromIntentRelayChainId\` → \`getSpokeChainKeyFromIntentRelayChainId\`. The mutation input is \`{ intent, srcChainKey, walletProvider }\`.
- **\`components/solver/SelectChain.tsx\`, \`LimitOrderList.tsx\`** — pure type renames (\`SpokeChainId\` → \`SpokeChainKey\`).
- **\`components/bitcoin/BitcoinSetupPanel.tsx\`** — prop rename \`spokeProvider: BitcoinSpokeProvider\` → \`walletProvider: IBitcoinWalletProvider\`. Internal Radfi calls go through \`sodax.spokeService.bitcoinSpokeService.radfi.*\` (singleton owned by \`Sodax\`), not via the per-component provider.
- **\`providers.tsx\`** — \`SodaxProvider\`'s \`config\` prop becomes \`DeepPartial<SodaxConfig>\`. Solver endpoints move from \`SodaxConfig.swaps\` to \`SodaxConfig.solver\`. (This is the easy-to-miss config-shape pitfall — \`swaps\` is now \`SwapsConfig\` for supported-tokens-per-chain; \`solver\` is the endpoint/contract config.)
- **\`zustand/useAppStore.tsx\`** — \`ChainId\` → \`SpokeChainKey\`; replace string-literal default (\`'stacks'\`) with a typed \`ChainKeys.X\` constant.
- **\`constants.ts\`, \`lib/chains.ts\`** — chain-ID constant migration (mechanical). \`type CustomProvider\` → \`unknown\` in window declaration.
- **\`lib/utils.ts\`** — drop \`hubAssets\` import; any helper that walked \`hubAssets[chainId]\` for vault lookup must move to \`sodax.config\` lookups.

## New Patterns Worth Knowing

### Pattern: Single-object \`{ chain, token }\` state per side

Demo collapsed four \`useState\` calls (\`sourceChain\`, \`destChain\`, \`sourceToken\`, \`destToken\`) into
two \`{ chain, token }\` records (\`src\`, \`dst\`). Direction-swap is \`setSrc(dst); setDst(src);\`. The
chain-token coupling (resetting token when chain changes) is enforced at the setter call:

\`\`\`tsx
setSrc({ chain: chainId, token: getSupportedSolverTokens(chainId)[0] });
\`\`\`

### Pattern: \`Result<T>\` unwrap helper for backend hooks

Two distinct semantics — pick consciously per hook:

- **Throw on \`!ok\`** (default for mutations and required-data queries): use the \`unwrapResult\` helper at \`packages/dapp-kit/src/hooks/backend/unwrapResult.ts\`. Applied in \`useBackendAllMoneyMarketAssets\`, \`useBackendMoneyMarketAsset\`, \`useBackendMoneyMarketPosition\`, \`useBackendSubmitSwapTx\`, \`useBackendSubmitSwapTxStatus\`.
- **Return \`undefined\` on \`!ok\`** (soft-miss, e.g. not-yet-relayed intent): used in \`useBackendIntentByHash\`, \`useBackendIntentByTxHash\`. The query then resolves with \`undefined\` rather than throwing.

## Pitfalls

1. **Over-broad regex on \`srcChain\`/\`dstChain\`** — request types renamed, \`Intent\` (read shape) didn't. Distinguish "I'm building a request" from "I'm reading an intent."
2. **Casting wallet provider at the wrong site** — apply the cast next to the chain-key guard, not deep inside event handlers. The narrowed binding should flow downstream; don't repeat the cast.
3. **Forgetting \`raw: false\`** — without the discriminator field, TypeScript can't pick the signed branch of \`WalletProviderSlot\`, and \`walletProvider\` is rejected as \`?: never\`. Error message: \`Object literal may only specify known properties, and 'walletProvider' does not exist in type ...\`.
4. **\`isBitcoinSpokeProvider(provider)\`** — replace with chain-key compares (\`chainKey === ChainKeys.BITCOIN_MAINNET\`) or \`isBitcoinChainKey(chainKey)\` from \`@sodax/types\`. Same for \`destProvider instanceof StellarSpokeProvider\` → chain-key compare.
5. **\`Intent.deadline\` is \`bigint\`** — \`Math.floor(Date.now() / 1000) + 60 * 5\` returns a number; wrap in \`BigInt(...)\`.
6. **\`IntentResponse\` from backend has \`srcChain\`/\`dstChain\` as relay chain id (number)**, not chain keys. Convert via \`sodax.config.getSpokeChainKeyFromIntentRelayChainId(BigInt(intent.dstChain))\` when displaying as a chain key.
7. **\`spokeTxHash\` typing in tuples** — \`createIntent({ raw: false, ... })\` returns \`[TxReturnType<K, false>, Intent, Hex]\`. The first element is a discriminated union over \`Raw\`; narrow with \`as string\` at the boundary where the consumer expects a plain string (e.g. \`SubmitSwapTxRequest.txHash\`).
8. **\`hubAssets\` is gone** — anything that walked \`hubAssets[chainId]\` for vault lookup must move to \`sodax.config\` (\`getOriginalAssetAddress\`, \`getSupportedTokensPerChain()\`).
9. **\`SodaxConfig.swaps\` vs \`.solver\`** — \`swaps\` is the \`SwapsConfig\` listing supported solver tokens per chain. \`solver\` holds endpoint/contract addresses (\`{ intentsContract, solverApiEndpoint, protocolIntentsContract }\`). The v1 demo passed solver endpoints under \`swaps\`; v2 requires the \`solver\` field. Don't put endpoints under \`swaps\`.
10. **\`CustomProvider\` window typedecl** — gone. Type as \`unknown\` or import directly from the wallet vendor.

## Verification Recipe

When migrating a swap-feature consumer:

1. \`pnpm -C packages/dapp-kit run build\` — must produce ESM + CJS + DTS. Failures are usually stale \`SpokeProvider\`-typed imports inside dapp-kit hooks, not consumer issues.
2. \`pnpm -C apps/<your-app> run checkTs\` — fix in this order **per file** (independent across files, sequential within each):
   - Mechanical chain-key constant renames first (\`*_MAINNET_CHAIN_ID\` → \`ChainKeys.*\`).
   - Type renames (\`SpokeChainId\` → \`SpokeChainKey\`, \`Token\` → \`XToken\`, \`xChainId\` → \`chainKey\`).
   - Drop \`useSpokeProvider\` callsites; switch to \`(chainKey, walletProvider)\` arguments.
   - Add the \`raw: false\` field to every service call shape that previously took \`{ intentParams, spokeProvider }\`.
   - Apply the cast-at-boundary pattern for Bitcoin / Stellar / EVM-specific helpers.
3. \`pnpm -C apps/<your-app> run build\` — Vite/Rollup will catch any runtime-string \`*_CHAIN_ID\` reference (e.g. inside config) that the typechecker missed because it was being read as a generic \`string\`.
4. **Manual smoke test in dev** — connect a wallet, hit \`/swap\` (or your route), verify approve → submit → status flow end-to-end. The TypeScript checker can't tell you if your runtime narrowing guards are correct.

## Out-of-scope

\`apps/web\` consumes \`useSpokeProvider\` in **18 live call sites across 16 files** (stake, save, pool,
partner-dashboard, migrate, \`hooks/useTokenSupplyBalances.ts\`). Not part of this migration; will fail
to typecheck once the deprecated shim is finally deleted from dapp-kit. The migration pattern is
identical to the demo's: remove \`useSpokeProvider(chainKey, walletProvider)\` and pass
\`(chainKey, walletProvider)\` directly to the corresponding feature hook.
`;

export default SUMMARY;
