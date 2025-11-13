# How to Create a Spoke Provider

This guide provides comprehensive instructions for creating spoke providers for all supported chain types in the Sodax SDK. A spoke provider is a container that combines a wallet provider with chain-specific configuration, enabling interaction with Sodax features on different blockchains.

## What is a Spoke Provider?

A **Spoke Provider** is an instance that contains:
- A **wallet provider** implementation (e.g., `IEvmWalletProvider`, `ISuiWalletProvider`) that handles wallet interactions
- A **chain configuration** object that contains chain-specific settings, addresses, and metadata

The spoke provider acts as the bridge between your application and the Sodax protocol, allowing you to interact with swaps, money market operations, bridging, and staking features.

**Important**: You should create one spoke provider instance for each user wallet connection. Once created, reuse the same spoke provider instance for all Sodax feature interactions on that specific chain.

For more information, refer to the [README.md](../README.md#initialising-spoke-provider) section.

## Prerequisites

Before creating a spoke provider, ensure you have:

- A wallet provider implementation for your target chain. You can use existing wallet provider implementations from the [`@sodax/wallet-sdk-core`](https://www.npmjs.com/package/@sodax/wallet-sdk-core) npm package, or use the local package [@wallet-sdk-core](../../wallet-sdk-core/README.md) if working within the Sodax monorepo.
- The `@sodax/sdk` package installed
- For Node.js environments: RPC URLs for the chains you're interacting with (we recommend using dedicated node providers like Alchemy, QuickNode, etc.)
- For browser environments: Wallet extensions installed and connected (e.g., MetaMask for EVM chains)

## Getting Chain Configuration

Chain configurations are available through the `spokeChainConfig` object exported from `@sodax/sdk`. This object contains pre-configured settings for all supported chains.

```typescript
import { spokeChainConfig, ARBITRUM_MAINNET_CHAIN_ID, type EvmSpokeChainConfig } from "@sodax/sdk";

// Get chain configuration for a specific chain
const arbChainConfig = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID] as EvmSpokeChainConfig;
```

**Note**: It's recommended to initialize Sodax before creating spoke providers to ensure you have the latest chain configurations:

```typescript
import { Sodax } from "@sodax/sdk";

const sodax = new Sodax();
await sodax.initialize(); // Fetches latest configuration from backend API
```

## EVM Chains

EVM chains include Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Lightlink, and HyperEVM. For these chains, use the `EvmSpokeProvider` class.

**Supported EVM Chains**:
- Arbitrum (`ARBITRUM_MAINNET_CHAIN_ID`)
- Avalanche (`AVALANCHE_MAINNET_CHAIN_ID`)
- Base (`BASE_MAINNET_CHAIN_ID`)
- BSC (`BSC_MAINNET_CHAIN_ID`)
- Optimism (`OPTIMISM_MAINNET_CHAIN_ID`)
- Polygon (`POLYGON_MAINNET_CHAIN_ID`)
- Lightlink (`LIGHTLINK_MAINNET_CHAIN_ID`)
- HyperEVM (`HYPEREVM_MAINNET_CHAIN_ID`)

### Constructor Signature

```typescript
new EvmSpokeProvider(
  walletProvider: IEvmWalletProvider,
  chainConfig: EvmSpokeChainConfig,
  rpcUrl?: string // Optional: custom RPC URL
)
```

### Node.js Example

```typescript
import {
  EvmSpokeProvider,
  ARBITRUM_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type EvmSpokeChainConfig,
  type Hex
} from "@sodax/sdk";
import { EvmWalletProvider } from "@sodax/wallet-sdk-core";

// Create wallet provider with private key and RPC URL
const evmWalletProvider = new EvmWalletProvider({
  privateKey: '0x...' as Hex, // Your private key
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
  rpcUrl: 'https://arb1.arbitrum.io/rpc', // Arbitrum RPC URL
});

// Get chain configuration
const arbChainConfig = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID] as EvmSpokeChainConfig;

// Create Arbitrum spoke provider
const arbSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider,
  arbChainConfig
);

// Optional: Create with custom RPC URL
const arbSpokeProviderWithCustomRpc = new EvmSpokeProvider(
  evmWalletProvider,
  arbChainConfig,
  'https://custom-arbitrum-rpc.com' // Custom RPC URL
);
```

### Browser Example

```typescript
import {
  EvmSpokeProvider,
  POLYGON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type EvmSpokeChainConfig,
  type IEvmWalletProvider
} from "@sodax/sdk";

// Wallet provider is typically injected by wallet extension (e.g., MetaMask)
// In a React app, you might get it from a wallet context or hook
const evmWalletProvider: IEvmWalletProvider = /* injected by wallet */;

// Get chain configuration
const polygonChainConfig = spokeChainConfig[POLYGON_MAINNET_CHAIN_ID] as EvmSpokeChainConfig;

// Create Polygon spoke provider
const polygonSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider,
  polygonChainConfig
);
```

## Sonic Chain (Special Case)

**Important**: Sonic chain must use `SonicSpokeProvider` instead of `EvmSpokeProvider`, even though it's an EVM-compatible chain. This is because Sonic is the hub chain of the Sodax protocol and requires special handling.

### Constructor Signature

```typescript
new SonicSpokeProvider(
  walletProvider: IEvmWalletProvider,
  chainConfig: SonicSpokeChainConfig,
  rpcUrl?: string // Optional: custom RPC URL
)
```

### Example

```typescript
import {
  SonicSpokeProvider,
  SONIC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SonicSpokeChainConfig,
  type IEvmWalletProvider,
  type Hex
} from "@sodax/sdk";
import { EvmWalletProvider } from "@sodax/wallet-sdk-core";

// Create wallet provider
const sonicWalletProvider = new EvmWalletProvider({
  privateKey: '0x...' as Hex,
  chainId: SONIC_MAINNET_CHAIN_ID,
  rpcUrl: 'https://rpc.soniclabs.com',
});

// Get chain configuration
const sonicChainConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID] as SonicSpokeChainConfig;

// Create Sonic spoke provider (NOT EvmSpokeProvider!)
const sonicSpokeProvider = new SonicSpokeProvider(
  sonicWalletProvider,
  sonicChainConfig
);
```

## Sui Chain

For Sui blockchain, use the `SuiSpokeProvider` class.

**Note**: The constructor parameter order is different from EVM chains - chain configuration comes first, then wallet provider.

### Constructor Signature

```typescript
new SuiSpokeProvider(
  chainConfig: SuiSpokeChainConfig,
  walletProvider: ISuiWalletProvider
)
```

### Node.js Example

```typescript
import {
  SuiSpokeProvider,
  SUI_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SuiSpokeChainConfig
} from "@sodax/sdk";
import { SuiWalletProvider } from "@sodax/wallet-sdk-core";

// Create wallet provider with mnemonics and RPC URL
const suiWalletProvider = new SuiWalletProvider({
  rpcUrl: 'https://fullnode.mainnet.sui.io',
  mnemonics: 'your twelve word mnemonic phrase here...',
});

// Get chain configuration
const suiChainConfig = spokeChainConfig[SUI_MAINNET_CHAIN_ID] as SuiSpokeChainConfig;

// Create Sui spoke provider (note: chainConfig first, then walletProvider)
const suiSpokeProvider = new SuiSpokeProvider(
  suiChainConfig,
  suiWalletProvider
);
```

### Browser Example

```typescript
import {
  SuiSpokeProvider,
  SUI_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SuiSpokeChainConfig,
  type ISuiWalletProvider
} from "@sodax/sdk";

// Wallet provider is typically injected by Sui wallet extension
const suiWalletProvider: ISuiWalletProvider = /* injected by wallet */;

// Get chain configuration
const suiChainConfig = spokeChainConfig[SUI_MAINNET_CHAIN_ID] as SuiSpokeChainConfig;

// Create Sui spoke provider
const suiSpokeProvider = new SuiSpokeProvider(
  suiChainConfig,
  suiWalletProvider
);
```

## Stellar Chain

For Stellar blockchain, use the `StellarSpokeProvider` class. Stellar uses both Horizon (for account data) and Soroban RPC (for smart contract interactions).

### Constructor Signature

```typescript
new StellarSpokeProvider(
  walletProvider: IStellarWalletProvider,
  chainConfig: StellarSpokeChainConfig,
  rpcConfig?: StellarRpcConfig // Optional: custom RPC configuration
)
```

### RPC Configuration

The optional `rpcConfig` parameter allows you to specify custom Horizon and Soroban RPC URLs:

```typescript
type StellarRpcConfig = {
  horizonRpcUrl?: string;
  sorobanRpcUrl?: string;
};
```

If not provided, the RPC URLs from `chainConfig` will be used.

### Node.js Example

```typescript
import {
  StellarSpokeProvider,
  STELLAR_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type StellarSpokeChainConfig,
  type StellarRpcConfig,
  type Hex
} from "@sodax/sdk";
import { StellarWalletProvider, type StellarWalletConfig } from "@sodax/wallet-sdk-core";

// Create wallet provider with private key
const stellarWalletConfig: StellarWalletConfig = {
  type: 'PRIVATE_KEY',
  privateKey: '0x...' as Hex,
  network: 'PUBLIC', // or 'TESTNET'
  rpcUrl: 'https://soroban-rpc.mainnet.stellar.org',
};

const stellarWalletProvider = new StellarWalletProvider(stellarWalletConfig);

// Get chain configuration
const stellarChainConfig = spokeChainConfig[STELLAR_MAINNET_CHAIN_ID] as StellarSpokeChainConfig;

// Create Stellar spoke provider with default RPC URLs
const stellarSpokeProvider = new StellarSpokeProvider(
  stellarWalletProvider,
  stellarChainConfig
);

// Or with custom RPC configuration
const customRpcConfig: StellarRpcConfig = {
  horizonRpcUrl: 'https://horizon.stellar.org',
  sorobanRpcUrl: 'https://soroban-rpc.mainnet.stellar.org',
};

const stellarSpokeProviderWithCustomRpc = new StellarSpokeProvider(
  stellarWalletProvider,
  stellarChainConfig,
  customRpcConfig
);
```

### Browser Example

```typescript
import {
  StellarSpokeProvider,
  STELLAR_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type StellarSpokeChainConfig,
  type IStellarWalletProvider
} from "@sodax/sdk";

// Wallet provider is typically injected by Stellar wallet extension
const stellarWalletProvider: IStellarWalletProvider = /* injected by wallet */;

// Get chain configuration
const stellarChainConfig = spokeChainConfig[STELLAR_MAINNET_CHAIN_ID] as StellarSpokeChainConfig;

// Create Stellar spoke provider
const stellarSpokeProvider = new StellarSpokeProvider(
  stellarWalletProvider,
  stellarChainConfig
);
```

## Injective Chain

For Injective blockchain, use the `InjectiveSpokeProvider` class.

**Note**: The constructor parameter order is different from EVM chains - chain configuration comes first, then wallet provider.

### Constructor Signature

```typescript
new InjectiveSpokeProvider(
  chainConfig: InjectiveSpokeChainConfig,
  walletProvider: IInjectiveWalletProvider
)
```

### Node.js Example

```typescript
import {
  InjectiveSpokeProvider,
  INJECTIVE_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type InjectiveSpokeChainConfig
} from "@sodax/sdk";
import { InjectiveWalletProvider } from "@sodax/wallet-sdk-core";
import { Network } from "@injectivelabs/networks";

// Create wallet provider
const injectiveWalletProvider = new InjectiveWalletProvider({
  network: Network.Mainnet,
  privateKey: 'your-private-key-here',
});

// Get chain configuration
const injectiveChainConfig = spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID] as InjectiveSpokeChainConfig;

// Create Injective spoke provider (note: chainConfig first, then walletProvider)
const injectiveSpokeProvider = new InjectiveSpokeProvider(
  injectiveChainConfig,
  injectiveWalletProvider
);
```

### Browser Example

```typescript
import {
  InjectiveSpokeProvider,
  INJECTIVE_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type InjectiveSpokeChainConfig,
  type IInjectiveWalletProvider
} from "@sodax/sdk";

// Wallet provider is typically injected by Injective wallet extension
const injectiveWalletProvider: IInjectiveWalletProvider = /* injected by wallet */;

// Get chain configuration
const injectiveChainConfig = spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID] as InjectiveSpokeChainConfig;

// Create Injective spoke provider
const injectiveSpokeProvider = new InjectiveSpokeProvider(
  injectiveChainConfig,
  injectiveWalletProvider
);
```

## ICON Chain

For ICON blockchain, use the `IconSpokeProvider` class.

### Constructor Signature

```typescript
new IconSpokeProvider(
  walletProvider: IIconWalletProvider,
  chainConfig: IconSpokeChainConfig,
  rpcUrl?: HttpUrl, // Optional: custom RPC URL (defaults to mainnet)
  debugRpcUrl?: HttpUrl // Optional: custom debug RPC URL (defaults to mainnet)
)
```

### Node.js Example

```typescript
import {
  IconSpokeProvider,
  ICON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type IconSpokeChainConfig,
  type Hex
} from "@sodax/sdk";
import { IconWalletProvider } from "@sodax/wallet-sdk-core";

// Create wallet provider with private key and RPC URL
const iconWalletProvider = new IconWalletProvider({
  privateKey: '0x...' as Hex,
  rpcUrl: 'https://ctz.solidwallet.io/api/v3', // ICON mainnet RPC URL
});

// Get chain configuration
const iconChainConfig = spokeChainConfig[ICON_MAINNET_CHAIN_ID] as IconSpokeChainConfig;

// Create ICON spoke provider with default RPC URLs
const iconSpokeProvider = new IconSpokeProvider(
  iconWalletProvider,
  iconChainConfig
);

// Or with custom RPC URLs
const iconSpokeProviderWithCustomRpc = new IconSpokeProvider(
  iconWalletProvider,
  iconChainConfig,
  'https://ctz.solidwallet.io/api/v3', // Custom RPC URL
  'https://ctz.solidwallet.io/api/v3d' // Custom debug RPC URL
);
```

### Browser Example

```typescript
import {
  IconSpokeProvider,
  ICON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type IconSpokeChainConfig,
  type IIconWalletProvider
} from "@sodax/sdk";

// Wallet provider is typically injected by ICON wallet extension
const iconWalletProvider: IIconWalletProvider = /* injected by wallet */;

// Get chain configuration
const iconChainConfig = spokeChainConfig[ICON_MAINNET_CHAIN_ID] as IconSpokeChainConfig;

// Create ICON spoke provider
const iconSpokeProvider = new IconSpokeProvider(
  iconWalletProvider,
  iconChainConfig
);
```

## Solana Chain

For Solana blockchain, use the `SolanaSpokeProvider` class.

### Constructor Signature

```typescript
new SolanaSpokeProvider(
  walletProvider: ISolanaWalletProvider,
  chainConfig: SolanaChainConfig
)
```

### Node.js Example

```typescript
import {
  SolanaSpokeProvider,
  SOLANA_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SolanaChainConfig
} from "@sodax/sdk";
import { SolanaWalletProvider } from "@sodax/wallet-sdk-core";
import { Keypair } from "@solana/web3.js";

// Create wallet provider with private key
const privateKey = Buffer.from('your-private-key-hex-string', 'hex');
const keypair = Keypair.fromSecretKey(new Uint8Array(privateKey));

const solanaWalletProvider = new SolanaWalletProvider({
  privateKey: keypair.secretKey,
  endpoint: 'https://api.mainnet-beta.solana.com', // Solana RPC endpoint
});

// Get chain configuration
const solanaChainConfig = spokeChainConfig[SOLANA_MAINNET_CHAIN_ID] as SolanaChainConfig;

// Create Solana spoke provider
const solanaSpokeProvider = new SolanaSpokeProvider(
  solanaWalletProvider,
  solanaChainConfig
);
```

### Browser Example

```typescript
import {
  SolanaSpokeProvider,
  SOLANA_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SolanaChainConfig,
  type ISolanaWalletProvider
} from "@sodax/sdk";

// Wallet provider is typically injected by Solana wallet extension (e.g., Phantom)
const solanaWalletProvider: ISolanaWalletProvider = /* injected by wallet */;

// Get chain configuration
const solanaChainConfig = spokeChainConfig[SOLANA_MAINNET_CHAIN_ID] as SolanaChainConfig;

// Create Solana spoke provider
const solanaSpokeProvider = new SolanaSpokeProvider(
  solanaWalletProvider,
  solanaChainConfig
);
```

## Best Practices

### One Spoke Provider Per Wallet Connection

Create one spoke provider instance for each user wallet connection. Once created, reuse the same spoke provider instance for all operations on that chain:

```typescript
// Good: Create once and reuse
const arbSpokeProvider = new EvmSpokeProvider(evmWalletProvider, arbChainConfig);

// Use the same instance for all operations
await sodax.swap.createIntent(params, arbSpokeProvider);
await sodax.moneyMarket.supply(supplyParams, arbSpokeProvider);
```

### Initialize Sodax Before Creating Spoke Providers

Initialize Sodax before creating spoke providers to ensure you have the latest chain configurations:

```typescript
const sodax = new Sodax();
await sodax.initialize(); // Fetches latest configuration

// Now create spoke providers with up-to-date configuration
const arbSpokeProvider = new EvmSpokeProvider(evmWalletProvider, arbChainConfig);
```

### Handle Wallet Disconnection

When a user disconnects their wallet, you should recreate the spoke provider when they reconnect:

```typescript
// When wallet disconnects
let arbSpokeProvider: EvmSpokeProvider | null = null;

// When wallet reconnects
function onWalletConnect(walletProvider: IEvmWalletProvider) {
  const arbChainConfig = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID] as EvmSpokeChainConfig;
  arbSpokeProvider = new EvmSpokeProvider(walletProvider, arbChainConfig);
}
```

### Type Safety

Always use proper TypeScript types when creating spoke providers to ensure type safety:

```typescript
import type {
  EvmSpokeChainConfig,
  SuiSpokeChainConfig,
  StellarSpokeChainConfig,
  InjectiveSpokeChainConfig,
  IconSpokeChainConfig,
  SolanaChainConfig
} from "@sodax/sdk";

// Type-safe chain configuration access
const arbChainConfig = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID] as EvmSpokeChainConfig;
```

## Usage Examples

Once you've created a spoke provider, you can use it with all Sodax features:

### Using with Swaps

```typescript
import { Sodax } from "@sodax/sdk";

const sodax = new Sodax();
await sodax.initialize();

// Create spoke provider (as shown in examples above)
const arbSpokeProvider = new EvmSpokeProvider(evmWalletProvider, arbChainConfig);

// Use spoke provider for swap operations
const createIntentResult = await sodax.swap.createIntent(
  createIntentParams,
  arbSpokeProvider
);
```

For detailed swap documentation, see [HOW_TO_MAKE_A_SWAP.md](./HOW_TO_MAKE_A_SWAP.md) and [SWAPS.md](./SWAPS.md).

### Using with Money Market

```typescript
// Use spoke provider for money market operations
const supplyResult = await sodax.moneyMarket.supply(
  supplyParams,
  arbSpokeProvider
);
```

For detailed money market documentation, see [MONEY_MARKET.md](./MONEY_MARKET.md).

### Using with Bridge

```typescript
// Use spoke provider for bridge operations
const bridgeResult = await sodax.bridge.createBridgeIntent(
  bridgeParams,
  arbSpokeProvider
);
```

For detailed bridge documentation, see [BRIDGE.md](./BRIDGE.md).

### Using with Staking

```typescript
// Use spoke provider for staking operations
const stakeResult = await sodax.staking.stake(
  stakeParams,
  arbSpokeProvider
);
```

For detailed staking documentation, see [STAKING.md](./STAKING.md).

## Summary

- **Spoke Provider** is a container that combines wallet provider and chain configuration
- Create **one spoke provider per wallet connection** and reuse it for all operations
- Use the appropriate provider class for each chain type:
  - `EvmSpokeProvider` for EVM chains (Arbitrum, Polygon, BSC, etc.)
  - `SonicSpokeProvider` for Sonic chain (special case - hub chain)
  - `SuiSpokeProvider` for Sui blockchain
  - `StellarSpokeProvider` for Stellar blockchain
  - `InjectiveSpokeProvider` for Injective blockchain
  - `IconSpokeProvider` for ICON blockchain
  - `SolanaSpokeProvider` for Solana blockchain
- Initialize Sodax before creating spoke providers for latest configuration
- Use proper TypeScript types for type safety
- Reuse the same spoke provider instance for all operations on that chain

For more information on specific features, refer to the respective documentation files:
- [HOW_TO_MAKE_A_SWAP.md](./HOW_TO_MAKE_A_SWAP.md) - Swap operations
- [SWAPS.md](./SWAPS.md) - Swap API reference
- [MONEY_MARKET.md](./MONEY_MARKET.md) - Money market operations
- [BRIDGE.md](./BRIDGE.md) - Bridge operations
- [STAKING.md](./STAKING.md) - Staking operations

