### Estimate Gas for Raw Transactions

The `estimateGas` function allows you to estimate the gas cost for raw transactions before executing them. This is particularly useful for all Sodax operations (swaps, money market operations, approvals) to provide users with accurate gas estimates.

The function is available on all service classes:
- `SwapService.estimateGas()` - for solver/intent operations (reachable through `sodax.swap`)
- `MoneyMarketService.estimateGas()` - for money market operations (reachable through `sodax.moneyMarket`)
- `SpokeService.estimateGas()` - for general spoke chain operations

```typescript
import { 
  SwapService, 
  MoneyMarketService, 
  SpokeService,
  MoneyMarketSupplyParams 
} from "@sodax/sdk";

// Example: Estimate gas for a solver swap transaction
const createIntentResult = await sodax.swaps.createIntent(
  createIntentParams,
  bscSpokeProvider,
  partnerFeeAmount,
  true, // true = get raw transaction
);

if (createIntentResult.ok) {
  const [rawTx, intent] = createIntentResult.value;
  
  // Estimate gas for the raw transaction
  const gasEstimate = await SwapService.estimateGas(rawTx, bscSpokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for swap:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for swap:', gasEstimate.error);
  }
}

// Example: Estimate gas for a money market supply transaction
const supplyResult = await sodax.moneyMarket.createSupplyIntent(
  supplyParams,
  bscSpokeProvider,
  true, // true = get raw transaction
);

if (supplyResult.ok) {
  const rawTx = supplyResult.value;
  
  // Estimate gas for the raw transaction
  const gasEstimate = await MoneyMarketService.estimateGas(rawTx, bscSpokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for supply:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for supply:', gasEstimate.error);
  }
}

// Example: Estimate gas for an approval transaction
const approveResult = await sodax.swaps.approve(
  tokenAddress,
  amount,
  bscSpokeProvider,
  true // true = get raw transaction
);

if (approveResult.ok) {
  const rawTx = approveResult.value;
  
  // Estimate gas for the approval transaction
  const gasEstimate = await SpokeService.estimateGas(rawTx, bscSpokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for approval:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for approval:', gasEstimate.error);
  }
}
```