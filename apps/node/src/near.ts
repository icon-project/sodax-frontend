import {
  EvmAssetManagerService,
  EvmHubProvider,
  type EvmHubProviderConfig,
  EvmWalletAbstraction,
  type NearSpokeChainConfig,
  Sodax,
  type SodaxConfig,
  type SolverConfigParams,
  SpokeService,
  getHubChainConfig,
  getMoneyMarketConfig,
  spokeChainConfig,
  NearSpokeProvider,
  type CreateIntentParams,
  IntentsAbi,
  type FillData,
  waitForTransactionReceipt,
  type EvmSpokeChainConfig,
  EvmSpokeProvider,
  type EvmChainId,
} from '@sodax/sdk';

import { type Address, encodeFunctionData, type Hash, type Hex, toHex } from 'viem';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, NEAR_MAINNET_CHAIN_ID, type EvmRawTransaction } from '@sodax/types';
import dotenv from 'dotenv';
import { EvmWalletProvider, NearWalletProvider } from '@sodax/wallet-sdk-core';
dotenv.config();

// load PK from .env
const privateKey = process.env.NEAR_PRIVATE_KEY as Hex;
const accountId = process.env.NEAR_ACCOUNT_ID;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET ? 'https://sonic-testnet.drpc.org' : 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;

const DEFAULT_SPOKE_RPC_URL = IS_TESTNET ? 'https://rpc.testnet.near.org' : 'https://rpc.mainnet.near.org';

const DEFAULT_SPOKE_CHAIN_ID = NEAR_MAINNET_CHAIN_ID;

const SPOKE_CHAIN_ID = (process.env.NEAR_SPOKE_CHAIN_ID || DEFAULT_SPOKE_CHAIN_ID) as SpokeChainId; // Default to Injective
const SPOKE_RPC_URL = process.env.SPOKE_RPC_URL || DEFAULT_SPOKE_RPC_URL;

if (!privateKey) {
  throw new Error('NEAR_PRIVATE_KEY environment variable is required');
}
if (!accountId) {
  throw new Error('NEAR_ACCOUNT_ID environment variable is required');
}

const spokeConfig = spokeChainConfig[SPOKE_CHAIN_ID] as NearSpokeChainConfig;

const walletProvider = new NearWalletProvider({ rpcUrl: SPOKE_RPC_URL, accountId, privateKey });

const spokeProvider = new NearSpokeProvider(walletProvider, spokeConfig);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const solverConfig = {
  intentsContract: '0x611d800F24b5844Ea874B330ef4Ad6f1d5812f29',
  solverApiEndpoint: 'https://staging-sodax.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  swaps: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const evmHubProvider = new EvmHubProvider({
  config: hubConfig,
  configService: sodax.config,
});

const evmSpokePrivateKey = process.env.EVM_SPOKE_PRIVATE_KEY;

if (!evmSpokePrivateKey) {
  throw new Error('EVM_SPOKE_PRIVATE_KEY environment variable is required');
}

const EVM_SPOKE_CHAIN_ID = (process.env.EVM_SPOKE_CHAIN_ID || 'sonic') as EvmChainId & SpokeChainId;
const EVM_SPOKE_RPC_URL = HUB_RPC_URL;

const spokeEvmWallet = new EvmWalletProvider({
  privateKey: evmSpokePrivateKey as Hex,
  chainId: EVM_SPOKE_CHAIN_ID,
  rpcUrl: SPOKE_RPC_URL as `http${string}`,
});

const spokeCfg = spokeChainConfig[EVM_SPOKE_CHAIN_ID] as EvmSpokeChainConfig;
const evmSpokeProvider = new EvmSpokeProvider(spokeEvmWallet, spokeCfg);

async function depositTo(token: string, amount: bigint, recipient: Address): Promise<void> {
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );
  console.log(hubWallet);
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    spokeProvider.chainConfig.chain.id,
    sodax.config,
  );
  //const data="0x";
  const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
  const txHash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    spokeProvider,
    evmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // near address
): Promise<void> {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: toHex(Buffer.from(recipient, 'utf-8')),
      amount,
    },
    evmHubProvider,
    spokeProvider.chainConfig.chain.id,
  );
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );

  const txHash = await SpokeService.callWallet(hubWallet, data, spokeProvider, evmHubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function getAvailable(token: string) {
  const balance = await SpokeService.getAvailable(token, spokeProvider);
  console.log('[Available]:', balance);
}

async function getLimit(token: string) {
  const balance = await SpokeService.getLimit(token, spokeProvider);
  console.log('[Limit]:', balance);
}

async function createIntent(amount: bigint, inputToken: string, outputToken: string) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddressBytes()) as Address;
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );
  console.log(hubWallet);
  const intent = {
    inputToken: inputToken,
    outputToken: outputToken,
    inputAmount: amount,
    minOutputAmount: 0n,
    deadline: 0n,
    allowPartialFill: false,
    srcChain: spokeProvider.chainConfig.chain.id,
    dstChain: spokeProvider.chainConfig.chain.id,
    srcAddress: walletAddress,
    dstAddress: walletAddress,
    solver: '0x0000000000000000000000000000000000000000',
    data: '0x',
  } satisfies CreateIntentParams;

  const txHash = await sodax.swaps.createIntent({
    intentParams: intent,
    spokeProvider,
  });
  console.log('[createIntent] txHash', txHash);
}

async function fillIntent(fill_id: bigint, intent_hash: Hex, token: string, amount: bigint) {
  const receiver = await spokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );
  const fillData = {
    fill_id,
    amount,
    intent_hash,
    receiver,
    solver: '0xf089255c81c4d3d39b1e0954d9f40359ae50347e',
    token,
  } as FillData;
  const txn = await spokeProvider.fillIntent(fillData);
  const hash = await spokeProvider.submit(txn);
  console.log(`[TxnHash]:${hash}`);
}

async function fillIntentHub(
  fill_id: bigint,
  intentId: bigint,
  inputToken: Address,
  outputToken: Address,
  inputAmount: bigint,
  outputAmount: bigint,
) {
  // Get the wallet client and account
  const walletClient = evmSpokeProvider.walletProvider;
  const walletAddress = await spokeProvider.walletProvider.getWalletAddressBytes();

  // Get the creator's wallet on the hub chain
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    evmHubProvider,
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
    srcChain: BigInt(15),
    dstChain: BigInt(15),
    srcAddress: walletAddress,
    dstAddress: walletAddress,
    solver: '0x0000000000000000000000000000000000000000' as Address,
    data: '0x' as Hex,
  };

  console.log('Intent to fill:', intent);
  console.log('Input amount:', inputAmount.toString());
  console.log('Output amount:', outputAmount.toString());

  const evmAccount = await walletClient.getWalletAddress();

  try {
    const rawTx = {
      from: evmAccount,
      to: solverConfig.intentsContract as `0x${string}`,
      data: encodeFunctionData({
        abi: IntentsAbi,
        functionName: 'fillIntent',
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
          fill_id,
        ],
      }),
      value: 0n,
    } satisfies EvmRawTransaction;

    // Send the transaction using the same request object
    const txHash = await walletClient.sendTransaction(rawTx);

    console.log('[fillIntent] txHash', txHash);

    const txReceipt = await waitForTransactionReceipt(txHash, evmSpokeProvider.walletProvider);

    console.log(txReceipt);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
}
import * as ethers from 'ethers';
async function fillIntentHubRaw(
  fill_id: bigint,
  intentId: bigint,
  inputToken: Address,
  outputToken: Address,
  inputAmount: bigint,
  outputAmount: bigint,
) {
  const walletAddress = await spokeProvider.walletProvider.getWalletAddressBytes();

  // Get the creator's wallet on the hub chain
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    evmHubProvider,
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
    srcChain: BigInt(15),
    dstChain: BigInt(15),
    srcAddress: walletAddress,
    dstAddress: walletAddress,
    solver: '0x0000000000000000000000000000000000000000' as Address,
    data: '0x' as Hex,
  };

  console.log('Intent to fill:', intent);
  console.log('Input amount:', inputAmount.toString());
  console.log('Output amount:', outputAmount.toString());

  const provider = new ethers.JsonRpcProvider('https://rpc.blaze.soniclabs.com ');
  const signer = new ethers.Wallet(evmSpokePrivateKey as string, provider);

  // --- Contract ABI and Address ---
  const contractAddress = '0x611d800F24b5844Ea874B330ef4Ad6f1d5812f29';
  const contractAbi = [
    'function fillIntent((uint256 intentId,address creator,address inputToken,address outputToken,uint256 inputAmount,uint256 minOutputAmount,uint256 deadline,bool allowPartialFill,uint256 srcChain,uint256 dstChain,bytes srcAddress,bytes dstAddress,address solver,bytes data),uint256,uint256,uint256) external',
  ];
  const contract = new ethers.Contract(contractAddress, contractAbi, signer);

  // --- Other Arguments ---
  const _inputAmount = inputAmount;
  const _outputAmount = outputAmount;
  const _externalFillId = fill_id;

  const tx = await contract.fillIntent(intent, _inputAmount, _outputAmount, _externalFillId, {
    gasLimit: 1_000_000n, // or higher if needed
  });

  console.log('Transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Transaction confirmed:', receipt.transactionHash);
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
  } else if (functionName === 'get_limit') {
    const token = process.argv[3] as string;
    await getLimit(token);
  } else if (functionName === 'get_available') {
    const token = process.argv[3] as string;
    await getAvailable(token);
  } else if (functionName === 'createIntent') {
    const amount = BigInt(process.argv[3]); // Get amount from command line argument
    const inputToken = process.argv[4] as Address; // Get output token address from command line argument
    const outputToken = process.argv[5] as Address; // Get output token address from command line argument
    await createIntent(amount, inputToken, outputToken);
  } else if (functionName === 'fillIntent') {
    const fill_id = BigInt(process.argv[3]);
    const intent_hash = process.argv[4] as Hex;
    const token = process.argv[5] as string;
    const amount = BigInt(process.argv[6]);
    await fillIntent(fill_id, intent_hash, token, amount);
  } else if (functionName === 'fillIntentHub') {
    const fillId = BigInt(process.argv[3]);
    const intentId = BigInt(process.argv[4]); // Get intent ID from command line argument
    const inputToken = process.argv[5] as Address; // Get input token address
    const outputToken = process.argv[6] as Address; // Get output token address
    const inputAmount = BigInt(process.argv[7]); // Get input amount
    const outputAmount = BigInt(process.argv[8]); // Get output amount
    await fillIntentHub(fillId, intentId, inputToken, outputToken, inputAmount, outputAmount);
  } else if (functionName === 'fillIntentHubRaw') {
    const fillId = BigInt(process.argv[3]);
    const intentId = BigInt(process.argv[4]); // Get intent ID from command line argument
    const inputToken = process.argv[5] as Address; // Get input token address
    const outputToken = process.argv[6] as Address; // Get output token address
    const inputAmount = BigInt(process.argv[7]); // Get input amount
    const outputAmount = BigInt(process.argv[8]); // Get output amount
    await fillIntentHubRaw(fillId, intentId, inputToken, outputToken, inputAmount, outputAmount);
  } else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();
