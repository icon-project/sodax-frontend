/**
 * SODAX DEX Feature Migration Summary (v1 → v2 SDK)
 * ==================================================
 *
 * React-side migration playbook for moving a DEX consumer (e.g. `apps/demo`) from the v1 SDK
 * shape (per-chain `*SpokeProvider` instances, mutation hooks that throw on `!ok`,
 * `ConcentratedLiquidityError<Code>` typed errors, `getAssetsForPool(spokeProvider, poolKey)`,
 * etc.) to the v2 SDK shape (chain-key + chain-narrowed wallet provider, `Result<T>` returned
 * as-is, `srcChainKey`/`srcAddress` baked into action params).
 *
 * Sibling playbooks:
 *   - `packages/SWAP_FEATURE_MIGRATION_SUMMARY.ts` — read first if you haven't; covers the
 *     spoke-provider elimination, cast-at-boundary pattern, and `*_MAINNET_CHAIN_ID` →
 *     `ChainKeys.*` mapping that all features share.
 *   - `packages/MM_FEATURE_MIGRATION_SUMMARY.ts` — money-market migration; the canonical pure-
 *     mutation hook pattern this DEX migration follows.
 *
 * For upstream rationale, see:
 *   - `packages/sdk/docs/ARCHITECTURE_REFACTOR_SUMMARY.md` — Concepts 1-6.
 *   - `packages/sdk/CHAIN_ID_MIGRATION.md` — `*_MAINNET_CHAIN_ID` → `ChainKeys.*` table.
 *
 * Diff scope: `apps/demo/src/{App.tsx,components/shared/header.tsx,pages/dex/page.tsx,
 *   components/dex/**}` and a peer rewrite of `packages/dapp-kit/src/{hooks/dex/,utils/dex-utils.ts}`.
 */

const SUMMARY = String.raw`
# SODAX DEX Feature: v1 → v2 Migration Playbook

## TL;DR

The v2 DEX hooks adopt the same **pure-mutation** pattern as v2 \`useSwap\` and v2 \`useSupply\`:
no hook-time arguments, all inputs (\`params\`, \`walletProvider\`) are passed via the mutation vars,
and the mutation \`data\` is the SDK's \`Result<T>\` returned **as-is** — branch on \`data?.ok\` at the
call site; **do not throw** on SDK-level failures. Action params (\`CreateAssetDepositParams<K>\`,
\`CreateAssetWithdrawParams<K>\`, \`ClSupplyParams<K>\`, \`ClIncreaseLiquidityParams<K>\`,
\`ClDecreaseLiquidityParams<K>\`, \`ClClaimRewardsParams<K>\`) all gain \`srcChainKey\` + \`srcAddress\`
fields, and pure helper hooks (\`useCreateDepositParams\` etc.) return only the deposit-specific
subset — callers spread \`{ srcChainKey, srcAddress }\` in at the mutation call site.

The seven mechanical things you need to do:

1. Replace \`useSpokeProvider(chainKey, walletProvider)\` and the \`spokeProvider: SpokeProvider\`
   field on every params object with the wallet provider directly. \`useWalletProvider(chainKey)\`
   from \`@sodax/wallet-sdk-react\` returns the right type.
2. Add \`srcChainKey\` + \`srcAddress\` to every \`CreateAssetDepositParams\` /
   \`CreateAssetWithdrawParams\` / \`ClSupplyParams\` / \`ClIncreaseLiquidityParams\` /
   \`ClDecreaseLiquidityParams\` / \`ClClaimRewardsParams\` you build. The pure helpers
   (\`createDepositParamsProps\` / \`createWithdrawParamsProps\` /
   \`createDecreaseLiquidityParamsProps\`) intentionally don't include them — spread the helper's
   output and add \`{ srcChainKey, srcAddress }\` at the mutation call site.
3. Convert every dex mutation hook call: \`useDexDeposit() \` and \`useDexApprove()\` etc. take **no
   hook-time arguments**. Pass \`{ params, walletProvider }\` to \`mutateAsync\`. **\`useSupplyLiquidity\`
   is one mutation** that fans out to \`clService.supplyLiquidity\` (mint new) or
   \`clService.increaseLiquidity\` (existing) based on \`params.tokenId\` + \`params.isValidPosition\`.
4. Drop \`ConcentratedLiquidityError<Code>\` from mutation generics; type errors as plain
   \`Error\`. The CODE moved from \`error.code\` to \`error.message\`.
5. Rename \`usePoolBalances\` props: \`{ spokeProvider }\` → \`{ spokeChainKey, userAddress }\`.
   Drop the v1 \`getDeposit(token, spokeProvider)\` overload — the SDK's v2 signature is
   \`getDeposit(poolToken, walletAddress, chainKey)\` returning \`Result<bigint>\`.
6. Replace \`sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey)\` with
   \`getAssetsForPool(srcChainKey, poolKey)\` — chain-key-first in v2.
7. \`useDexAllowance\` is read-only and always passes \`raw: true\` to the SDK — the underlying
   \`assetService.isAllowanceValid\` does not consult \`walletProvider\`, so requiring one would be
   pure friction. Pass \`{ params }\` (where \`params\` already contains \`srcChainKey\`/\`srcAddress\`)
   and the hook handles the discriminator.

## DEX-specific divergences from swap & MM

Trip-wires that catch DEX migrators specifically:

1. **\`assetService.isAllowanceValid\` requires the \`WalletProviderSlot\` discriminator.** Unlike
   MM where \`moneyMarket.isAllowanceValid({ params })\` works, the DEX SDK signature is
   \`isAllowanceValid<K, Raw>(_params: AssetDepositAction<K, Raw>)\`. Inside \`useDexAllowance\` the
   hook short-circuits by passing \`raw: true\` (the underlying read does not use \`walletProvider\`),
   so consumers don't need to pass one. Forgetting \`raw: true\` would force callers to supply a
   wallet provider just to satisfy types.

2. **\`useSupplyLiquidity\` fans out into two SDK methods.** Mint-new and increase-existing share
   the same hook. The hook branches on \`params.tokenId && params.isValidPosition\`: if both are
   truthy → \`clService.increaseLiquidity({ params: <ClIncreaseLiquidityParams<K>>, raw: false,
   walletProvider })\`, else → \`clService.supplyLiquidity({ params: <ClSupplyParams<K>>, raw: false,
   walletProvider })\`. The mutation vars carry the merged
   \`UseCreateSupplyLiquidityParamsResult & { srcChainKey, srcAddress }\` shape. Both SDK methods
   return \`Promise<Result<[SpokeTxHash, HubTxHash]>>\` so the hook's data type unifies.

3. **\`clService.getPools()\` is synchronous in v2.** Was \`Promise<PoolKey[]>\` in v1. The v2 SDK
   reads from cached config, no I/O. \`useQuery\` accepts a sync \`queryFn\` so this is transparent
   inside \`usePools\`, but a consumer doing \`await sodax.dex.clService.getPools()\` is still fine.
   What's NOT fine: \`sodax.dex.clService.getPools().then(...)\` — there's no \`.then\` on a
   non-promise return.

4. **\`clService.getAssetsForPool(srcChainKey, poolKey)\` — chain-key-first.** Was
   \`getAssetsForPool(spokeProvider, poolKey)\` in v1. Demo's \`ManageLiquidity\` calls this
   synchronously to derive \`{ token0, token1 }\` for the pool — must pass \`selectedChainId\`,
   not the (now-gone) spoke provider.

5. **\`clService.getPoolData\` and \`getPositionInfo\` use the hub \`publicClient\`.** Both methods
   take a viem \`PublicClient<HttpTransport>\` arg. v2 hooks use \`sodax.hubProvider.publicClient\`
   internally; consumer apps should not be reaching into a spoke provider's RPC for these reads.

6. **Pure-helper hooks carry no chain context.** \`useCreateDepositParams\` /
   \`useCreateWithdrawParams\` / \`useCreateSupplyLiquidityParams\` /
   \`useCreateDecreaseLiquidityParams\` / \`useLiquidityAmounts\` produce only the helper-relevant
   subset — they don't know about \`srcChainKey\` / \`srcAddress\`. Callers are responsible for
   spreading the result into a full action params object at the mutation call site:
   \`{ ...createDepositParams0, srcChainKey, srcAddress }\`.

## Type / Symbol Rename Cheat Sheet

### Field-level renames

| Type | Old shape | New shape | Notes |
|---|---|---|---|
| \`CreateAssetDepositParams<K>\` | \`{ asset, amount, poolToken, dst? }\` | \`{ srcChainKey, srcAddress, asset, amount, poolToken, dst? }\` | Generic \`K\` carries the literal chain key for inference. |
| \`CreateAssetWithdrawParams<K>\` | \`{ asset, amount, poolToken, dst? }\` | \`{ srcChainKey, srcAddress, poolToken, asset, amount, dst? }\` | Same rename. |
| \`ClSupplyParams<K>\` | \`{ poolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, sqrtPriceX96 }\` | \`{ srcChainKey, srcAddress, poolKey, … }\` | Fields prepended. |
| \`ClIncreaseLiquidityParams<K>\` | \`{ poolKey, tokenId, tickLower, tickUpper, liquidity, amount0Max, amount1Max, sqrtPriceX96 }\` | \`{ srcChainKey, srcAddress, poolKey, tokenId, … }\` | Same. |
| \`ClDecreaseLiquidityParams<K>\` | \`{ poolKey, tokenId, liquidity, amount0Min, amount1Min }\` | \`{ srcChainKey, srcAddress, poolKey, tokenId, liquidity, amount0Min, amount1Min }\` | Same. |
| \`ClClaimRewardsParams<K>\` | \`{ poolKey, tokenId, tickLower, tickUpper }\` | \`{ srcChainKey, srcAddress, poolKey, tokenId, tickLower, tickUpper }\` | Same. |
| \`usePoolBalances\` props | \`{ poolData, poolKey, spokeProvider }\` | \`{ poolData, poolKey, spokeChainKey, userAddress }\` | Hub wallet derived inside the hook. |
| \`useDexAllowance\` props | \`{ params, spokeProvider }\` | \`{ params }\` | Read-only; \`raw: true\` is added internally. |
| \`getAssetsForPool(spoke, poolKey)\` | accepts \`SpokeProvider\` | \`getAssetsForPool(srcChainKey, poolKey)\` | Chain-key-first; sync. |
| \`getPools()\` | \`Promise<PoolKey[]>\` | \`PoolKey[]\` (synchronous) | No I/O in v2. |
| \`assetService.getDeposit\` | \`(token, spokeProvider) => Promise<bigint>\` | \`(poolToken, walletAddress, chainKey) => Promise<Result<bigint>>\` | Now Result-wrapped. |

### Deleted symbols (replace, don't shim)

- \`useSpokeProvider\` — gone from \`@sodax/dapp-kit\`. Pass \`(chainKey, walletProvider)\` directly
  via mutation vars. \`useWalletProvider(chainKey)\` from \`@sodax/wallet-sdk-react\` returns the
  right type, and re-exports \`IWalletProvider\` for prop-drilling.
- \`SpokeProvider\` union type and every \`*SpokeProvider\` class (\`EvmSpokeProvider\`,
  \`SonicSpokeProvider\`, etc.) — gone from public surface. Where the v1 demo grabbed
  \`spokeProvider.chainConfig.chain.name\` for display, use \`baseChainInfo[chainKey].name\`
  from \`@sodax/types\` (or the demo's existing \`apps/demo/src/lib/chains.ts\` helpers).
- \`ConcentratedLiquidityError<Code>\` and the rest of the module-error type-guard family —
  branch on \`error.message\` (e.g. \`'CLAIM_REWARDS_FAILED'\`) and/or \`error.cause\`. SDK CLAUDE.md
  "Error message convention" has the canonical taxonomy.
- \`createIntentParamsProps\` / \`useCreateIntentParams\` — never existed for DEX, but if you
  ported swap-side helpers expecting the same shape, note that DEX helpers do **not** include
  \`srcChainKey\` / \`srcAddress\` — that's intentional (see "Pure-helper hooks" above).

### Field-level gotchas to triple-check

- \`useXBalances({ xChainId })\` is **not** renamed in v2 — the hook still uses \`xChainId\`, not
  \`chainKey\`. \`ManageLiquidity\` uses this to read spoke-side balances.
- \`saveTokenIdToLocalStorage\` and \`getTokenIdsFromLocalStorage\` in
  \`apps/demo/src/lib/utils.ts\` already accept \`SpokeChainKey\` (the v2 type) — no rename needed.

## The Pure-Mutation Pattern (DEX edition)

### v1 (before)

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);
const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

const { mutateAsync: deposit, isPending, error } = useDexDeposit();
const { mutateAsync: approve } = useDexApprove();
const { data: hasAllowed } = useDexAllowance({
  params: { asset, amount, poolToken },
  spokeProvider,
});

const params = { asset, amount: parseUnits(amount, decimals), poolToken };

await deposit({ params, spokeProvider });          // throws on !ok
await approve({ params, spokeProvider });          // throws on !ok
\`\`\`

### v2 (after)

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);

const { mutateAsync: deposit, isPending, error } = useDexDeposit();
const { mutateAsync: approve } = useDexApprove();
const { data: hasAllowed } = useDexAllowance({
  params: createDepositParams0
    ? { ...createDepositParams0, srcChainKey: selectedChainId, srcAddress: xAccount.address as \`0x\${string}\` }
    : undefined,
});

const result = await deposit({
  params: { ...createDepositParams0, srcChainKey: selectedChainId, srcAddress: xAccount.address as \`0x\${string}\` },
  walletProvider,
});
if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  // …
}
\`\`\`

The same cast-at-boundary pattern from the swap migration applies if a chain-narrowed wallet
provider is needed (e.g., for a Stellar deposit/approve). The DEX hooks themselves do not require
narrowing at the consumer — \`useDexDeposit<K>\`'s \`walletProvider\` arg accepts the broad
\`IWalletProvider | undefined\` union when \`K\` is the broad \`SpokeChainKey\` union, which is what
\`useWalletProvider(runtimeKey)\` returns.

## Dapp-kit Hook API Contract (v2)

Link to source rather than transcribe so this doc doesn't drift:

- \`packages/dapp-kit/src/hooks/dex/useDexDeposit.ts\` — generic \`<K>\`, mutation input
  \`Omit<AssetDepositAction<K, false>, 'raw'>\`, returns \`Result<[SpokeTxHash, HubTxHash]>\`.
  Invalidates \`['dex', 'poolBalances', srcChainKey, srcAddress]\`,
  \`['dex', 'allowance', srcChainKey, asset, amount]\`, and \`['xBalances', srcChainKey]\`.
- \`packages/dapp-kit/src/hooks/dex/useDexWithdraw.ts\` — same shape, withdraw action.
- \`packages/dapp-kit/src/hooks/dex/useDexApprove.ts\` — generic \`<K>\`, mutation input
  \`Omit<AssetDepositAction<K, false>, 'raw'>\`, returns \`Result<TxReturnType<K, false>>\`.
  Invalidates \`['dex', 'allowance', srcChainKey, asset, amount]\`.
- \`packages/dapp-kit/src/hooks/dex/useSupplyLiquidity.ts\` — generic \`<K>\`, mutation vars
  \`{ params: UseCreateSupplyLiquidityParamsResult & { srcChainKey, srcAddress }, walletProvider, timeout? }\`.
  Branches mint vs increase internally. Returns \`Result<[SpokeTxHash, HubTxHash]>\`.
- \`packages/dapp-kit/src/hooks/dex/useDecreaseLiquidity.ts\` — generic \`<K>\`, mutation input
  \`Omit<ClLiquidityDecreaseLiquidityAction<K, false>, 'raw'>\`, returns
  \`Result<[SpokeTxHash, HubTxHash]>\`.
- \`packages/dapp-kit/src/hooks/dex/useClaimRewards.ts\` — generic \`<K>\`, mutation input
  \`Omit<ClLiquidityClaimRewardsAction<K, false>, 'raw'>\`. Error type is plain \`Error\` (the
  v1 \`ConcentratedLiquidityError\` typed-error generic was deleted).
- \`packages/dapp-kit/src/hooks/dex/usePools.ts\` — query, no inputs, returns
  \`UseQueryResult<PoolKey[], Error>\`. Synchronous SDK call wrapped in a sync \`queryFn\`.
- \`packages/dapp-kit/src/hooks/dex/usePoolData.ts\` — query, input \`{ poolKey, queryOptions? }\`.
  Reads via the hub \`publicClient\`.
- \`packages/dapp-kit/src/hooks/dex/usePoolBalances.ts\` — query, input
  \`{ poolData, poolKey, spokeChainKey, userAddress, queryOptions? }\`. Throws on missing required
  fields. Hub wallet derived internally via \`assetService.getDeposit(poolToken, walletAddress,
  chainKey)\`.
- \`packages/dapp-kit/src/hooks/dex/usePositionInfo.ts\` — query, input
  \`{ tokenId, poolKey, queryOptions? }\`. Validates the position's poolKey against the input.
  Reads via the hub \`publicClient\`.
- \`packages/dapp-kit/src/hooks/dex/useDexAllowance.ts\` — query, input
  \`{ params: CreateAssetDepositParams<K> | undefined, queryOptions? }\`. Calls
  \`isAllowanceValid({ params, raw: true })\` internally — no \`walletProvider\` needed.
- \`packages/dapp-kit/src/hooks/dex/useLiquidityAmounts.ts\` — pure state hook, no SDK calls.
  Math via \`ClService.priceToTick\`/\`calculateAmount0FromAmount1\`/\`calculateAmount1FromAmount0\`.
- \`packages/dapp-kit/src/hooks/dex/useCreateDepositParams.ts\` /
  \`.../useCreateWithdrawParams.ts\` — pure helpers. Return the deposit/withdraw subset
  (\`{ asset, amount, poolToken, dst? }\`) without \`srcChainKey\`/\`srcAddress\`.
- \`packages/dapp-kit/src/hooks/dex/useCreateSupplyLiquidityParams.ts\` /
  \`.../useCreateDecreaseLiquidityParams.ts\` — pure helpers. Return CL-only fields without
  \`srcChainKey\`/\`srcAddress\`.

## Worked Example: full \`SimplePoolManager\` migration

**Before (v1):**

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);
const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

const { data: balances } = usePoolBalances({ poolData, poolKey, spokeProvider });
const supplyMutation = useSupplyLiquidity();

await supplyMutation.mutateAsync({
  params: createSupplyLiquidityParamsProps({ ... }),
  spokeProvider,
});
const [, hubTxHash] = supplyMutation.data!;        // throws if !ok
saveTokenIdToLocalStorage(
  await spokeProvider.walletProvider.getWalletAddress(),
  selectedChainId,
  ...,
);
\`\`\`

**After (v2):**

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);

const { data: balances } = usePoolBalances({
  poolData,
  poolKey,
  spokeChainKey: selectedChainId,
  userAddress: xAccount?.address,
});
const supplyMutation = useSupplyLiquidity();

const supplyParamsCore = createSupplyLiquidityParamsProps({ ... });
const result = await supplyMutation.mutateAsync({
  params: { ...supplyParamsCore, srcChainKey: selectedChainId, srcAddress: xAccount.address },
  walletProvider,
});
if (!result.ok) {
  setError(result.error instanceof Error ? result.error.message : 'Unknown error');
  return;
}
const [, hubTxHash] = result.value;
saveTokenIdToLocalStorage(xAccount.address, selectedChainId, ...);  // address from xAccount, not spokeProvider
\`\`\`

The five meaningful diffs:

1. \`useSpokeProvider(...)\` line is gone; \`useWalletProvider(...)\` value flows directly.
2. \`usePoolBalances\` props rename: \`{ spokeProvider }\` → \`{ spokeChainKey, userAddress }\`.
3. \`supplyMutation.mutateAsync\` vars: \`{ params, spokeProvider }\` →
   \`{ params: { ...core, srcChainKey, srcAddress }, walletProvider }\`. The pure helper's output
   is the deposit subset — caller spreads it and adds chain-key/address.
4. Mutation \`data\` is \`Result<[SpokeTxHash, HubTxHash]>\` — branch on \`result.ok\`; do not throw.
5. \`spokeProvider.walletProvider.getWalletAddress()\` reads → \`xAccount.address\` directly.

## Per-file Migration Checklist (apps/demo)

These are the actual edits that landed during the migration, not the planned ones:

- **\`App.tsx\`** — added \`DexPage\` import and a \`/dex\` route after the bridge route.
- **\`components/shared/header.tsx\`** — uncommented the \`/dex\` nav link entry.
- **\`pages/dex/page.tsx\`** — uncommented as-is. No SDK references.
- **\`components/dex/Setup.tsx\`** — uncommented; \`ChainId\` → \`SpokeChainKey\`. Removed
  \`ChainType\` import from \`@sodax/sdk\` (now in \`@sodax/types\`). No SDK calls.
- **\`components/dex/SelectPool.tsx\`** — pure UI; \`ChainId\` → \`SpokeChainKey\`. Removed empty
  trailing comma in import. No SDK calls.
- **\`components/dex/PoolInformation.tsx\`** — uncommented; dropped unused \`ClService\` type
  import. Pure-presentational.
- **\`components/dex/SimplePoolManager.tsx\`** — top-level pool manager:
  - Dropped \`useSpokeProvider\`. \`walletProvider = useWalletProvider(selectedChainId)\` flows
    directly to children and to mutation calls.
  - \`usePoolBalances({ poolData, poolKey, spokeProvider })\` →
    \`{ poolData, poolKey, spokeChainKey: selectedChainId, userAddress: xAccount?.address }\`.
  - Mutation calls: build \`params\` by spreading the helper output and adding
    \`{ srcChainKey: selectedChainId, srcAddress: xAccount.address }\`. Pass \`walletProvider\` as
    a sibling field. Branch on \`result.ok\`; on success extract \`[spokeTxHash, hubTxHash]\` from
    \`result.value\`.
  - \`saveTokenIdToLocalStorage\` reads \`xAccount.address\` (not
    \`spokeProvider.walletProvider.getWalletAddress()\`).
- **\`components/dex/ManageLiquidity.tsx\`** — biggest churn:
  - Dropped \`spokeProvider: SpokeProvider\` prop; replaced with
    \`walletProvider: IWalletProvider\` (typed against \`@sodax/wallet-sdk-react\`'s re-export).
  - \`getAssetsForPool(spokeProvider, poolKey)\` → \`getAssetsForPool(selectedChainId, poolKey)\`.
  - \`useDexAllowance({ params, spokeProvider })\` → \`useDexAllowance({ params })\` where
    \`params = createDepositParams0 ? { ...createDepositParams0, srcChainKey, srcAddress } : undefined\`.
  - \`useDexApprove\`/\`useDexDeposit\`/\`useDexWithdraw\` mutation calls: same shape — \`params\`
    spreads the helper output + adds \`srcChainKey\`/\`srcAddress\`; vars include \`walletProvider\`.
    Branch on \`result.ok\`.
  - \`spokeProvider.chainConfig.chain.name\` → \`baseChainInfo[selectedChainId]?.name\` (from
    \`@sodax/types\`).
  - \`useXBalances({ xService, xChainId, ... })\` — unchanged. \`xChainId\` is the one v2 hook that
    didn't rename.
- **\`components/dex/UserPositions.tsx\`** — dropped \`spokeProvider: SpokeProvider\` prop. Added
  \`chainKey: SpokeChainKey\` + \`walletProvider: IWalletProvider\` + \`userAddress: string\` props.
  \`useClaimRewards\`/\`useDecreaseLiquidity\` mutations: build \`params\` with \`srcChainKey: chainKey\`
  + \`srcAddress: userAddress\`; pass \`walletProvider\` in vars. Branch on \`result.ok\`.

## New Patterns Worth Knowing

### Pattern: \`raw: true\` for read-only allowance queries

The DEX SDK's \`assetService.isAllowanceValid<K, Raw>(_params: AssetDepositAction<K, Raw>)\`
intersects with \`WalletProviderSlot<K, Raw>\`, which forces consumers to either pass a wallet
provider (\`raw: false\`) or assert raw mode (\`raw: true\`). Since the underlying read does not
consult the wallet provider — only \`params.srcChainKey\`, \`params.amount\`, \`params.asset\`,
\`params.srcAddress\` — the cleanest hook implementation is:

\`\`\`ts
const result = await sodax.dex.assetService.isAllowanceValid({ params, raw: true });
if (!result.ok) throw result.error;  // matches useMMAllowance's "throw on !ok inside queryFn"
return result.value;
\`\`\`

### Pattern: Mint-vs-increase fan-out inside one \`useSupplyLiquidity\`

The shared \`UseCreateSupplyLiquidityParamsResult\` carries both \`tokenId?: string | bigint\` and
\`isValidPosition?: boolean\`. The hook branches inside \`mutationFn\`:

\`\`\`ts
const isIncrease = !!params.tokenId && !!params.isValidPosition;
if (isIncrease && params.tokenId !== undefined) {
  return sodax.dex.clService.increaseLiquidity({ params: <ClIncreaseLiquidityParams<K>>, raw: false, walletProvider, timeout });
}
return sodax.dex.clService.supplyLiquidity({ params: <ClSupplyParams<K>>, raw: false, walletProvider, timeout });
\`\`\`

The two SDK methods both return \`Promise<Result<[SpokeTxHash, HubTxHash]>>\`, so the hook's
return type unifies without casting.

### Pattern: Query-key invalidation moved into hooks

Every v2 mutation hook invalidates the canonical key set in its own \`onSuccess\`:

- \`['dex', 'poolBalances', srcChainKey, srcAddress]\` (deposit / withdraw / supplyLiquidity / decreaseLiquidity)
- \`['dex', 'allowance', srcChainKey, asset, amount]\` (deposit / approve)
- \`['dex', 'positionInfo']\` (supplyLiquidity / decreaseLiquidity / claimRewards) — broad key
  intentionally covers all positions.
- \`['dex', 'positionInfo', tokenId, poolKey]\` (claimRewards) — narrower invalidation for
  fee-only refresh.
- \`['xBalances', srcChainKey]\` (deposit / supplyLiquidity / withdraw on the spoke side).

Don't reintroduce per-modal invalidations unless there's a query key the hook doesn't already
handle.

### Pattern: Helper functions return only the helper-relevant subset

\`\`\`ts
// dex-utils.ts
export type DepositParamsCore = Omit<CreateAssetDepositParams<SpokeChainKey>, 'srcChainKey' | 'srcAddress'>;
export function createDepositParamsProps(...): DepositParamsCore {
  return { asset: ..., amount: ..., poolToken: ... };  // no chain-key, no address
}
\`\`\`

Consumer composes at the mutation site:

\`\`\`tsx
const params: CreateAssetDepositParams<typeof selectedChainId> = {
  ...createDepositParams0,
  srcChainKey: selectedChainId,
  srcAddress: xAccount.address as \`0x\${string}\`,
};
\`\`\`

This keeps the helper context-free and reusable across allowance / approve / deposit /
\`useXBalances\`-driven UI without re-deriving address every call.

## Pitfalls

1. **Forgetting \`raw: true\` on \`useDexAllowance\`** — TypeScript error
   \`Property 'walletProvider' is missing in type ...\`. Cause: \`isAllowanceValid\` requires
   \`WalletProviderSlot<K, Raw>\` and \`raw: false\` would force a wallet provider. Fix: pass
   \`{ params, raw: true }\` inside the queryFn.

2. **Calling \`getAssetsForPool(spokeProvider, poolKey)\`** — TypeScript error
   \`Argument of type 'SpokeProvider' is not assignable to parameter of type 'SpokeChainKey'\`.
   Cause: v2 signature is \`(srcChainKey, poolKey)\`. Fix: pass \`selectedChainId\` directly.

3. **\`getPools()\` no longer returns a Promise** — \`await sodax.dex.clService.getPools()\` is
   harmless (TS allows \`await\` on non-promise), but \`sodax.dex.clService.getPools().then(...)\`
   is a runtime error. Fix: drop the \`.then\`.

4. **Reading \`spokeProvider.chainConfig.chain.name\` for display** — gone in v2. Fix: use
   \`baseChainInfo[chainKey]?.name\` from \`@sodax/types\`, or the demo's existing
   \`getChainName(chainId)\` helper at \`apps/demo/src/lib/chains.ts\`.

5. **Reading \`spokeProvider.walletProvider.getWalletAddress()\`** — gone in v2. Fix: read
   \`xAccount.address\` from \`useXAccount(chainKey)\`.

6. **Re-introducing \`ConcentratedLiquidityError\` typed error generic** — gone. The mutation
   error type is plain \`Error\`; the CODE lives on \`error.message\` (e.g.
   \`'CLAIM_REWARDS_FAILED'\`), the underlying chain on \`error.cause\` (ES2022).

7. **Mutation hooks return \`Result<T>\`; do not \`try/catch\` and re-throw.** The v1 pattern of
   \`try { await mutateAsync(...); } catch (e) { setError(...) }\` only catches \`mutationFn\`
   exceptions (e.g. missing \`walletProvider\`). SDK-level failures land in \`result.ok === false\`
   — branch on that. The legacy try/catch can stay as a defense-in-depth net for unexpected
   throws.

8. **\`xAccount.address\` is typed as \`string\`, not \`Address\`.** The SDK action params
   (\`CreateAssetDepositParams<K>['srcAddress']\` etc.) require \`GetAddressType<K>\`, which for
   EVM chains is \`\`0x\${string}\`\` (viem's \`Address\`). Cast at the boundary:
   \`xAccount.address as \\\`0x\\\${string}\\\`\` — safe because \`useXAccount(evmChainKey)\` returns an
   EVM-shaped address. For non-EVM chains this cast won't typecheck (good — forces narrowing).

9. **\`useSupplyLiquidity\` mutation vars must include \`tokenId\` + \`isValidPosition\` for
   increase mode.** Forgetting either field silently routes through the mint path
   (\`supplyLiquidity\`) and creates a new NFT instead of increasing the existing one. The pure
   helper \`createSupplyLiquidityParamsProps\` carries both fields if you pass \`positionId\` /
   \`isValidPosition\` as inputs — propagate them.

10. **\`usePoolBalances\` is hub-side, not spoke-side.** It returns the user's deposited balance
    in the pool's hub wallet (via \`assetService.getDeposit\`). The spoke-side (wallet) balance
    comes from \`useXBalances\` with the pool spoke assets. \`ManageLiquidity\` displays both side
    by side.

11. **Helper-pure hooks (\`useCreateDepositParams\` etc.) return \`undefined\` when amount is 0
    or empty.** Guard the result before spreading: \`createDepositParams0 ? { ...createDepositParams0, srcChainKey, srcAddress } : undefined\`.
    The underlying mutation hook will also throw on missing params — the early check just
    avoids a noisy error message.

12. **\`assetService.deposit\` and \`withdraw\` always relay to hub.** The signed-mode method
    (\`deposit<K>(action: AssetDepositAction<K, false>)\`) wraps \`executeDeposit\` + relay. If
    you need spoke-only execution (e.g. for a dry-run or to control the relay yourself), use
    \`executeDeposit\` directly — but it's not surfaced through dapp-kit's \`useDexDeposit\`.

## Verification Recipe

When migrating a DEX consumer, follow this order:

1. \`pnpm --filter @sodax/dapp-kit build\` — must produce ESM + CJS + DTS without errors. The
   DEX hooks rely on \`SpokeChainKey\` + \`AssetDepositAction\` / \`ClSupplyAction\` flowing through
   \`@sodax/sdk\`; failures here usually mean a SDK-side type mismatch, not consumer issues.
2. **Phase order is load-bearing**: do \`packages/dapp-kit/src/utils/dex-utils.ts\` **first**,
   before re-enabling any of the pure-helper hooks (\`useCreateDepositParams\` etc.). The hooks
   \`import\` the helper functions and their associated \`*Core\` types; updating the hooks first
   produces a noisy cascade of import errors.
3. **Re-enable the dex barrel exports** (\`packages/dapp-kit/src/hooks/dex/index.ts\`,
   \`packages/dapp-kit/src/hooks/index.ts\`, \`packages/dapp-kit/src/utils/index.ts\`). The last
   one is easy to miss — the helper functions live in \`dex-utils.ts\` and only reach the demo
   if the utils barrel re-exports them.
4. \`pnpm --filter sodax-demo checkTs\` after each phase. Errors at this stage are almost always
   one of: missing \`srcChainKey\` / \`srcAddress\` in spread params, leftover \`spokeProvider\`
   prop, missing \`@sodax/wallet-sdk-core\` import (use \`@sodax/wallet-sdk-react\` instead), or a
   helper-function output that needs \`as \\\`0x\\\${string}\\\`\` casting on \`xAccount.address\`.
5. \`pnpm --filter sodax-demo lint && pnpm --filter sodax-demo build\` once \`checkTs\` is clean.
6. **Manual smoke test in dev** (\`pnpm dev:demo\`):
   - \`/solver\` and \`/money-market\` regression check — both should still work.
   - \`/dex\` route renders \`SimplePoolManager\`.
   - Connect an EVM wallet on a chain with a configured CL pool. Confirm via the \`SelectPool\`
     UI (or the console: \`sodax.dex.clService.getPools()\`).
   - Round-trip on a small testnet balance: select pool → deposit → approve →
     \`usePoolBalances\` updates → supply liquidity → confirm \`getMintPositionEvent\` saves the
     tokenId → \`usePositionInfo\` populates → claim rewards → decrease liquidity → withdraw.
   - Check the network/console for any \`Result<T>\` \`!ok\` errors that surface as user-facing
     error toasts in the modal.

## Out-of-scope

This migration intentionally did not touch:

- **Other demo features** — \`bridge\` / \`staking\` / \`partner-fee-claim\` / \`recovery\` pages and
  components remain commented; their nav links stay disabled. Their underlying
  \`@sodax/dapp-kit\` hook directories also remain commented in
  \`packages/dapp-kit/src/hooks/index.ts\` (\`./staking\`, \`./migrate\`).
- **\`apps/web\`** — separate, much wider migration. Many \`useSpokeProvider\` call sites and
  \`xChainId\` field reads still live there, plus the partner / migrate / pool / save pages have
  their own SDK-shape updates pending.
- **Raw-tx variants** (\`executeDeposit\`, \`executeWithdraw\`, \`executeSupplyLiquidity\`,
  \`executeIncreaseLiquidity\`, \`executeDecreaseLiquidity\`, \`executeClaimRewards\`) — only worth
  wiring when product needs sign-elsewhere flows.
- **\`isSodaAsXSodaInPool\` UX redirect to \`/staking\`** — kept inline in \`ManageLiquidity\`.
  Once the staking route is re-enabled, the \`NavLink to={'/staking'}\` link will resolve; today
  it 404s gracefully.
`;

export default SUMMARY;
