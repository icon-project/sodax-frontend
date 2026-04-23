# Skill: Bitcoin (Radfi)

Bitcoin trading via the Radfi protocol. Authenticate, fund a trading wallet, trade, withdraw, and manage UTXOs.

**Depends on:** [setup.md](setup.md), [wallet-connectivity.md](wallet-connectivity.md)

## Hooks

### Session

| Hook | Type | Purpose |
|------|------|---------|
| `useRadfiAuth` | Mutation | Authenticate with Radfi via BIP322 signing |
| `useRadfiSession` | Utility | Manage full session lifecycle (login, refresh, auto-refresh) |

### Balance

| Hook | Type | Purpose |
|------|------|---------|
| `useBitcoinBalance` | Query | BTC balance for any address (sums UTXOs from mempool.space) |
| `useTradingWalletBalance` | Query | Trading wallet balance from Radfi API (confirmed + pending) |
| `useTradingWallet` | Utility | Get trading wallet address from persisted session |

### Operations

| Hook | Type | Purpose |
|------|------|---------|
| `useFundTradingWallet` | Mutation | Send BTC from personal wallet to trading wallet |
| `useRadfiWithdraw` | Mutation | Withdraw BTC from trading wallet to personal wallet |
| `useExpiredUtxos` | Query | Fetch UTXOs that need renewal (polls every 60s) |
| `useRenewUtxos` | Mutation | Renew expired UTXOs in trading wallet |

## Session Flow

Radfi requires authentication before any trading operation. The typical flow:

```tsx
import { useRadfiSession, useSpokeProvider } from '@sodax/dapp-kit';
import { BITCOIN_MAINNET_CHAIN_ID } from '@sodax/sdk';

function BitcoinAuth() {
  const spokeProvider = useSpokeProvider({ chainId: BITCOIN_MAINNET_CHAIN_ID });
  const { isAuthed, tradingAddress, login, isLoginPending } = useRadfiSession(spokeProvider);

  if (isAuthed) {
    return <p>Authenticated. Trading wallet: {tradingAddress}</p>;
  }

  return (
    <button onClick={login} disabled={isLoginPending}>
      {isLoginPending ? 'Signing...' : 'Login to Radfi'}
    </button>
  );
}
```

`useRadfiSession` handles the full lifecycle:
- On mount: refreshes token to validate existing session
- Every 5 min: auto-refreshes access token
- If refresh fails: clears session, sets `isAuthed = false`
- Session persisted in localStorage

## Check Balances

```tsx
import { useBitcoinBalance, useTradingWalletBalance, useTradingWallet, useSpokeProvider } from '@sodax/dapp-kit';
import { BITCOIN_MAINNET_CHAIN_ID } from '@sodax/sdk';

function BitcoinBalances({ walletAddress }: { walletAddress: string }) {
  const spokeProvider = useSpokeProvider({ chainId: BITCOIN_MAINNET_CHAIN_ID });
  const { tradingAddress } = useTradingWallet(walletAddress);

  // Personal wallet balance (from mempool.space)
  const { data: personalBalance } = useBitcoinBalance(walletAddress);

  // Trading wallet balance (from Radfi API)
  const { data: tradingBalance } = useTradingWalletBalance(spokeProvider, tradingAddress);

  return (
    <div>
      <p>Personal: {personalBalance?.toString() ?? '...'} sats</p>
      <p>Trading: {tradingBalance?.confirmed?.toString() ?? '...'} sats</p>
    </div>
  );
}
```

## Fund Trading Wallet

```tsx
import { useFundTradingWallet, useSpokeProvider } from '@sodax/dapp-kit';
import { BITCOIN_MAINNET_CHAIN_ID } from '@sodax/sdk';

function FundButton() {
  const spokeProvider = useSpokeProvider({ chainId: BITCOIN_MAINNET_CHAIN_ID });
  const { mutateAsync: fundWallet, isPending } = useFundTradingWallet(spokeProvider);

  const handleFund = async () => {
    const txId = await fundWallet(100_000n); // 100,000 satoshis
    console.log('Funded:', txId);
  };

  return (
    <button onClick={handleFund} disabled={isPending}>
      {isPending ? 'Funding...' : 'Fund Trading Wallet'}
    </button>
  );
}
```

## Withdraw from Trading Wallet

```tsx
import { useRadfiWithdraw, useSpokeProvider } from '@sodax/dapp-kit';
import { BITCOIN_MAINNET_CHAIN_ID } from '@sodax/sdk';

function WithdrawButton({ withdrawTo }: { withdrawTo: string }) {
  const spokeProvider = useSpokeProvider({ chainId: BITCOIN_MAINNET_CHAIN_ID });
  const { mutateAsync: withdraw, isPending } = useRadfiWithdraw(spokeProvider);

  const handleWithdraw = async () => {
    const result = await withdraw({
      amount: '10000',
      tokenId: '0:0',
      withdrawTo, // user's personal BTC address
    });
    console.log('Withdrawn:', result.txId, 'Fee:', result.fee);
  };

  return (
    <button onClick={handleWithdraw} disabled={isPending}>
      {isPending ? 'Withdrawing...' : 'Withdraw'}
    </button>
  );
}
```

## Manage Expired UTXOs

UTXOs in the trading wallet can expire. Check and renew them:

```tsx
import { useExpiredUtxos, useRenewUtxos, useSpokeProvider } from '@sodax/dapp-kit';
import { BITCOIN_MAINNET_CHAIN_ID } from '@sodax/sdk';

function UtxoManager({ tradingAddress }: { tradingAddress: string }) {
  const spokeProvider = useSpokeProvider({ chainId: BITCOIN_MAINNET_CHAIN_ID });
  const { data: expiredUtxos } = useExpiredUtxos(spokeProvider, tradingAddress);
  const { mutateAsync: renewUtxos, isPending } = useRenewUtxos(spokeProvider);

  if (!expiredUtxos?.length) return <p>No expired UTXOs</p>;

  const handleRenew = async () => {
    const txIdVouts = expiredUtxos.map((u) => u.txidVout);
    const txId = await renewUtxos({ txIdVouts });
    console.log('Renewed:', txId);
  };

  return (
    <div>
      <p>{expiredUtxos.length} expired UTXOs</p>
      <button onClick={handleRenew} disabled={isPending}>
        {isPending ? 'Renewing...' : 'Renew UTXOs'}
      </button>
    </div>
  );
}
```

## Notes

- **Authentication required** before any trading operation. `useRadfiSession` manages this automatically.
- **Trading wallet** is created during first authentication -- not a separate step.
- **PSBT signing flow**: withdraw and renew operations build an unsigned PSBT server-side, user signs it locally, then submits back for co-signing and broadcast.
- **Session tokens** are stored in localStorage keyed by wallet address. They're for API rate-limiting, not for accessing user assets.
