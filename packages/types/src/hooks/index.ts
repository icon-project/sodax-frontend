// packages/types/src/hooks/index.ts
import type { Address } from '../common/index.js';

// Credit Hook (Limit Orders)
export interface CreditHookParams {
  debtAsset: Address;
  targetAsset: Address;
  maxPayment: string;
  minReceive: string;
  deadline?: string;
  feeReceiver?: Address;
  feeAmount?: string;
  solver?: Address; // Optional specific solver address (address(0) or undefined = any solver)
}

export interface CreditDelegationStatus {
  delegated: boolean;
  allowance: string;
}

// Leverage Hook
export interface LeverageHookParams {
  collateralAsset: Address;
  debtAsset: Address;
  collateralAmount: string;
  borrowAmount: string;
  deadline?: string;
  feeReceiver?: Address;
  feeAmount?: string;
  solver?: Address; // Optional specific solver address (address(0) or undefined = any solver)
}

// Debt Side Leverage Hook
export interface DebtSideLeverageHookParams {
  collateralAsset: Address;
  debtAsset: Address;
  collateralAmount: string;
  userProvidedAmount: string;
  totalBorrowAmount: string;
  deadline?: string;
  feeReceiver?: Address;
  feeAmount?: string;
  solver?: Address; // Optional specific solver address (address(0) or undefined = any solver)
}

export interface DebtSideLeverageStatus {
  tokenAllowance: string;
  creditDelegation: string;
  tokenBalance: string;
  isReady: boolean;
}

// Deleverage Hook
export interface DeleverageHookParams {
  collateralAsset: Address;
  debtAsset: Address;
  withdrawAmount: string;
  repayAmount: string;
  deadline?: string;
  feeReceiver?: Address;
  feeAmount?: string;
  solver?: Address; // Optional specific solver address (address(0) or undefined = any solver)
}

export interface ATokenApprovalInfo {
  aTokenAddress: Address;
  aTokensNeeded: string;
  currentAllowance: string;
  isApproved: boolean;
}

// Liquidation Hook
export interface LiquidationHookParams {
  collateralAsset: Address;
  debtAsset: Address;
  userToLiquidate: Address;
  collateralAmount: string;
  debtAmount: string;
  deadline?: string;
  feeReceiver?: Address;
  feeAmount?: string;
  solver?: Address; // Optional specific solver address (address(0) or undefined = any solver)
}

export interface UserAccountData {
  totalCollateralBase: string;
  totalDebtBase: string;
  availableBorrowsBase: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface LiquidationOpportunity {
  userAddress: Address;
  healthFactor: string;
  isLiquidatable: boolean;
  accountData: UserAccountData;
}

// Common
export interface IntentCreationResult {
  txHash: string;
  intentId?: string;
}

export interface ApprovalResult {
  txHash: string;
  approved: boolean;
}

// Hook Intent Types (matching contract struct)
export interface HookIntent {
  intentId: bigint;
  creator: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: bigint;
  minOutputAmount: bigint;
  deadline: bigint;
  allowPartialFill: boolean;
  srcChain: bigint;
  dstChain: bigint;
  srcAddress: string; // bytes as hex string
  dstAddress: string; // bytes as hex string
  solver: Address;
  data: string; // bytes as hex string
}

export interface HookIntentState {
  exists: boolean;
  remainingInput: string;
  receivedOutput: string;
  pendingPayment: boolean;
}

export interface HookPendingIntentState {
  pendingInput: string;
  pendingOutput: string;
}

export interface FillHookIntentParams {
  intent: HookIntent;
  inputAmount: string;
  outputAmount: string;
  externalFillId?: string; // 0 for same-chain fills
}

export interface CancelIntentResult {
  txHash: string;
  cancelled: boolean;
}

export interface FillIntentResult {
  txHash: string;
  filled: boolean;
}
