// apps/node/src/moneymarket-ops.ts
import 'dotenv/config';
import {
  EvmSpokeProvider,
  getHubChainConfig,
  getMoneyMarketConfig,
  spokeChainConfig,
  type EvmHubProviderConfig,
  type EvmSpokeChainConfig,
  Sodax,
  type SodaxConfig,
} from '@sodax/sdk';
import { EvmWalletProvider } from '@sodax/wallet-sdk-core';
import type { Address, Hash, Hex, SpokeChainId } from '@sodax/types';
import { ARBITRUM_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

// Load configuration from environment
const evmPrivateKey: string | undefined = process.env.EVM_PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';

if (!evmPrivateKey) {
  throw new Error('EVM_PRIVATE_KEY environment variable is required');
}

// Hub chain configuration
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';

// EVM chain configuration (Arbitrum)
const EVM_CHAIN_ID = ARBITRUM_MAINNET_CHAIN_ID;
const EVM_RPC_URL = IS_TESTNET ? 'https://goerli-rollup.arbitrum.io/rpc' : 'https://arb1.arbitrum.io/rpc';

// Initialize EVM wallet provider
const evmWalletProvider: EvmWalletProvider = new EvmWalletProvider({
  privateKey: evmPrivateKey as Hex,
  chainId: EVM_CHAIN_ID,
  rpcUrl: EVM_RPC_URL,
});

// Initialize Sodax with money market configuration
const hubConfig: EvmHubProviderConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(),
};

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax: Sodax = new Sodax({
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

await sodax.initialize();

// Create EVM spoke provider
const evmSpokeProvider: EvmSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider,
  spokeChainConfig[EVM_CHAIN_ID] as EvmSpokeChainConfig,
);

/**
 * Supply tokens to the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to supply (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the supplied assets
 * @param toAddress - Optional address on the target spoke chain to receive the supplied assets
 */
async function supply(token: string, amount: bigint, toChainId?: SpokeChainId, toAddress?: Address): Promise<void> {
  try {
    const walletAddress = await evmSpokeProvider.walletProvider.getWalletAddress();
    console.log(`[Supply] Using wallet: ${walletAddress}`);

    // Check allowance
    console.log('[Supply] Checking allowance...');
    const allowanceResult = await sodax.moneyMarket.isAllowanceValid(
      {
        token,
        amount,
        action: 'supply',
      },
      evmSpokeProvider,
    );

    if (!allowanceResult.ok) {
      console.error('[Supply] Failed to check allowance:', allowanceResult.error);
      return;
    }

    // Approve if needed
    if (!allowanceResult.value) {
      console.log('[Supply] Approving tokens...');
      const approveResult = await sodax.moneyMarket.approve(
        {
          token,
          amount,
          action: 'supply',
        },
        evmSpokeProvider,
      );

      if (!approveResult.ok) {
        console.error('[Supply] Failed to approve tokens:', approveResult.error);
        return;
      }

      const approvalTxHash: Hash = approveResult.value as Hash;
      console.log('[Supply] Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      await evmSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
      console.log('[Supply] Approval confirmed');
    } else {
      console.log('[Supply] Approval not needed');
    }

    // Execute supply
    console.log('[Supply] Executing supply...');
    const supplyParams: {
      token: string;
      amount: bigint;
      action: 'supply';
      toChainId?: SpokeChainId;
      toAddress?: Address;
    } = {
      token,
      amount,
      action: 'supply',
    };

    if (toChainId) {
      supplyParams.toChainId = toChainId;
      console.log(`[Supply] Target chain ID: ${toChainId}`);
    }
    if (toAddress) {
      supplyParams.toAddress = toAddress;
      console.log(`[Supply] Target address: ${toAddress}`);
    }

    const supplyResult = await sodax.moneyMarket.supply(supplyParams, evmSpokeProvider);

    if (!supplyResult.ok) {
      console.error('[Supply] Supply failed:', supplyResult.error);
      return;
    }

    const [spokeTxHash, hubTxHash] = supplyResult.value;
    console.log('[Supply] ✅ Supply transaction submitted successfully!');
    console.log('[Supply] Spoke transaction hash:', spokeTxHash);
    console.log('[Supply] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Supply] Unexpected error:', error);
  }
}

/**
 * Withdraw tokens from the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to withdraw (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the withdrawn assets
 * @param toAddress - Optional address on the target spoke chain to receive the withdrawn assets
 */
async function withdraw(token: string, amount: bigint, toChainId?: SpokeChainId, toAddress?: Address): Promise<void> {
  try {
    const walletAddress = await evmSpokeProvider.walletProvider.getWalletAddress();
    console.log(`[Withdraw] Using wallet: ${walletAddress}`);

    // Check allowance (for Sonic hub chain)
    if (evmSpokeProvider.chainConfig.chain.id === HUB_CHAIN_ID) {
      console.log('[Withdraw] Checking allowance...');
      const allowanceResult = await sodax.moneyMarket.isAllowanceValid(
        {
          token,
          amount,
          action: 'withdraw',
        },
        evmSpokeProvider,
      );

      if (!allowanceResult.ok) {
        console.error('[Withdraw] Failed to check allowance:', allowanceResult.error);
        return;
      }

      if (!allowanceResult.value) {
        console.log('[Withdraw] Approving tokens...');
        const approveResult = await sodax.moneyMarket.approve(
          {
            token,
            amount,
            action: 'withdraw',
          },
          evmSpokeProvider,
        );

        if (!approveResult.ok) {
          console.error('[Withdraw] Failed to approve tokens:', approveResult.error);
          return;
        }

        const approvalTxHash: Hash = approveResult.value as Hash;
        console.log('[Withdraw] Approval transaction hash:', approvalTxHash);

        // Wait for approval confirmation
        await evmSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
        console.log('[Withdraw] Approval confirmed');
      }
    }

    // Execute withdraw
    console.log('[Withdraw] Executing withdraw...');
    const withdrawParams: {
      token: string;
      amount: bigint;
      action: 'withdraw';
      toChainId?: SpokeChainId;
      toAddress?: Address;
    } = {
      token,
      amount,
      action: 'withdraw',
    };

    if (toChainId) {
      withdrawParams.toChainId = toChainId;
      console.log(`[Withdraw] Target chain ID: ${toChainId}`);
    }
    if (toAddress) {
      withdrawParams.toAddress = toAddress;
      console.log(`[Withdraw] Target address: ${toAddress}`);
    }

    const withdrawResult = await sodax.moneyMarket.withdraw(withdrawParams, evmSpokeProvider);

    if (!withdrawResult.ok) {
      console.error('[Withdraw] Withdraw failed:', withdrawResult.error);
      return;
    }

    const [spokeTxHash, hubTxHash] = withdrawResult.value;
    console.log('[Withdraw] ✅ Withdraw transaction submitted successfully!');
    console.log('[Withdraw] Spoke transaction hash:', spokeTxHash);
    console.log('[Withdraw] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Withdraw] Unexpected error:', error);
  }
}

/**
 * Borrow tokens from the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to borrow (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the borrowed assets
 * @param toAddress - Optional address on the target spoke chain to receive the borrowed assets
 */
async function borrow(token: string, amount: bigint, toChainId?: SpokeChainId, toAddress?: Address): Promise<void> {
  try {
    const walletAddress = await evmSpokeProvider.walletProvider.getWalletAddress();
    console.log(`[Borrow] Using wallet: ${walletAddress}`);

    // Check allowance (for Sonic hub chain)
    if (evmSpokeProvider.chainConfig.chain.id === HUB_CHAIN_ID) {
      console.log('[Borrow] Checking allowance...');
      const allowanceResult = await sodax.moneyMarket.isAllowanceValid(
        {
          token,
          amount,
          action: 'borrow',
        },
        evmSpokeProvider,
      );

      if (!allowanceResult.ok) {
        console.error('[Borrow] Failed to check allowance:', allowanceResult.error);
        return;
      }

      if (!allowanceResult.value) {
        console.log('[Borrow] Approving tokens...');
        const approveResult = await sodax.moneyMarket.approve(
          {
            token,
            amount,
            action: 'borrow',
          },
          evmSpokeProvider,
        );

        if (!approveResult.ok) {
          console.error('[Borrow] Failed to approve tokens:', approveResult.error);
          return;
        }

        const approvalTxHash: Hash = approveResult.value as Hash;
        console.log('[Borrow] Approval transaction hash:', approvalTxHash);

        // Wait for approval confirmation
        await evmSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
        console.log('[Borrow] Approval confirmed');
      }
    }

    // Execute borrow
    console.log('[Borrow] Executing borrow...');
    const borrowParams: {
      token: string;
      amount: bigint;
      action: 'borrow';
      toChainId?: SpokeChainId;
      toAddress?: Address;
    } = {
      token,
      amount,
      action: 'borrow',
    };

    if (toChainId) {
      borrowParams.toChainId = toChainId;
      console.log(`[Borrow] Target chain ID: ${toChainId}`);
    }
    if (toAddress) {
      borrowParams.toAddress = toAddress;
      console.log(`[Borrow] Target address: ${toAddress}`);
    }

    const borrowResult = await sodax.moneyMarket.borrow(borrowParams, evmSpokeProvider);

    if (!borrowResult.ok) {
      console.error('[Borrow] Borrow failed:', borrowResult.error);
      return;
    }

    const [spokeTxHash, hubTxHash] = borrowResult.value;
    console.log('[Borrow] ✅ Borrow transaction submitted successfully!');
    console.log('[Borrow] Spoke transaction hash:', spokeTxHash);
    console.log('[Borrow] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Borrow] Unexpected error:', error);
  }
}

/**
 * Repay tokens to the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to repay (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the repaid assets
 * @param toAddress - Optional address on the target spoke chain to receive the repaid assets
 */
async function repay(token: string, amount: bigint, toChainId?: SpokeChainId, toAddress?: Address): Promise<void> {
  try {
    const walletAddress = await evmSpokeProvider.walletProvider.getWalletAddress();
    console.log(`[Repay] Using wallet: ${walletAddress}`);

    // Check allowance
    console.log('[Repay] Checking allowance...');
    const allowanceResult = await sodax.moneyMarket.isAllowanceValid(
      {
        token,
        amount,
        action: 'repay',
      },
      evmSpokeProvider,
    );

    if (!allowanceResult.ok) {
      console.error('[Repay] Failed to check allowance:', allowanceResult.error);
      return;
    }

    // Approve if needed
    if (!allowanceResult.value) {
      console.log('[Repay] Approving tokens...');
      const approveResult = await sodax.moneyMarket.approve(
        {
          token,
          amount,
          action: 'repay',
        },
        evmSpokeProvider,
      );

      if (!approveResult.ok) {
        console.error('[Repay] Failed to approve tokens:', approveResult.error);
        return;
      }

      const approvalTxHash: Hash = approveResult.value as Hash;
      console.log('[Repay] Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      await evmSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
      console.log('[Repay] Approval confirmed');
    } else {
      console.log('[Repay] Approval not needed');
    }

    // Execute repay
    console.log('[Repay] Executing repay...');
    const repayParams: {
      token: string;
      amount: bigint;
      action: 'repay';
      toChainId?: SpokeChainId;
      toAddress?: Address;
    } = {
      token,
      amount,
      action: 'repay',
    };

    if (toChainId) {
      repayParams.toChainId = toChainId;
      console.log(`[Repay] Target chain ID: ${toChainId}`);
    }
    if (toAddress) {
      repayParams.toAddress = toAddress;
      console.log(`[Repay] Target address: ${toAddress}`);
    }

    const repayResult = await sodax.moneyMarket.repay(repayParams, evmSpokeProvider);

    if (!repayResult.ok) {
      console.error('[Repay] Repay failed:', repayResult.error);
      return;
    }

    const [spokeTxHash, hubTxHash] = repayResult.value;
    console.log('[Repay] ✅ Repay transaction submitted successfully!');
    console.log('[Repay] Spoke transaction hash:', spokeTxHash);
    console.log('[Repay] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Repay] Unexpected error:', error);
  }
}

// Main execution
const args: string[] = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: pnpm moneymarket-ops <action> <token> <amount> [toChainId] [toAddress]');
  console.log('Actions: supply, withdraw, borrow, repay');
  console.log('Optional parameters:');
  console.log('  toChainId - Target spoke chain ID to receive the assets (e.g., "0x89.polygon")');
  console.log('  toAddress - Address on the target spoke chain to receive the assets');
  console.log('Examples:');
  console.log('  pnpm moneymarket-ops supply 0x... 1000000000000000000');
  console.log('  pnpm moneymarket-ops supply 0x... 1000000000000000000 "0x89.polygon" 0x...');
  console.log('  pnpm moneymarket-ops withdraw 0x... 1000000000000000000');
  console.log('  pnpm moneymarket-ops borrow 0x... 1000000000000000000 "0x89.polygon" 0x...');
  console.log('  pnpm moneymarket-ops repay 0x... 1000000000000000000');
  process.exit(1);
}

const action = args[0] as 'supply' | 'withdraw' | 'borrow' | 'repay';
const token = args[1] as string;
const amount = BigInt(args[2]);
const toChainId = args[3] as SpokeChainId | undefined;
const toAddress = args[4] as Address | undefined;

if (!['supply', 'withdraw', 'borrow', 'repay'].includes(action)) {
  console.error(`Invalid action: ${action}. Must be one of: supply, withdraw, borrow, repay`);
  process.exit(1);
}

console.log(`Executing ${action} with token ${token} and amount ${amount}`);
if (toChainId) {
  console.log(`Target chain ID: ${toChainId}`);
}
if (toAddress) {
  console.log(`Target address: ${toAddress}`);
}

switch (action) {
  case 'supply':
    await supply(token, amount, toChainId, toAddress);
    break;
  case 'withdraw':
    await withdraw(token, amount, toChainId, toAddress);
    break;
  case 'borrow':
    await borrow(token, amount, toChainId, toAddress);
    break;
  case 'repay':
    await repay(token, amount, toChainId, toAddress);
    break;
}
