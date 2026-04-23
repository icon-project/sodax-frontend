# Skill: Migration

Legacy token migration (ICX, bnUSD, BALN).

**Depends on:** [setup.md](setup.md), [wallet-connectivity.md](wallet-connectivity.md)

## Hooks

| Hook | Type | Purpose |
|------|------|---------|
| `useMigrate` | Mutation | Execute migration or revert |
| `useMigrationAllowance` | Query | Check if approval is needed |
| `useMigrationApprove` | Mutation | Approve tokens |

## Migration Paths

| From | To | Reversible |
|------|----|-----------|
| ICX/wICX (ICON) | SODA (Sonic) | Yes |
| Legacy bnUSD (ICON/Sui/Stellar) | New bnUSD (EVM) | Yes |
| BALN (ICON) | SODA (Sonic) | No (with lock periods) |

## ICX to SODA

```tsx
import { useMigrate, useSpokeProvider } from '@sodax/dapp-kit';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/sdk';

function IcxMigration() {
  const spokeProvider = useSpokeProvider({ chainId: ICON_MAINNET_CHAIN_ID });
  const { mutateAsync: migrate, isPending } = useMigrate({ spokeProvider });

  const handleMigrate = async () => {
    const result = await migrate({
      params: {
        address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // wICX on ICON
        amount: 1000000000000000000n,
        to: '0x...', // recipient on Sonic
      },
      type: 'migrate',
    });
    if (result.ok) console.log('Migrated:', result.value);
  };

  return <button onClick={handleMigrate} disabled={isPending}>{isPending ? 'Migrating...' : 'Migrate ICX to SODA'}</button>;
}
```

## Revert (SODA back to wICX)

```tsx
import { useMigrate, useMigrationAllowance, useMigrationApprove, useSpokeProvider } from '@sodax/dapp-kit';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/sdk';

function RevertMigration() {
  const spokeProvider = useSpokeProvider({ chainId: SONIC_MAINNET_CHAIN_ID });

  const { data: allowance } = useMigrationAllowance({
    params: { amount: 1000000000000000000n, to: 'hx...' },
    type: 'revert',
    spokeProvider,
  });
  const isApproved = allowance?.ok && allowance.value;

  const { mutateAsync: approve, isPending: isApproving } = useMigrationApprove({ spokeProvider });
  const { mutateAsync: migrate, isPending: isMigrating } = useMigrate({ spokeProvider });

  const handleRevert = async () => {
    if (!isApproved) await approve({ params: { amount: 1000000000000000000n, to: 'hx...' }, type: 'revert' });
    const result = await migrate({ params: { amount: 1000000000000000000n, to: 'hx...' }, type: 'revert' });
    if (result.ok) console.log('Reverted:', result.value);
  };

  return <button onClick={handleRevert} disabled={isMigrating || isApproving}>{isApproving ? 'Approving...' : isMigrating ? 'Reverting...' : 'Revert to wICX'}</button>;
}
```

## BALN Swap (with Lock)

```tsx
const { mutateAsync: migrate } = useMigrate({ spokeProvider });

await migrate({
  params: {
    address: 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619', // BALN on ICON
    amount: 100000000000000000000n,
    to: '0x...',
    lockPeriod: 12, // months (0=0.5x, 6=0.75x, 12=1.0x, 24=1.5x)
  },
  type: 'migrate',
});
```

## Notes

- **Forward migrations** (ICX, bnUSD, BALN): no approval needed.
- **Reverse migrations** (SODA to wICX): approval required.
- **BALN locks**: longer lock = higher reward multiplier.
