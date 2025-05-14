import type { Address, Hash, Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  type MoneyMarketConfig,
  type EvmSpokeChainConfig,
  EvmSpokeProvider,
  EvmWalletAbstraction,
  EvmWalletProvider,
  getHubChainConfig,
  MoneyMarketService,
  spokeChainConfig,
  SpokeService,
  waitForTransactionReceipt,
  type SolverConfig,
  SolverService,
  IntentsAbi,
  SONIC_TESTNET_CHAIN_ID,
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  type CreateIntentParams,
  type SpokeChainId,
  type HubChainId,
  SONIC_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  type EvmChainId,
  getMoneyMarketConfig,
} from '@new-world/sdk';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const DEFAULT_SPOKE_RPC_URL = IS_TESTNET ? 'https://avalanche-fuji.drpc.org' : 'https://api.avax.network/ext/bc/C/rpc';
const DEFAULT_SPOKE_CHAIN_ID = IS_TESTNET
  ? AVALANCHE_FUJI_TESTNET_CHAIN_ID.toString()
  : AVALANCHE_MAINNET_CHAIN_ID.toString();
const HUB_CHAIN_ID: HubChainId = IS_TESTNET ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';

const EVM_SPOKE_CHAIN_ID = Number.parseInt(process.env.SPOKE_CHAIN_ID || DEFAULT_SPOKE_CHAIN_ID) as SpokeChainId; // Default to Avalanche
const SPOKE_RPC_URL = process.env.SPOKE_RPC_URL || DEFAULT_SPOKE_RPC_URL;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider({
  chain: HUB_CHAIN_ID,
  privateKey: privateKey as Hex,
  provider: HUB_RPC_URL,
});

const spokeEvmWallet = new EvmWalletProvider({
  chain: EVM_SPOKE_CHAIN_ID as EvmChainId,
  privateKey: privateKey as Hex,
  provider: SPOKE_RPC_URL,
});

const hubChainCfg = getHubChainConfig(HUB_CHAIN_ID);
const hubProvider = new EvmHubProvider(hubEvmWallet, hubChainCfg);

const spokeCfg = spokeChainConfig[EVM_SPOKE_CHAIN_ID] as EvmSpokeChainConfig;
const spokeProvider = new EvmSpokeProvider(spokeEvmWallet, spokeCfg);

// Configure based on testnet/mainnet
const moneyMarketConfig: MoneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const solverConfig: SolverConfig = IS_TESTNET
  ? {
      intentsContract: '0x611d800F24b5844Ea874B330ef4Ad6f1d5812f29',
      solverApiEndpoint: 'https://TODO',
      relayerApiEndpoint: 'https://TODO',
    }
  : {
      intentsContract: '0x611d800F24b5844Ea874B330ef4Ad6f1d5812f29',
      solverApiEndpoint: 'https://TODO',
      relayerApiEndpoint: 'https://TODO',
    };

const solverService = new SolverService(solverConfig);

async function depositTo(token: Address, amount: bigint, recipient: Address) {
  console.log(recipient);

  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    spokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: spokeProvider.walletProvider.walletClient.account.address,
      token,
      amount,
      data,
    },
    spokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(token: Address, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: recipient,
      amount,
    },
    hubProvider,
    spokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(
    spokeProvider.walletProvider.walletClient.account.address,
    data,
    spokeProvider,
    hubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    spokeProvider.chainConfig.chain.id,
    spokeProvider.walletProvider.walletClient.account.address,
    hubProvider,
  );

  const data = MoneyMarketService.supplyData(
    token,
    hubWallet,
    amount,
    spokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash = await SpokeService.deposit(
    {
      from: spokeProvider.walletProvider.walletClient.account.address,
      token,
      amount,
      data,
    },
    spokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    spokeProvider.chainConfig.chain.id,
    spokeProvider.walletProvider.walletClient.account.address,
    hubProvider,
  );
  const data: Hex = MoneyMarketService.borrowData(
    hubWallet,
    spokeProvider.walletProvider.walletClient.account.address,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
    hubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    spokeProvider.walletProvider.walletClient.account.address,
    data,
    spokeProvider,
    hubProvider,
  );

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    spokeProvider.chainConfig.chain.id,
    spokeProvider.walletProvider.walletClient.account.address,
    hubProvider,
  );

  const data: Hex = MoneyMarketService.withdrawData(
    hubWallet,
    spokeProvider.walletProvider.walletClient.account.address,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
    hubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    spokeProvider.walletProvider.walletClient.account.address,
    data,
    spokeProvider,
    hubProvider,
  );

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    spokeProvider.chainConfig.chain.id,
    spokeProvider.walletProvider.walletClient.account.address,
    hubProvider,
  );
  const data: Hex = MoneyMarketService.repayData(
    token,
    hubWallet,
    amount,
    spokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: spokeProvider.walletProvider.walletClient.account.address,
      token,
      amount,
      data,
    },
    spokeProvider,
    hubProvider,
  );

  console.log('[repay] txHash', txHash);
}

// uses spoke assets to create intents
async function createIntent(amount: bigint, nativeToken: Address, inputToken: Address, outputToken: Address) {
  const intent = {
    inputToken: inputToken,
    outputToken: outputToken,
    inputAmount: amount,
    minOutputAmount: 0n,
    deadline: 0n,
    allowPartialFill: false,
    srcChain: spokeProvider.chainConfig.chain.id,
    dstChain: spokeProvider.chainConfig.chain.id,
    srcAddress: spokeProvider.walletProvider.walletClient.account.address,
    dstAddress: spokeProvider.walletProvider.walletClient.account.address,
    solver: '0x0000000000000000000000000000000000000000',
    data: '0x',
  } satisfies CreateIntentParams;

  const txHash = await solverService.createIntent(intent, spokeProvider, hubProvider);

  console.log('[createIntent] txHash', txHash);
}

// Helper function for testing only
async function fillIntent(
  intentId: bigint,
  inputToken: Address,
  outputToken: Address,
  inputAmount: bigint,
  outputAmount: bigint,
) {
  // Get the wallet client and account
  const walletClient = hubProvider.walletProvider.walletClient;
  const account = walletClient.account;

  console.log('Using account:', account.address);

  // Get the creator's wallet on the hub chain
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    spokeProvider.chainConfig.chain.id,
    spokeProvider.walletProvider.walletClient.account.address,
    hubProvider,
  );

  // Create the intent object with proper typing
  const intent = {
    intentId,
    creator: hubWallet as Address,
    inputToken,
    outputToken,
    inputAmount,
    minOutputAmount: 0n,
    deadline: 0n,
    allowPartialFill: false,
    srcChain: BigInt(spokeProvider.chainConfig.chain.id),
    dstChain: BigInt(spokeProvider.chainConfig.chain.id),
    srcAddress: spokeProvider.walletProvider.walletClient.account.address as Address,
    dstAddress: spokeProvider.walletProvider.walletClient.account.address as Address,
    solver: '0x0000000000000000000000000000000000000000' as Address,
    data: '0x' as Hex,
  };

  console.log('Intent to fill:', intent);
  console.log('Input amount:', inputAmount.toString());
  console.log('Output amount:', outputAmount.toString());

  try {
    // Prepare the transaction request
    const req = {
      account,
      address: solverConfig.intentsContract as `0x${string}`,
      abi: IntentsAbi,
      functionName: 'fillIntent' as const,
      args: [
        {
          intentId: intent.intentId,
          creator: intent.creator,
          inputToken: intent.inputToken,
          outputToken: intent.outputToken,
          inputAmount: intent.inputAmount,
          minOutputAmount: intent.minOutputAmount,
          deadline: intent.deadline,
          allowPartialFill: intent.allowPartialFill,
          srcChain: intent.srcChain,
          dstChain: intent.dstChain,
          srcAddress: intent.srcAddress,
          dstAddress: intent.dstAddress,
          solver: intent.solver,
          data: intent.data,
        },
        inputAmount,
        outputAmount,
        0n,
      ] as const,
      chainId: 57054,
    };

    console.log(hubProvider.walletProvider.walletClient.chain);
    console.log(await hubProvider.walletProvider.walletClient.getChainId());
    // Estimate gas with the same account that will send the transaction
    const { request } = await hubProvider.walletProvider.publicClient.simulateContract(req);
    console.log('[fillIntent] request', request);

    // Send the transaction using the same request object
    const txHash = await walletClient.writeContract(request);

    console.log('[fillIntent] txHash', txHash);

    const txReceipt = await waitForTransactionReceipt(txHash, hubProvider.walletProvider);

    console.log(txReceipt);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
}

// uses spoke assets to create intents
async function cancelIntent(intentCreateTxHash: string) {
  const intent = await solverService.getIntent(intentCreateTxHash as Hash, hubProvider);

  const txHash: Hash = await solverService.cancelIntent(intent, spokeProvider, hubProvider);

  console.log('[cancelIntent] txHash', txHash);
}

async function getIntent(txHash: string) {
  const intent = await solverService.getIntent(txHash as Hash, hubProvider);
  console.log(intent);
}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2]; // Get function name from command line argument

  if (functionName === 'deposit') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await repay(token, amount);
  } else if (functionName === 'createIntent') {
    const amount = BigInt(process.argv[3]); // Get amount from command line argument
    const nativeToken = process.argv[4] as Address; // Get input token address from command line argument
    const inputToken = process.argv[5] as Address; // Get output token address from command line argument
    const outputToken = process.argv[6] as Address; // Get output token address from command line argument
    await createIntent(amount, nativeToken, inputToken, outputToken);
  } else if (functionName === 'fillIntent') {
    const intentId = BigInt(process.argv[3]); // Get intent ID from command line argument
    const inputToken = process.argv[4] as Address; // Get input token address
    const outputToken = process.argv[5] as Address; // Get output token address
    const inputAmount = BigInt(process.argv[6]); // Get input amount
    const outputAmount = BigInt(process.argv[7]); // Get output amount
    await fillIntent(intentId, inputToken, outputToken, inputAmount, outputAmount);
  } else if (functionName === 'cancelIntent') {
    const txHash = process.argv[3]; // Get txHash from command line argument
    await cancelIntent(txHash);
  } else if (functionName === 'getIntent') {
    const txHash = process.argv[3]; // Get txHash from command line argument
    await getIntent(txHash);
  } else {
    console.log(
      'Function not recognized. Please use "deposit", "withdrawAsset", "supply", "borrow", "withdraw", "repay", "createIntent", "fillIntent", or "cancelIntent".',
    );
  }
}

main();