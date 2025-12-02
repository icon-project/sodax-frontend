# Intent Hooks SDK Usage Guide

This guide provides comprehensive instructions for using the Intent Hooks SDK and the `intent-hooks.ts` CLI script.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Token Addresses](#token-addresses)
4. [Common Workflows](#common-workflows)
5. [Hook-Specific Guides](#hook-specific-guides)
6. [Troubleshooting](#troubleshooting)
7. [Transaction Reference](#transaction-reference)

## Prerequisites

### Required Tokens

- **bnUSD**: Stablecoin used for debt operations
  - Address: `0xE801CA34E19aBCbFeA12025378D19c4FBE250131`
  - Decimals: 18

- **WETH**: Wrapped Ether used for collateral
  - Address: `0x50c42dEAcD8Fc9773493ED674b675bE577f2634b`
  - Decimals: 18

### Environment Setup

1. Set `EVM_PRIVATE_KEY` in your `.env` file
2. Ensure you have sufficient token balances
3. Check balances: `pnpm tsx src/intent-hooks.ts checkBalances`

## Setup

### Check Token Balances

```bash
pnpm tsx src/intent-hooks.ts checkBalances
```

This will display:
- bnUSD balance
- WETH balance

**Note**: If balance shows 0 but visible on sodax.com/swap, tokens may be in a smart contract wallet. Transactions may still work.

## Common Workflows

### Complete Leverage → Fill → Deleverage → Fill Workflow

This is the most common workflow for testing leverage and deleverage hooks:

```bash
pnpm tsx src/intent-hooks.ts leverageAndDeleverage \
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # WETH (collateral)
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # bnUSD (debt)
  <collateralAmount> \                          # Amount in wei
  <borrowAmount>                                 # Amount in wei
```

**What it does:**
1. Creates leverage intent with prerequisites (auto-approves credit delegation)
2. Fills leverage intent (you act as solver)
3. Creates deleverage intent with prerequisites (auto-approves aToken)
4. Fills deleverage intent (you act as solver)

**Successful Transaction Hashes:**
- Leverage Intent: `0x0361059bb1267234227ab0274ec3f1313857ec93dbcc051361f302cdc0b0879d`
- Leverage Fill: `0xf5a2456429e725ed4640e2575ced4421a5fe39bc47f0eaa7ae68e6d92d8895cc`
- Deleverage Intent: `0xe12f729c5527198892a387934b2fccc119e199b9c68985b098286d5f8f707fc6`
- Deleverage Fill: `0x611f736dfaa97e6527f12660b41c4b3392be1cb01d6de5605013bc40c8b982be`

## Hook-Specific Guides

### 1. Credit Hook (Limit Orders)

#### Create Credit Intent

```bash
pnpm tsx src/intent-hooks.ts createCreditIntentWithPrerequisites \
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # debtAsset (bnUSD)
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # targetAsset (WETH)
  <maxPayment> \                                 # Amount in wei
  <minReceive> \                                 # Amount in wei
  0                                               # deadline (0 = no deadline)
```

**Intent Structure:**
- `inputToken`: debtAsset (bnUSD) - what solver provides
- `outputToken`: targetAsset (WETH) - what solver receives
- `inputAmount`: maxPayment
- `minOutputAmount`: minReceive

**Fill Credit Intent:**

```bash
pnpm tsx src/intent-hooks.ts fillIntentWithData \
  <credit_intent_tx_hash> \
  <inputAmount> \  # Amount in wei
  <outputAmount>    # Amount in wei
```

**Important Notes:**
- Requires credit delegation approval (auto-handled by `WithPrerequisites`)
- Solver must approve `inputToken` (bnUSD) to Intents contract (auto-handled)
- Solver must have sufficient WETH balance for hook execution
- `maxPayment`: Maximum amount of debtAsset to pay
- `minReceive`: Minimum amount of targetAsset to receive
- Use exact amounts from intent to avoid `PartialFillNotAllowed` error

### 2. Leverage Hook

#### Create Leverage Intent

```bash
pnpm tsx src/intent-hooks.ts createLeverageIntentWithPrerequisites \
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # collateralAsset (WETH)
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # debtAsset (bnUSD)
  <collateralAmount> \                          # Amount in wei
  <borrowAmount> \                               # Amount in wei
  0                                               # deadline
```

**Intent Structure:**
- `inputToken`: debtAsset (bnUSD) - what solver provides
- `outputToken`: collateralAsset (WETH) - what solver receives
- `inputAmount`: borrowAmount
- `minOutputAmount`: collateralAmount

**Fill Leverage Intent:**

```bash
pnpm tsx src/intent-hooks.ts fillIntentWithData \
  <leverage_intent_tx_hash> \
  <inputAmount> \  # Amount in wei
  <outputAmount>    # Amount in wei
```

**Important Notes:**
- Solver must approve `inputToken` (bnUSD) to Intents contract (auto-handled)
- Solver must have sufficient WETH balance for hook execution
- Use exact amounts from intent to avoid `PartialFillNotAllowed` error

### 3. Deleverage Hook

#### Create Deleverage Intent

```bash
pnpm tsx src/intent-hooks.ts createDeleverageIntent \
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # collateralAsset (WETH)
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # debtAsset (bnUSD)
  <withdrawAmount> \                             # Amount in wei
  <repayAmount> \                                # Amount in wei
  0                                               # deadline
```

**Intent Structure:**
- `inputToken`: debtAsset (bnUSD) - what solver provides to repay debt
- `outputToken`: collateralAsset (WETH) - what solver receives (withdrawn from pool)
- `inputAmount`: repayAmount
- `minOutputAmount`: withdrawAmount

**Fill Deleverage Intent:**

```bash
pnpm tsx src/intent-hooks.ts fillIntentWithData \
  <deleverage_intent_tx_hash> \
  <inputAmount> \  # Amount in wei
  <outputAmount>    # Amount in wei
```

**Important Notes:**
- Requires aToken approval for collateralAsset (auto-handled by `WithPrerequisites`)
- Solver must approve `inputToken` (bnUSD) to Intents contract (auto-handled)
- Use exact amounts from intent to avoid `PartialFillNotAllowed` error

### 4. Debt Side Leverage Hook

#### Check Status

```bash
pnpm tsx src/intent-hooks.ts checkDebtSideLeverageStatus \
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131  # debtAsset
```

#### Create Debt Side Leverage Intent

```bash
pnpm tsx src/intent-hooks.ts createDebtSideLeverageIntentWithPrerequisites \
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # collateralAsset
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # debtAsset
  <collateralAmount> \                          # Amount in wei
  <userProvidedAmount> \                         # Amount in wei
  <totalBorrowAmount> \                          # Amount in wei
  0                                               # deadline
```

**Intent Structure:**
- `inputToken`: debtAsset (bnUSD) - what solver provides (full totalBorrowAmount)
- `outputToken`: collateralAsset (WETH) - what solver receives
- `inputAmount`: totalBorrowAmount
- `minOutputAmount`: collateralAmount

**Fill Debt Side Leverage Intent:**

```bash
pnpm tsx src/intent-hooks.ts fillIntentWithData \
  <debt_side_leverage_intent_tx_hash> \
  <inputAmount> \  # Amount in wei (full totalBorrowAmount)
  <outputAmount>    # Amount in wei
```

**Important Notes:**
- Requires credit delegation approval for debtAsset (auto-handled)
- Requires token approval for debtAsset to Debt Side Leverage Hook (auto-handled)
- Solver must approve `inputToken` (bnUSD) to Intents contract (auto-handled)
- Hook uses user's provided amount + solver's amount to supply collateral and borrow
- Use exact amounts from intent to avoid `PartialFillNotAllowed` error

### 5. Liquidation Hook

#### Check Liquidation Opportunity

```bash
pnpm tsx src/intent-hooks.ts checkLiquidation \
  0xUserAddressToCheck
```

This checks if a user's position is liquidatable by verifying their health factor.

#### Create Liquidation Intent

```bash
pnpm tsx src/intent-hooks.ts createLiquidationIntent \
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # collateralAsset (WETH)
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # debtAsset (bnUSD)
  0xUserToLiquidateAddress \                     # userToLiquidate
  <collateralAmount> \                           # Amount in wei
  <debtAmount> \                                  # Amount in wei
  0                                               # deadline
```

**Intent Structure:**
- `inputToken`: collateralAsset (WETH) - what solver provides (collateral to seize)
- `outputToken`: debtAsset (bnUSD) - what solver receives (debt to repay)
- `inputAmount`: collateralAmount
- `minOutputAmount`: debtAmount

**Fill Liquidation Intent:**

```bash
pnpm tsx src/intent-hooks.ts fillIntentWithData \
  <liquidation_intent_tx_hash> \
  <inputAmount> \    # Amount in wei
  <outputAmount>      # Amount in wei
```

**Important Notes:**
- The hook automatically checks if the position is liquidatable before creating the intent
- User's health factor must be < 1.0 (represented as < 1e18 in wei) for liquidation to be possible
- Solver must approve `inputToken` (collateralAsset) to Intents contract (auto-handled)
- Use exact amounts from intent to avoid `PartialFillNotAllowed` error
- The liquidation hook seizes collateral and repays debt on behalf of the liquidated user

## Intent Lifecycle Operations

### Get Intent Data from Transaction

```bash
pnpm tsx src/intent-hooks.ts fillIntentWithData \
  <tx_hash> \
  <inputAmount> \
  <outputAmount>
```

This automatically:
1. Retrieves intent data from the transaction
2. Approves inputToken if needed
3. Fills the intent

### Cancel Intent

You need to provide full intent data from the `IntentCreated` event:

```bash
pnpm tsx src/intent-hooks.ts cancelIntentWithData \
  <intentId> \
  <creator> \
  <inputToken> \
  <outputToken> \
  <inputAmount> \
  <minOutputAmount> \
  <deadline> \
  <allowPartialFill> \
  <srcChain> \
  <dstChain> \
  <srcAddress> \
  <dstAddress> \
  <solver> \
  <data>
```

**Note**: Get intent data from SonicScan `IntentCreated` event logs.

### Check Intent State

```bash
pnpm tsx src/intent-hooks.ts getIntentState <intentHash>
```

## Approval Operations

### Check Credit Delegation

```bash
pnpm tsx src/intent-hooks.ts checkDelegation \
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # debtAsset
  leverage                                        # hookType
```

### Approve Credit Delegation

```bash
pnpm tsx src/intent-hooks.ts approveDelegation \
  0xE801CA34E19aBCbFeA12025378D19c4FBE250131 \  # debtAsset
  115792089237316195423570985008687907853269984665640564039457584007913129639935 \  # max amount
  leverage
```

### Approve Token Spending

```bash
pnpm tsx src/intent-hooks.ts approveToken \
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # tokenAddress
  115792089237316195423570985008687907853269984665640564039457584007913129639935 \  # max amount
  leverage
```

### Approve aToken Spending

```bash
pnpm tsx src/intent-hooks.ts approveAToken \
  0x50c42dEAcD8Fc9773493ED674b675bE577f2634b \  # underlyingAsset
  115792089237316195423570985008687907853269984665640564039457584007913129639935 \  # max amount
  deleverage
```

## Important Notes

### Address Normalization

- All addresses are automatically normalized to 20 bytes before being passed to HooksService
- Addresses from events may be 32-byte ABI-encoded; they are automatically extracted
- The `normalizeAddress` function handles this conversion

### Amount Format

- All amounts are in **wei** (smallest unit, 18 decimals)
- Example: `1000000000000000` = 0.001 tokens
- Example: `500000000000000000` = 0.5 tokens

### Token Approvals

- **Credit Delegation**: Required for leverage, debt side leverage hooks
- **Token Approval**: Required for debt side leverage hook
- **aToken Approval**: Required for deleverage hook
- **Fill Approval**: Solver must approve `inputToken` to Intents contract (auto-handled)

### Common Errors

1. **`ERC20InsufficientBalance` (0xe450d38c)**
   - **Cause**: Insufficient token balance
   - **Solution**: Ensure sufficient balance for the operation
   - **Note**: For leverage fills, solver needs WETH balance even though providing bnUSD

2. **`IntentAlreadyExists`**
   - **Cause**: Intent with same parameters already exists
   - **Solution**: Cancel existing intent or use different parameters

3. **`PartialFillNotAllowed`**
   - **Cause**: Attempting to fill with different amounts than intent
   - **Solution**: Use exact `inputAmount` and `minOutputAmount` from intent

4. **`ERC20InsufficientAllowance`**
   - **Cause**: Insufficient token allowance
   - **Solution**: Approve tokens before operation (auto-handled by `WithPrerequisites` methods)

5. **`IntentNotFound`**
   - **Cause**: Intent doesn't exist or hash mismatch
   - **Solution**: Verify intent data matches exactly (check address normalization)

## Transaction Reference

This section lists successful transaction hashes for reference. All amounts are in wei (18 decimals).

### Complete Successful Workflow

**Leverage → Fill → Deleverage → Fill (All Successful):**

1. **Leverage Intent Creation**
   - Tx Hash: `0x0361059bb1267234227ab0274ec3f1313857ec93dbcc051361f302cdc0b0879d`
   - Command: `createLeverageIntentWithPrerequisites`

2. **Leverage Intent Fill**
   - Tx Hash: `0xf5a2456429e725ed4640e2575ced4421a5fe39bc47f0eaa7ae68e6d92d8895cc`
   - Command: `fillIntentWithData` with exact amounts from intent

3. **Deleverage Intent Creation**
   - Tx Hash: `0xe12f729c5527198892a387934b2fccc119e199b9c68985b098286d5f8f707fc6`
   - Command: `createDeleverageIntent`

4. **Deleverage Intent Fill**
   - Tx Hash: `0x611f736dfaa97e6527f12660b41c4b3392be1cb01d6de5605013bc40c8b982be`
   - Command: `fillIntentWithData` with exact amounts from intent

**All transactions completed successfully!** ✅

### Credit Hook Workflow

1. **Credit Intent Creation**
   - Tx Hash: `0x5a448d0590f66cd0019abd262f4354133e58798601ff38e5f77463fe66bd705f`
   - Command: `createCreditIntentWithPrerequisites`

2. **Credit Intent Fill**
   - Tx Hash: `0x7458296f347a9b3007a903f657a52056849cc1d68bbf87e8461415861b747b49`
   - Command: `fillIntentWithData` with exact amounts from intent

### Debt Side Leverage Hook Workflow

1. **Debt Side Leverage Intent Creation**
   - Tx Hash: `0x91a74feb63936b1e155b9ccfe2d356b003509d44c50ce226a32bf154523d2f0a`
   - Command: `createDebtSideLeverageIntentWithPrerequisites`

2. **Debt Side Leverage Intent Fill**
   - Tx Hash: `0x61a61bf1eaffe72ba01eb7accf968e9670138a26d7c4bac1ded6cdb3b6fd3b02`
   - Command: `fillIntentWithData` with exact amounts from intent

## Contract Addresses

- **Intents Contract**: `0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef`
- **Credit Hook**: `0xe2A8E6023eB4C88c51472c8eB1332b87Dd09d8f7`
- **Leverage Hook**: `0xB0E2ee3C1dA131d4004f0b8cc2ca159FaA129B86`
- **Debt Side Leverage Hook**: `0x34aFac3b87c5585942D74a1F12eA13a33821D4bd`
- **Deleverage Hook**: `0x5fF9c34f1734c2B62c53231E6923D0967F95a8A3`
- **Liquidation Hook**: `0x9e6D9D2D9c900Be023d839910855A864eDE3ABBD`
- **Chain ID**: 146 (Sonic Mainnet)


## Getting Help

1. Verify token balances: `checkBalances`
2. Check intent state: `getIntentState`

