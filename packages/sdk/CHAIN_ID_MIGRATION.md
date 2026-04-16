# Chain ID Constant Migration Reference

This document maps the old individual chain ID constants to their new `ChainKeys.*` equivalents. Use this as a reference when migrating other packages (`wallet-sdk-core`, `wallet-sdk-react`, `dapp-kit`, `apps/web`, etc.).

## Import change

```diff
- import { SONIC_MAINNET_CHAIN_ID, ARBITRUM_MAINNET_CHAIN_ID, ... } from '@sodax/types';
+ import { ChainKeys } from '@sodax/types';
```

`ChainKeys` is defined in `packages/types/src/chains/chains.ts`.

## Mapping table

| Old constant | New expression | Value |
|---|---|---|
| `SONIC_MAINNET_CHAIN_ID` | `ChainKeys.SONIC_MAINNET` | `'sonic'` |
| `ARBITRUM_MAINNET_CHAIN_ID` | `ChainKeys.ARBITRUM_MAINNET` | `'0xa4b1.arbitrum'` |
| `AVALANCHE_MAINNET_CHAIN_ID` | `ChainKeys.AVALANCHE_MAINNET` | `'0xa86a.avax'` |
| `BASE_MAINNET_CHAIN_ID` | `ChainKeys.BASE_MAINNET` | `'0x2105.base'` |
| `BSC_MAINNET_CHAIN_ID` | `ChainKeys.BSC_MAINNET` | `'0x38.bsc'` |
| `ETHEREUM_MAINNET_CHAIN_ID` | `ChainKeys.ETHEREUM_MAINNET` | `'ethereum'` |
| `HYPEREVM_MAINNET_CHAIN_ID` | `ChainKeys.HYPEREVM_MAINNET` | `'hyper'` |
| `ICON_MAINNET_CHAIN_ID` | `ChainKeys.ICON_MAINNET` | `'0x1.icon'` |
| `INJECTIVE_MAINNET_CHAIN_ID` | `ChainKeys.INJECTIVE_MAINNET` | `'injective-1'` |
| `KAIA_MAINNET_CHAIN_ID` | `ChainKeys.KAIA_MAINNET` | `'0x2019.kaia'` |
| `LIGHTLINK_MAINNET_CHAIN_ID` | `ChainKeys.LIGHTLINK_MAINNET` | `'lightlink'` |
| `NEAR_MAINNET_CHAIN_ID` | `ChainKeys.NEAR_MAINNET` | `'near'` |
| `OPTIMISM_MAINNET_CHAIN_ID` | `ChainKeys.OPTIMISM_MAINNET` | `'0xa.optimism'` |
| `POLYGON_MAINNET_CHAIN_ID` | `ChainKeys.POLYGON_MAINNET` | `'0x89.polygon'` |
| `REDBELLY_MAINNET_CHAIN_ID` | `ChainKeys.REDBELLY_MAINNET` | `'redbelly'` |
| `SOLANA_MAINNET_CHAIN_ID` | `ChainKeys.SOLANA_MAINNET` | `'solana'` |
| `STACKS_MAINNET_CHAIN_ID` | `ChainKeys.STACKS_MAINNET` | `'stacks'` |
| `STELLAR_MAINNET_CHAIN_ID` | `ChainKeys.STELLAR_MAINNET` | `'stellar'` |
| `SUI_MAINNET_CHAIN_ID` | `ChainKeys.SUI_MAINNET` | `'sui'` |
| `BITCOIN_MAINNET_CHAIN_ID` | `ChainKeys.BITCOIN_MAINNET` | `'bitcoin'` |

## Regex for bulk replacement

Find: `(\w+)_MAINNET_CHAIN_ID`
Replace: `ChainKeys.$1_MAINNET`

Note: After replacing usages, also update import statements to remove the old constants and add `ChainKeys` to the `@sodax/types` import.
