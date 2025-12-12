# Intent Hooks SDK Usage Guide

This guide provides comprehensive instructions for using the Intent Hooks SDK and the `intent-hooks.ts` CLI script to interact with the sodax protocol on Sonic Mainnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Reference Addresses](#reference-addresses)
3. [Setup & Configuration](#setup--configuration)
4. [CLI Commands Guide](#cli-commands-guide)
   - [General](#general)
   - [Credit Hook (Limit Orders)](#credit-hook-limit-orders)
   - [Leverage Hook](#leverage-hook)
   - [Deleverage Hook](#deleverage-hook)
   - [Debt Side Leverage Hook](#debt-side-leverage-hook)
   - [Liquidation Hook](#liquidation-hook)
5. [Common Workflows](#common-workflows)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Environment Variable**: Set `EVM_PRIVATE_KEY` in your `.env` file (must be a funded wallet on Sonic Mainnet).
2. **Tokens**: Ensure you have sufficient balances of `sodaUSDC` and `sodaETH`.
3. **Node.js**: Ensure Node.js and `pnpm` are installed.

## Reference Addresses

### Tokens (Sonic Mainnet - Chain ID 146)

| Token | Symbol | Address | Decimals | Usage |
|-------|--------|---------|----------|-------|
| **sodaETH** | sodaETH | `0x4effB5813271699683C25c734F4daBc45B363709` | 18 | Collateral |
| **sodaUSDC** | sodaUSDC | `0xAbbb91c0617090F0028BDC27597Cd0D038F3A833` | 18 | Debt |

### Contract Addresses

| Contract | Address |
|----------|---------|
| **Intents Contract** | `0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef` |
| **Credit Hook** | `0xe2A8E6023eB4C88c51472c8eB1332b87Dd09d8f7` |
| **Leverage Hook** | `0xB0E2ee3C1dA131d4004f0b8cc2ca159FaA129B86` |
| **Debt Side Leverage Hook** | `0x34aFac3b87c5585942D74a1F12eA13a33821D4bd` |
| **Deleverage Hook** | `0x5fF9c34f1734c2B62c53231E6923D0967F95a8A3` |
| **Liquidation Hook** | `0x9e6D9D2D9c900Be023d839910855A864eDE3ABBD` |

You can also view these addresses by running:
```bash
pnpm tsx src/intent-hooks.ts showAddresses
```

## Setup & Configuration

Verify your setup by checking token balances:

```bash
pnpm tsx src/intent-hooks.ts checkBalances
```

**Note**: If the balance shows 0 but is visible on sodax.com/swap, tokens might be in a smart contract wallet.

### Address Normalization
The SDK automatically handles address normalization (converting to 20 bytes), so you can safely paste addresses from block explorers.

### Amount Units
All amounts must be specified in **wei** (18 decimals).
- 1.0 Token = `1000000000000000000`
- 0.1 Token = `100000000000000000`

## Intent Types & Purposes

Understanding which hook to use and how they interact with your money market position:

### 1. Credit Hook (Limit Orders)
**Purpose**: Perform limit orders or spot swaps using your credit line or wallet balance.
- **Mechanism**: You **delegate credit** (or approve token spending) to the Hook contract. The hook uses this to borrow the "Debt Asset" from your available credit line (or pull from wallet).
- **Function**: The hook pays the "Debt Asset" to the solver, who in exchange provides the "Target Asset" to you.
- **Use Case**: swapping assets without upfront capital (using credit), or paying off debts with other assets.

### 2. Leverage Hook
**Purpose**: Open or increase a leveraged position in a single transaction.
- **Mechanism**: **Prerequisite: You must have an existing supply position.** You **delegate credit** to the Hook contract. The hook borrows the "Debt Asset" on your behalf against your existing collateral.
- **Function**: The hook borrows the asset, sends it to the solver, and the solver swaps it for "Collateral Asset". The hook then deposits this new collateral back into your position, effectively increasing your exposure.
- **Use Case**: Longing an asset with leverage (e.g., Borrow USDC -> Buy ETH -> Supply ETH).

### 3. Deleverage Hook
**Purpose**: Reduce leverage or close a position to avoid liquidation or take profits.
- **Mechanism**: You **approve the Hook contract to spend your aTokens** (your receipt tokens for supplied collateral).
- **Function**: The hook uses this approval to **withdraw** "Collateral Asset" from your position. It sends this collateral to the solver, who pays "Debt Asset" in return. The hook immediately uses this "Debt Asset" to **repay** your loan in the money market.
- **Use Case**: Reducing risk, taking profits, or avoiding liquidation (e.g., Withdraw ETH -> Sell for USDC -> Repay USDC Debt).

### 4. Debt Side Leverage Hook
**Purpose**: Advanced leverage management, often for specific debt strategies.
- **Mechanism**: Similar to the Leverage Hook, relies on **credit delegation**. You delegate borrowing power to the Hook.
- **Function**: The hook borrows "Debt Asset" on your behalf (can be combined with user-provided capital). The solver swaps this for "Collateral Asset", which is deposited into your position. This is distinct from standard leverage in how it handles the initial capital source and accounting.
- **Use Case**: Advanced yield farming or maximizing borrowing power against specific collateral.

### 5. Liquidation Hook
**Purpose**: Protocol health maintenance (for Liquidators).
- **Mechanism**: Does not require user delegation. The protocol allows liquidation of positions with Health Factor < 1.0.
- **Function**: The hook (called by a liquidator) pays "Debt Asset" to repay the user's bad debt. In return, the hook **seizes** a portion of the user's "Collateral Asset" (plus a liquidation bonus) and sends it to the solver/liquidator.
- **Use Case**: Running a liquidation bot to earn profits and secure the protocol.

## CLI Commands Guide

### General

| Command | Description |
|---------|-------------|
| `showAddresses` | Show all hook contract addresses |
| `checkBalances` | Check sodaUSDC and sodaETH balances |
| `getIntentState <hash>` | Check the state of an intent |
| `cancelIntentFromTx <txHash>` | Cancel an intent using its transaction hash |

### Credit Hook (Limit Orders)

**Create Credit Intent:**
```bash
pnpm tsx src/intent-hooks.ts createCreditIntentWithPrerequisites \
  <debtAsset_sodaUSDC> \
  <targetAsset_sodaETH> \
  <maxPayment_wei> \
  <minReceive_wei> \
  0  # deadline (0 = none)
```
*Auto-approves credit delegation.*

**Fill Credit Intent (for Solvers):**
```bash
pnpm tsx src/intent-hooks.ts fillIntentWithData <tx_hash> <inputAmount> <outputAmount>
```

### Leverage Hook

**Create Leverage Intent:**
```bash
pnpm tsx src/intent-hooks.ts createLeverageIntentWithPrerequisites \
  <collateralAsset_sodaETH> \
  <debtAsset_sodaUSDC> \
  <collateralAmount_wei> \
  <borrowAmount_wei> \
  0
```
- `inputToken` (Solver Provides): debtAsset
- `outputToken` (Solver Receives): collateralAsset

### Deleverage Hook

**Create Deleverage Intent:**
```bash
pnpm tsx src/intent-hooks.ts createDeleverageIntentWithPrerequisites \
  <collateralAsset_sodaETH> \
  <debtAsset_sodaUSDC> \
  <withdrawAmount_wei> \
  <repayAmount_wei> \
  0
```
- `inputToken` (Hook Withdraws): collateralAsset
- `outputToken` (Hook Repays): debtAsset (Solver provides this)

### Debt Side Leverage Hook

**Check Status:**
```bash
pnpm tsx src/intent-hooks.ts checkDebtSideLeverageStatus <debtAsset>
```

**Create Intent:**
```bash
pnpm tsx src/intent-hooks.ts createDebtSideLeverageIntentWithPrerequisites \
  <collateralAsset> \
  <debtAsset> \
  <collateralAmount> \
  <userProvidedAmount> \
  <totalBorrowAmount> \
  0
```

### Liquidation Hook

**Check Opportunity:**
```bash
pnpm tsx src/intent-hooks.ts checkLiquidation <userAddress>
```

**Create Intent:**
```bash
pnpm tsx src/intent-hooks.ts createLiquidationIntent \
  <collateralAsset> \
  <debtAsset> \
  <userToLiquidate> \
  <collateralAmount> \
  <debtAmount> \
  0
```

## Common Workflows

### Complete Leverage & Deleverage Test Loop
This workflow tests the entire cycle: creating a leverage position, filling it, then unwinding it with deleverage.

```bash
pnpm tsx src/intent-hooks.ts leverageAndDeleverage \
  0x4effB5813271699683C25c734F4daBc45B363709 \  # sodaETH
  0xAbbb91c0617090F0028BDC27597Cd0D038F3A833 \  # sodaUSDC
  <collateralAmount> \
  <borrowAmount>
```

**Steps Performed:**
1. Creates leverage intent (auto-approves delegation).
2. Fills leverage intent (you act as solver).
3. Verifies position.
4. Creates deleverage intent (auto-approves aToken).
5. Fills deleverage intent.

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `ERC20InsufficientBalance` | Low token balance | Ensure you have enough `sodaETH`/`sodaUSDC`. Solvers need `sodaETH` inventory. |
| `IntentAlreadyExists` | Duplicate intent ID | Intent ID is random but based on params; try again or cancel existing. |
| `PartialFillNotAllowed` | Wrong fill amounts | Use exact `inputAmount` and `minOutputAmount` when filling. |
| `ERC20InsufficientAllowance` | Missing approval | Use the `...WithPrerequisites` commands to auto-approve. |
| `IntentNotFound` | Hash mismatch | Verify intent data and address normalization. |
