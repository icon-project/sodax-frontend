// apps/node/src/intent-hooks.ts
import 'dotenv/config';
import { createPublicClient, createWalletClient, http, type Address, type Hex, erc20Abi, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonic } from 'viem/chains';
import { HooksService, HookType } from '@sodax/sdk';
import {
  SONIC_MAINNET_CHAIN_ID,
  type HubChainId,
  type HookIntent,
  getSolverConfig,
  getMoneyMarketConfig,
} from '@sodax/types';
import { poolAbi } from '@sodax/sdk';

// Load configuration from environment
const privateKey = process.env.EVM_PRIVATE_KEY;

if (!privateKey) {
  throw new Error('EVM_PRIVATE_KEY environment variable is required');
}

// Ensure private key has 0x prefix
const formattedPrivateKey = privateKey.startsWith('0x') ? (privateKey as Hex) : (`0x${privateKey}` as Hex);

// Constants
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

// Create viem clients
const account = privateKeyToAccount(formattedPrivateKey);

const publicClient = createPublicClient({
  chain: sonic,
  transport: http(HUB_RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: sonic,
  transport: http(HUB_RPC_URL),
});

// Initialize HooksService
const hooksService = new HooksService({
  publicClient,
  walletClient,
  chainId: HUB_CHAIN_ID,
});

// Helper to get user address
async function getUserAddress(): Promise<Address> {
  const addresses = await walletClient.getAddresses();
  if (!addresses[0]) {
    throw new Error('No wallet address available');
  }
  return addresses[0];
}

function normalizeAddress(addr: string): Hex {
  const hex = addr.startsWith('0x') ? addr : `0x${addr}`;
  const bytes = (hex.length - 2) / 2;
  if (bytes === 32) {
    // Extract last 20 bytes (40 hex chars) from 32-byte ABI-encoded value
    return `0x${hex.slice(-40)}` as Hex;
  }
  if (bytes === 20) {
    return hex.toLowerCase() as Hex;
  }
  if (bytes > 20) {
    // If longer, extract last 20 bytes
    return `0x${hex.slice(-40)}` as Hex;
  }
  // If shorter, it's invalid for EVM addresses, but use as-is
  return hex.toLowerCase() as Hex;
}

// === CREDIT HOOK FUNCTIONS ===

/**
 * Check credit delegation status for a specific hook
 */
async function checkCreditDelegation(debtAsset: Address, hookType: HookType): Promise<void> {
  console.log(`\n[checkCreditDelegation] Checking delegation for ${hookType} hook...`);
  const userAddress = await getUserAddress();
  console.log(`[checkCreditDelegation] User: ${userAddress}`);
  console.log(`[checkCreditDelegation] Debt Asset: ${debtAsset}`);

  const result = await hooksService.getCreditDelegationStatus(debtAsset, userAddress, hookType);

  if (result.ok) {
    console.log(`[checkCreditDelegation] Delegated: ${result.value.delegated}`);
    console.log(`[checkCreditDelegation] Allowance: ${result.value.allowance}`);
  } else {
    console.error('[checkCreditDelegation] Error:', result.error);
  }
}

/**
 * Approve credit delegation for a specific hook
 */
async function approveDelegation(debtAsset: Address, amount: string, hookType: HookType): Promise<void> {
  console.log(`\n[approveDelegation] Approving delegation for ${hookType} hook...`);
  console.log(`[approveDelegation] Debt Asset: ${debtAsset}`);
  console.log(`[approveDelegation] Amount: ${amount}`);

  const result = await hooksService.approveCreditDelegation(debtAsset, amount, hookType);

  if (result.ok) {
    console.log('[approveDelegation] Approved!');
    console.log(`[approveDelegation] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[approveDelegation] Error:', result.error);
  }
}

/**
 * Approve token spending for a specific hook
 */
async function approveTokenSpending(tokenAddress: Address, amount: string, hookType: HookType): Promise<void> {
  console.log(`\n[approveToken] Approving token for ${hookType} hook...`);
  console.log(`[approveToken] Token: ${tokenAddress}`);
  console.log(`[approveToken] Amount: ${amount}`);

  const result = await hooksService.approveToken(tokenAddress, amount, hookType);

  if (result.ok) {
    console.log('[approveToken] Approved!');
    console.log(`[approveToken] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[approveToken] Error:', result.error);
  }
}

/**
 * Approve aToken spending for a specific hook
 */
async function approveATokenSpending(underlyingAsset: Address, amount: string, hookType: HookType): Promise<void> {
  console.log(`\n[approveAToken] Approving aToken for ${hookType} hook...`);
  console.log(`[approveAToken] Underlying Asset: ${underlyingAsset}`);
  console.log(`[approveAToken] Amount: ${amount}`);

  const result = await hooksService.approveAToken(underlyingAsset, amount, hookType);

  if (result.ok) {
    console.log('[approveAToken] Approved!');
    console.log(`[approveAToken] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[approveAToken] Error:', result.error);
  }
}

/**
 * Create a credit intent (limit order)
 */
async function createCreditIntent(
  debtAsset: Address,
  targetAsset: Address,
  maxPayment: string,
  minReceive: string,
  deadline?: string,
): Promise<void> {
  console.log('\n[createCreditIntent] Creating credit intent (limit order)...');
  console.log(`[createCreditIntent] Debt Asset: ${debtAsset}`);
  console.log(`[createCreditIntent] Target Asset: ${targetAsset}`);
  console.log(`[createCreditIntent] Max Payment: ${maxPayment}`);
  console.log(`[createCreditIntent] Min Receive: ${minReceive}`);

  const result = await hooksService.createCreditIntent(
    {
      debtAsset,
      targetAsset,
      maxPayment,
      minReceive,
      deadline,
    },
    146, // Sonic mainnet chain ID
  );

  if (result.ok) {
    console.log('[createCreditIntent] Intent created!');
    console.log(`[createCreditIntent] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[createCreditIntent] Error:', result.error);
  }
}

/**
 * Create a credit intent with automatic prerequisite handling
 */
async function createCreditIntentWithPrerequisites(
  debtAsset: Address,
  targetAsset: Address,
  maxPayment: string,
  minReceive: string,
  deadline?: string,
  checkOnly?: boolean,
): Promise<void> {
  console.log('\n[createCreditIntentWithPrerequisites] Creating credit intent with prerequisites...');
  console.log(`[createCreditIntentWithPrerequisites] Debt Asset: ${debtAsset}`);
  console.log(`[createCreditIntentWithPrerequisites] Target Asset: ${targetAsset}`);
  console.log(`[createCreditIntentWithPrerequisites] Max Payment: ${maxPayment}`);
  console.log(`[createCreditIntentWithPrerequisites] Min Receive: ${minReceive}`);
  if (checkOnly) {
    console.log('[createCreditIntentWithPrerequisites] Check-only mode: will not create intent');
  }

  const result = await hooksService.createCreditIntentWithPrerequisites(
    {
      debtAsset,
      targetAsset,
      maxPayment,
      minReceive,
      deadline,
    },
    146,
    { checkOnly: checkOnly === true },
  );

  if (result.ok) {
    console.log('[createCreditIntentWithPrerequisites] Prerequisites:');
    console.log(`  - Credit Delegation Approved: ${result.value.prerequisites.creditDelegationApproved}`);
    if (!checkOnly) {
      console.log('[createCreditIntentWithPrerequisites] Intent created!');
      console.log(`[createCreditIntentWithPrerequisites] Tx Hash: ${result.value.txHash}`);
    }
  } else {
    console.error('[createCreditIntentWithPrerequisites] Error:', result.error);
  }
}

// === LEVERAGE HOOK FUNCTIONS ===

/**
 * Create a leverage intent
 */
async function createLeverageIntent(
  collateralAsset: Address,
  debtAsset: Address,
  collateralAmount: string,
  borrowAmount: string,
  deadline?: string,
): Promise<void> {
  console.log('\n[createLeverageIntent] Creating leverage intent...');
  console.log(`[createLeverageIntent] Collateral Asset: ${collateralAsset}`);
  console.log(`[createLeverageIntent] Debt Asset: ${debtAsset}`);
  console.log(`[createLeverageIntent] Collateral Amount: ${collateralAmount}`);
  console.log(`[createLeverageIntent] Borrow Amount: ${borrowAmount}`);

  const result = await hooksService.createLeverageIntent(
    {
      collateralAsset,
      debtAsset,
      collateralAmount,
      borrowAmount,
      deadline,
    },
    146,
  );

  if (result.ok) {
    console.log('[createLeverageIntent] Intent created!');
    console.log(`[createLeverageIntent] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[createLeverageIntent] Error:', result.error);
  }
}

/**
 * Create a leverage intent with automatic prerequisite handling
 */
async function createLeverageIntentWithPrerequisites(
  collateralAsset: Address,
  debtAsset: Address,
  collateralAmount: string,
  borrowAmount: string,
  deadline?: string,
  checkOnly?: boolean,
): Promise<void> {
  console.log('\n[createLeverageIntentWithPrerequisites] Creating leverage intent with prerequisites...');
  console.log(`[createLeverageIntentWithPrerequisites] Collateral Asset: ${collateralAsset}`);
  console.log(`[createLeverageIntentWithPrerequisites] Debt Asset: ${debtAsset}`);
  console.log(`[createLeverageIntentWithPrerequisites] Collateral Amount: ${collateralAmount}`);
  console.log(`[createLeverageIntentWithPrerequisites] Borrow Amount: ${borrowAmount}`);
  if (checkOnly) {
    console.log('[createLeverageIntentWithPrerequisites] Check-only mode: will not create intent');
  }

  const result = await hooksService.createLeverageIntentWithPrerequisites(
    {
      collateralAsset,
      debtAsset,
      collateralAmount,
      borrowAmount,
      deadline,
    },
    146,
    { checkOnly: checkOnly === true },
  );

  if (result.ok) {
    console.log('[createLeverageIntentWithPrerequisites] Prerequisites:');
    console.log(`  - Credit Delegation Approved: ${result.value.prerequisites.creditDelegationApproved}`);
    if (!checkOnly) {
      console.log('[createLeverageIntentWithPrerequisites] Intent created!');
      console.log(`[createLeverageIntentWithPrerequisites] Tx Hash: ${result.value.txHash}`);
    }
  } else {
    console.error('[createLeverageIntentWithPrerequisites] Error:', result.error);
  }
}

// === DEBT SIDE LEVERAGE HOOK FUNCTIONS ===

/**
 * Check debt side leverage status
 */
async function checkDebtSideLeverageStatus(debtAsset: Address): Promise<void> {
  console.log('\n[checkDebtSideLeverageStatus] Checking status...');
  const userAddress = await getUserAddress();
  console.log(`[checkDebtSideLeverageStatus] User: ${userAddress}`);
  console.log(`[checkDebtSideLeverageStatus] Debt Asset: ${debtAsset}`);

  const result = await hooksService.getDebtSideLeverageStatus(debtAsset, userAddress);

  if (result.ok) {
    console.log(`[checkDebtSideLeverageStatus] Token Allowance: ${result.value.tokenAllowance}`);
    console.log(`[checkDebtSideLeverageStatus] Credit Delegation: ${result.value.creditDelegation}`);
    console.log(`[checkDebtSideLeverageStatus] Token Balance: ${result.value.tokenBalance}`);
    console.log(`[checkDebtSideLeverageStatus] Is Ready: ${result.value.isReady ? ' Yes' : ' No'}`);
  } else {
    console.error('[checkDebtSideLeverageStatus] Error:', result.error);
  }
}

/**
 * Create a debt side leverage intent
 */
async function createDebtSideLeverageIntent(
  collateralAsset: Address,
  debtAsset: Address,
  collateralAmount: string,
  userProvidedAmount: string,
  totalBorrowAmount: string,
  deadline?: string,
): Promise<void> {
  console.log('\n[createDebtSideLeverageIntent] Creating debt side leverage intent...');
  console.log(`[createDebtSideLeverageIntent] Collateral Asset: ${collateralAsset}`);
  console.log(`[createDebtSideLeverageIntent] Debt Asset: ${debtAsset}`);
  console.log(`[createDebtSideLeverageIntent] Collateral Amount: ${collateralAmount}`);
  console.log(`[createDebtSideLeverageIntent] User Provided Amount: ${userProvidedAmount}`);
  console.log(`[createDebtSideLeverageIntent] Total Borrow Amount: ${totalBorrowAmount}`);

  const result = await hooksService.createDebtSideLeverageIntent(
    {
      collateralAsset,
      debtAsset,
      collateralAmount,
      userProvidedAmount,
      totalBorrowAmount,
      deadline,
    },
    146,
  );

  if (result.ok) {
    console.log('[createDebtSideLeverageIntent]  Intent created!');
    console.log(`[createDebtSideLeverageIntent] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[createDebtSideLeverageIntent] Error:', result.error);
  }
}

/**
 * Create a debt side leverage intent with automatic prerequisite handling
 */
async function createDebtSideLeverageIntentWithPrerequisites(
  collateralAsset: Address,
  debtAsset: Address,
  collateralAmount: string,
  userProvidedAmount: string,
  totalBorrowAmount: string,
  deadline?: string,
  checkOnly?: boolean,
): Promise<void> {
  console.log(
    '\n[createDebtSideLeverageIntentWithPrerequisites] Creating debt side leverage intent with prerequisites...',
  );
  console.log(`[createDebtSideLeverageIntentWithPrerequisites] Collateral Asset: ${collateralAsset}`);
  console.log(`[createDebtSideLeverageIntentWithPrerequisites] Debt Asset: ${debtAsset}`);
  console.log(`[createDebtSideLeverageIntentWithPrerequisites] Collateral Amount: ${collateralAmount}`);
  console.log(`[createDebtSideLeverageIntentWithPrerequisites] User Provided Amount: ${userProvidedAmount}`);
  console.log(`[createDebtSideLeverageIntentWithPrerequisites] Total Borrow Amount: ${totalBorrowAmount}`);
  if (checkOnly) {
    console.log('[createDebtSideLeverageIntentWithPrerequisites] Check-only mode: will not create intent');
  }

  const result = await hooksService.createDebtSideLeverageIntentWithPrerequisites(
    {
      collateralAsset,
      debtAsset,
      collateralAmount,
      userProvidedAmount,
      totalBorrowAmount,
      deadline,
    },
    146,
    { checkOnly: checkOnly === true },
  );

  if (result.ok) {
    console.log('[createDebtSideLeverageIntentWithPrerequisites] Prerequisites:');
    console.log(`  - Credit Delegation Approved: ${result.value.prerequisites.creditDelegationApproved}`);
    console.log(`  - Token Approved: ${result.value.prerequisites.tokenApproved}`);
    if (!checkOnly) {
      console.log('[createDebtSideLeverageIntentWithPrerequisites] Intent created!');
      console.log(`[createDebtSideLeverageIntentWithPrerequisites] Tx Hash: ${result.value.txHash}`);
    }
  } else {
    console.error('[createDebtSideLeverageIntentWithPrerequisites] Error:', result.error);
  }
}

// === DELEVERAGE HOOK FUNCTIONS ===

/**
 * Check aToken approval info for deleverage
 */
async function checkATokenApprovalInfo(
  collateralAsset: Address,
  withdrawAmount: string,
  feeAmount?: string,
): Promise<void> {
  console.log('\n[checkATokenApprovalInfo] Checking aToken approval info...');
  const userAddress = await getUserAddress();
  console.log(`[checkATokenApprovalInfo] User: ${userAddress}`);
  console.log(`[checkATokenApprovalInfo] Collateral Asset: ${collateralAsset}`);
  console.log(`[checkATokenApprovalInfo] Withdraw Amount: ${withdrawAmount}`);

  const result = await hooksService.getATokenApprovalInfo(collateralAsset, userAddress, withdrawAmount, feeAmount);

  if (result.ok) {
    console.log(`[checkATokenApprovalInfo] aToken Address: ${result.value.aTokenAddress}`);
    console.log(`[checkATokenApprovalInfo] aTokens Needed: ${result.value.aTokensNeeded}`);
    console.log(`[checkATokenApprovalInfo] Current Allowance: ${result.value.currentAllowance}`);
    console.log(`[checkATokenApprovalInfo] Is Approved: ${result.value.isApproved ? ' Yes' : ' No'}`);
  } else {
    console.error('[checkATokenApprovalInfo] Error:', result.error);
  }
}

/**
 * Create a deleverage intent
 */
async function createDeleverageIntent(
  collateralAsset: Address,
  debtAsset: Address,
  withdrawAmount: string,
  repayAmount: string,
  deadline?: string,
): Promise<void> {
  console.log('\n[createDeleverageIntent] Creating deleverage intent...');
  console.log(`[createDeleverageIntent] Collateral Asset: ${collateralAsset}`);
  console.log(`[createDeleverageIntent] Debt Asset: ${debtAsset}`);
  console.log(`[createDeleverageIntent] Withdraw Amount: ${withdrawAmount}`);
  console.log(`[createDeleverageIntent] Repay Amount: ${repayAmount}`);

  const result = await hooksService.createDeleverageIntent(
    {
      collateralAsset,
      debtAsset,
      withdrawAmount,
      repayAmount,
      deadline,
    },
    146,
  );

  if (result.ok) {
    console.log('[createDeleverageIntent] Intent created!');
    console.log(`[createDeleverageIntent] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[createDeleverageIntent] Error:', result.error);
  }
}

/**
 * Create a deleverage intent with automatic prerequisite handling
 */
async function createDeleverageIntentWithPrerequisites(
  collateralAsset: Address,
  debtAsset: Address,
  withdrawAmount: string,
  repayAmount: string,
  deadline?: string,
  checkOnly?: boolean,
): Promise<void> {
  console.log('\n[createDeleverageIntentWithPrerequisites] Creating deleverage intent with prerequisites...');
  console.log(`[createDeleverageIntentWithPrerequisites] Collateral Asset: ${collateralAsset}`);
  console.log(`[createDeleverageIntentWithPrerequisites] Debt Asset: ${debtAsset}`);
  console.log(`[createDeleverageIntentWithPrerequisites] Withdraw Amount: ${withdrawAmount}`);
  console.log(`[createDeleverageIntentWithPrerequisites] Repay Amount: ${repayAmount}`);
  if (checkOnly) {
    console.log('[createDeleverageIntentWithPrerequisites] Check-only mode: will not create intent');
  }

  const result = await hooksService.createDeleverageIntentWithPrerequisites(
    {
      collateralAsset,
      debtAsset,
      withdrawAmount,
      repayAmount,
      deadline,
    },
    146,
    { checkOnly: checkOnly === true },
  );

  if (result.ok) {
    console.log('[createDeleverageIntentWithPrerequisites] Prerequisites:');
    console.log(`  - aToken Approved: ${result.value.prerequisites.aTokenApproved}`);
    if (!checkOnly) {
      console.log('[createDeleverageIntentWithPrerequisites] Intent created!');
      console.log(`[createDeleverageIntentWithPrerequisites] Tx Hash: ${result.value.txHash}`);
    }
  } else {
    console.error('[createDeleverageIntentWithPrerequisites] Error:', result.error);
  }
}

// === LIQUIDATION HOOK FUNCTIONS ===

/**
 * Check if a user position is liquidatable
 */
async function checkLiquidationOpportunity(userToCheck: Address): Promise<void> {
  console.log('\n[checkLiquidationOpportunity] Checking liquidation opportunity...');
  console.log(`[checkLiquidationOpportunity] User to Check: ${userToCheck}`);

  const result = await hooksService.getLiquidationOpportunity(userToCheck);

  if (result.ok) {
    console.log(`[checkLiquidationOpportunity] Health Factor: ${result.value.healthFactor}`);
    console.log(`[checkLiquidationOpportunity] Is Liquidatable: ${result.value.isLiquidatable ? ' Yes' : ' No'}`);
    console.log('[checkLiquidationOpportunity] Account Data:');
    console.log(`  - Total Collateral: ${result.value.accountData.totalCollateralBase}`);
    console.log(`  - Total Debt: ${result.value.accountData.totalDebtBase}`);
    console.log(`  - Available Borrows: ${result.value.accountData.availableBorrowsBase}`);
    console.log(`  - LTV: ${result.value.accountData.ltv}`);
    console.log(`  - Liquidation Threshold: ${result.value.accountData.currentLiquidationThreshold}`);
  } else {
    console.error('[checkLiquidationOpportunity] Error:', result.error);
  }
}

/**
 * Create a liquidation intent
 */
async function createLiquidationIntent(
  collateralAsset: Address,
  debtAsset: Address,
  userToLiquidate: Address,
  collateralAmount: string,
  debtAmount: string,
  deadline?: string,
): Promise<void> {
  console.log('\n[createLiquidationIntent] Creating liquidation intent...');
  console.log(`[createLiquidationIntent] Collateral Asset: ${collateralAsset}`);
  console.log(`[createLiquidationIntent] Debt Asset: ${debtAsset}`);
  console.log(`[createLiquidationIntent] User to Liquidate: ${userToLiquidate}`);
  console.log(`[createLiquidationIntent] Collateral Amount: ${collateralAmount}`);
  console.log(`[createLiquidationIntent] Debt Amount: ${debtAmount}`);

  const result = await hooksService.createLiquidationIntent(
    {
      collateralAsset,
      debtAsset,
      userToLiquidate,
      collateralAmount,
      debtAmount,
      deadline,
    },
    146,
  );

  if (result.ok) {
    console.log('[createLiquidationIntent] Intent created!');
    console.log(`[createLiquidationIntent] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[createLiquidationIntent] Error:', result.error);
  }
}

// === INTENT LIFECYCLE FUNCTIONS ===

/**
 * Get intent hash from transaction hash by parsing IntentCreated event
 */
async function getIntentHashFromTx(txHash: Hex): Promise<Hex | null> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const solverConfig = getSolverConfig(HUB_CHAIN_ID);
    const userAddress = await getUserAddress();

    // Query IntentCreated events from the transaction's block
    const blockNumber = receipt.blockNumber;

    // Get all IntentCreated events from the block
    const logs = await publicClient.getLogs({
      address: solverConfig.intentsContract as Address,
      event: {
        type: 'event',
        name: 'IntentCreated',
        inputs: [
          { name: 'intentHash', type: 'bytes32', indexed: false },
          {
            name: 'intent',
            type: 'tuple',
            components: [
              { name: 'intentId', type: 'uint256' },
              { name: 'creator', type: 'address' },
              { name: 'inputToken', type: 'address' },
              { name: 'outputToken', type: 'address' },
              { name: 'inputAmount', type: 'uint256' },
              { name: 'minOutputAmount', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
              { name: 'allowPartialFill', type: 'bool' },
              { name: 'srcChain', type: 'uint256' },
              { name: 'dstChain', type: 'uint256' },
              { name: 'srcAddress', type: 'bytes' },
              { name: 'dstAddress', type: 'bytes' },
              { name: 'solver', type: 'address' },
              { name: 'data', type: 'bytes' },
            ],
          },
        ],
      },
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });

    // Find the log where creator matches our address
    const matchingLog = logs.find(log => {
      const intent = log.args.intent;
      return intent && intent.creator?.toLowerCase() === userAddress.toLowerCase();
    });

    if (matchingLog && matchingLog.args.intentHash) {
      return matchingLog.args.intentHash as Hex;
    }

    return null;
  } catch (error) {
    console.error('[getIntentHashFromTx] Error:', error);
    return null;
  }
}

/**
 * Get intent state by hash
 */
async function getIntentState(intentHash: Hex): Promise<void> {
  console.log('\n[getIntentState] Querying intent state...');
  console.log(`[getIntentState] Intent Hash: ${intentHash}`);

  const result = await hooksService.getIntentState(intentHash);

  if (result.ok) {
    console.log('[getIntentState] Intent State:');
    console.log(`  - Exists: ${result.value.exists}`);
    console.log(`  - Remaining Input: ${result.value.remainingInput}`);
    console.log(`  - Received Output: ${result.value.receivedOutput}`);
    console.log(`  - Pending Payment: ${result.value.pendingPayment}`);
  } else {
    console.error('[getIntentState] Error:', result.error);
  }
}

/**
 * Get pending intent state
 */
async function getPendingIntentState(intentHash: Hex): Promise<void> {
  console.log('\n[getPendingIntentState] Querying pending state...');
  console.log(`[getPendingIntentState] Intent Hash: ${intentHash}`);

  const result = await hooksService.getPendingIntentState(intentHash);

  if (result.ok) {
    console.log('[getPendingIntentState] Pending State:');
    console.log(`  - Pending Input: ${result.value.pendingInput}`);
    console.log(`  - Pending Output: ${result.value.pendingOutput}`);
  } else {
    console.error('[getPendingIntentState] Error:', result.error);
  }
}

/**
 * Check if an intent is fillable
 */
async function checkFillable(intentHash: Hex): Promise<void> {
  console.log('\n[checkFillable] Checking if intent is fillable...');
  console.log(`[checkFillable] Intent Hash: ${intentHash}`);

  const result = await hooksService.isFillable(intentHash);

  if (result.ok) {
    console.log(`[checkFillable] Is Fillable: ${result.value ? 'Yes' : 'No'}`);
  } else {
    console.error('[checkFillable] Error:', result.error);
  }
}

/**
 * Check intent state before cancellation
 */
async function checkIntentStateBeforeCancel(intent: HookIntent): Promise<void> {
  console.log('\n[checkIntentStateBeforeCancel] Checking intent state...');

  const intentHash = hooksService.computeIntentHash(intent);
  console.log(`[checkIntentStateBeforeCancel] Intent Hash: ${intentHash}`);

  const stateResult = await hooksService.getIntentState(intentHash);
  if (!stateResult.ok) {
    console.error('[checkIntentStateBeforeCancel] Error getting intent state:', stateResult.error);
    return;
  }

  const { exists, remainingInput } = stateResult.value;
  console.log(`[checkIntentStateBeforeCancel] Intent exists: ${exists}`);
  console.log(`[checkIntentStateBeforeCancel] Remaining input: ${remainingInput}`);

  if (!exists) {
    console.error('[checkIntentStateBeforeCancel] Intent does not exist!');
    console.error('[checkIntentStateBeforeCancel] This might mean:');
    console.error('  - The intent hash does not match (check address normalization)');
    console.error('  - The intent was never created');
    console.error('  - The intent parameters are incorrect');
    return;
  }

  if (remainingInput === '0') {
    console.error('[checkIntentStateBeforeCancel] Intent has no remaining input - cannot cancel!');
    console.error('[checkIntentStateBeforeCancel] The intent has already been fully filled or cancelled.');
    return;
  }

  console.log('[checkIntentStateBeforeCancel] Intent can be cancelled ✓');
}

/**
 * Cancel an intent using intent data directly
 */
async function cancelIntentWithData(intentData: {
  intentId: string;
  creator: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: string;
  minOutputAmount: string;
  deadline: string;
  allowPartialFill: boolean;
  srcChain: string;
  dstChain: string;
  srcAddress: string; // hex string
  dstAddress: string; // hex string
  solver: Address;
  data: string; // hex string
}): Promise<void> {
  console.log('\n[cancelIntentWithData] Cancelling intent with provided data...');
  console.log(`[cancelIntentWithData] Intent ID: ${intentData.intentId}`);
  console.log(`[cancelIntentWithData] Creator: ${intentData.creator}`);

  // Ensure data is properly formatted as Hex
  const dataHex = intentData.data.startsWith('0x') ? (intentData.data as Hex) : (`0x${intentData.data}` as Hex);

  const srcAddressHex = normalizeAddress(intentData.srcAddress);
  const dstAddressHex = normalizeAddress(intentData.dstAddress);

  console.log(`[cancelIntentWithData] Data (hex): ${dataHex}`);
  console.log(`[cancelIntentWithData] Data length: ${(dataHex.length - 2) / 2} bytes`);
  console.log(
    `[cancelIntentWithData] srcAddress (formatted): ${srcAddressHex} (${(srcAddressHex.length - 2) / 2} bytes)`,
  );
  console.log(
    `[cancelIntentWithData] dstAddress (formatted): ${dstAddressHex} (${(dstAddressHex.length - 2) / 2} bytes)`,
  );

  const intent: HookIntent = {
    intentId: BigInt(intentData.intentId),
    creator: intentData.creator,
    inputToken: intentData.inputToken,
    outputToken: intentData.outputToken,
    inputAmount: BigInt(intentData.inputAmount),
    minOutputAmount: BigInt(intentData.minOutputAmount),
    deadline: BigInt(intentData.deadline),
    allowPartialFill: intentData.allowPartialFill,
    srcChain: BigInt(intentData.srcChain),
    dstChain: BigInt(intentData.dstChain),
    srcAddress: srcAddressHex,
    dstAddress: dstAddressHex,
    solver: intentData.solver,
    data: dataHex,
  };

  // Check intent state before attempting cancellation
  await checkIntentStateBeforeCancel(intent);

  const result = await hooksService.cancelIntent(intent);

  if (result.ok) {
    console.log('[cancelIntentWithData] Intent cancelled!');
    console.log(`[cancelIntentWithData] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[cancelIntentWithData] Error:', result.error);
  }
}

/**
 * Get full intent data from a transaction hash
 */
async function getIntentDataFromTx(txHash: Hex): Promise<HookIntent | null> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const solverConfig = getSolverConfig(HUB_CHAIN_ID);
    const userAddress = await getUserAddress();

    // Query IntentCreated events from the transaction's block
    const blockNumber = receipt.blockNumber;

    // Get all IntentCreated events from the block
    const logs = await publicClient.getLogs({
      address: solverConfig.intentsContract as Address,
      event: {
        type: 'event',
        name: 'IntentCreated',
        inputs: [
          { name: 'intentHash', type: 'bytes32', indexed: false },
          {
            name: 'intent',
            type: 'tuple',
            components: [
              { name: 'intentId', type: 'uint256' },
              { name: 'creator', type: 'address' },
              { name: 'inputToken', type: 'address' },
              { name: 'outputToken', type: 'address' },
              { name: 'inputAmount', type: 'uint256' },
              { name: 'minOutputAmount', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
              { name: 'allowPartialFill', type: 'bool' },
              { name: 'srcChain', type: 'uint256' },
              { name: 'dstChain', type: 'uint256' },
              { name: 'srcAddress', type: 'bytes' },
              { name: 'dstAddress', type: 'bytes' },
              { name: 'solver', type: 'address' },
              { name: 'data', type: 'bytes' },
            ],
          },
        ],
      },
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });

    // Find the log where creator matches our address
    const matchingLog = logs.find(log => {
      const intent = log.args.intent;
      return intent && intent.creator?.toLowerCase() === userAddress.toLowerCase();
    });

    if (matchingLog && matchingLog.args.intent) {
      const intent = matchingLog.args.intent;
      return {
        intentId: intent.intentId,
        creator: intent.creator as Address,
        inputToken: intent.inputToken as Address,
        outputToken: intent.outputToken as Address,
        inputAmount: intent.inputAmount,
        minOutputAmount: intent.minOutputAmount,
        deadline: intent.deadline,
        allowPartialFill: intent.allowPartialFill,
        srcChain: intent.srcChain,
        dstChain: intent.dstChain,
        srcAddress: normalizeAddress(intent.srcAddress as string),
        dstAddress: normalizeAddress(intent.dstAddress as string),
        solver: intent.solver as Address,
        data: intent.data as string,
      };
    }

    return null;
  } catch (error) {
    console.error('[getIntentDataFromTx] Error:', error);
    return null;
  }
}

/**
 * Cancel an intent using transaction hash
 */
async function cancelIntentFromTx(txHash: Hex): Promise<void> {
  console.log('\n[cancelIntentFromTx] Getting intent data from transaction...');
  console.log(`[cancelIntentFromTx] Transaction Hash: ${txHash}`);

  const intentData = await getIntentDataFromTx(txHash);
  if (!intentData) {
    console.error('[cancelIntentFromTx] Failed to get intent data from transaction');
    return;
  }

  console.log('[cancelIntentFromTx] Intent data retrieved, cancelling intent...');

  await cancelIntentWithData({
    intentId: intentData.intentId.toString(),
    creator: intentData.creator,
    inputToken: intentData.inputToken,
    outputToken: intentData.outputToken,
    inputAmount: intentData.inputAmount.toString(),
    minOutputAmount: intentData.minOutputAmount.toString(),
    deadline: intentData.deadline.toString(),
    allowPartialFill: intentData.allowPartialFill,
    srcChain: intentData.srcChain.toString(),
    dstChain: intentData.dstChain.toString(),
    srcAddress: intentData.srcAddress,
    dstAddress: intentData.dstAddress,
    solver: intentData.solver,
    data: intentData.data,
  });
}

/**
 * Ensure token is approved to Intents contract for filling
 * The solver needs to approve inputToken to the Intents contract
 */
async function ensureTokenApprovedForFill(tokenAddress: Address, amount: string): Promise<void> {
  const userAddress = await getUserAddress();
  const solverConfig = getSolverConfig(HUB_CHAIN_ID);
  const intentsContractAddress = solverConfig.intentsContract;

  try {
    // Check balance first
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    const currentAllowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [userAddress, intentsContractAddress],
    });

    const amountBigInt = BigInt(amount);
    console.log(
      `[ensureTokenApprovedForFill] Balance: ${balance.toString()}, Required: ${amountBigInt.toString()}, Allowance: ${currentAllowance.toString()}`,
    );

    if (balance < amountBigInt) {
      throw new Error(`Insufficient balance: have ${balance.toString()}, need ${amountBigInt.toString()}`);
    }

    if (currentAllowance < amountBigInt) {
      console.log(`[ensureTokenApprovedForFill] Approving ${amount} tokens to Intents contract...`);
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [intentsContractAddress, amountBigInt],
        account: walletClient.account,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log('[ensureTokenApprovedForFill] Token approved!');
    } else {
      console.log('[ensureTokenApprovedForFill] Token already approved');
    }
  } catch (error) {
    console.error('[ensureTokenApprovedForFill] Error:', error);
    throw error;
  }
}

/**
 * Fill an intent (using user address as solver)
 * Addresses are normalized to 20 bytes before passing to HooksService
 * Automatically approves inputToken if needed
 */
async function fillIntentWithData(
  intent: HookIntent,
  inputAmount: string,
  outputAmount: string,
  externalFillId?: string,
): Promise<void> {
  console.log('\n[fillIntentWithData] Filling intent...');
  console.log(`[fillIntentWithData] Input Amount: ${inputAmount}`);
  console.log(`[fillIntentWithData] Output Amount: ${outputAmount}`);

  // Ensure inputToken is approved (solver needs to provide inputToken)
  console.log('[fillIntentWithData] Ensuring inputToken is approved...');
  await ensureTokenApprovedForFill(intent.inputToken, inputAmount);

  // Normalize addresses to 20 bytes before passing to HooksService
  const normalizedIntent: HookIntent = {
    ...intent,
    srcAddress: normalizeAddress(intent.srcAddress),
    dstAddress: normalizeAddress(intent.dstAddress),
  };

  console.log(
    `[fillIntentWithData] srcAddress (normalized): ${normalizedIntent.srcAddress} (${(normalizedIntent.srcAddress.length - 2) / 2} bytes)`,
  );
  console.log(
    `[fillIntentWithData] dstAddress (normalized): ${normalizedIntent.dstAddress} (${(normalizedIntent.dstAddress.length - 2) / 2} bytes)`,
  );

  const result = await hooksService.fillIntent({
    intent: normalizedIntent,
    inputAmount,
    outputAmount,
    externalFillId,
  });

  if (result.ok) {
    console.log('[fillIntentWithData] Intent filled!');
    console.log(`[fillIntentWithData] Tx Hash: ${result.value.txHash}`);
  } else {
    console.error('[fillIntentWithData] Error:', result.error);
  }
}

/**
 * Create leverage intent, fill it, then create deleverage intent
 */
async function leverageAndDeleverage(
  collateralAsset: Address,
  debtAsset: Address,
  collateralAmount: string,
  borrowAmount: string,
  deadline?: string,
): Promise<void> {
  console.log('\n[leverageAndDeleverage] Starting leverage -> fill -> deleverage workflow...');
  console.log(`[leverageAndDeleverage] Collateral Asset: ${collateralAsset}`);
  console.log(`[leverageAndDeleverage] Debt Asset: ${debtAsset}`);
  console.log(`[leverageAndDeleverage] Collateral Amount: ${collateralAmount}`);
  console.log(`[leverageAndDeleverage] Borrow Amount: ${borrowAmount}`);

  // Step 1: Create leverage intent with prerequisites
  console.log('\n[leverageAndDeleverage] Step 1: Creating leverage intent...');
  const leverageResult = await hooksService.createLeverageIntentWithPrerequisites(
    {
      collateralAsset,
      debtAsset,
      collateralAmount,
      borrowAmount,
      deadline,
    },
    146,
    { checkOnly: false },
  );

  if (!leverageResult.ok) {
    console.error('[leverageAndDeleverage] Failed to create leverage intent:', leverageResult.error);
    return;
  }

  const leverageTxHash = leverageResult.value.txHash;
  console.log(`[leverageAndDeleverage] Leverage intent created! Tx Hash: ${leverageTxHash}`);

  // Step 2: Get full intent data from transaction
  console.log('\n[leverageAndDeleverage] Step 2: Getting intent data from transaction...');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for transaction to be indexed

  const intentData = await getIntentDataFromTx(leverageTxHash as Hex);
  if (!intentData) {
    console.error('[leverageAndDeleverage] Failed to get intent data from transaction');
    return;
  }

  console.log('[leverageAndDeleverage] Intent data retrieved successfully');

  // Step 3: Fill the leverage intent (using user address as solver)
  console.log('\n[leverageAndDeleverage] Step 3: Filling leverage intent...');
  // For leverage intent:
  // - inputToken = debtAsset (bnUSD), inputAmount = borrowAmount
  // - outputToken = collateralAsset (WETH), minOutputAmount = collateralAmount
  // We need to fill with the exact amounts from the intent to avoid PartialFillNotAllowed
  await fillIntentWithData(intentData, intentData.inputAmount.toString(), intentData.minOutputAmount.toString());

  // Wait for fill to be processed
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 4: Check position after leverage
  console.log('\n[leverageAndDeleverage] Step 4: Checking position after leverage...');
  const userAddress = await getUserAddress();
  await checkLiquidationOpportunity(userAddress);

  // Step 5: Create deleverage intent
  // For deleverage: we withdraw collateral and repay debt
  // withdrawAmount should be less than or equal to what we supplied
  // repayAmount should be less than or equal to what we borrowed
  console.log('\n[leverageAndDeleverage] Step 5: Creating deleverage intent...');
  const deleverageResult = await hooksService.createDeleverageIntentWithPrerequisites(
    {
      collateralAsset,
      debtAsset,
      withdrawAmount: collateralAmount, // Withdraw the same amount we supplied
      repayAmount: borrowAmount, // Repay the same amount we borrowed
      deadline,
    },
    146,
    { checkOnly: false },
  );

  if (!deleverageResult.ok) {
    console.error('[leverageAndDeleverage] Failed to create deleverage intent:', deleverageResult.error);
    return;
  }

  const deleverageTxHash = deleverageResult.value.txHash;
  console.log(`[leverageAndDeleverage] Deleverage intent created! Tx Hash: ${deleverageTxHash}`);

  // Step 6: Get deleverage intent data from transaction
  console.log('\n[leverageAndDeleverage] Step 6: Getting deleverage intent data from transaction...');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for transaction to be indexed

  const deleverageIntentData = await getIntentDataFromTx(deleverageTxHash as Hex);
  if (!deleverageIntentData) {
    console.error('[leverageAndDeleverage] Failed to get deleverage intent data from transaction');
    return;
  }

  console.log('[leverageAndDeleverage] Deleverage intent data retrieved successfully');

  // Step 7: Fill the deleverage intent (using user address as solver)
  console.log('\n[leverageAndDeleverage] Step 7: Filling deleverage intent...');
  // For deleverage intent:
  // - inputToken = debtAsset (bnUSD), inputAmount = repayAmount
  // - outputToken = collateralAsset (WETH), minOutputAmount = withdrawAmount
  // We need to fill with the exact amounts from the intent
  await fillIntentWithData(
    deleverageIntentData,
    deleverageIntentData.inputAmount.toString(),
    deleverageIntentData.minOutputAmount.toString(),
  );

  // Wait for fill to be processed
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 8: Check final position after deleverage
  console.log('\n[leverageAndDeleverage] Step 8: Checking position after deleverage...');
  await checkLiquidationOpportunity(userAddress);

  console.log('\n[leverageAndDeleverage] Workflow completed!');
  console.log(`[leverageAndDeleverage] Leverage Intent Tx: ${leverageTxHash}`);
  console.log('[leverageAndDeleverage] Leverage Fill Tx: (from fillIntentWithData)');
  console.log(`[leverageAndDeleverage] Deleverage Intent Tx: ${deleverageTxHash}`);
  console.log('[leverageAndDeleverage] Deleverage Fill Tx: (from fillIntentWithData)');
}

// === UTILITY FUNCTIONS ===

/**
 * Check balances for required test tokens (bnUSD and WETH)
 * Note: If balance shows 0 but you see it on sodax.com/swap, it may be in a smart contract wallet
 */
async function checkRequiredTokenBalances(): Promise<void> {
  console.log('\n=== Checking Required Token Balances ===');
  const userAddress = await getUserAddress();
  console.log(`Wallet Address: ${userAddress}`);
  console.log('Note: If balance shows 0 but visible on sodax.com/swap, it may be in a smart contract wallet\n');

  // Token addresses (18 decimals for both)
  const bnUSDAddress: Address = '0xE801CA34E19aBCbFeA12025378D19c4FBE250131';
  const wethAddress: Address = '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b';

  try {
    // Check bnUSD balance
    const bnUSDBalance = await publicClient.readContract({
      address: bnUSDAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    // Check WETH balance
    const wethBalance = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    const bnUSDFormatted = formatUnits(bnUSDBalance, 18);
    const wethFormatted = formatUnits(wethBalance, 18);

    console.log('Token Balances (Direct Wallet):');
    console.log(`  bnUSD:   ${bnUSDFormatted} (raw: ${bnUSDBalance.toString()})`);
    console.log(`  WETH:    ${wethFormatted} (raw: ${wethBalance.toString()})`);

    // Check if balances meet minimum requirements (lowered for testing)
    console.log('\nBalance Status:');
    const minBnUSD = BigInt('1000000000000000000'); // 1 bnUSD (lowered from 2.0)
    const minWethRecommended = BigInt('10000000000000000'); // 0.01 WETH (recommended)
    const minWethMinimum = BigInt('1000000000000000'); // 0.001 WETH (absolute minimum for testing)

    if (bnUSDBalance >= minBnUSD) {
      console.log(`  bnUSD: Sufficient (minimum: 1.0, have: ${bnUSDFormatted})`);
    } else {
      console.log(`   bnUSD: Low (minimum: 1.0, have: ${bnUSDFormatted})`);
    }

    if (wethBalance >= minWethRecommended) {
      console.log(`  WETH: Sufficient (recommended: 0.01, have: ${wethFormatted})`);
    } else if (wethBalance >= minWethMinimum) {
      console.log(`   WETH: Low but testable (recommended: 0.01, minimum: 0.001, have: ${wethFormatted})`);
      console.log('     Note: You can test with this amount, but some operations may be limited');
    } else {
      console.log(`  WETH: Insufficient (minimum: 0.001, have: ${wethFormatted})`);
      console.log('     Please swap for at least 0.001 WETH (0.0015+ recommended)');
    }

    if (wethBalance === 0n) {
      console.log('\n💡 Tip: If you see balance on sodax.com/swap but not here,');
      console.log('   the tokens may be in a smart contract wallet. Transactions may still work.');
    }
    console.log('\n💡 Note: Using WETH address: 0x50c42dEAcD8Fc9773493ED674b675bE577f2634b');
  } catch (error) {
    console.error('[checkRequiredTokenBalances] Error:', error);
  }
}

/**
 * Check aToken balance for a given underlying asset
 */
async function checkATokenBalance(underlyingAsset: Address): Promise<void> {
  console.log('\n[checkATokenBalance] Checking aToken balance...');
  console.log(`[checkATokenBalance] Underlying Asset: ${underlyingAsset}`);

  const userAddress = await getUserAddress();
  const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);
  const poolAddress = moneyMarketConfig.lendingPool;

  try {
    // Get aToken address from pool
    const reserveData = await publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'getReserveData',
      args: [underlyingAsset],
    });

    const aTokenAddress = reserveData.aTokenAddress;
    console.log(`[checkATokenBalance] aToken Address: ${aTokenAddress}`);

    if (aTokenAddress === '0x0000000000000000000000000000000000000000') {
      console.log('[checkATokenBalance] No aToken address found - asset may not be configured in the pool');
      return;
    }

    // Check aToken balance
    const aTokenBalance = await publicClient.readContract({
      address: aTokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    console.log(`[checkATokenBalance] aToken Balance: ${aTokenBalance.toString()}`);
    console.log(`[checkATokenBalance] Formatted: ${formatUnits(aTokenBalance, 18)} aTokens`);

    // Get underlying balance from pool (what you can withdraw)
    const accountData = await publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'getUserAccountData',
      args: [userAddress],
    });

    // getUserAccountData returns: [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor]
    const [totalCollateralBase, totalDebtBase] = accountData;
    console.log(`[checkATokenBalance] Total Collateral (base): ${totalCollateralBase.toString()}`);
    console.log(`[checkATokenBalance] Total Debt (base): ${totalDebtBase.toString()}`);
  } catch (error) {
    console.error('[checkATokenBalance] Error:', error);
  }
}

/**
 * Get hook address by type
 */
function showHookAddress(hookType: HookType): void {
  const address = hooksService.getHookAddress(hookType);
  console.log(`\n[getHookAddress] ${hookType} Hook Address: ${address}`);
}

/**
 * Show all hook addresses
 */
function showAllHookAddresses(): void {
  console.log('\n=== Hook Contract Addresses ===');
  console.log(`Credit Hook:           ${hooksService.getHookAddress(HookType.Credit)}`);
  console.log(`Leverage Hook:         ${hooksService.getHookAddress(HookType.Leverage)}`);
  console.log(`DebtSideLeverage Hook: ${hooksService.getHookAddress(HookType.DebtSideLeverage)}`);
  console.log(`Deleverage Hook:       ${hooksService.getHookAddress(HookType.Deleverage)}`);
  console.log(`Liquidation Hook:      ${hooksService.getHookAddress(HookType.Liquidation)}`);
}

// Helper to parse hook type from string
function parseHookType(hookTypeStr: string): HookType {
  const hookTypeMap: Record<string, HookType> = {
    credit: HookType.Credit,
    leverage: HookType.Leverage,
    debtsideleverage: HookType.DebtSideLeverage,
    deleverage: HookType.Deleverage,
    liquidation: HookType.Liquidation,
  };

  const hookType = hookTypeMap[hookTypeStr.toLowerCase()];
  if (!hookType) {
    throw new Error(
      `Invalid hook type: ${hookTypeStr}. Valid types: credit, leverage, debtSideLeverage, deleverage, liquidation`,
    );
  }
  return hookType;
}

// Main function
async function main(): Promise<void> {
  const functionName = process.argv[2];

  try {
    switch (functionName) {
      // General commands
      case 'showAddresses':
        showAllHookAddresses();
        break;

      case 'checkBalances':
        await checkRequiredTokenBalances();
        break;

      case 'getHookAddress': {
        const hookType = parseHookType(process.argv[3]);
        showHookAddress(hookType);
        break;
      }

      // Approval commands
      case 'checkDelegation': {
        const debtAsset = process.argv[3] as Address;
        const hookType = parseHookType(process.argv[4]);
        await checkCreditDelegation(debtAsset, hookType);
        break;
      }

      case 'approveDelegation': {
        const debtAsset = process.argv[3] as Address;
        const amount = process.argv[4];
        const hookType = parseHookType(process.argv[5]);
        await approveDelegation(debtAsset, amount, hookType);
        break;
      }

      case 'approveToken': {
        const tokenAddress = process.argv[3] as Address;
        const amount = process.argv[4];
        const hookType = parseHookType(process.argv[5]);
        await approveTokenSpending(tokenAddress, amount, hookType);
        break;
      }

      case 'approveAToken': {
        const underlyingAsset = process.argv[3] as Address;
        const amount = process.argv[4];
        const hookType = parseHookType(process.argv[5]);
        await approveATokenSpending(underlyingAsset, amount, hookType);
        break;
      }

      // Credit Hook commands
      case 'createCreditIntent': {
        const debtAsset = process.argv[3] as Address;
        const targetAsset = process.argv[4] as Address;
        const maxPayment = process.argv[5];
        const minReceive = process.argv[6];
        const deadline = process.argv[7];
        await createCreditIntent(debtAsset, targetAsset, maxPayment, minReceive, deadline);
        break;
      }

      case 'createCreditIntentWithPrerequisites': {
        const debtAsset = process.argv[3] as Address;
        const targetAsset = process.argv[4] as Address;
        const maxPayment = process.argv[5];
        const minReceive = process.argv[6];
        const deadline = process.argv[7];
        const checkOnly = process.argv[8] === 'true';
        await createCreditIntentWithPrerequisites(debtAsset, targetAsset, maxPayment, minReceive, deadline, checkOnly);
        break;
      }

      // Leverage Hook commands
      case 'createLeverageIntent': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const collateralAmount = process.argv[5];
        const borrowAmount = process.argv[6];
        const deadline = process.argv[7];
        await createLeverageIntent(collateralAsset, debtAsset, collateralAmount, borrowAmount, deadline);
        break;
      }

      case 'createLeverageIntentWithPrerequisites': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const collateralAmount = process.argv[5];
        const borrowAmount = process.argv[6];
        const deadline = process.argv[7];
        const checkOnly = process.argv[8] === 'true';
        await createLeverageIntentWithPrerequisites(
          collateralAsset,
          debtAsset,
          collateralAmount,
          borrowAmount,
          deadline,
          checkOnly,
        );
        break;
      }

      // Debt Side Leverage Hook commands
      case 'checkDebtSideLeverageStatus': {
        const debtAsset = process.argv[3] as Address;
        await checkDebtSideLeverageStatus(debtAsset);
        break;
      }

      case 'createDebtSideLeverageIntent': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const collateralAmount = process.argv[5];
        const userProvidedAmount = process.argv[6];
        const totalBorrowAmount = process.argv[7];
        const deadline = process.argv[8];
        await createDebtSideLeverageIntent(
          collateralAsset,
          debtAsset,
          collateralAmount,
          userProvidedAmount,
          totalBorrowAmount,
          deadline,
        );
        break;
      }

      case 'createDebtSideLeverageIntentWithPrerequisites': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const collateralAmount = process.argv[5];
        const userProvidedAmount = process.argv[6];
        const totalBorrowAmount = process.argv[7];
        const deadline = process.argv[8];
        const checkOnly = process.argv[9] === 'true';
        await createDebtSideLeverageIntentWithPrerequisites(
          collateralAsset,
          debtAsset,
          collateralAmount,
          userProvidedAmount,
          totalBorrowAmount,
          deadline,
          checkOnly,
        );
        break;
      }

      // Deleverage Hook commands
      case 'checkATokenApproval': {
        const collateralAsset = process.argv[3] as Address;
        const withdrawAmount = process.argv[4];
        const feeAmount = process.argv[5];
        await checkATokenApprovalInfo(collateralAsset, withdrawAmount, feeAmount);
        break;
      }

      case 'createDeleverageIntent': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const withdrawAmount = process.argv[5];
        const repayAmount = process.argv[6];
        const deadline = process.argv[7];
        await createDeleverageIntent(collateralAsset, debtAsset, withdrawAmount, repayAmount, deadline);
        break;
      }

      case 'createDeleverageIntentWithPrerequisites': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const withdrawAmount = process.argv[5];
        const repayAmount = process.argv[6];
        const deadline = process.argv[7];
        const checkOnly = process.argv[8] === 'true';
        await createDeleverageIntentWithPrerequisites(
          collateralAsset,
          debtAsset,
          withdrawAmount,
          repayAmount,
          deadline,
          checkOnly,
        );
        break;
      }

      case 'leverageAndDeleverage': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const collateralAmount = process.argv[5];
        const borrowAmount = process.argv[6];
        const deadline = process.argv[7];
        await leverageAndDeleverage(collateralAsset, debtAsset, collateralAmount, borrowAmount, deadline);
        break;
      }

      // Liquidation Hook commands
      case 'checkLiquidation': {
        const userToCheck = process.argv[3] as Address;
        await checkLiquidationOpportunity(userToCheck);
        break;
      }

      case 'createLiquidationIntent': {
        const collateralAsset = process.argv[3] as Address;
        const debtAsset = process.argv[4] as Address;
        const userToLiquidate = process.argv[5] as Address;
        const collateralAmount = process.argv[6];
        const debtAmount = process.argv[7];
        const deadline = process.argv[8];
        await createLiquidationIntent(
          collateralAsset,
          debtAsset,
          userToLiquidate,
          collateralAmount,
          debtAmount,
          deadline,
        );
        break;
      }

      case 'checkATokenBalance': {
        const underlyingAsset = process.argv[3] as Address;
        await checkATokenBalance(underlyingAsset);
        break;
      }

      // Intent Lifecycle commands
      case 'getIntentHashFromTx': {
        const txHash = process.argv[3] as Hex;
        console.log('\n[getIntentHashFromTx] Getting intent hash from transaction...');
        console.log(`[getIntentHashFromTx] Transaction Hash: ${txHash}`);
        const intentHash = await getIntentHashFromTx(txHash);
        if (intentHash) {
          console.log(`[getIntentHashFromTx] Intent Hash: ${intentHash}`);
        } else {
          console.error('[getIntentHashFromTx] Could not find intent hash in transaction');
        }
        break;
      }

      case 'getIntentState': {
        const intentHash = process.argv[3] as Hex;
        await getIntentState(intentHash);
        break;
      }

      case 'getPendingState': {
        const intentHash = process.argv[3] as Hex;
        await getPendingIntentState(intentHash);
        break;
      }

      case 'checkFillable': {
        const intentHash = process.argv[3] as Hex;
        await checkFillable(intentHash);
        break;
      }

      case 'fillIntentWithData': {
        // Usage: fillIntentWithData <txHash> <inputAmount> <outputAmount> [externalFillId]
        const txHash = process.argv[3] as Hex;
        const inputAmount = process.argv[4];
        const outputAmount = process.argv[5];
        const externalFillId = process.argv[6];

        console.log('\n[fillIntentWithData] Getting intent data from transaction...');
        console.log(`[fillIntentWithData] Transaction Hash: ${txHash}`);

        const intentData = await getIntentDataFromTx(txHash);
        if (!intentData) {
          console.error('[fillIntentWithData] Failed to get intent data from transaction');
          break;
        }

        await fillIntentWithData(intentData, inputAmount, outputAmount, externalFillId);
        break;
      }

      case 'cancelIntentFromTx': {
        // Usage: cancelIntentFromTx <txHash>
        const txHash = process.argv[3] as Hex;
        if (!txHash) {
          console.error('[cancelIntentFromTx] Missing transaction hash');
          console.log('Usage: cancelIntentFromTx <txHash>');
          break;
        }
        await cancelIntentFromTx(txHash);
        break;
      }

      case 'cancelIntentWithData': {
        // Usage: cancelIntentWithData <intentId> <creator> <inputToken> <outputToken> <inputAmount> <minOutputAmount> <deadline> <allowPartialFill> <srcChain> <dstChain> <srcAddress> <dstAddress> <solver> <data>
        const intentId = process.argv[3];
        const creator = process.argv[4] as Address;
        const inputToken = process.argv[5] as Address;
        const outputToken = process.argv[6] as Address;
        const inputAmount = process.argv[7];
        const minOutputAmount = process.argv[8];
        const deadline = process.argv[9];
        const allowPartialFill = process.argv[10] === 'true';
        const srcChain = process.argv[11];
        const dstChain = process.argv[12];
        const srcAddress = process.argv[13] as string;
        const dstAddress = process.argv[14] as string;
        const solver = process.argv[15] as Address;
        const data = process.argv[16] as Hex;

        if (!intentId || !creator || !inputToken || !outputToken) {
          console.error('[cancelIntentWithData] Missing required parameters');
          console.log(
            'Usage: cancelIntentWithData <intentId> <creator> <inputToken> <outputToken> <inputAmount> <minOutputAmount> <deadline> <allowPartialFill> <srcChain> <dstChain> <srcAddress> <dstAddress> <solver> <data>',
          );
          break;
        }

        await cancelIntentWithData({
          intentId,
          creator,
          inputToken,
          outputToken,
          inputAmount,
          minOutputAmount,
          deadline,
          allowPartialFill,
          srcChain,
          dstChain,
          srcAddress,
          dstAddress,
          solver,
          data,
        });
        break;
      }

      default:
        console.log('\n=== Intent Hooks CLI ===\n');
        console.log('Usage: pnpm intent-hooks <command> [args...]\n');
        console.log('Commands:');
        console.log('\n  General:');
        console.log('    showAddresses                                    - Show all hook contract addresses');
        console.log('    checkBalances                                    - Check bnUSD and WETH token balances');
        console.log('    getHookAddress <hookType>                        - Get specific hook address');
        console.log('\n  Approvals (hookType: credit|leverage|debtSideLeverage|deleverage|liquidation):');
        console.log('    checkDelegation <debtAsset> <hookType>           - Check credit delegation status');
        console.log('    approveDelegation <debtAsset> <amount> <hookType> - Approve credit delegation');
        console.log('    approveToken <tokenAddress> <amount> <hookType>   - Approve token spending');
        console.log('    approveAToken <underlyingAsset> <amount> <hookType> - Approve aToken spending');
        console.log('\n  Credit Hook (Limit Orders):');
        console.log('    createCreditIntent <debtAsset> <targetAsset> <maxPayment> <minReceive> [deadline]');
        console.log(
          '    createCreditIntentWithPrerequisites <debtAsset> <targetAsset> <maxPayment> <minReceive> [deadline] [checkOnly] - Auto-handles approvals',
        );
        console.log('\n  Leverage Hook:');
        console.log(
          '    createLeverageIntent <collateralAsset> <debtAsset> <collateralAmount> <borrowAmount> [deadline]',
        );
        console.log(
          '    createLeverageIntentWithPrerequisites <collateralAsset> <debtAsset> <collateralAmount> <borrowAmount> [deadline] [checkOnly] - Auto-handles approvals',
        );
        console.log('\n  Debt Side Leverage Hook:');
        console.log('    checkDebtSideLeverageStatus <debtAsset>          - Check readiness status');
        console.log(
          '    createDebtSideLeverageIntent <collateralAsset> <debtAsset> <collateralAmount> <userProvidedAmount> <totalBorrowAmount> [deadline]',
        );
        console.log(
          '    createDebtSideLeverageIntentWithPrerequisites <collateralAsset> <debtAsset> <collateralAmount> <userProvidedAmount> <totalBorrowAmount> [deadline] [checkOnly] - Auto-handles approvals',
        );
        console.log('\n  Deleverage Hook:');
        console.log('    checkATokenApproval <collateralAsset> <withdrawAmount> [feeAmount] - Check aToken approval');
        console.log(
          '    createDeleverageIntent <collateralAsset> <debtAsset> <withdrawAmount> <repayAmount> [deadline]',
        );
        console.log(
          '    createDeleverageIntentWithPrerequisites <collateralAsset> <debtAsset> <withdrawAmount> <repayAmount> [deadline] [checkOnly] - Auto-handles approvals',
        );
        console.log(
          '    leverageAndDeleverage <collateralAsset> <debtAsset> <collateralAmount> <borrowAmount> [deadline] - Create leverage intent, fill it, create deleverage intent, and fill it',
        );
        console.log('\n  Liquidation Hook:');
        console.log('    checkLiquidation <userAddress>                   - Check if user is liquidatable');
        console.log(
          '    createLiquidationIntent <collateralAsset> <debtAsset> <userToLiquidate> <collateralAmount> <debtAmount> [deadline]',
        );
        console.log('\n  Money Market Position Management:');
        console.log('    checkATokenBalance <underlyingAsset>             - Check aToken balance for an asset');
        console.log('\n  Intent Lifecycle:');
        console.log('    getIntentHashFromTx <txHash>                     - Get intent hash from transaction hash');
        console.log('    getIntentState <intentHash>                      - Get intent state by hash');
        console.log('    getPendingState <intentHash>                     - Get pending state (cross-chain)');
        console.log('    checkFillable <intentHash>                       - Check if intent can be filled');
        console.log(
          '    fillIntentWithData <txHash> <inputAmount> <outputAmount> [externalFillId] - Fill intent using data from transaction',
        );
        console.log(
          '    cancelIntentFromTx <txHash>                                    - Cancel intent using transaction hash',
        );
        console.log(
          '    cancelIntentWithData <intentId> <creator> <inputToken> <outputToken> <inputAmount> <minOutputAmount> <deadline> <allowPartialFill> <srcChain> <dstChain> <srcAddress> <dstAddress> <solver> <data> - Cancel intent with data',
        );
        console.log('\nExamples:');
        console.log('  pnpm intent-hooks showAddresses');
        console.log('  pnpm intent-hooks checkBalances');
        console.log('  pnpm intent-hooks checkDelegation 0xUSDC... credit');
        console.log('  pnpm intent-hooks approveDelegation 0xUSDC... 1000000000 leverage');
        console.log('  pnpm intent-hooks createCreditIntent 0xUSDC... 0xWETH... 1500000000 1000000000000000000');
        console.log('  pnpm intent-hooks checkLiquidation 0xUserAddress...');
        console.log('  pnpm intent-hooks getIntentState 0xIntentHash...');
        console.log('  pnpm intent-hooks cancelIntentWithData <intentData...>');
        break;
    }
  } catch (error) {
    console.error('\n Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
