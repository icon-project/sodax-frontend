# Configure SDK

Learn how to configure the Sodax SDK for your application. The SDK supports both Swaps (intent-based solver swaps) and Money Market (cross-chain lending and borrowing) services. Both configurations are optional—you can use just the features you need.

## Basic Configuration

### Default Configuration

Initialize the SDK with default Sonic mainnet configurations (no fees):

```typescript
import { Sodax } from '@sodax/sdk';

const sodax = new Sodax();
```

### Dynamic Configuration

For the latest tokens and chains, initialize the instance before usage. By default, the SDK uses configuration from the specific SDK version you're using:

```typescript
await sodax.initialize();
```

### Partner Fees

Configure partner fees for swaps and/or money market operations. See [Monetize SDK](./MONETIZE_SDK.md) for detailed fee configuration options.

```typescript
import { Sodax, PartnerFee } from '@sodax/sdk';

const partnerFee: PartnerFee = {
  address: '0x0000000000000000000000000000000000000000', // address to receive fee
  percentage: 100, // 100 = 1%, 10000 = 100%
};

// Fee on swaps only
const sodaxWithSwapFees = new Sodax({
  swap: { partnerFee },
});

// Fee on money market only
const sodaxWithMoneyMarketFees = new Sodax({
  moneyMarket: { partnerFee },
});

// Fees on both features
const sodaxWithFees = new Sodax({
  swap: { partnerFee },
  moneyMarket: { partnerFee },
});
```

## Custom Configuration

### Partner Fees

Partner fees can be defined as a percentage or a definite token amount:

```typescript
import { PartnerFee } from '@sodax/sdk';

// Percentage-based fee
const partnerFeePercentage: PartnerFee = {
  address: '0x0000000000000000000000000000000000000000',
  percentage: 100, // 100 = 1%, 10000 = 100%
};

// Amount-based fee
const partnerFeeAmount: PartnerFee = {
  address: '0x0000000000000000000000000000000000000000',
  amount: 1000n, // definite amount in token decimal precision
};
```

### Solver Configuration

Solver config is optional and required only for intent-based swaps. You can use a custom config or the default one (based on hub chain ID—defaults to Sonic).

```typescript
import {
  Sodax,
  SolverConfigParams,
  getSolverConfig,
  SONIC_MAINNET_CHAIN_ID,
} from '@sodax/sdk';

// Custom solver config
const customSolverConfig: SolverConfigParams = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: partnerFeePercentage, // optional
};

// Pre-defined default solver config
const solverConfig = getSolverConfig(SONIC_MAINNET_CHAIN_ID);

const sodax = new Sodax({
  swap: customSolverConfig
});
```

### Money Market Configuration

Money market config is optional and required only for cross-chain lending and borrowing.

```typescript
import {
  Sodax,
  MoneyMarketConfigParams,
  getMoneyMarketConfig,
  SONIC_MAINNET_CHAIN_ID,
} from '@sodax/sdk';

// Custom money market config
const customMoneyMarketConfig: MoneyMarketConfigParams = {
  lendingPool: '0x553434896D39F867761859D0FE7189d2Af70514E',
  uiPoolDataProvider: '0xC04d746C38f1E51C8b3A3E2730250bbAC2F271bf',
  poolAddressesProvider: '0x036aDe0aBAA4c82445Cb7597f2d6d6130C118c7b',
  bnUSD: '0x94dC79ce9C515ba4AE4D195da8E6AB86c69BFc38',
  bnUSDVault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
};

// Pre-defined default money market config
const moneyMarketConfig = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID);

const sodax = new Sodax({
  moneyMarket: customMoneyMarketConfig
});
```

### Hub Provider Configuration

Configure the hub chain provider for cross-chain operations:

```typescript
import {
  EvmHubProviderConfig,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
} from '@sodax/sdk';

const sodax = new Sodax({
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  }
});
```

### Shared Configuration

Configure SDK to use provided configuration when internally invoking things like reading from blockchain etc..

```typescript
import {
  STELLAR_MAINNET_CHAIN_ID,
} from '@sodax/sdk';

const sodax = new Sodax({
  sharedConfig: { // config used by internal services
    [STELLAR_MAINNET_CHAIN_ID]: {
      horizonRpcUrl: 'https://horizon.stellar.org',
      sorobanRpcUrl: 'https://rpc.ankr.com/stellar_soroban',
    }
  }
});

```

### Complete Custom Configuration

Combine all configurations:

```typescript
import {
  Sodax,
  getSolverConfig,
  getMoneyMarketConfig,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
} from '@sodax/sdk';

const sodax = new Sodax({
  swap: getSolverConfig(SONIC_MAINNET_CHAIN_ID),
  moneyMarket: getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID),
  ...,
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  },
  sharedConfig: { // config used by internal services
    [STELLAR_MAINNET_CHAIN_ID]: {
      horizonRpcUrl: 'https://horizon.stellar.org',
      sorobanRpcUrl: 'https://rpc.ankr.com/stellar_soroban',
    }
  }
});

// Optional: initialize for latest tokens/chains
await sodax.initialize();
```

## Additional Resources

- [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/types/src/constants/index.ts) - Additional static constants and configurations
- [Monetize SDK](./MONETIZE_SDK.md) - Detailed fee configuration guide

