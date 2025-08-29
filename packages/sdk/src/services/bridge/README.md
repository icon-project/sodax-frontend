# Bridge Service

The Bridge Service provides functionality to bridge tokens between different chains using the Sodax hub.

## Features

- **Bridge Check**: Check if two assets on different chains are bridgeable
- **Bridgeable Tokens**: Get all bridgeable tokens from a source token to a destination chain
- **Bridge Execution**: Execute bridge transactions between chains

## Usage Examples

### Checking if Assets are Bridgeable

```typescript
import { BridgeService } from '@sodax/sdk';
import { ARBITRUM_MAINNET_CHAIN_ID, BASE_MAINNET_CHAIN_ID } from '@sodax/types';

// Create bridge service instance
const bridgeService = new BridgeService(hubProvider, relayerApiEndpoint);

// Define source and destination tokens
const fromToken: XToken = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000', // Native ETH
  xChainId: ARBITRUM_MAINNET_CHAIN_ID,
};

const toToken: XToken = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000', // Native ETH
  xChainId: BASE_MAINNET_CHAIN_ID,
};

// Check if assets are bridgeable
const isBridgeable = BridgeService.isBridgeable(fromToken, toToken);

if (isBridgeable) {
  console.log('Assets are bridgeable!');
} else {
  console.log('Assets are not bridgeable');
}
```

### Getting All Bridgeable Tokens

```typescript
// Get all tokens that can be bridged from ETH on Arbitrum to Base chain
const fromToken: XToken = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
  xChainId: '0xa4b1.arbitrum',
};

const bridgeableTokens = BridgeService.getBridgeableTokens(fromToken, '0x2105.base');

console.log('Bridgeable tokens:', bridgeableTokens);
// This will include ETH on Base since they share the same vault
// You can use this to show users what tokens they can bridge to
```

### Example: ETH on Arbitrum to ETH on Base

```typescript
// ETH on Arbitrum
const arbitrumEth: XToken = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
  xChainId: '0xa4b1.arbitrum',
};

// ETH on Base
const baseEth: XToken = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
  xChainId: '0x2105.base',
};

// These should be bridgeable since they share the same vault
const isBridgeable = BridgeService.isBridgeable(arbitrumEth, baseEth);
console.log('ETH Arbitrum -> ETH Base bridgeable:', isBridgeable);
```

### Example: Different Assets (Not Bridgeable)

```typescript
// ETH on Arbitrum
const arbitrumEth: XToken = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
  xChainId: '0xa4b1.arbitrum',
};

// USDC on Base
const baseUsdc: XToken = {
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  address: '0x72E852545B024ddCbc5b70C1bCBDAA025164259C',
  xChainId: '0x2105.base',
};

// These should NOT be bridgeable since they use different vaults
const isBridgeable = BridgeService.isBridgeable(arbitrumEth, baseUsdc);
console.log('ETH Arbitrum -> USDC Base bridgeable:', isBridgeable);
```

## How It Works

1. **Vault Mapping**: Each asset on a spoke chain is mapped to a specific vault on the hub chain
2. **Bridgeability Check**: Two assets are bridgeable if they share the same vault address
3. **Cross-Chain Transfer**: When bridging, tokens are:
   - Deposited into the vault on the source chain
   - Withdrawn from the same vault on the destination chain
   - This ensures the same underlying asset representation across chains

## Supported Assets

The bridge service supports all assets defined in the `hubAssets` configuration, including:
- Native tokens (ETH, AVAX, etc.)
- Wrapped tokens (WETH, WAVAX, etc.)
- Stablecoins (USDC, USDT, bnUSD)
- Other major tokens (WBTC, SODA, etc.)

## Error Handling

All methods return a `Result` type that includes:
- `ok`: Boolean indicating success/failure
- `value`: The actual result data
- `error`: Error information if the operation failed

```typescript
const result = await bridgeService.isBridgeable(fromToken, toToken);

if (!result.ok) {
  console.error('Bridge check failed:', result.error);
  return;
}

console.log('Bridgeable:', result.value);
```
