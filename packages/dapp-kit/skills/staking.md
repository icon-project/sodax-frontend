# Skill: Staking

SODA token staking via xSODA ERC-4626 vault.

**Depends on:** [setup.md](setup.md), [wallet-connectivity.md](wallet-connectivity.md)

## Hooks

### Mutations

| Hook | Purpose |
|------|---------|
| `useStake` | Stake SODA, receive xSODA |
| `useStakeApprove` | Approve SODA for staking |
| `useUnstake` | Request unstake (waiting period) |
| `useUnstakeApprove` | Approve xSODA for unstaking |
| `useInstantUnstake` | Instant unstake with slippage |
| `useInstantUnstakeApprove` | Approve xSODA for instant unstaking |
| `useClaim` | Claim SODA after waiting period |
| `useCancelUnstake` | Cancel pending unstake |

### Queries

| Hook | Purpose |
|------|---------|
| `useStakeAllowance` | Check SODA approval for staking |
| `useUnstakeAllowance` | Check xSODA approval for unstaking |
| `useInstantUnstakeAllowance` | Check xSODA approval for instant unstaking |
| `useStakingInfo` | Staking position (total staked, xSODA balance, value) |
| `useUnstakingInfo` | Pending unstake requests |
| `useUnstakingInfoWithPenalty` | Unstake requests with penalty calcs |
| `useStakingConfig` | Unstaking period, max penalty |
| `useStakeRatio` | SODA-to-xSODA exchange rate |
| `useInstantUnstakeRatio` | Instant unstake rate |
| `useConvertedAssets` | xSODA to SODA conversion |

## Staking Dashboard

```tsx
import { useStakingInfo, useStakingConfig, useStakeRatio } from '@sodax/dapp-kit';
import { formatUnits } from 'viem';

function StakingDashboard({ userAddress }: { userAddress: string }) {
  const { data: info } = useStakingInfo({ params: { userAddress } });
  const { data: config } = useStakingConfig({});
  const { data: ratio } = useStakeRatio({ params: { amount: 1000000000000000000n } });

  if (!info?.ok) return <div>Loading...</div>;
  return (
    <div>
      <p>Total Staked: {formatUnits(info.value.totalStaked, 18)} SODA</p>
      <p>Your xSODA: {formatUnits(info.value.userXSodaBalance, 18)}</p>
      <p>Your Value: {formatUnits(info.value.userXSodaValue, 18)} SODA</p>
      {ratio?.ok && <p>Rate: 1 SODA = {formatUnits(ratio.value[0], 18)} xSODA</p>}
      {config?.ok && <p>Unstaking: {(Number(config.value.unstakingPeriod) / 86400).toFixed(1)} days</p>}
    </div>
  );
}
```

## Stake

```tsx
import { useStake, useStakeAllowance, useStakeApprove, useSpokeProvider, useStakeRatio } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { parseUnits, formatUnits } from 'viem';

function StakeForm() {
  const [amount, setAmount] = useState('');
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const parsedAmount = amount ? parseUnits(amount, 18) : 0n;

  const { data: ratio } = useStakeRatio({ params: { amount: parsedAmount } });

  const stakeParams = parsedAmount > 0n
    ? { amount: parsedAmount, minReceive: ratio?.ok ? (ratio.value[0] * 95n) / 100n : 0n, account: '0x...' as Address, action: 'stake' as const }
    : undefined;

  const { data: allowance } = useStakeAllowance({ params: stakeParams, spokeProvider });
  const isApproved = allowance?.ok && allowance.value;
  const { mutateAsync: approve, isPending: isApproving } = useStakeApprove({ spokeProvider });
  const { mutateAsync: stake, isPending: isStaking } = useStake({ spokeProvider });

  const handleStake = async () => {
    if (!stakeParams) return;
    if (!isApproved) await approve({ params: stakeParams });
    const result = await stake({ params: stakeParams });
    if (result.ok) console.log('Staked:', result.value);
  };

  return (
    <div>
      <input placeholder="SODA amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      {ratio?.ok && <p>~{formatUnits(ratio.value[0], 18)} xSODA</p>}
      <button onClick={handleStake} disabled={isStaking || isApproving || !stakeParams}>
        {isApproving ? 'Approving...' : isStaking ? 'Staking...' : 'Stake'}
      </button>
    </div>
  );
}
```

## Unstake + Claim

```tsx
import { useUnstake, useUnstakingInfoWithPenalty, useClaim, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';

function UnstakePanel() {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const { data: info } = useUnstakingInfoWithPenalty({ spokeProvider });
  const { mutateAsync: claim } = useClaim({ spokeProvider });

  return (
    <div>
      {info?.ok && info.value.requestsWithPenalty.map((req, i) => (
        <div key={i}>
          <p>{formatUnits(req.claimableAmount, 18)} SODA claimable (penalty: {req.penaltyPercentage}%)</p>
          <button onClick={() => claim({ params: { requestId: req.request.requestId, amount: req.claimableAmount, action: 'claim' } })}>
            Claim
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Instant Unstake

```tsx
import { useInstantUnstake, useInstantUnstakeRatio, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';

function InstantUnstakeButton({ xSodaAmount }: { xSodaAmount: bigint }) {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const { data: ratio } = useInstantUnstakeRatio({ params: { amount: xSodaAmount } });
  const { mutateAsync: instantUnstake, isPending } = useInstantUnstake({ spokeProvider });

  return (
    <button disabled={isPending} onClick={() => instantUnstake({
      params: { amount: xSodaAmount, minAmount: ratio?.ok ? (ratio.value * 95n) / 100n : 0n, account: '0x...' as Address, action: 'instantUnstake' },
    })}>
      {isPending ? 'Processing...' : 'Instant Unstake'}
    </button>
  );
}
```

## Types

```typescript
type StakeParams = { amount: bigint; minReceive: bigint; account: Address; action: 'stake' };
type UnstakeParams = { amount: bigint; account: Address; action: 'unstake' };
type InstantUnstakeParams = { amount: bigint; minAmount: bigint; account: Address; action: 'instantUnstake' };
type ClaimParams = { requestId: bigint; amount: bigint; action: 'claim' };
type CancelUnstakeParams = { requestId: bigint; action: 'cancelUnstake' };
```

## Notes

- **Unstaking period**: configurable, check `useStakingConfig`.
- **Penalty**: linear from `maxPenalty` to 0 over the unstaking period.
- **Instant unstake**: no waiting, but pays slippage via StakingRouter.
