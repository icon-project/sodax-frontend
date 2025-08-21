import 'dotenv/config';
import { type Address, type Hex, encodeFunctionData } from 'viem';
import {
  EvmHubProvider,
  SonicSpokeProvider,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type HubChainId,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  spokeChainConfig,
  SonicSpokeService,
  type SpokeChainId,
  erc20Abi,
  type MoneyMarketSupplyParams,
  type MoneyMarketBorrowParams,
  type MoneyMarketWithdrawParams,
  type MoneyMarketRepayParams,
  type IconEoaAddress,
  type IcxCreateRevertMigrationParams,
  type UnifiedBnUSDMigrateParams,
} from '@sodax/sdk';
import { EvmWalletProvider } from './wallet-providers/EvmWalletProvider.js';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);
const spokeEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const hubProvider = new EvmHubProvider(hubConfig);
const spokeProvider = new SonicSpokeProvider(spokeEvmWallet, spokeChainConfig[HUB_CHAIN_ID]);

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

// 0xEEFdd69e94466D935022702Cddd9c4abD66Ce73Fz
async function supply(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  if (token !== '0x0000000000000000000000000000000000000000') {
    const txHash = await spokeProvider.walletProvider.sendTransaction({
      to: token,
      from: wallet,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [userRouter, amount],
      }),
      value: 0n,
    });
    console.log('[approve] txHash', txHash);
    await new Promise(f => setTimeout(f, 1000));
  }
  const data = sodax.moneyMarket.buildSupplyData(token, wallet, amount, spokeProvider.chainConfig.chain.id);

  const txHash = await SonicSpokeService.deposit(
    {
      from: wallet,
      token,
      amount,
      data,
    },
    spokeProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function supplyHighLevel(token: Address, amount: bigint) {
  console.log(`[supplyHighLevel] token=${token} amount=${amount}`);
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  console.log('[supplyHighLevel] user wallet address:', wallet);
  console.log('[supplyHighLevel] user router address:', userRouter);

  const params = {
    token,
    amount,
    action: 'supply',
  } satisfies MoneyMarketSupplyParams;

  // first check if the allowance is valid
  const isAllowed = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);

  if (!isAllowed.ok) {
    console.error('[supplyHighLevel] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[supplyHighLevel] isAllowed', isAllowed.value);
  } else {
    // if the allowance is not valid, approve the allowance
    const approveResult = await sodax.moneyMarket.approve(params, spokeProvider);
    if (approveResult.ok) {
      console.log('[supplyHighLevel] approveHash', approveResult.value);
      const approveTxResult = await spokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[supplyHighLevel] approveTxResult', approveTxResult);
    } else {
      console.error('[supplyHighLevel] approve error:', approveResult.error);
      return;
    }
  }

  console.log('[supplyHighLevel] supplying with params:', params);
  const result = await sodax.moneyMarket.createSupplyIntent(params, spokeProvider);

  if (result.ok) {
    console.log('[supply] txHash', result.value);

    const txResult = await spokeProvider.walletProvider.waitForTransactionReceipt(result.value);
    console.log('[supply] txResult', txResult);
  } else {
    console.error('[supply] error', result.error);
  }
}

async function borrow(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const borrowInfo = await SonicSpokeService.getBorrowInfo(
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
    sodax.moneyMarket.data,
  );
  const approveHash = await SonicSpokeService.approveBorrow(wallet, borrowInfo, spokeProvider);
  console.log('[approve] txHash', approveHash);

  await new Promise(f => setTimeout(f, 1000));
  const data = sodax.moneyMarket.buildBorrowData(wallet, wallet, token, amount, spokeProvider.chainConfig.chain.id);

  const txHash = await SonicSpokeService.callWallet(data, spokeProvider);
  console.log('[borrow] txHash', txHash);
}

async function borrowHighLevel(token: Address, amount: bigint) {
  console.log(`[borrowHighLevel] token=${token} amount=${amount}`);
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  console.log('[borrowHighLevel] user wallet address:', wallet);
  console.log('[borrowHighLevel] user router address:', userRouter);

  const params = {
    token,
    amount,
    action: 'borrow',
  } satisfies MoneyMarketBorrowParams;

  // first check if the allowance is valid
  const isAllowed = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);

  if (!isAllowed.ok) {
    console.error('[borrowHighLevel] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[borrowHighLevel] isAllowed', isAllowed.value);
  } else {
    // if the allowance is not valid, approve the allowance
    const approveResult = await sodax.moneyMarket.approve(params, spokeProvider);
    if (approveResult.ok) {
      console.log('[borrowHighLevel] approveHash', approveResult.value);
      const approveTxResult = await spokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[borrowHighLevel] approveTxResult', approveTxResult);
    } else {
      console.error('[borrowHighLevel] approve error:', approveResult.error);
      return;
    }
  }

  console.log('[borrowHighLevel] borrowing with params:', params);
  const result = await sodax.moneyMarket.createBorrowIntent(params, spokeProvider);

  if (result.ok) {
    console.log('[borrow] txHash', result.value);

    const txResult = await spokeProvider.walletProvider.waitForTransactionReceipt(result.value);
    console.log('[borrow] txResult', txResult);
  } else {
    console.error('[borrow] error', result.error);
  }
}

async function withdraw(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const withdrawInfo = await SonicSpokeService.getWithdrawInfo(token, amount, spokeProvider, sodax.moneyMarket.data);
  const approveHash = await SonicSpokeService.approveWithdraw(wallet, withdrawInfo, spokeProvider);
  console.log('[approve] txHash', approveHash);
  await new Promise(f => setTimeout(f, 1000));

  const withdrawData = await SonicSpokeService.buildWithdrawData(
    wallet,
    withdrawInfo,
    amount,
    spokeProvider,
    sodax.moneyMarket,
  );

  const txHash = await SonicSpokeService.callWallet(withdrawData, spokeProvider);

  console.log('[withdraw] txHash', txHash);
}

async function withdrawHighLevel(token: Address, amount: bigint) {
  console.log(`[withdrawHighLevel] token=${token} amount=${amount}`);
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  console.log('[withdrawHighLevel] user wallet address:', wallet);
  console.log('[withdrawHighLevel] user router address:', userRouter);

  const params = {
    token,
    amount,
    action: 'withdraw',
  } satisfies MoneyMarketWithdrawParams;

  // first check if the allowance is valid
  const isAllowed = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);

  if (!isAllowed.ok) {
    console.error('[withdrawHighLevel] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[withdrawHighLevel] isAllowed', isAllowed.value);
  } else {
    // if the allowance is not valid, approve the allowance
    const approveResult = await sodax.moneyMarket.approve(params, spokeProvider);
    if (approveResult.ok) {
      console.log('[withdrawHighLevel] approveHash', approveResult.value);
      const approveTxResult = await spokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[withdrawHighLevel] approveTxResult', approveTxResult);
    } else {
      console.error('[withdrawHighLevel] approve error:', approveResult.error);
      return;
    }
  }

  console.log('[withdrawHighLevel] withdrawing with params:', params);
  const result = await sodax.moneyMarket.createWithdrawIntent(params, spokeProvider);

  if (result.ok) {
    console.log('[withdraw] txHash', result.value);

    const txResult = await spokeProvider.walletProvider.waitForTransactionReceipt(result.value);
    console.log('[withdraw] txResult', txResult);
  } else {
    console.error('[withdraw] error', result.error);
  }
}

async function repay(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  const data = sodax.moneyMarket.buildRepayData(token, wallet, amount, spokeProvider.chainConfig.chain.id);
  if (token !== '0x0000000000000000000000000000000000000000') {
    const txHash = await spokeProvider.walletProvider.sendTransaction({
      to: token,
      from: wallet,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [userRouter, amount],
      }),
      value: 0n,
    });
    console.log('[approve] txHash', txHash);
    await new Promise(f => setTimeout(f, 1000));
  }
  const txHash = await SonicSpokeService.deposit(
    {
      from: wallet,
      token,
      amount,
      data,
    },
    spokeProvider,
  );

  console.log('[repay] txHash', txHash);
}

async function repayHighLevel(token: Address, amount: bigint) {
  console.log(`[repayHighLevel] token=${token} amount=${amount}`);
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  console.log('[repayHighLevel] user wallet address:', wallet);
  console.log('[repayHighLevel] user router address:', userRouter);

  const params = {
    token,
    amount,
    action: 'repay',
  } satisfies MoneyMarketRepayParams;

  // first check if the allowance is valid
  const isAllowed = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);

  if (!isAllowed.ok) {
    console.error('[repayHighLevel] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[repayHighLevel] isAllowed', isAllowed.value);
  } else {
    // if the allowance is not valid, approve the allowance
    const approveResult = await sodax.moneyMarket.approve(params, spokeProvider);
    if (approveResult.ok) {
      console.log('[repayHighLevel] approveHash', approveResult.value);
      const approveTxResult = await spokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[repayHighLevel] approveTxResult', approveTxResult);
    } else {
      console.error('[repayHighLevel] approve error:', approveResult.error);
      return;
    }
  }

  console.log('[repayHighLevel] repaying with params:', params);
  const result = await sodax.moneyMarket.createRepayIntent(params, spokeProvider);

  if (result.ok) {
    console.log('[withdraw] txHash', result.value);

    const txResult = await spokeProvider.walletProvider.waitForTransactionReceipt(result.value);
    console.log('[withdraw] txResult', txResult);
  } else {
    console.error('[withdraw] error', result.error);
  }
}

async function reverseMigrateSodaToIcx(amount: bigint, to: IconEoaAddress) {
  const params = {
    amount,
    to,
  } satisfies IcxCreateRevertMigrationParams;

  const isAllowed = await sodax.migration.isAllowanceValid(params, 'revert', spokeProvider);

  if (!isAllowed.ok) {
    console.error('[reverseMigrate] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[reverseMigrate] isAllowed', isAllowed.value);
  } else {
    const approveResult = await sodax.migration.approve(params, 'revert', spokeProvider);

    if (approveResult.ok) {
      console.log('[reverseMigrate] approveHash', approveResult.value);
      const approveTxResult = await spokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[reverseMigrate] approveTxResult', approveTxResult);
    } else {
      console.error('[reverseMigrate] approve error:', approveResult.error);
      return;
    }
  }

  const result = await sodax.migration.revertMigrateSodaToIcx(params, spokeProvider);

  if (result.ok) {
    console.log('[reverseMigrate] txHash', result.value);
    const [hubTxHash, spokeTxHash] = result.value;
    console.log('[reverseMigrate] hubTxHash', hubTxHash);
    console.log('[reverseMigrate] spokeTxHash', spokeTxHash);
  } else {
    console.error('[reverseMigrate] error', result.error);
  }
}

/**
 * Migrates new bnUSD tokens back to legacy bnUSD tokens.
 * This function handles the migration of new bnUSD tokens to legacy bnUSD tokens.
 *
 * @param dstChainID - The destination chain ID where the legacy bnUSD token exists
 * @param legacybnUSD - The address of the legacy bnUSD token to receive
 * @param amount - The amount of new bnUSD tokens to migrate back
 * @param recipient - The address that will receive the migrated legacy bnUSD tokens
 */
async function reverseMigrateBnUSD(
  dstChainID: SpokeChainId,
  amount: bigint,
  recipient: Hex,
  legacybnUSD: string,
  newbnUSD: string,
): Promise<void> {
  const params = {
    srcChainId: HUB_CHAIN_ID,
    srcbnUSD: newbnUSD,
    dstChainId: dstChainID,
    dstbnUSD: legacybnUSD,
    amount,
    to: recipient,
  } satisfies UnifiedBnUSDMigrateParams;

  const isAllowed = await sodax.migration.isAllowanceValid(params, 'revert', spokeProvider);

  if (!isAllowed.ok) {
    console.error('[reverseMigrateBnUSD] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[reverseMigrateBnUSD] isAllowed', isAllowed.value);
  } else {
    const approveResult = await sodax.migration.approve(params, 'revert', spokeProvider);

    if (approveResult.ok) {
      console.log('[reverseMigrateBnUSD] approveHash', approveResult.value);
      const approveTxResult = await spokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[reverseMigrateBnUSD] approveTxResult', approveTxResult);
    } else {
      console.error('[reverseMigrateBnUSD] approve error:', approveResult.error);
      return;
    }
  }

  const result = await sodax.migration.migratebnUSD(params, spokeProvider);

  if (result.ok) {
    console.log('[reverseMigrateBnUSD] txHash', result.value);
    const [spokeTxHash, hubTxHash] = result.value;
    console.log('[reverseMigrateBnUSD] hubTxHash', hubTxHash);
    console.log('[reverseMigrateBnUSD] spokeTxHash', spokeTxHash);
  } else {
    console.error('[reverseMigrateBnUSD] error', result.error);
  }
}

async function borrowTo(token: Hex, amount: bigint, to: Hex, spokeChainId: SpokeChainId) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const borrowInfo = await SonicSpokeService.getBorrowInfo(token, amount, spokeChainId, sodax.moneyMarket.data);
  const approveHash = await SonicSpokeService.approveBorrow(wallet, borrowInfo, spokeProvider);
  console.log('[approve] txHash', approveHash);
  await new Promise(f => setTimeout(f, 1000));
  const data = sodax.moneyMarket.buildBorrowData(wallet, to, token, amount, spokeChainId);

  const txHash = await SonicSpokeService.callWallet(data, spokeProvider);
  console.log('[borrow] txHash', txHash);
}
// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2];

  if (functionName === 'supply') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await supply(token, amount);
  } else if (functionName === 'supplyHighLevel') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await supplyHighLevel(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await borrow(token, amount);
  } else if (functionName === 'borrowHighLevel') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await borrowHighLevel(token, amount);
  } else if (functionName === 'borrowTo') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    const to = process.argv[5] as Hex;
    const spokeChainId = process.argv[6] as SpokeChainId;
    await borrowTo(token, amount, to, spokeChainId);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await withdraw(token, amount);
  } else if (functionName === 'withdrawHighLevel') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await withdrawHighLevel(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await repay(token, amount);
  } else if (functionName === 'repayHighLevel') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await repayHighLevel(token, amount);
  } else if (functionName === 'reverseMigrate') {
    const amount = BigInt(process.argv[3]);
    const to = process.argv[4] as IconEoaAddress;
    await reverseMigrateSodaToIcx(amount, to);
  } else if (functionName === 'reverseMigrateBnUSD') {
    const dstChainID = process.argv[3] as SpokeChainId;
    const amount = BigInt(process.argv[4]);
    const recipient = process.argv[5] as Hex;
    const legacybnUSD = process.argv[6] as string;
    const newbnUSD = process.argv[7] as string;
    await reverseMigrateBnUSD(dstChainID, amount, recipient, legacybnUSD, newbnUSD);
  } else {
    console.log(
      'Function not recognized. Please use one of: "supply", "supplyHighLevel", "borrow", "borrowHighLevel", "borrowTo", "withdraw", "withdrawHighLevel", "repay", "repayHighLevel", "reverseMigrate", or "reverseMigrateBnUSD".',
    );
    console.log('Usage examples:');
    console.log('  npm run sonic supply <token_address> <amount>');
    console.log('  npm run sonic supplyHighLevel <token_address> <amount>');
    console.log('  npm run sonic borrow <token_address> <amount>');
    console.log('  npm run sonic borrowHighLevel <token_address> <amount>');
    console.log('  npm run sonic borrowTo <token_address> <amount> <to_address> <spokeChainId>');
    console.log('  npm run sonic withdraw <token_address> <amount>');
    console.log('  npm run sonic withdrawHighLevel <token_address> <amount>');
    console.log('  npm run sonic repay <token_address> <amount>');
    console.log('  npm run sonic repayHighLevel <token_address> <amount>');
    console.log('  npm run sonic reverseMigrate <amount> <to_address>');
    console.log(
      '  npm run sonic reverseMigrateBnUSD <newbnUSD_address> <dstChainID> <legacybnUSD_address> <amount> <recipient_address>',
    );
  }
}

main();
