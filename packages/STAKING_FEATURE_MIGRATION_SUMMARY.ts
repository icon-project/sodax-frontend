/**
 * SODAX Staking Feature Migration Summary (v1 → v2 SDK)
 * =====================================================
 *
 * React-side migration playbook for moving a Staking consumer (e.g. `apps/demo`) from the v1 SDK
 * shape (per-chain `*SpokeProvider` instances passed at hook-time, mutation hooks that throw on
 * `!ok`, `StakingError<Code>` typed errors) to the v2 SDK shape (chain-key + chain-narrowed
 * wallet provider, `Result<T>` returned as-is, action-discriminated `staking.approve` /
 * `staking.isAllowanceValid` methods).
 *
 * Sibling playbooks:
 *   - `packages/SWAP_FEATURE_MIGRATION_SUMMARY.ts` — read first if you haven't; covers the
 *     spoke-provider elimination, cast-at-boundary pattern, and `*_MAINNET_CHAIN_ID` →
 *     `ChainKeys.*` mapping that all features share.
 *   - `packages/MM_FEATURE_MIGRATION_SUMMARY.ts` — money-market migration; reference for the
 *     pure-mutation hook pattern.
 *   - `packages/DEX_FEATURE_MIGRATION_SUMMARY.ts` — DEX migration; reference for cross-chain
 *     mutations that return `Result<[SpokeTxHash, HubTxHash]>` and the `raw: true` allowance trick.
 *
 * For upstream rationale, see:
 *   - `packages/sdk/docs/ARCHITECTURE_REFACTOR_SUMMARY.md` — Concepts 1-6.
 *   - `packages/sdk/CHAIN_ID_MIGRATION.md` — `*_MAINNET_CHAIN_ID` → `ChainKeys.*` table.
 *
 * Diff scope: `apps/demo/src/{App.tsx,components/shared/header.tsx,pages/staking/page.tsx,
 *   components/staking/**,hooks/useSodaBalance.ts}` and a peer rewrite of
 *   `packages/dapp-kit/src/hooks/staking/`.
 */

const SUMMARY = String.raw`
# SODAX Staking Feature: v1 → v2 Migration Playbook

## TL;DR

The v2 staking hooks adopt the **canonical pure-mutation pattern** from \`useSwap\` /
\`useSupply\` / \`useDexDeposit\`: no hook-time arguments, all inputs (\`params\`,
\`walletProvider\`) passed via mutation vars, and \`data\` is the SDK \`Result<T>\` returned
**as-is** — branch on \`data?.ok\`. **Staking is fully cross-chain** — every action mutation
returns \`Result<[SpokeTxHash, HubTxHash]>\` (matches dex/bridge, not MM-style approve). The
underlying SDK methods accept \`srcChainKey: K extends SpokeChainKey\` + \`srcAddress\` and
relay spoke→hub via \`relayTxAndWaitPacket\` automatically.

The seven mechanical things you need to do:

1. Replace \`useSpokeProvider(chainKey, walletProvider)\` and the \`spokeProvider: SpokeProvider\`
   field on every params object with the wallet provider directly. Mutation hooks are now
   zero-arg; pass \`{ params, walletProvider }\` to \`mutateAsync\`.
2. Add \`srcChainKey\` + \`srcAddress\` to every \`StakeParams\` / \`UnstakeParams\` /
   \`InstantUnstakeParams\` / \`ClaimParams\` / \`CancelUnstakeParams\` you build. Every action
   params type now requires both fields.
3. The 3 approve hooks (\`useStakeApprove\` / \`useUnstakeApprove\` / \`useInstantUnstakeApprove\`)
   and 3 allowance hooks (\`useStakeAllowance\` / \`useUnstakeAllowance\` /
   \`useInstantUnstakeAllowance\`) **share one underlying SDK method each**
   (\`staking.approve\` / \`staking.isAllowanceValid\`) discriminated by \`params.action\`. Each
   hook injects the \`action\` literal internally — callers pass \`Omit<…Params, 'action'>\`.
4. Drop \`StakingError<Code>\` from mutation generics; type errors as plain \`Error\`. The CODE
   moved from \`error.code\` to \`error.message\`.
5. Allowance hooks pass \`raw: true\` to \`staking.isAllowanceValid\` so no \`walletProvider\`
   is needed (the underlying read does not consult \`walletProvider\`). Same trick as
   \`useDexAllowance\`.
6. Info hooks rename \`(spokeProvider)\` arg → \`{ srcAddress, srcChainKey, queryOptions? }\`
   typed input. The 3 cross-chain info hooks (\`useStakingInfo\`, \`useUnstakingInfo\`,
   \`useUnstakingInfoWithPenalty\`) all call \`getStakingInfoFromSpoke\` /
   \`getUnstakingInfo\` / \`getUnstakingInfoWithPenalty\` with \`(srcAddress, srcChainKey)\`
   and derive the hub wallet internally. Hub-only hooks (\`useStakingConfig\`,
   \`useStakeRatio\`, \`useInstantUnstakeRatio\`, \`useConvertedAssets\`) take \`amount\` only
   (or no input).
7. Demo's \`useSodaBalance\` helper becomes a thin wrapper around \`useXBalances\`. Drop the
   \`spokeProvider\` arg; pass \`(chainKey, userAddress)\`. The hook looks up the SODA token
   via \`sodax.config.findSupportedTokenBySymbol(chainKey, 'SODA')\`.

## Staking-specific divergences from swap / MM / dex

Trip-wires that catch staking migrators specifically:

1. **Action-discriminator inside one SDK method.** Unlike dex (\`assetService.approve\` is
   per-deposit) or MM (\`moneyMarket.approve\` is action-discriminated but exposed via a
   single dapp-kit hook \`useMMApprove\`), staking exposes \`staking.approve\` as a single
   action-discriminated method **but** dapp-kit splits it into 3 hooks for v1 ergonomic parity
   (\`useStakeApprove\`, \`useUnstakeApprove\`, \`useInstantUnstakeApprove\`). Each hook injects
   the \`action\` literal internally; callers don't pass \`action\` in vars. Same split for the
   3 allowance hooks. **This was a deliberate choice** to keep v1 demo call-sites readable —
   if you're building a fresh consumer, calling \`sodax.staking.approve({ params, raw: false,
   walletProvider })\` directly with the right \`action\` is also fine.

2. **All 5 staking actions are cross-chain.** Even though staking writes happen on the hub
   (Sonic), the SDK's \`stake\` / \`unstake\` / \`instantUnstake\` / \`claim\` / \`cancelUnstake\`
   methods all accept \`srcChainKey: K extends SpokeChainKey\` and relay spoke→hub via
   \`relayTxAndWaitPacket\` when \`srcChainKey !== hub\`. **Return type is always
   \`Result<[SpokeTxHash, HubTxHash]>\`** — same as dex/bridge, never MM-style
   \`Result<TxReturnType<K, false>>\`. Do not treat staking as hub-only.

3. **\`staking.approve\` returns \`Result<TxReturnType<K, false>>\`, not a tx-pair.** Approve is
   spoke-only (no relay) — it just spends ERC-20 allowance on the source chain. So the 3
   approve hooks return \`Result<TxReturnType<K, false>>\` (a single tx hash), unlike the 5
   action mutations that return \`Result<[SpokeTxHash, HubTxHash]>\`.

4. **Info getter signatures changed.** v1 hooks took a single \`spokeProvider\` arg; v2 takes
   typed \`{ srcAddress, srcChainKey }\`. The SDK derives the hub wallet from those internally
   via \`HubService.getUserHubWalletAddress\`. \`useStakingInfo\` calls
   \`getStakingInfoFromSpoke\` (not \`getStakingInfo\`, which takes a hub-already address).

5. **Hub-only / amount-only query hooks have no chain context.** \`useStakingConfig\` (no
   args), \`useStakeRatio({ amount })\`, \`useInstantUnstakeRatio({ amount })\`,
   \`useConvertedAssets({ amount })\` — none of these accept \`srcChainKey\` or
   \`spokeProvider\`. The vault state and penalty parameters live entirely on the hub.

6. **No raw-tx variants exposed in dapp-kit.** The SDK has \`createStakeIntent\` /
   \`createUnstakeIntent\` / etc. (\`Raw extends boolean\`), but those are spoke-only (no
   relay) and not surfaced through dapp-kit. Only worth wiring when product needs
   sign-elsewhere flows.

## Type / Symbol Rename Cheat Sheet

### Field-level renames

| Type | Old shape | New shape | Notes |
|---|---|---|---|
| \`StakeParams<K>\` | \`{ amount, account, minReceive, action: 'stake' }\` | \`{ srcChainKey, srcAddress, amount, minReceive, action: 'stake' }\` | Generic \`K\` carries the literal chain key. \`account\` field renamed to \`srcAddress\`. |
| \`UnstakeParams<K>\` | \`{ amount, account, action: 'unstake' }\` | \`{ srcChainKey, srcAddress, amount, action: 'unstake' }\` | Same rename. |
| \`InstantUnstakeParams<K>\` | \`{ amount, minAmount, account, action: 'instantUnstake' }\` | \`{ srcChainKey, srcAddress, amount, minAmount, action: 'instantUnstake' }\` | Same. |
| \`ClaimParams<K>\` | \`{ requestId, amount, action: 'claim' }\` | \`{ srcChainKey, srcAddress, requestId, amount, action: 'claim' }\` | Adds chain context. |
| \`CancelUnstakeParams<K>\` | \`{ requestId, action: 'cancelUnstake' }\` | \`{ srcChainKey, srcAddress, requestId, action: 'cancelUnstake' }\` | Adds chain context. |
| \`useStakingInfo\` props | \`(spokeProvider)\` arg | \`{ srcAddress, srcChainKey, queryOptions? }\` | v1 took a single positional arg; v2 takes a typed object. |
| \`useUnstakingInfo\` / \`useUnstakingInfoWithPenalty\` props | \`(userAddress, spokeProvider)\` | \`{ srcAddress, srcChainKey, queryOptions? }\` | v1 ignored \`userAddress\` and used \`spokeProvider\` internally; v2 reads \`srcAddress\` directly. |
| \`useStakeApprove\` etc. mutation vars | \`{ params: <Params with action> }\` (and hook took \`spokeProvider\`) | \`{ params: Omit<<Params>, 'action'>, walletProvider }\` | Hook is zero-arg; \`action\` injected internally. |
| \`useStake\` etc. mutation vars | \`{ params: <Params> }\` (and hook took \`spokeProvider\`) | \`Omit<<Action>Action<K, false>, 'raw'>\` (i.e. \`{ params, walletProvider, skipSimulation?, timeout? }\`) | Includes the \`action\` literal in \`params\`; hook does not inject it. |

### Deleted symbols (replace, don't shim)

- \`useSpokeProvider\` — gone from \`@sodax/dapp-kit\`. Pass \`(chainKey, walletProvider)\` directly
  via mutation vars. \`useWalletProvider(chainKey)\` from \`@sodax/wallet-sdk-react\` returns the
  right type.
- \`SpokeProvider\` union and every \`*SpokeProvider\` class — gone. Demo's v1 \`useSodaBalance\`
  reached into \`EvmSpokeProvider\`/\`SonicSpokeProvider\` via \`instanceof\` checks; v2
  rewrites the helper around \`useXBalances\` from dapp-kit.
- \`StakingError<Code>\` and the rest of the module-error type-guard family — branch on
  \`error.message\` (e.g. \`'STAKE_FAILED'\`, \`'UNSTAKE_FAILED'\`) and/or \`error.cause\`. SDK
  CLAUDE.md "Error message convention" has the canonical taxonomy.
- v1 instance-method check \`spokeProvider instanceof SonicSpokeProvider\` — replace with
  \`isHubChainKeyType(chainKey)\` (from \`@sodax/types\`) where needed.

### New v2 types worth knowing about

| Type | Purpose |
|---|---|
| \`StakeAction<K, Raw>\` / \`UnstakeAction<K, Raw>\` / \`InstantUnstakeAction<K, Raw>\` / \`ClaimAction<K, Raw>\` / \`CancelUnstakeAction<K, Raw>\` | \`SpokeExecActionParams<K, Raw, *Params<K>>\` — the discriminated union shape that pairs \`raw\` with \`walletProvider\`. |
| \`StakingParamsUnion<K, Raw>\` | Union of all 5 action params; consumed by \`staking.approve\` / \`staking.isAllowanceValid\`. |
| \`UnstakeRequestWithPenalty\` | \`UserUnstakeInfo & { penalty, penaltyPercentage, claimableAmount }\` returned by \`getUnstakingInfoWithPenalty\`. |

## The Pure-Mutation Pattern (Staking edition)

### v1 (before)

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);
const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

const { mutateAsync: stake } = useStake(spokeProvider);
const { mutateAsync: approveStake } = useStakeApprove(spokeProvider);
const { data: isStakeAllowed } = useStakeAllowance(
  { amount, account: account.address as \`0x\${string}\`, minReceive },
  spokeProvider,
);

await stake({ amount, account: account.address as \`0x\${string}\`, minReceive, action: 'stake' });  // throws on !ok
\`\`\`

### v2 (after)

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);
const srcAddress = account?.address as \`0x\${string}\` | undefined;

const { mutateAsync: stake } = useStake();
const { mutateAsync: approveStake } = useStakeApprove();
const { data: isStakeAllowed } = useStakeAllowance({
  params: srcAddress ? { srcChainKey: selectedChainId, srcAddress, amount, minReceive } : undefined,
});

const result = await stake({
  params: { srcChainKey: selectedChainId, srcAddress, amount, minReceive, action: 'stake' },
  walletProvider,
});
if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  // …
}
\`\`\`

The cast-at-boundary pattern from the swap migration applies as needed — but typically a
single \`const srcAddress = xAccount?.address as \\\`0x\\\${string}\\\` | undefined\` extracted at
component scope is enough.

## Dapp-kit Hook API Contract (v2)

Link to source rather than transcribe so this doc doesn't drift:

- \`packages/dapp-kit/src/hooks/staking/useStake.ts\` — generic \`<K>\`, mutation input
  \`Omit<StakeAction<K, false>, 'raw'>\`, returns \`Result<[SpokeTxHash, HubTxHash]>\`. Same
  shape for \`useUnstake\`, \`useInstantUnstake\`, \`useClaim\`, \`useCancelUnstake\`.
- \`packages/dapp-kit/src/hooks/staking/useStakeApprove.ts\` — generic \`<K>\`, mutation vars
  \`{ params: Omit<StakeParams<K>, 'action'>, walletProvider }\`, returns
  \`Result<TxReturnType<K, false>>\`. Hook injects \`action: 'stake'\` internally. Same shape
  for \`useUnstakeApprove\` (\`'unstake'\`) and \`useInstantUnstakeApprove\` (\`'instantUnstake'\`).
- \`packages/dapp-kit/src/hooks/staking/useStakeAllowance.ts\` — generic \`<K>\`, query input
  \`{ params: Omit<StakeParams<K>, 'action'> | undefined, queryOptions? }\`. Calls
  \`isAllowanceValid({ params, raw: true })\` internally. 5s \`refetchInterval\`,
  \`gcTime: 0\`. Same shape for \`useUnstakeAllowance\` and \`useInstantUnstakeAllowance\`.
- \`packages/dapp-kit/src/hooks/staking/useStakingInfo.ts\` /
  \`useUnstakingInfo.ts\` / \`useUnstakingInfoWithPenalty.ts\` — query input
  \`{ srcAddress, srcChainKey, queryOptions? }\`. 5s \`refetchInterval\`. Throws on \`!ok\`.
- \`packages/dapp-kit/src/hooks/staking/useStakingConfig.ts\` — no args, query, 30s
  \`refetchInterval\`. Throws on \`!ok\`.
- \`packages/dapp-kit/src/hooks/staking/useStakeRatio.ts\` /
  \`useInstantUnstakeRatio.ts\` / \`useConvertedAssets.ts\` — query input \`{ amount, queryOptions? }\`.
  10s \`refetchInterval\`. \`enabled: amount !== undefined\`.

## Worked Example: full \`StakingPage\` migration

**Before (v1):**

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);
const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

const { mutateAsync: stake } = useStake(spokeProvider);
const { mutateAsync: approveStake } = useStakeApprove(spokeProvider);
const { data: isStakeAllowed } = useStakeAllowance(
  stakeAmount && sodaToken && account.address
    ? { amount, account: account.address as \`0x\${string}\`, minReceive }
    : undefined,
  spokeProvider,
);

await stake({ amount, account, minReceive, action: 'stake' });   // throws on !ok
\`\`\`

**After (v2):**

\`\`\`tsx
const walletProvider = useWalletProvider(selectedChainId);
const srcAddress = account?.address as \`0x\${string}\` | undefined;

const { mutateAsync: stake } = useStake();
const { mutateAsync: approveStake } = useStakeApprove();
const { data: isStakeAllowed } = useStakeAllowance({
  params: stakeAmount && sodaToken && srcAddress
    ? { srcChainKey: selectedChainId, srcAddress, amount, minReceive }
    : undefined,
});

const result = await stake({
  params: { srcChainKey: selectedChainId, srcAddress, amount, minReceive, action: 'stake' },
  walletProvider,
});
if (!result.ok) { setError(...); return; }
const [spokeTxHash, hubTxHash] = result.value;
\`\`\`

The five meaningful diffs:

1. \`useSpokeProvider(...)\` line is gone; \`useWalletProvider(...)\` value flows directly.
2. Hooks are zero-arg; previous hook-time \`spokeProvider\` arg is dropped.
3. \`account: 0x…\` → \`srcChainKey + srcAddress\`. Allowance hook props become \`{ params }\`.
4. Mutation result is \`Result<[SpokeTxHash, HubTxHash]>\` — branch on \`result.ok\`; do not throw.
5. Approve / allowance hook vars omit the \`action\` field (hook injects it).

## Per-file Migration Checklist (apps/demo)

These are the actual edits that landed during the migration, not the planned ones:

- **\`App.tsx\`** — added \`StakingPage\` import and a \`/staking\` route after the dex route.
- **\`components/shared/header.tsx\`** — uncommented the \`/staking\` nav link entry.
- **\`pages/staking/page.tsx\`** — biggest file (~600 lines):
  - Dropped \`useSpokeProvider\`. \`walletProvider = useWalletProvider(selectedChainId)\` flows
    directly to mutation vars.
  - Extracted \`srcAddress = account?.address as \\\`0x\\\${string}\\\` | undefined\` once at
    component scope; reused in every params object.
  - Replaced \`spokeChainConfig[selectedChainId]?.supportedTokens.SODA\` lookup with
    \`sodax.config.findSupportedTokenBySymbol(selectedChainId, 'SODA')\` (cleaner v2 SDK API).
  - Removed all \`as unknown as Record<...>\` casts on the SODA token.
  - Mutation calls — drop the \`spokeProvider\` hook-time arg; pass \`{ params, walletProvider }\`
    to \`mutateAsync\`. Build \`params\` with \`srcChainKey: selectedChainId\` + \`srcAddress\`.
    Branch on \`result.ok\` for every mutation.
  - Allowance hook calls — \`useStakeAllowance({ params: { srcChainKey, srcAddress, amount,
    minReceive } })\` (no \`spokeProvider\`, no \`action\` field). Same for unstake / instant.
  - Approve hook calls — same shape, vars are \`{ params: <without action>, walletProvider }\`.
  - Removed all top-level \`console.log\` debug noise that the v1 version had sprinkled in.
- **\`components/staking/StakingConfiguration.tsx\`** — uncommented as-is. No SDK call shape
  change (\`useStakingConfig()\` is hub-only no-args).
- **\`components/staking/SodaBalance.tsx\`** — dropped \`spokeProvider\` prop. \`useSodaBalance\`
  signature shrunk to \`(chainKey, userAddress)\`.
- **\`components/staking/StakingInfo.tsx\`** — props rename: \`{ spokeProvider }\` →
  \`{ srcAddress, srcChainKey }\`. Hook call: \`useStakingInfo({ srcAddress, srcChainKey })\`.
- **\`components/staking/UnstakingInfo.tsx\`** — props rename: \`{ spokeProvider, userAddress }\`
  → \`{ srcChainKey, srcAddress, walletProvider }\`. Mutation calls (\`useClaim\` /
  \`useCancelUnstake\`) build \`params\` with full \`{ srcChainKey, srcAddress, action: 'claim' |
  'cancelUnstake', requestId, amount? }\`.
- **\`hooks/useSodaBalance.ts\`** — rewritten as a thin wrapper around \`useXBalances\` from
  \`@sodax/dapp-kit\`. Drops \`spokeProvider\` arg; takes \`(chainKey, userAddress)\` only.
  Looks up the SODA token via \`sodax.config.findSupportedTokenBySymbol\`.

## New Patterns Worth Knowing

### Pattern: \`raw: true\` for read-only allowance queries

Same trick as dex. \`staking.isAllowanceValid<K, Raw>(_params: StakingParamsUnion<K, Raw>)\`
intersects with \`WalletProviderSlot<K, Raw>\`, which forces consumers to either pass a wallet
provider (\`raw: false\`) or assert raw mode (\`raw: true\`). Since the underlying read does
not consult \`walletProvider\`, the cleanest hook implementation is:

\`\`\`ts
const result = await sodax.staking.isAllowanceValid({
  params: { ...params, action: 'stake' },
  raw: true,
});
if (!result.ok) throw result.error;  // matches useMMAllowance's "throw on !ok inside queryFn"
return result.value;
\`\`\`

### Pattern: Action-discriminator routing inside a single SDK method

\`staking.approve\` and \`staking.isAllowanceValid\` both take a single
\`StakingParamsUnion<K, Raw>\` discriminated by \`params.action\`. Internally the SDK
branches on the action to determine which token to approve (SODA for \`'stake'\`, xSODA for
\`'unstake'\` and \`'instantUnstake'\`). Dapp-kit splits this into 6 thin per-action wrappers
(\`useStakeApprove\` etc.) for v1 ergonomic parity — each hook injects the literal so
callers don't repeat themselves. \`Omit<…Params, 'action'>\` on the vars makes the contract
explicit.

### Pattern: Cross-chain mutations always return tx-pairs

Every action (\`stake\`, \`unstake\`, \`instantUnstake\`, \`claim\`, \`cancelUnstake\`) returns
\`Result<[SpokeTxHash, HubTxHash]>\` because the SDK internally calls
\`relayTxAndWaitPacket\` whenever \`srcChainKey !== hubChainKey\`. **Always destructure as
\`[spokeTxHash, hubTxHash]\`.** Even if the user happens to be on the hub chain, the SDK
returns \`[hubTxHash, hubTxHash]\` for shape consistency.

### Pattern: Query-key invalidation moved into hooks

Every v2 mutation hook invalidates the canonical key set in its own \`onSuccess\`:

- \`['staking', 'info', srcChainKey, srcAddress]\` — staking + cancelUnstake mutations
- \`['staking', 'unstakingInfo']\` / \`['staking', 'unstakingInfoWithPenalty']\` — unstake /
  claim / cancelUnstake mutations
- \`['staking', 'allowance', srcChainKey, '<action>']\` — corresponding approve mutation
- \`['staking', 'stakeRatio']\` / \`['staking', 'convertedAssets']\` — stake mutation
- \`['staking', 'instantUnstakeRatio']\` — instant-unstake mutation
- \`['xBalances', srcChainKey]\` — stake / claim / instant-unstake mutations (spoke-side
  balance changes)

Don't reintroduce per-modal invalidations unless there's a query key the hook doesn't already
handle.

### Pattern: \`useSodaBalance\` thin wrapper around \`useXBalances\`

The v1 \`useSodaBalance\` reached into \`EvmSpokeProvider\` / \`SonicSpokeProvider\` instances
via \`instanceof\` checks and called \`spokeProvider.publicClient.readContract\`. v2 deletes
the spoke-provider classes; the cleanest replacement is a thin wrapper that delegates to
\`useXBalances\`:

\`\`\`ts
export function useSodaBalance(chainKey, userAddress): bigint | undefined {
  const { sodax } = useSodaxContext();
  const sodaToken = sodax.config.findSupportedTokenBySymbol(chainKey, 'SODA');
  const xService = useXService(getXChainType(chainKey));
  const { data: balances } = useXBalances({
    xService,
    xChainId: chainKey,
    xTokens: sodaToken ? [sodaToken] : [],
    address: userAddress,
  });
  return sodaToken ? balances?.[sodaToken.address] : undefined;
}
\`\`\`

Loses the explicit \`isLoading\` flag; callers can derive it from \`balance === undefined\`.

## Pitfalls

1. **Forgetting \`raw: true\` on the allowance query** — TypeScript error
   \`Property 'walletProvider' is missing in type ...\`. Cause: \`isAllowanceValid\` requires
   \`WalletProviderSlot<K, Raw>\` and \`raw: false\` would force a wallet provider. Fix:
   \`{ params, raw: true }\` inside the queryFn.

2. **Using \`Result<TxReturnType<K, false>>\` for stake/unstake mutations** — would match
   \`useMMApprove\`'s shape. **Wrong.** Staking is cross-chain — the correct return is
   \`Result<[SpokeTxHash, HubTxHash]>\`. Only the 3 approve hooks return single-tx-hash.

3. **Reading \`spokeProvider.chainConfig.chain.name\` for display** — gone in v2. Use
   \`baseChainInfo[chainKey]?.name\` from \`@sodax/types\`, or the demo's \`chainIdToChainName\`
   helper at \`apps/demo/src/constants.ts\`.

4. **Reintroducing \`StakingError<Code>\` typed-error generic** — gone. The mutation
   error type is plain \`Error\`; the CODE lives on \`error.message\`, the underlying chain
   on \`error.cause\` (ES2022).

5. **Mutation hooks return \`Result<T>\`; do not \`try/catch\` and re-throw.** The v1 pattern
   of \`try { await mutateAsync(...); } catch (e) { ... }\` only catches \`mutationFn\`
   exceptions (e.g. missing \`walletProvider\`). SDK-level failures land in \`result.ok ===
   false\` — branch on that. The legacy try/catch can stay as defense-in-depth for
   unexpected throws.

6. **\`xAccount.address\` is \`string\`, not \`Address\`.** Cast at the boundary:
   \`xAccount.address as \\\`0x\\\${string}\\\`\` — safe because \`useXAccount(evmChainKey)\` returns
   an EVM-shaped address. Extract once at component scope (\`const srcAddress = ...\`) and
   reuse — don't repeat the cast 8 times.

7. **Each per-action approve/allowance hook injects \`params.action\` internally.** Callers
   pass \`Omit<…Params, 'action'>\`. If you accidentally leave \`action: 'stake'\` in the
   params object, TypeScript will reject it (the \`Omit\` removed the field from the vars
   shape).

8. **\`useSodaBalance\`'s isLoading flag is gone.** v1 returned \`{ data, isLoading }\`; v2
   returns \`bigint | undefined\` (loading inferred from \`undefined\`). Adjust call sites:
   \`isLoadingSodaBalance = sodaBalance === undefined\`.

9. **\`useStakingInfo({ srcAddress, srcChainKey })\` calls \`getStakingInfoFromSpoke\`, not
   \`getStakingInfo\`.** The latter takes a hub-already address and is not surfaced via
   dapp-kit. The former derives the hub wallet from \`srcChainKey\` + \`srcAddress\`
   internally.

10. **Demo's \`scaleTokenAmount\` already exists at \`apps/demo/src/lib/utils.ts\` —
    don't reimplement it.** Same for \`formatTokenAmount\` and \`getTimeRemaining\`.

11. **The 5 mutation hooks are zero-arg.** Calling \`useStake(spokeProvider)\` (v1 shape) is
    a TS error. Call \`useStake()\` and pass \`walletProvider\` in mutation vars.

12. **\`UnstakingInfo\` no longer accepts \`userAddress\` separately.** v1 took both
    \`spokeProvider\` and \`userAddress\` props but ignored \`userAddress\` inside the queryFn.
    v2 takes \`{ srcAddress, srcChainKey }\` and the hook reads \`srcAddress\` for real.

## Verification Recipe

When migrating a Staking consumer, follow this order:

1. \`pnpm --filter @sodax/dapp-kit build\` — must produce ESM + CJS + DTS without errors.
   Failures here usually mean a SDK-side type mismatch (e.g. \`StakeAction\` shape change),
   not consumer issues.
2. **Phase order is load-bearing**: do all 18 hooks in \`packages/dapp-kit/src/hooks/staking/\`
   **first**, then re-enable the barrel exports, then build dapp-kit. Demo migration depends
   on all 18 exports being live.
3. \`pnpm --filter @sodax/dapp-kit checkTs\` after the hooks. Then \`pnpm --filter sodax-demo
   checkTs\`. Errors at the demo stage are almost always one of: missing \`srcChainKey\` /
   \`srcAddress\` in params, leftover \`spokeProvider\` arg on a hook call, leftover
   \`action: 'stake'\` field in approve/allowance params, or \`xAccount.address\` casting
   issues.
4. \`pnpm --filter sodax-demo lint && pnpm --filter sodax-demo build\` once \`checkTs\` is clean.
5. **Manual smoke test in dev** (\`pnpm dev:demo\`):
   - \`/solver\`, \`/money-market\`, \`/bridge\`, \`/dex\` regression checks — all should still work.
   - Connect an EVM wallet on a chain that has SODA configured.
   - \`/staking\` route renders the page; chain selector + setup visible.
   - Round-trip: enter stake amount → check \`useStakeAllowance\` → approve → stake → confirm
     \`useStakingInfo\` updates with new xSODA balance.
   - Unstake flow: enter unstake amount → approve → unstake → confirm
     \`useUnstakingInfoWithPenalty\` shows the new request → wait or instant-unstake → claim
     or cancel.
   - Watch \`useStakeRatio\` / \`useInstantUnstakeRatio\` / \`useConvertedAssets\` populate live
     as amount inputs change.
   - Check the network/console for any \`Result<T>\` \`!ok\` errors.

## Out-of-scope

This migration intentionally did not touch:

- **Other demo features** — the only commented-out demo feature now is \`/migrate\` (and the
  \`partner-fee-claim\` / \`recovery\` legacy pages). Their underlying \`@sodax/dapp-kit\` hook
  directories also remain commented in \`packages/dapp-kit/src/hooks/index.ts\`.
- **\`apps/web\`** — separate, much wider migration. Many \`useSpokeProvider\` call sites and
  \`xChainId\` field reads still live there, plus the partner / migrate / pool / save pages
  have their own SDK-shape updates pending.
- **Raw-tx variants** (\`createStakeIntent\`, \`createUnstakeIntent\`, etc.) — only worth wiring
  when product needs sign-elsewhere flows.
- **Refactoring the demo's \`StakingPage\` cognitive complexity** — the file inherits a
  640-line single-component layout from v1 with nested ternaries and a single \`useStake\`
  page-level state machine. A future cleanup pass could extract sub-forms (StakeForm,
  UnstakeForm, InstantUnstakeForm), but that's out of scope for this migration.
- **Consolidating the 6 per-action approve/allowance hooks into 2 unified hooks** — was
  considered but rejected; v1 API names preserved per project decision.
`;

export default SUMMARY;
