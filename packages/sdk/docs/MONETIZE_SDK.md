# Monetize SDK

Learn how to configure fees and monetize your Sodax SDK integration.

When using the SODAX SDK, you can monetize your integration by collecting fees from the transactions processed through your application.
The SDK supports fee configuration in two ways: globally when creating the SDK config, or per-request.

## Defining Fee

```typescript
import { PartnerFee } from '@sodax/sdk';

// Partner fee can be defined as a percentage or a definite token amount.
// Fee is optional, you can leave it empty/undefined.
const partnerFeePercentage = {
  address: '0x0000000000000000000000000000000000000000', // EVM (Sonic) address to receive fee
  percentage: 100, // 100 = 1%, 10000 = 100%
} satisfies PartnerFee;

const partnerFeeAmount = {
  address: '0x0000000000000000000000000000000000000000', // EVM (Sonic) address to receive fee
  amount: 1000n, // definite amount denominated in token decimal precision
} satisfies PartnerFee;
```

## Global fee configuration

The recommended approach is to configure fees globally per feature when creating your SDK config using `new Sodax({...configuration})`.
This ensures all requests use the same fee configuration automatically:

```typescript
import { Sodax, PartnerFee } from '@sodax/sdk';

// both partnerFeePercentage or partnerFeeAmount can be used

// apply fee to swap feature
const sodaxWithSwapFees = new Sodax({
  swap: { partnerFee: partnerFeePercentage },
});

// apply fee to money market feature
const sodaxWithMoneyMarketFees = new Sodax({
  moneyMarket: { partnerFee: partnerFeePercentage },
});

// apply fee to swap and money market feature
const sodaxWithFees = new Sodax({
  swap: { partnerFee: partnerFeePercentage },
  moneyMarket: { partnerFee: partnerFeePercentage },
});
```

## Per-request fee configuration

Alternatively, you can configure fees on a per-request basis.
This is useful when you need different fee rates for different types of transactions or users.
The fee parameter can be added to the params object when requesting quotes or executing swaps.
All fee-enabled features contain similar logic (e.g. money market, etc..).

### Quote request with fees

```typescript
import {
  type SolverIntentQuoteRequest,
} from "@sodax/sdk";

const result = await sodax.swaps.getQuote({
  token_src: '0x...', // The address of the source token on the spoke chain
  token_dst: '0x...', // The address of the destination token on the spoke chain
  token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,  // Source chain ID (e.g. Binance Smart Chain)
  token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID, // Destination chain ID (e.g. Arbitrum)
  amount: 1000000000000000n, // token amount in scaled token decimal precision (e.g. 1 ETH = 1e18)
  quote_type: 'exact_input', // type of quote
  fee: fee, // optional, uses global partner fee if not provided
} satisfies SolverIntentQuoteRequest);

if (result.ok) {
  const { quoted_amount } = result.value;
  console.log('Quoted amount:', quoted_amount);
} else {
  // handle error
  console.error('Quote failed:', result.error);
}
```

### Swap request with fees

```typescript
const swapResult = await sodax.swaps.swap({
  intentParams: {
    inputToken: '0x...',  // The address of the input token on the spoke chain
    outputToken: '0x...', // The address of the output token on the spoke chain
    inputAmount: 1_000_000n, // Amount of input tokens, fee will be deducted from this amount
    minOutputAmount: 900_000n, // Minimum output tokens expected
    deadline: 0n, // Optional: timestamp after which intent expires (0 = no deadline)
    allowPartialFill: false, // Whether intent can be partially filled
    srcChain: BSC_MAINNET_CHAIN_ID, // Source chain ID
    dstChain: ARBITRUM_MAINNET_CHAIN_ID, // Destination chain ID
    srcAddress: '0x...', // Originating address on source chain
    dstAddress: '0x...', // Destination address on destination chain
    solver: '0x0000000000000000000000000000000000000000', // Optional: specific solver, address(0) means any solver
    data: '0x', // Arbitrary additional data
  } satisfies CreateIntentParams,
  spokeProvider,
  fee, // optional, uses global partner fee if not provided
  timeout, // optional, request timeout in ms if needed
  skipSimulation, // optional - whether to skip transaction simulation (default: false)
});
```
