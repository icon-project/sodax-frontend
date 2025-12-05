# How to Create a Spoke Provider

This guide provides comprehensive instructions for creating spoke providers for all supported chain types in the Sodax SDK. A spoke provider is a container that combines a wallet provider with chain-specific configuration, enabling interaction with Sodax features on different blockchains.

## What is a Spoke Provider?

A **Spoke Provider** is an instance that contains:

- A **wallet provider** implementation (e.g., `IEvmWalletProvider`, `ISuiWalletProvider`) that handles wallet interactions
- A **chain configuration** object that contains chain-specific settings, addresses, and metadata

The spoke provider acts as the bridge between your application and the Sodax protocol, allowing you to interact with swaps, money market operations, bridging, and staking features.

**Important**: You should create one spoke provider instance for each user wallet connection. Once created, reuse the same spoke provider instance for all Sodax feature interactions on that specific chain.

For more information, refer to the [README.md](../README.md#initialising-spoke-provider) section.

## What is a Raw Spoke Provider?

A **Raw Spoke Provider** is a special type of spoke provider that is used when you only have a user's wallet address and cannot create a full wallet provider instance. Unlike regular spoke providers, raw spoke providers:

- **Do not require a wallet provider** - They only need the user's wallet address
- **Cannot sign transactions** - They are read-only and used for generating raw transaction data
- **Return raw transaction data** - When used with Sodax features, they return unsigned transaction payloads instead of executing transactions

### When to Use Raw Spoke Providers

Raw spoke providers are ideal for:

- **Backend services** - When creating transaction payloads on the server side where wallet providers cannot be instantiated
- **Transaction preparation** - When you need to prepare raw transaction data for users to sign later
- **Gas estimation** - When estimating transaction costs without executing transactions
- **Multi-step flows** - When separating transaction creation from transaction signing/execution

### Key Differences from Regular Spoke Providers

| Feature | Regular Spoke Provider | Raw Spoke Provider |
|---------|----------------------|-------------------|
| Wallet Provider | Required (full implementation) | Not required (only address needed) |
| Transaction Signing | Can sign and execute | Cannot sign (read-only) |
| Return Type | Transaction hash (string) | Raw transaction data object |
| Use Case | Frontend/browser with wallet | Backend/server-side preparation |

**Note**: When using raw spoke providers with Sodax features, you must pass the `raw: true` flag to methods like `createIntent()`, `supply()`, etc. This ensures the methods return raw transaction data instead of attempting to execute transactions.

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

### Raw Spoke Provider

For backend scenarios where you only have a user's wallet address and cannot create a wallet provider, use `EvmRawSpokeProvider`.

#### Constructor Signature

```typescript
new EvmRawSpokeProvider(
  walletAddress: Address,
  chainConfig: EvmSpokeChainConfig,
  rpcUrl?: string // Optional: custom RPC URL
)
```

#### Example

```typescript
import {
  EvmRawSpokeProvider,
  ARBITRUM_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type EvmSpokeChainConfig,
  type Address
} from "@sodax/sdk";

// User's wallet address (e.g., from database or API)
const userWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;

// Get chain configuration
const arbChainConfig = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID] as EvmSpokeChainConfig;

// Create raw Arbitrum spoke provider (no wallet provider needed)
const arbRawSpokeProvider = new EvmRawSpokeProvider(
  userWalletAddress,
  arbChainConfig
);

// Optional: Create with custom RPC URL
const arbRawSpokeProviderWithCustomRpc = new EvmRawSpokeProvider(
  userWalletAddress,
  arbChainConfig,
  'https://custom-arbitrum-rpc.com'
);
```

**Note**: When using `EvmRawSpokeProvider` with Sodax features, pass `raw: true` to get raw transaction data instead of executing transactions.

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

### Raw Spoke Provider

For backend scenarios where you only have a user's wallet address, use `SonicRawSpokeProvider`.

#### Constructor Signature

```typescript
new SonicRawSpokeProvider(
  walletAddress: Address,
  chainConfig: SonicSpokeChainConfig,
  rpcUrl?: string // Optional: custom RPC URL
)
```

#### Example

```typescript
import {
  SonicRawSpokeProvider,
  SONIC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SonicSpokeChainConfig,
  type Address
} from "@sodax/sdk";

// User's wallet address
const userWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;

// Get chain configuration
const sonicChainConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID] as SonicSpokeChainConfig;

// Create raw Sonic spoke provider
const sonicRawSpokeProvider = new SonicRawSpokeProvider(
  userWalletAddress,
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

### Raw Spoke Provider

For backend scenarios where you only have a user's wallet address, use `SuiRawSpokeProvider`.

**Note**: The constructor parameter order is the same as the regular provider - chain configuration comes first, then wallet address.

#### Constructor Signature

```typescript
new SuiRawSpokeProvider(
  chainConfig: SuiSpokeChainConfig,
  walletAddress: string
)
```

#### Example

```typescript
import {
  SuiRawSpokeProvider,
  SUI_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SuiSpokeChainConfig
} from "@sodax/sdk";

// User's wallet address
const userWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';

// Get chain configuration
const suiChainConfig = spokeChainConfig[SUI_MAINNET_CHAIN_ID] as SuiSpokeChainConfig;

// Create raw Sui spoke provider (note: chainConfig first, then walletAddress)
const suiRawSpokeProvider = new SuiRawSpokeProvider(
  suiChainConfig,
  userWalletAddress
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

### Raw Spoke Provider

For backend scenarios where you only have a user's wallet address, use `StellarRawSpokeProvider`.

#### Constructor Signature

```typescript
new StellarRawSpokeProvider(
  walletAddress: string,
  chainConfig: StellarSpokeChainConfig,
  rpcConfig?: StellarRpcConfig // Optional: custom RPC configuration
)
```

#### Example

```typescript
import {
  StellarRawSpokeProvider,
  STELLAR_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type StellarSpokeChainConfig,
  type StellarRpcConfig
} from "@sodax/sdk";

// User's wallet address (Stellar address format)
const userWalletAddress = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

// Get chain configuration
const stellarChainConfig = spokeChainConfig[STELLAR_MAINNET_CHAIN_ID] as StellarSpokeChainConfig;

// Create raw Stellar spoke provider with default RPC URLs
const stellarRawSpokeProvider = new StellarRawSpokeProvider(
  userWalletAddress,
  stellarChainConfig
);

// Or with custom RPC configuration
const customRpcConfig: StellarRpcConfig = {
  horizonRpcUrl: 'https://horizon.stellar.org',
  sorobanRpcUrl: 'https://soroban-rpc.mainnet.stellar.org',
};

const stellarRawSpokeProviderWithCustomRpc = new StellarRawSpokeProvider(
  userWalletAddress,
  stellarChainConfig,
  customRpcConfig
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

### Raw Spoke Provider

For backend scenarios where you only have a user's wallet address, use `InjectiveRawSpokeProvider`.

**Note**: The constructor parameter order is the same as the regular provider - chain configuration comes first, then wallet address.

#### Constructor Signature

```typescript
new InjectiveRawSpokeProvider(
  chainConfig: InjectiveSpokeChainConfig,
  walletAddress: string
)
```

#### Example

```typescript
import {
  InjectiveRawSpokeProvider,
  INJECTIVE_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type InjectiveSpokeChainConfig
} from "@sodax/sdk";

// User's wallet address (Injective address format)
const userWalletAddress = 'inj1abcdefghijklmnopqrstuvwxyz1234567890';

// Get chain configuration
const injectiveChainConfig = spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID] as InjectiveSpokeChainConfig;

// Create raw Injective spoke provider (note: chainConfig first, then walletAddress)
const injectiveRawSpokeProvider = new InjectiveRawSpokeProvider(
  injectiveChainConfig,
  userWalletAddress
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

### Raw Spoke Provider

For backend scenarios where you only have a user's wallet address, use `IconRawSpokeProvider`.

**Note**: The constructor parameter order differs from the regular provider - chain configuration comes first, then wallet address.

#### Constructor Signature

```typescript
new IconRawSpokeProvider(
  chainConfig: IconSpokeChainConfig,
  walletAddress: string
)
```

#### Example

```typescript
import {
  IconRawSpokeProvider,
  ICON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type IconSpokeChainConfig
} from "@sodax/sdk";

// User's wallet address (ICON address format)
const userWalletAddress = 'hx1234567890abcdef1234567890abcdef12345678';

// Get chain configuration
const iconChainConfig = spokeChainConfig[ICON_MAINNET_CHAIN_ID] as IconSpokeChainConfig;

// Create raw ICON spoke provider (note: chainConfig first, then walletAddress)
const iconRawSpokeProvider = new IconRawSpokeProvider(
  iconChainConfig,
  userWalletAddress
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

### Raw Spoke Provider

For backend scenarios where you only have a user's wallet address, use `SolanaRawSpokeProvider`. This provider also provides additional utility methods for building transactions and querying balances.

#### Constructor Signature

```typescript
new SolanaRawSpokeProvider({
  connection: { rpcUrl: string } | { connection: Connection },
  walletAddress: SolanaBase58PublicKey,
  chainConfig: SolanaChainConfig
})
```

#### Example

```typescript
import {
  SolanaRawSpokeProvider,
  SOLANA_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SolanaChainConfig
} from "@sodax/sdk";

// User's wallet address (Solana Base58 format)
const userWalletAddress = 'EuenpE24dc6ve6STi8enwgXJ6yuR7fgUrFa3KSYHmFTv';

// Get chain configuration
const solanaChainConfig = spokeChainConfig[SOLANA_MAINNET_CHAIN_ID] as SolanaChainConfig;

// Create raw Solana spoke provider with RPC URL
const solanaRawSpokeProvider = new SolanaRawSpokeProvider({
  connection: { rpcUrl: 'https://api.mainnet-beta.solana.com' },
  walletAddress: userWalletAddress,
  chainConfig: solanaChainConfig
});

// Or with existing Connection instance
import { Connection } from "@solana/web3.js";

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const solanaRawSpokeProviderWithConnection = new SolanaRawSpokeProvider({
  connection: { connection },
  walletAddress: userWalletAddress,
  chainConfig: solanaChainConfig
});
```

**Note**: `SolanaRawSpokeProvider` provides additional methods like `buildV0Txn()`, `getBalance()`, `getTokenAccountBalance()`, and `getAssociatedTokenAddress()` through its `walletProvider` interface.

## Best Practices

### One Spoke Provider Per Wallet Connection

Create one spoke provider instance for each user wallet connection. Once created, reuse the same spoke provider instance for all operations on that chain:

```typescript
// Good: Create once and reuse
const arbSpokeProvider = new EvmSpokeProvider(evmWalletProvider, arbChainConfig);

// Use the same instance for all operations
await sodax.swaps.createIntent(params, arbSpokeProvider);
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
const createIntentResult = await sodax.swaps.createIntent(
  createIntentParams,
  arbSpokeProvider
);
```

For detailed swap documentation, see [HOW_TO_MAKE_A_SWAP.md](./HOW_TO_MAKE_A_SWAP.md) and [SWAPS.md](./SWAPS.md).

### Using Raw Spoke Providers with Swaps

When using raw spoke providers, you must pass the `raw: true` flag to get raw transaction data instead of executing transactions:

```typescript
import { Sodax, EvmRawSpokeProvider, ARBITRUM_MAINNET_CHAIN_ID, spokeChainConfig, type Address } from "@sodax/sdk";

const sodax = new Sodax();
await sodax.initialize();

// Create raw spoke provider (only wallet address needed)
const userWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;
const arbChainConfig = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID];
const arbRawSpokeProvider = new EvmRawSpokeProvider(userWalletAddress, arbChainConfig);

// Use raw spoke provider with raw: true flag
const createIntentResult = await sodax.swaps.createIntent(
  {
    intentParams: {
      inputToken: arbChainConfig.nativeToken,
      outputToken: '0x...', // Output token address
      inputAmount: BigInt(1e18), // 1 token
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: ARBITRUM_MAINNET_CHAIN_ID,
      dstChain: '...', // Destination chain ID
      srcAddress: userWalletAddress,
      dstAddress: userWalletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: arbRawSpokeProvider,
    raw: true, // Important: must pass raw: true
  }
);

if (createIntentResult.ok) {
  const [rawTx, intent] = createIntentResult.value;
  // rawTx contains: { from, to, value, data }
  // This can be sent to the user for signing, or used for gas estimation
  console.log('Raw transaction:', rawTx);
}
```

**Key differences when using raw spoke providers:**

- Return type is a raw transaction data object `{ from, to, value, data }` instead of a transaction hash
- Transactions are not executed automatically
- Useful for backend services that prepare transactions for frontend signing
- Can be used for gas estimation without executing transactions

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
- **Raw Spoke Provider** is used when only a wallet address is available (backend scenarios, transaction preparation)
- Create **one spoke provider per wallet connection** and reuse it for all operations
- Use the appropriate provider class for each chain type:

  **Regular Spoke Providers** (require full wallet provider):
  - `EvmSpokeProvider` for EVM chains (Arbitrum, Polygon, BSC, etc.)
  - `SonicSpokeProvider` for Sonic chain (special case - hub chain)
  - `SuiSpokeProvider` for Sui blockchain
  - `StellarSpokeProvider` for Stellar blockchain
  - `InjectiveSpokeProvider` for Injective blockchain
  - `IconSpokeProvider` for ICON blockchain
  - `SolanaSpokeProvider` for Solana blockchain

  **Raw Spoke Providers** (only require wallet address):
  - `EvmRawSpokeProvider` for EVM chains
  - `SonicRawSpokeProvider` for Sonic chain
  - `SuiRawSpokeProvider` for Sui blockchain
  - `StellarRawSpokeProvider` for Stellar blockchain
  - `InjectiveRawSpokeProvider` for Injective blockchain
  - `IconRawSpokeProvider` for ICON blockchain
  - `SolanaRawSpokeProvider` for Solana blockchain

- **When to use Raw Spoke Providers:**
  - Backend services creating transaction payloads
  - Transaction preparation without signing
  - Gas estimation without execution
  - Multi-step flows separating creation from signing

- **When to use Regular Spoke Providers:**
  - Frontend/browser applications with wallet connections
  - When you need to sign and execute transactions
  - Interactive user flows

- Initialize Sodax before creating spoke providers for latest configuration
- Use proper TypeScript types for type safety
- Reuse the same spoke provider instance for all operations on that chain
- When using raw spoke providers with Sodax features, always pass `raw: true` to get raw transaction data

For more information on specific features, refer to the respective documentation files:

- [HOW_TO_MAKE_A_SWAP.md](./HOW_TO_MAKE_A_SWAP.md) - Swap operations
- [SWAPS.md](./SWAPS.md) - Swap API reference
- [MONEY_MARKET.md](./MONEY_MARKET.md) - Money market operations
- [BRIDGE.md](./BRIDGE.md) - Bridge operations
- [STAKING.md](./STAKING.md) - Staking operations
