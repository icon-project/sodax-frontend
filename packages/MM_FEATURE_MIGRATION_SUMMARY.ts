/**
 * SODAX Money Market Feature Migration Summary (v1 → v2 SDK)
 * ==========================================================
 *
 * React-side migration playbook for moving a money-market consumer (e.g. `apps/demo`) from the v1
 * SDK shape (per-chain `*SpokeProvider` instances, global `moneyMarketSupportedTokens` map,
 * `MoneyMarketError<Code>` typed errors) to the v2 SDK shape (chain-key + chain-narrowed wallet
 * provider, `XToken.vault`/`hubAsset` baked in, `Result<[SpokeTxHash, HubTxHash]>` returns).
 *
 * Sibling playbook: `packages/SWAP_FEATURE_MIGRATION_SUMMARY.ts` covers the swap-side migration and
 * the underlying SDK refactor concepts. Read it first if you haven't — most of the spoke-provider
 * elimination logic, cast-at-boundary pattern, and `*_MAINNET_CHAIN_ID` → `ChainKeys.*` mapping
 * already applies. This document captures only the **MM-specific** deltas.
 *
 * For upstream rationale, see:
 *   - `packages/sdk/docs/ARCHITECTURE_REFACTOR_SUMMARY.md` — Concepts 1-6.
 *   - `packages/sdk/CHAIN_ID_MIGRATION.md` — `*_MAINNET_CHAIN_ID` → `ChainKeys.*` table.
 *   - `packages/SWAP_FEATURE_MIGRATION_SUMMARY.ts` — sibling migration this complements.
 *
 * Diff scope: `apps/demo/src/{App.tsx,components/shared/{ChainSelector,header}.tsx,
 *   components/mm/**,hooks/{useReserveMetrics,useSodaxScanMessageUrl}.ts,
 *   lib/{utils,borrowUtils}.ts,pages/money-market/page.tsx}` and a peer review of
 *   `packages/dapp-kit/src/hooks/mm/`.
 */

const SUMMARY = String.raw`
# SODAX Money Market Feature: v1 → v2 Migration Playbook

## TL;DR

The v2 MM hooks adopt the same **hook-time closure pattern** as \`useSwap\`: the source
\`chainKey\` and \`walletProvider\` are captured at the hook call site, and the mutation input
shrinks to \`{ params, skipSimulation?, timeout? }\`. The mutation \`data\` is the SDK's
\`Result<[SpokeTxHash, HubTxHash]>\` returned **as-is** — branch on \`data?.ok\` at the call site;
**do not throw** on SDK-level failures. \`MoneyMarketParams<K>\` now requires \`srcChainKey\` and
\`srcAddress\` in every action params object.

The seven mechanical things you need to do:

1. Replace \`useSpokeProvider(chainKey, walletProvider)\` with the wallet provider directly. Drop
   the \`spokeProvider\` field from every params object you build.
2. Add \`srcChainKey\` and \`srcAddress\` to every \`MoneyMarketSupplyParams\` /
   \`MoneyMarketBorrowParams\` / \`MoneyMarketWithdrawParams\` / \`MoneyMarketRepayParams\`.
3. Convert hook calls: \`useSupply()\` → \`useSupply(srcChainKey, walletProvider)\`. Same shape
   for borrow / withdraw / repay / approve. **\`useMMApprove\` does NOT take \`params\` at
   hook-time** (this differs from \`useSwapApprove\`).
4. Drop \`MoneyMarketError<Code>\` and \`RelayErrorCode\` from mutation generics; type errors as
   plain \`Error\`. The CODE moved from \`error.code\` to \`error.message\`.
5. Rename data-hook param fields: \`{ spokeProvider, address }\` → \`{ spokeChainKey, userAddress }\`.
6. Replace the deleted \`moneyMarketSupportedTokens\` map with
   \`sodax.moneyMarket.getSupportedTokensByChainId(chainKey)\` (chain-scoped) or
   \`sodax.moneyMarket.getSupportedTokens()\` (full chain-keyed map). Source \`sodax\` from
   \`useSodaxContext\`.
7. Rename \`XToken.xChainId\` → \`XToken.chainKey\` in every read site, including helper functions
   that walked \`hubAssets[token.xChainId]\` — vault and hub-asset addresses now live directly on
   \`XToken.vault\` / \`XToken.hubAsset\`.

## MM-specific divergences from the swap migration

The swap playbook has four traps that **do not apply** to MM. Tripping over them will produce
TypeScript errors with no runtime equivalent. Read each line below carefully:

1. **No \`raw: false\` discriminator on MM service methods.** Unlike \`sodax.swaps.swap\`,
   \`sodax.moneyMarket.supply\` (and borrow / withdraw / repay / approve) do **not** accept a
   \`WalletProviderSlot\` discriminator. Raw mode is a **separate twin method**:
   \`createSupplyIntentRaw\` / \`createBorrowIntentRaw\` / \`createWithdrawIntentRaw\` /
   \`createRepayIntentRaw\` / \`approveRaw\`. Adding \`raw: false\` to a MM service call will
   produce \`Object literal may only specify known properties, and 'raw' does not exist in type ...\`.

2. **\`useMMApprove\` is 2-arg, not 3-arg.** \`useSwapApprove(params, srcChainKey, walletProvider)\`
   takes \`params\` at hook-time. \`useMMApprove(srcChainKey, walletProvider)\` does not — pass
   \`params\` only at the mutation call site: \`await approve({ params })\`.

3. **\`useAToken\` returns \`Erc20Token & { chainKey }\`, not \`XToken\`.** The full \`XToken\`
   shape has \`hubAsset\` and \`vault\` fields too; the data hook does not synthesize those.
   Callers that need the full \`XToken\` shape must look it up via
   \`sodax.config.getMoneyMarketToken(chainKey, address)\` separately.

4. **\`useAToken({ queryOptions })\` Omits \`queryKey\` and \`enabled\`.** The hook owns those
   internally (\`enabled\` is derived from \`!!aToken && isAddress(aToken)\`). Don't try to override
   either field — the type signature rejects it. Pass \`aToken: addressOrUndefined\` directly and
   let the hook handle gating.

## Type / Symbol Rename Cheat Sheet

### Field-level renames

| Type | Old field | New field | Notes |
|---|---|---|---|
| \`XToken\` | \`xChainId\` | \`chainKey\` | Plus \`hubAsset\` and \`vault\` are now baked in. |
| \`MoneyMarketSupplyParams\` (request) | \`{ token, amount, action }\` | \`{ srcChainKey, srcAddress, token, amount, action, toChainId?, toAddress? }\` | Same for withdraw / repay; borrow adds \`fromChainId?\` / \`fromAddress?\`. |
| \`MoneyMarketAllowanceParams\` (input to \`useMMAllowance\`) | \`{ params, spokeProvider }\` | \`{ params }\` | Allowance is read-only; no provider needed. |
| \`useUserReservesData\` props | \`{ spokeProvider, address }\` | \`{ spokeChainKey, userAddress }\` | Same rename for \`useUserFormattedSummary\`. |
| \`useATokensBalances\` props | \`{ aTokens, spokeProvider, userAddress }\` | \`{ aTokens, spokeChainKey, userAddress }\` | Hub wallet derived inside the hook via \`HubService.getUserHubWalletAddress\`. |

### Deleted symbols (replace, don't shim)

- \`useSpokeProvider\` — gone from \`@sodax/dapp-kit\`. Pass \`(chainKey, walletProvider)\` directly
  to feature hooks. \`useWalletProvider(chainKey)\` from \`@sodax/wallet-sdk-react\` returns the
  right type.
- \`MoneyMarketError<Code>\`, \`RelayErrorCode\` — gone. Mutation error generic is \`Error\`. The
  CODE (\`'CREATE_SUPPLY_INTENT_FAILED'\`, \`'RELAY_TIMEOUT'\`, \`'SUBMIT_TX_FAILED'\`, etc.) lives
  on \`error.message\`. Underlying error chain lives on \`error.cause\` (ES2022).
- \`moneyMarketSupportedTokens\` (static \`Record<SpokeChainKey, XToken[]>\` map) — gone. Use
  \`sodax.moneyMarket.getSupportedTokensByChainId(chainKey)\` for one chain or
  \`sodax.moneyMarket.getSupportedTokens()\` for all chains.
- \`hubAssets\` global lookup — gone. \`XToken.vault\` and \`XToken.hubAsset\` carry the equivalent
  data per token. Helpers that walked \`hubAssets[chainId][address]\` for vault lookup should now
  read \`token.vault\` directly.
- \`SodaTokens\` legacy registry — for "is this a known soda vault" checks, replace with
  \`sodax.config.getMoneyMarketReserveAssets()\` or \`sodax.moneyMarket.getSupportedReserves()\`.
- \`baseChainInfo[chain].id\` — entries now expose \`.key\` (a \`SpokeChainKey\`), not \`.id\`.
- \`*_MAINNET_CHAIN_ID\` constants (\`ICON_MAINNET_CHAIN_ID\`, \`AVALANCHE_MAINNET_CHAIN_ID\`, …) —
  use \`ChainKeys.*\` instead. \`ChainKeys.ICON_MAINNET\` is the string \`'0x1.icon'\`, not the
  numeric chain ID.
- \`SpokeChainId\` / \`ChainId\` type — renamed to \`SpokeChainKey\`. Same value union.

### Field-level gotchas to triple-check

- \`useXBalances({ xChainId })\` is **not** renamed in v2 — the hook still uses \`xChainId\`, not
  \`chainKey\`. This is the only public hook that didn't follow the rename. Don't mass-replace.
- \`useEvmSwitchChain(chainKey)\` accepts \`SpokeChainKey\` directly — no change needed at the call
  site beyond the type narrowing.
- \`getChainType(chainKey)\` from \`@sodax/types\` replaces the older
  \`spokeProvider.chainConfig.chain.type === 'EVM'\` check. Returns \`'EVM' | 'BITCOIN' | ...\`.
- \`isUserReserveDataArray(arr)\` and \`isXTokenArray(arr)\` type guards in
  \`apps/demo/src/components/mm/typeGuards.ts\` still work — no changes needed beyond the
  \`xChainId\` → \`chainKey\` rename inside their \`isXToken\` check.

## The Hook-Time Closure Pattern (MM edition)

### v1 (before)

\`\`\`tsx
const sourceWalletProvider = useWalletProvider(selectedChainId);
const sourceSpokeProvider  = useSpokeProvider(selectedChainId, sourceWalletProvider);

const { mutateAsync: supply, isPending, error } = useSupply();
const { mutateAsync: approve } = useMMApprove();
const { data: hasAllowed } = useMMAllowance({
  params: { token, amount, action: 'supply' },
  spokeProvider: sourceSpokeProvider,
});

const params = { token: token.address, amount: parseUnits(amount, token.decimals), action: 'supply' };

await supply({ params, spokeProvider: sourceSpokeProvider });
await approve({ params, spokeProvider: sourceSpokeProvider });
\`\`\`

### v2 (after)

\`\`\`tsx
const sourceWalletProvider = useWalletProvider(selectedChainId);

const { mutateAsync: supply, isPending, error } = useSupply(selectedChainId, sourceWalletProvider);
const { mutateAsync: approve } = useMMApprove(selectedChainId, sourceWalletProvider);
const { data: hasAllowed } = useMMAllowance({ params });

const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
  if (!amount || !address) return undefined;
  return {
    srcChainKey: selectedChainId,
    srcAddress: address,
    token: token.address,
    amount: parseUnits(amount, token.decimals),
    action: 'supply',
  };
}, [token.address, token.decimals, amount, address, selectedChainId]);

const result = await supply({ params });
if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  // …
}
await approve({ params });
\`\`\`

The same cast-at-boundary pattern from the swap migration applies if a chain-narrowed wallet
provider is needed (e.g., for a Stellar trustline check). The MM hooks themselves do not require
narrowing at the consumer — \`useSupply<K>\`'s \`walletProvider\` arg accepts the broad
\`IWalletProvider | undefined\` union when \`K\` is the broad \`SpokeChainKey\` union, which is what
\`useWalletProvider(runtimeKey)\` returns.

## Dapp-kit Hook API Contract (v2)

Link to source rather than transcribe so this doc doesn't drift:

- \`packages/dapp-kit/src/hooks/mm/useSupply.ts\` — generic \`<K>\`, \`(srcChainKey, walletProvider)\`,
  mutation input \`{ params, skipSimulation?, timeout? }\`, returns
  \`Result<[SpokeTxHash, HubTxHash]>\`. \`onSuccess\` invalidates user reserves / formatted summary /
  aTokensBalances / allowance / xBalances keyed by \`params.srcChainKey\`.
- \`packages/dapp-kit/src/hooks/mm/useBorrow.ts\` — same shape; also invalidates
  \`['xBalances', toChainId ?? srcChainKey]\` for cross-chain delivery.
- \`packages/dapp-kit/src/hooks/mm/useWithdraw.ts\` — same shape.
- \`packages/dapp-kit/src/hooks/mm/useRepay.ts\` — same shape.
- \`packages/dapp-kit/src/hooks/mm/useMMApprove.ts\` — generic \`<K>\`, \`(srcChainKey, walletProvider)\`,
  mutation input \`{ params }\` only (no \`skipSimulation\` / \`timeout\`). **Differs from
  \`useSwapApprove\`**, which takes \`params\` at hook-time.
- \`packages/dapp-kit/src/hooks/mm/useMMAllowance.ts\` — query, input \`{ params, queryOptions? }\`.
  Throws on \`!ok\` so React Query lands in \`error\` state. Auto-skips RPC for \`borrow\` /
  \`withdraw\` actions (\`enabled: false\`).
- \`packages/dapp-kit/src/hooks/mm/useReservesData.ts\`, \`.../useReservesHumanized.ts\`,
  \`.../useReservesList.ts\`, \`.../useReservesUsdFormat.ts\` — global queries; data methods return
  plain \`Promise<T>\` (no \`Result\` envelope), so no \`!ok\` branching needed.
- \`packages/dapp-kit/src/hooks/mm/useUserReservesData.ts\`, \`.../useUserFormattedSummary.ts\` —
  input \`{ spokeChainKey, userAddress, queryOptions? }\`. Throws on missing required fields.
- \`packages/dapp-kit/src/hooks/mm/useATokensBalances.ts\` — input
  \`{ aTokens, spokeChainKey, userAddress, queryOptions? }\`. Internally derives the hub wallet via
  \`HubService.getUserHubWalletAddress\`.
- \`packages/dapp-kit/src/hooks/mm/useAToken.ts\` — input \`{ aToken, queryOptions? }\` where
  \`queryOptions\` is \`Omit<UseQueryOptions<...>, 'queryKey' | 'queryFn' | 'enabled'>\`. Returns
  \`Erc20Token & { chainKey }\`, **not** \`XToken\`.

## Worked Example: full \`SupplyModal\` migration

**Before (v1):**

\`\`\`tsx
const sourceWalletProvider = useWalletProvider(selectedChainId);
const sourceSpokeProvider  = useSpokeProvider(selectedChainId, sourceWalletProvider);

const { mutateAsync: supply, isPending, error } = useSupply();
const { data: hasAllowed } = useMMAllowance({ params, spokeProvider: sourceSpokeProvider });
const { mutateAsync: approve } = useMMApprove();

const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
  if (!amount) return undefined;
  return {
    token: token.address,
    amount: parseUnits(amount, token.decimals),
    action: 'supply',
  };
}, [token.address, token.decimals, amount]);

const result = await supply({ params, spokeProvider: sourceSpokeProvider });
invalidateMmQueries(queryClient, { mmChainIds: [selectedChainId], address, balanceChainIds: [selectedChainId] });

const successData: ActionSuccessData = {
  amount,
  token,
  sourceChainId: selectedChainId,
  destinationChainId: token.xChainId,
  txHash: extractTxHash(result),
};
\`\`\`

**After (v2):**

\`\`\`tsx
const sourceWalletProvider = useWalletProvider(selectedChainId);

const { mutateAsync: supply, isPending, error } = useSupply(selectedChainId, sourceWalletProvider);
const { data: hasAllowed } = useMMAllowance({ params });
const { mutateAsync: approve } = useMMApprove(selectedChainId, sourceWalletProvider);

const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
  if (!amount || !address) return undefined;
  return {
    srcChainKey: selectedChainId,
    srcAddress: address,
    token: token.address,
    amount: parseUnits(amount, token.decimals),
    action: 'supply',
  };
}, [token.address, token.decimals, amount, address, selectedChainId]);

const result = await supply({ params });
// onSuccess in useSupply already invalidates the right query keys; no manual call needed.

const successData: ActionSuccessData = {
  amount,
  token,
  sourceChainId: selectedChainId,
  destinationChainId: token.chainKey, // xChainId → chainKey
  txHash: extractTxHash(result),       // already v2-compatible (handles Result<[hash, hash]>)
};
\`\`\`

The five meaningful diffs:

1. \`useSpokeProvider(...)\` line is gone; \`useWalletProvider(...)\` value flows directly.
2. \`useSupply()\` / \`useMMApprove()\` close over \`(selectedChainId, sourceWalletProvider)\`.
3. \`params\` gains \`srcChainKey\` + \`srcAddress\`. \`address\` becomes a memo dependency.
4. Mutation invocation is just \`{ params }\` — no \`spokeProvider\`.
5. \`token.xChainId\` reads become \`token.chainKey\`.

The legacy \`invalidateMmQueries\` call is dropped — the v2 mutation hooks already invalidate the
canonical key set on \`onSuccess\`.

## Per-file Migration Checklist (apps/demo)

These are the actual edits that landed during the migration, not the planned ones:

- **\`App.tsx\`** — added \`MoneyMarketPage\` import and two routes (\`/money-market\` redirect to a
  default chain, plus \`/money-market/:chainId\`). All other commented routes left alone.
- **\`components/shared/header.tsx\`** — uncommented the \`/money-market\` nav link. Bridge /
  staking / partner-fee-claim / dex / recovery links remain commented.
- **\`components/shared/ChainSelector.tsx\`** — uncommented; \`ChainId\` → \`SpokeChainKey\`,
  4× \`chain.id\` → \`chain.key\`.
- **\`pages/money-market/page.tsx\`** — uncommented; \`ChainId\` → \`SpokeChainKey\`,
  \`useGetUserHubWalletAddress\` already v2-compatible. No other changes.
- **\`components/mm/{ErrorAlert,MmErrorBox,constants,typeGuards}.{ts,tsx}\`** — uncommented as-is.
  No SDK references in any of them.
- **\`components/mm/lists/{BorrowButton,ActionSuccessContent,SupplyAssetsListItem}.tsx\`** —
  uncommented; \`ChainId\` → \`SpokeChainKey\`, \`xChainId\` → \`chainKey\` where applicable.
- **\`components/mm/lists/borrow/BorrowAssetsListItem.tsx\`** — uncommented; \`ChainId\` →
  \`SpokeChainKey\`. **Dropped the \`queryKey\` + \`enabled\` overrides** on \`useAToken\` — the
  v2 hook Omits both. Switched to \`useAToken({ aToken: aTokenAddress })\` and let the hook gate
  itself.
- **\`components/mm/lists/SupplyAssetsList.tsx\`** — dropped \`useSpokeProvider\` import and
  \`spokeProvider\` derivation. \`moneyMarketSupportedTokens[chainId]\` →
  \`sodax.moneyMarket.getSupportedTokensByChainId(...)\` via \`useSodaxContext\`.
  \`ICON_MAINNET_CHAIN_ID\` → \`ChainKeys.ICON_MAINNET\`. Data-hook param renames.
- **\`components/mm/lists/borrow/BorrowAssetsList.tsx\`** — same playbook.
  \`Object.entries(moneyMarketSupportedTokens).flatMap(...)\` →
  \`Object.entries(sodax.moneyMarket.getSupportedTokens()).flatMap(...)\`. Note: in v2, each
  \`XToken\` already carries \`chainKey\`, so the manual \`xChainId: chainId\` augmentation in the
  flatMap is no longer needed. \`AVALANCHE_MAINNET_CHAIN_ID\` → \`ChainKeys.AVALANCHE_MAINNET\`.
- **\`components/mm/lists/{SupplyModal,WithdrawModal,RepayModal}.tsx\` and
  \`components/mm/lists/borrow/BorrowModal.tsx\`** — dropped \`useSpokeProvider\`; converted
  hook closures (\`useSupply(chainKey, walletProvider)\` etc.); added \`srcChainKey\` + \`srcAddress\`
  to every params object; dropped \`spokeProvider\` from mutation invocations and from
  \`useMMAllowance\` input. \`MoneyMarketError\` types replaced by \`Error\`. Legacy
  \`invalidateMmQueries\` calls dropped (v2 hooks own this). \`token.xChainId\` reads →
  \`token.chainKey\`. \`WithdrawModal\` also replaced
  \`sourceSpokeProvider?.chainConfig?.chain?.type === 'EVM'\` with
  \`getChainType(selectedChainId) === 'EVM'\` from \`@sodax/types\`.
- **\`hooks/useReserveMetrics.ts\`** — rewritten. \`hubAssets[token.xChainId]?.[token.address]?.vault\`
  is gone; \`token.vault\` is directly available on \`XToken\` in v2. Lookup branch reduced from
  ~20 lines to a single null check.
- **\`hooks/useSodaxScanMessageUrl.ts\`** — uncommented as-is.
- **\`lib/utils.ts\`** — \`getChainsWithThisToken(token)\` and
  \`getTokenOnChain(symbol, chainId)\` now take a \`sodax: Sodax\` first arg and call
  \`sodax.moneyMarket.getSupportedTokensByChainId(...)\` /
  \`sodax.moneyMarket.getSupportedTokens()\`. \`getMmErrorText\` updated to read \`error.message\`
  as the CODE for v2 plain-Error instances (with \`error.cause\` as the \`data.error\` equivalent),
  preserving the v1 object-shape branch for backward compatibility.
- **\`lib/borrowUtils.ts\`** — rewritten. \`hubAssets\` walk replaced by
  \`Object.entries(sodax.moneyMarket.getSupportedTokens())\`. \`SodaTokens\` validation dropped
  (every supported token already has a vault by definition). \`getSpokeTokenAddressByVault\`
  helper inlined / no longer needed.

## New Patterns Worth Knowing

### Pattern: Two-axis chain identification on borrow

A borrow has two distinct chain keys: **\`srcChainKey\`** (collateral chain — drives the wallet
provider, signs the tx, where the debt is recorded) and **\`toChainId\`** (delivery chain — where
the borrowed funds land). Cross-chain borrow:

\`\`\`tsx
const { mutateAsync: borrow } = useBorrow(sourceChainId, sourceWalletProvider);

await borrow({
  params: {
    srcChainKey: sourceChainId,
    srcAddress: sourceAddress,
    token: destinationToken.address,
    amount,
    action: 'borrow',
    toChainId: destinationChainId,
    toAddress: destinationAddress,
  },
});
\`\`\`

Same-chain borrow: omit \`toChainId\` / \`toAddress\` (they default to the source).

### Pattern: Repay can come from a different chain than the debt

The repay flow lets the user pick a "from chain" (where the funds come from) that differs from the
"debt chain" (where the debt lives). The hook closure follows the **from chain**:

\`\`\`tsx
const { mutateAsync: repay } = useRepay(fromChainId, sourceWalletProvider);

await repay({
  params: {
    srcChainKey: fromChainId,
    srcAddress: fromAddress,
    token: sourceToken.address,
    amount,
    action: 'repay',
    toChainId: debtChainId,    // where the debt lives
    toAddress: debtAddress,    // hub-derived address for the debt
  },
});
\`\`\`

### Pattern: Mutation \`data\` is \`Result<[SpokeTxHash, HubTxHash]>\` — branch on \`data?.ok\`

\`\`\`tsx
const result = await supply({ params });
if (!result.ok) {
  // Display via existing error helper. error.message contains the CODE.
  setError(getMmErrorText(result.error));
  return;
}
const [spokeTxHash, hubTxHash] = result.value;
\`\`\`

The existing \`extractTxHash\` helper at \`apps/demo/src/lib/extractTxHash.ts\` already handles this
shape — it walks \`{ ok: true, value: [hash, hash] }\` automatically.

### Pattern: Query-key invalidation moved into hooks

The legacy \`invalidateMmQueries\` helper in \`apps/demo/src/lib/invalidateMmQueries.ts\` is now
redundant. Every v2 mutation hook invalidates the canonical key set in its own \`onSuccess\`:

- \`['mm', 'userReservesData', srcChainKey, srcAddress]\`
- \`['mm', 'userFormattedSummary', srcChainKey, srcAddress]\`
- \`['mm', 'aTokensBalances']\`
- \`['mm', 'allowance', srcChainKey, token, action]\` (supply / repay / approve only)
- \`['xBalances', srcChainKey]\` (and \`['xBalances', toChainId]\` for borrow)

Don't reintroduce per-modal invalidations unless there's a query key the hook doesn't already
handle.

### Pattern: \`getMmErrorText\` shape adapter

For migrating \`getMmErrorText\` (or any error-formatting helper that branched on \`error.code\`),
the minimal change is to **adapt the v2 shape onto the v1 shape**:

\`\`\`tsx
let sdkError: { message?: string; code?: string; data?: { error?: unknown } } | null = null;
if (error instanceof Error) {
  // v2: CODE on .message, underlying chain on .cause.
  sdkError = { message: error.message, code: error.message, data: { error: (error as { cause?: unknown }).cause } };
} else if (error && typeof error === 'object') {
  // v1 legacy MoneyMarketError object shape.
  sdkError = error as { message?: string; code?: string; data?: { error?: unknown } };
}
// Existing CODE-based branches (e.g. sdkError.code === 'CREATE_SUPPLY_INTENT_FAILED') keep working.
\`\`\`

This avoids rewriting the entire error-formatting tree.

## Pitfalls

1. **Adding \`raw: false\` to MM service calls** — TypeScript error \`Object literal may only specify
   known properties, and 'raw' does not exist in type ...\`. Cause: MM uses \`*Raw\` twin methods,
   not \`WalletProviderSlot\`. Fix: drop the \`raw\` field.

2. **Calling \`useMMApprove(params, srcChainKey, walletProvider)\`** — TypeScript error \`Expected
   2 arguments, but got 3\`. Cause: MM approve takes \`params\` at the mutation call site, not at
   hook-time. Fix: \`useMMApprove(srcChainKey, walletProvider)\`, then \`await approve({ params })\`.

3. **\`useAToken({ queryOptions: { queryKey, enabled } })\`** — TypeScript error \`Object literal
   may only specify known properties, and 'queryKey' / 'enabled' does not exist in type
   Omit<UseQueryOptions<...>, 'queryKey' | 'queryFn' | 'enabled'>\`. Cause: hook owns those fields.
   Fix: pass \`{ aToken: addressOrUndefined }\` directly; let the hook gate itself.

4. **\`apps/demo/src/lib/utils.ts\` is a hidden compile blocker** — the file imports
   \`moneyMarketSupportedTokens\` (deleted) at module top, so even with MM components disabled the
   demo fails \`checkTs\`. Fix this **before** uncommenting any MM components, otherwise every
   subsequent run is polluted with the same error.

5. **\`extractTxHash\` already handles v2 \`Result<[SpokeTxHash, HubTxHash]>\`** at
   \`apps/demo/src/lib/extractTxHash.ts\`. Don't reimplement it. The helper walks
   \`{ value: [spokeTxHash, hubTxHash] }\` automatically.

6. **\`useXBalances\` retained \`xChainId\`** as the param name. Don't mass-replace
   \`xChainId\` → \`chainKey\` — \`useXBalances({ xChainId, xTokens, address })\` is correct in
   v2.

7. **\`baseChainInfo[chain].id\` is gone** — entries have \`.key\`, not \`.id\`. Most uses are in
   \`ChainSelector\`-style components.

8. **\`ChainKeys.ICON_MAINNET\` is \`'0x1.icon'\`** — a string, not the legacy numeric chain ID.
   Equality checks \`chainKey === ChainKeys.ICON_MAINNET\` work as expected, but coercions like
   \`Number(chainKey)\` will return \`NaN\`. Audit any numeric-coerced chain ID branches.

9. **\`useReserveMetrics\` and \`useAToken\`'s consumers are downstream of \`hubAssets\` removal**.
   If a custom helper walks \`hubAssets[token.xChainId][token.address]\` for vault, replace with
   \`token.vault\` directly. The same applies to \`SodaTokens\` validation — supported MM tokens
   already pass that filter by definition.

10. **The legacy \`invalidateMmQueries\` helper duplicates what v2 hooks do** — mismatched query
    keys silently no-op. Prefer deleting the helper entirely. If kept, the helper's \`mmChainIds\`
    field type must be \`readonly SpokeChainKey[]\`, and the chain-id parts of every key must match
    what the v2 hooks emit (\`['mm', 'userReservesData', srcChainKey, srcAddress]\`,
    \`['mm', 'aTokensBalances']\`, etc.).

11. **\`spokeProvider.chainConfig.chain.type === 'EVM'\`** is gone. Use
    \`getChainType(chainKey) === 'EVM'\` from \`@sodax/types\` instead.

12. **\`useSupply / useBorrow / useWithdraw / useRepay\` mutation \`data\` is \`Result<...>\`, not
    \`[hash, hash]\` directly**. Branch on \`data?.ok\`. The mutation does NOT throw on SDK-level
    failures — only \`mutationFn\` throws (e.g., when \`srcChainKey\` / \`walletProvider\` is
    missing).

## Verification Recipe

When migrating a money-market consumer, follow this order:

1. \`pnpm --filter @sodax/dapp-kit build\` — must produce ESM + CJS + DTS without errors. The MM
   hooks rely on \`SpokeChainKey\` flowing through \`@sodax/types\`; failures here usually mean an
   \`@sodax/types\` mismatch, not consumer issues.
2. **Phase order is load-bearing**: do \`lib/utils.ts\` (and any other shared lib that imports
   removed symbols) **first**, before uncommenting MM components. Otherwise every subsequent
   \`checkTs\` run is polluted with the same import error and signal-to-noise drops.
3. \`pnpm --filter sodax-demo checkTs\` after each phase. Errors at this stage are almost always
   one of: missing \`srcChainKey\` / \`srcAddress\` in params, leftover \`spokeProvider\` field,
   leftover \`xChainId\` field read, or a \`useAToken\` queryOptions override that's now Omit'd.
4. \`pnpm --filter sodax-demo lint && pnpm --filter sodax-demo build\` once \`checkTs\` is clean.
5. **Manual smoke test in dev** (\`pnpm dev:demo\`):
   - \`/solver\` regression check — confirm swaps still work.
   - \`/money-market\` redirect to \`/money-market/<defaultChainKey>\` works.
   - Connect an EVM wallet → \`SupplyAssetsList\` and \`BorrowAssetsList\` render.
   - Round-trip on a small testnet balance: supply → borrow → repay → withdraw. Confirm the hub
     wallet address strip populates and the success modals show the spoke tx hash.

## Out-of-scope

This migration intentionally did not touch:

- **Other demo features** — \`bridge\` / \`staking\` / \`dex\` / \`partner-fee-claim\` / \`recovery\`
  pages and components remain commented; their nav links stay disabled. Their underlying
  \`@sodax/dapp-kit\` hook directories also remain commented in
  \`packages/dapp-kit/src/hooks/index.ts\`.
- **\`apps/web\`** — separate, much wider migration. Many \`useSpokeProvider\` call sites and
  \`xChainId\` field reads still live there, plus the partner / migrate / pool / save pages have
  their own SDK-shape updates pending.
- **Raw-tx variants** (\`createSupplyIntentRaw\`, \`createBorrowIntentRaw\`, etc.) — only worth
  wiring when product needs sign-elsewhere flows.
- **Error-message UX alignment** with Concept 6 — the existing \`getMmErrorText\` mapping was
  preserved (with a v2 shape adapter at the top); future work could simplify by reading
  \`error.message\` and \`error.cause\` directly instead of the v1-shaped object branches.
- **Deleting the dead \`invalidateMmQueries.ts\` helper** — left commented in place. Mutation hooks
  now own this responsibility.
`;

export default SUMMARY;
