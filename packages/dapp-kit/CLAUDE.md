# packages/dapp-kit — React Query Hooks

## Mini Map

```
src/
├── hooks/
│   ├── swap/          # useQuote, useSwap, useSwapAllowance, useSwapApprove, useCancelSwap, ...
│   ├── mm/            # useSupply, useWithdraw, useBorrow, useRepay, useMMAllowance, useReservesData, ...
│   ├── staking/       # useStake, useUnstake, useInstantUnstake, useClaim, useStakingConfig, ...
│   ├── bridge/        # useBridge, useBridgeAllowance, useBridgeApprove, ...
│   ├── migrate/       # useMigrate, useMigrationAllowance, useMigrationApprove
│   ├── backend/       # useBackendIntentByHash, useBackendUserIntents, ... (~12 hooks)
│   ├── shared/        # ⭐ useSodaxContext, useDeriveUserWalletAddress, useEstimateGas, ...
│   ├── provider/      # useSpokeProvider, useHubProvider
│   ├── dex/           # DEX/pool hooks
│   └── bitcoin/       # Bitcoin-specific hooks
├── providers/
│   └── SodaxProvider.tsx  # SDK context provider
├── utils/
└── index.ts               # Re-exports everything
```

## Hook Patterns

### 1. Query Hook (data fetching)

```typescript
export function useFeatureData(
  params: ParamsType | undefined,
  provider?: ProviderType | undefined,
): UseQueryResult<DataType, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['feature', 'data', params],
    queryFn: async () => {
      if (!provider || !params) return defaultValue;
      const result = await sodax.feature.getData({ params, spokeProvider: provider });
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!provider && !!params,
    refetchInterval: 3000,  // Adjust per use case
  });
}
```

### 2. Mutation Hook (actions)

```typescript
export function useFeatureAction(
  spokeProvider: SpokeProviderType | undefined,
): UseMutationResult<ReturnType, Error, ParamsType> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ParamsType) => {
      if (!spokeProvider) throw new Error('Spoke provider not found');
      const result = await sodax.feature.action({ intentParams: params, spokeProvider });
      if (!result.ok) throw new Error(`Failed: ${result.error.code}`);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xBalances'] });
    },
  });
}
```

### 3. Approve Hook (custom return interface)

```typescript
interface UseApproveReturn {
  approve: (params: { params: ParamsType }) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

export function useFeatureApprove(
  params: ParamsType | undefined,
  spokeProvider: ProviderType | undefined,
): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const { mutateAsync: approve, isPending, error, reset } = useMutation({
    mutationFn: async ({ params }) => {
      const result = await sodax.feature.approve({ intentParams: params, spokeProvider });
      if (!result.ok) throw new Error('Failed to approve');
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature', 'allowance', params] });
    },
  });

  return { approve, isLoading: isPending, error, resetError: reset };
}
```

### 4. Allowance Hook

```typescript
export function useFeatureAllowance(
  params: ParamsType | undefined,
  spokeProvider: ProviderType | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['feature', 'allowance', params?.token],
    queryFn: async () => {
      const result = await sodax.feature.isAllowanceValid({ params, spokeProvider });
      if (!result.ok) return false;
      return result.value;
    },
    enabled: !!spokeProvider && !!params,
    refetchInterval: 2000,
  });
}
```

## Conventions

- **Always use `useSodaxContext()`** to get SDK instance — never instantiate SDK directly
- **Query keys**: `['feature', 'action', ...params]` — hierarchical for easy invalidation
- **Enabled guard**: `enabled: !!dep1 && !!dep2` — disable query when dependencies missing
- **Error handling**: Extract from `Result` type — `if (!result.ok) throw result.error`
- **BigInt in query keys**: Serialize with `useMemo` before passing to queryKey
- **Refetch intervals**: 2-5s for on-chain data, `false` for deterministic data

## Hook Naming

| Pattern | Purpose | Example |
|---------|---------|---------|
| `use[Action]` | Mutation (execute) | `useSwap`, `useSupply`, `useBridge` |
| `use[Action]Allowance` | Query (check) | `useSwapAllowance`, `useMMAllowance` |
| `use[Action]Approve` | Mutation (approve) | `useSwapApprove`, `useMMApprove` |
| `useQuote` | Query (real-time) | `useQuote` (3s refetch) |
| `useBackend[Entity]` | Query (backend API) | `useBackendIntentByHash` |

## Export Pattern

Feature index re-exports all hooks:
```typescript
// hooks/swap/index.ts
export * from './useSwap';
export * from './useQuote';
// ...
```

Root re-exports all features:
```typescript
// index.ts
export * from './hooks';
export * from './providers';
export * from './utils';
```

## Adding a New Feature Hook Group

1. Create `hooks/[feature]/` directory
2. Create hooks following the patterns above (query, mutation, allowance, approve)
3. Create `hooks/[feature]/index.ts` with `export * from './useXxx'` for each hook
4. Add `export * from './[feature]'` in `hooks/index.ts`
5. SDK method should return `Result<T, E>` — extract with `result.ok` check
