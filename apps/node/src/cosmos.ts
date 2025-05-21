import {
  CWSpokeProvider,
  type CosmosSpokeChainConfig,
  CosmosWalletProvider,
  CreateIntentParams,
  EvmAssetManagerService,
  EvmHubProvider,
  EvmWalletAbstraction,
  EvmWalletProvider,
  INJECTIVE_MAINNET_CHAIN_ID,
  INJECTIVE_TESTNET_CHAIN_ID,
  InjectiveWalletProvider,
  IntentsAbi,
  type MoneyMarketConfig,
  MoneyMarketService,
  SONIC_MAINNET_CHAIN_ID,
  SONIC_TESTNET_CHAIN_ID,
  SolverConfig,
  SolverService,
  type SpokeChainId,
  SpokeService,
  getHubChainConfig,
  getMoneyMarketConfig,
  spokeChainConfig,
  waitForTransactionReceipt,
} from '@new-world/sdk';
import { type Address, type Hash, type Hex, toHex } from 'viem';

import dotenv from 'dotenv';
dotenv.config();

// load PK from .env
const privateKey = process.env.PRIVATE_KEY as Hex;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = IS_TESTNET ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;

const DEFAULT_SPOKE_RPC_URL = IS_TESTNET
  ? 'https://injective-testnet-rpc.publicnode.com:443'
  : 'https://injective-rpc.publicnode.com:443';

const DEFAULT_SPOKE_CHAIN_ID = IS_TESTNET ? INJECTIVE_TESTNET_CHAIN_ID : INJECTIVE_MAINNET_CHAIN_ID;

const SPOKE_CHAIN_ID = (process.env.SPOKE_CHAIN_ID || DEFAULT_SPOKE_CHAIN_ID) as SpokeChainId; // Default to Injective
const SPOKE_RPC_URL = process.env.SPOKE_RPC_URL || DEFAULT_SPOKE_RPC_URL;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider({
  chain: HUB_CHAIN_ID,
  privateKey: privateKey as Hex,
  provider: HUB_RPC_URL,
});

const sonicHubChainConfig = getHubChainConfig(HUB_CHAIN_ID);
const sonicEvmHubProvider = new EvmHubProvider(hubEvmWallet, sonicHubChainConfig);

const cosmosConfig = spokeChainConfig[SPOKE_CHAIN_ID] as CosmosSpokeChainConfig;
const cosmosNetwork = IS_TESTNET ? 'TestNet' : 'Mainnet';

const cosmosWalletMnemonics = process.env.COSMOS_MNEMONICS;

if (!cosmosWalletMnemonics) {
  throw new Error('MNEMONICS environment variable is required');
}

const cosmosWalletProvider =
  cosmosConfig.chain.id === INJECTIVE_MAINNET_CHAIN_ID || cosmosConfig.chain.id === INJECTIVE_TESTNET_CHAIN_ID
    ? new InjectiveWalletProvider({
        mnemonics: cosmosWalletMnemonics,
        network: cosmosNetwork,
        rpcUrl: SPOKE_RPC_URL,
      })
    : new CosmosWalletProvider({
        gasPrice: cosmosConfig.gasPrice,
        mnemonics: cosmosWalletMnemonics,
        network: cosmosNetwork,
        prefix: cosmosConfig.prefix,
        rpcUrl: cosmosConfig.rpcUrl,
      });

const cwSpokeProvider = new CWSpokeProvider(cosmosConfig, cosmosWalletProvider);

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

async function depositTo(token: string, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    cwSpokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.deposit(
    {
      from: cwSpokeProvider.walletProvider.getWalletAddress(),
      token,
      amount,
      data,
    },
    cwSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // cosmos address
) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: toHex(Buffer.from(recipient, 'utf-8')),
      amount,
    },
    sonicEvmHubProvider,
    cwSpokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(
    cwSpokeProvider.walletProvider.getWalletAddress(),
    data,
    cwSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    cwSpokeProvider.chainConfig.chain.id,
    cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  const data = MoneyMarketService.supplyData(
    token,
    hubWallet,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash = await SpokeService.deposit(
    {
      from: cwSpokeProvider.walletProvider.getWalletAddress(),
      token,
      amount,
      data,
    },
    cwSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    cwSpokeProvider.chainConfig.chain.id,
    cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  console.log(hubWallet);
  const data: Hex = MoneyMarketService.borrowData(
    hubWallet,
    cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    token,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    sonicEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    cwSpokeProvider.walletProvider.getWalletAddress(),
    data,
    cwSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    cwSpokeProvider.chainConfig.chain.id,
    cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  const data: Hex = MoneyMarketService.withdrawData(
    hubWallet,
    cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    token,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    sonicEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    cwSpokeProvider.walletProvider.getWalletAddress(),
    data,
    cwSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    cwSpokeProvider.chainConfig.chain.id,
    cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  const data: Hex = MoneyMarketService.repayData(
    token,
    hubWallet,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: cwSpokeProvider.walletProvider.getWalletAddress(),
      token,
      amount,
      data,
    },
    cwSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[repay] txHash', txHash);
}

async function createIntent(amount: bigint, inputToken: Address, outputToken: Address) {
  const intent = {
    inputToken: inputToken,
    outputToken: outputToken,
    inputAmount: amount,
    minOutputAmount: 0n,
    deadline: 0n,
    allowPartialFill: false,
    srcChain: cwSpokeProvider.chainConfig.chain.id,
    dstChain: cwSpokeProvider.chainConfig.chain.id,
    srcAddress: cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    dstAddress: cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    solver: '0x0000000000000000000000000000000000000000',
    data: '0x',
  } satisfies CreateIntentParams;

  const txHash = await solverService.createIntent(intent, cwSpokeProvider, sonicEvmHubProvider);

  console.log('[createIntent] txHash', txHash);
}

// Helper function for testing only
async function fillIntent(
  fillId:bigint,
  intentId: bigint,
  inputToken: Address,
  outputToken: Address,
  inputAmount: bigint,
  outputAmount: bigint,
) {
  // Get the wallet client and account
  const walletClient = sonicEvmHubProvider.walletProvider.walletClient;
  const account = walletClient.account;

  console.log('Using account:', account.address);

  // Get the creator's wallet on the hub chain
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    cwSpokeProvider.chainConfig.chain.id,
    cwSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
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
    srcChain: BigInt(cwSpokeProvider.chainConfig.chain.id),
    dstChain: BigInt(cwSpokeProvider.chainConfig.chain.id),
    srcAddress: cwSpokeProvider.walletProvider.getWalletAddressBytes() as Address,
    dstAddress: cwSpokeProvider.walletProvider.getWalletAddressBytes() as Address,
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
        fillId,
      ] as const,
      chainId: 57054,
    };

    console.log(sonicEvmHubProvider.walletProvider.walletClient.chain);
    console.log(await sonicEvmHubProvider.walletProvider.walletClient.getChainId());
    // Estimate gas with the same account that will send the transaction
    const { request } = await sonicEvmHubProvider.walletProvider.publicClient.simulateContract(req);
    console.log('[fillIntent] request', request);

    // Send the transaction using the same request object
    const txHash = await walletClient.writeContract(request);

    console.log('[fillIntent] txHash', txHash);

    const txReceipt = await waitForTransactionReceipt(txHash, sonicEvmHubProvider.walletProvider);

    console.log(txReceipt);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
}

// uses spoke assets to create intents
async function cancelIntent(intentCreateTxHash: string) {
  const intent = await solverService.getIntent(intentCreateTxHash as Hash, sonicEvmHubProvider);

  const txHash: Hash = await solverService.cancelIntent(intent, cwSpokeProvider, sonicEvmHubProvider);

  console.log('[cancelIntent] txHash', txHash);
}
async function getIntent(txHash: string) {
  const intent = await solverService.getIntent(txHash as Hash, sonicEvmHubProvider);
  console.log(intent);
}

// Main function to decide which function to call
async function main() {
  console.log(process.argv);
  const functionName = process.argv[2];

  if (functionName === 'deposit') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Hex; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Hex; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await repay(token, amount);
  } else if (functionName === 'createIntent') {
        const amount = BigInt(process.argv[3]); // Get amount from command line argument
        const inputToken = process.argv[4] as Address; // Get output token address from command line argument
        const outputToken = process.argv[5] as Address; // Get output token address from command line argument
        await createIntent(amount, inputToken, outputToken);
      } else if (functionName === 'fillIntent') {
         const fillId = BigInt(process.argv[3]); 
        const intentId = BigInt(process.argv[4]); // Get intent ID from command line argument
        const inputToken = process.argv[5] as Address; // Get input token address
        const outputToken = process.argv[6] as Address; // Get output token address
        const inputAmount = BigInt(process.argv[7]); // Get input amount
        const outputAmount = BigInt(process.argv[8]); // Get output amount
        await fillIntent(fillId,intentId, inputToken, outputToken, inputAmount, outputAmount);
      } else if (functionName === 'cancelIntent') {
        const txHash = process.argv[3]; // Get txHash from command line argument
        await cancelIntent(txHash);
      } else if (functionName === 'getIntent') {
        const txHash = process.argv[3]; // Get txHash from command line argument
        await getIntent(txHash);
      }else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();
