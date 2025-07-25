import 'dotenv/config';
import type { Address, Hash, Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  EvmWalletAbstraction,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  type IconSpokeChainConfig,
  IconSpokeProvider,
  type IconAddress,
  getIconAddressBytes,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  Sodax,
  type SodaxConfig,
  type SolverConfigParams,
  type MigrationParams,
  BnUSDMigrationService,
  type BnUSDMigrateParams,
  encodeAddress,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, type HubChainId, ICON_MAINNET_CHAIN_ID, type SpokeChainId } from '@sodax/types';
import { IconWalletProvider } from './wallet-providers/IconWalletProvider.js';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

const DEFAULT_SPOKE_RPC_URL = IS_TESTNET
  ? 'https://lisbon.net.solidwallet.io/api/v3'
  : 'https://ctz.solidwallet.io/api/v3';
const DEFAULT_SPOKE_CHAIN_ID = ICON_MAINNET_CHAIN_ID;

const iconSpokeWallet = new IconWalletProvider({
  privateKey: privateKey as Hex,
  rpcUrl: DEFAULT_SPOKE_RPC_URL,
});
const iconSpokeChainConfig = spokeChainConfig[DEFAULT_SPOKE_CHAIN_ID];
const iconSpokeProvider = new IconSpokeProvider(iconSpokeWallet, iconSpokeChainConfig as IconSpokeChainConfig);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;
const hubProvider = new EvmHubProvider(hubConfig);

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef', // mainnet
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

async function depositTo(token: IconAddress, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    iconSpokeChainConfig.chain.id,
  );

  const walletAddress = (await iconSpokeProvider.walletProvider.getWalletAddress()) as IconAddress;

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data: data,
    },
    iconSpokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(token: IconAddress, amount: bigint, recipient: IconAddress) {
  const walletAddressBytes = await iconSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: getIconAddressBytes(recipient),
      amount,
    },
    hubProvider,
    iconSpokeChainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, iconSpokeProvider, hubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: IconAddress, amount: bigint) {
  const walletAddressBytes = await iconSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(token, hubWallet, amount, iconSpokeChainConfig.chain.id);

  const walletAddress = (await iconSpokeProvider.walletProvider.getWalletAddress()) as IconAddress;
  const txHash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    iconSpokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: IconAddress, amount: bigint) {
  const walletAddressBytes = await iconSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildBorrowData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    iconSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, iconSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: IconAddress, amount: bigint) {
  const walletAddressBytes = await iconSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildWithdrawData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    iconSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, iconSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: IconAddress, amount: bigint) {
  const walletAddressBytes = await iconSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildRepayData(token, hubWallet, amount, iconSpokeChainConfig.chain.id);

  const walletAddress = (await iconSpokeProvider.walletProvider.getWalletAddress()) as IconAddress;
  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    iconSpokeProvider,
    hubProvider,
  );

  console.log('[repay] txHash', txHash);
}

/**
 * Migrates wICX tokens from ICON to the hub chain.
 * This function handles the migration of wICX tokens to SODA tokens on the hub chain.
 *
 * @param wICX - The ICON address of the wICX token to migrate
 * @param amount - The amount of wICX tokens to migrate
 * @param recipient - The address that will receive the migrated SODA tokens
 */
async function migrate(amount: bigint, recipient: Address): Promise<void> {
  const params = {
    token: 'ICX',
    icx: iconSpokeChainConfig.nativeToken,
    amount,
    to: recipient,
    action: 'migrate',
  } satisfies MigrationParams;

  const result = await sodax.migration.createAndSubmitMigrateIntent(params, iconSpokeProvider);

  if (result.ok) {
    console.log('[migrate] txHash', result.value);
    const [hubTxHash, spokeTxHash] = result.value;
    console.log('[migrate] hubTxHash', hubTxHash);
    console.log('[migrate] spokeTxHash', spokeTxHash);
  } else {
    console.error('[migrate] error', result.error);
  }
}

/**
 * Migrates legacy bnUSD tokens to new bnUSD tokens.
 * This function handles the migration of legacy bnUSD tokens to new bnUSD tokens.
 *
 * @param legacybnUSD - The address of the legacy bnUSD token to migrate
 * @param dstChainID - The destination chain ID where the new bnUSD token exists
 * @param newbnUSD - The address of the new bnUSD token to receive
 * @param amount - The amount of legacy bnUSD tokens to migrate
 * @param recipient - The address that will receive the migrated new bnUSD tokens
 */
async function migrateBnUSD(
  legacybnUSD: string,
  dstChainID: SpokeChainId,
  newbnUSD: string,
  amount: bigint,
  recipient: Address,
): Promise<void> {
  const bnUSDMigrationService = new BnUSDMigrationService(hubProvider);

  const params: BnUSDMigrateParams = {
    srcChainID: iconSpokeChainConfig.chain.id,
    legacybnUSD,
    newbnUSD,
    amount,
    to: encodeAddress(dstChainID, recipient),
    dstChainID: dstChainID,
  };

  const migrationData = bnUSDMigrationService.migrateData(params);

  const walletAddress = (await iconSpokeProvider.walletProvider.getWalletAddress()) as IconAddress;

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token: legacybnUSD as IconAddress,
      amount,
      data: migrationData,
    },
    iconSpokeProvider,
    hubProvider,
  );

  console.log('[migrateBnUSD] txHash', txHash);
}

///**
// * Migrates BALN tokens from ICON to the hub chain.
// * This function handles the migration of BALN tokens to SODA tokens on the hub chain with lockup period.
// *
// * @param baln - The ICON address of the BALN token to migrate
// * @param amount - The amount of BALN tokens to migrate
// * @param lockupPeriod - The lockup period for the migration (in seconds)
// * @param to - The address that will receive the migrated SODA tokens
// */
//async function balnMigrate(baln: IconAddress, amount: bigint, lockupPeriod: bigint, to: Address): Promise<void> {
//  try {
//    // Prepare BALN migration parameters
//    const balnMigrateParams: BalnMigrateParams = {
//      baln,
//      amount,
//      lockupPeriod,
//      to,
//    };
//
//    // Generate BALN migration transaction data
//    const balnMigrationData = await ICXMigrationService.balnMigrateData(hubProvider.chainConfig, balnMigrateParams);
//
//    // Get wallet address for the transaction
//    const walletAddress = (await iconSpokeProvider.walletProvider.getWalletAddress()) as IconAddress;
//
//    // Execute the BALN migration transaction
//    const txHash: Hash = await SpokeService.deposit(
//      {
//        from: walletAddress,
//        token: baln,
//        amount,
//        data: balnMigrationData,
//      },
//      iconSpokeProvider,
//      hubProvider,
//    );
//
//    console.log('[balnMigrate] BALN migration transaction hash:', txHash);
//    console.log('[balnMigrate] BALN migration initiated successfully');
//  } catch (error) {
//    console.error('[balnMigrate] BALN migration failed:', error);
//    throw error;
//  }
//}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2]; // Get function name from command line argument

  if (functionName === 'deposit') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as IconAddress; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await repay(token, amount);
  } else if (functionName === 'migrate') {
    const amount = BigInt(process.argv[3]); // Get amount from command line argument
    const recipient = process.argv[4] as Address; // Get recipient address from command line argument
    await migrate(amount, recipient);
  } else if (functionName === 'migrateBnUSD') {
    const legacybnUSD = process.argv[3] as string; // Get legacy bnUSD address from command line argument
    const dstChainID = process.argv[4] as SpokeChainId; // Get destination chain ID from command line argument
    const newbnUSD = process.argv[5] as string; // Get new bnUSD address from command line argument
    const amount = BigInt(process.argv[6]); // Get amount from command line argument
    const recipient = process.argv[7] as Address; // Get recipient address from command line argument
    await migrateBnUSD(legacybnUSD, dstChainID, newbnUSD, amount, recipient);
    // } else if (functionName === 'balnMigrate') {
    //   const baln = process.argv[3] as IconAddress; // Get BALN token address from command line argument
    //   const amount = BigInt(process.argv[4]); // Get amount from command line argument
    //   const lockupPeriod = BigInt(process.argv[5]); // Get lockup period from command line argument
    //   const recipient = process.argv[6] as Address; // Get recipient address from command line argument
    //   await balnMigrate(baln, amount, lockupPeriod, recipient);
  } else {
    console.log(
      'Function not recognized. Please use one of: "deposit", "withdrawAsset", "supply", "borrow", "withdraw", "repay", "migrate", or "migrateBnUSD".',
    );
    console.log('Usage examples:');
    console.log('  npm run icon migrate <amount> <recipient_address>');
    console.log(
      '  npm run icon migrateBnUSD <srcChainID> <legacybnUSD_address> <newbnUSD_address> <amount> <recipient_address>',
    );
    console.log('  npm run icon balnMigrate <baln_address> <amount> <lockup_period> <recipient_address>');
    console.log('  npm run icon deposit <token_address> <amount> <recipient_address>');
    console.log('  npm run icon supply <token_address> <amount>');
  }
}

main();
