import 'dotenv/config';
import { encodeFunctionData, type Address, type Hash, type Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  type EvmSpokeChainConfig,
  EvmSpokeProvider,
  EvmWalletAbstraction,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  waitForTransactionReceipt,
  IntentsAbi,
  type CreateIntentParams,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  type EvmRawTransaction,
  type SolverConfigParams,
  type EvmChainId,
  ConcentratedLiquidityService,
  getConcentratedLiquidityConfig,
} from '@sodax/sdk';
import { EvmWalletProvider } from './wallet-providers/EvmWalletProvider.js';
import { SONIC_MAINNET_CHAIN_ID, ARBITRUM_MAINNET_CHAIN_ID, type HubChainId, type SpokeChainId } from '@sodax/types';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const DEFAULT_SPOKE_RPC_URL = IS_TESTNET ? 'https://arbitrum-sepolia.drpc.org' : 'https://arb1.arbitrum.io/rpc';
const DEFAULT_SPOKE_CHAIN_ID = ARBITRUM_MAINNET_CHAIN_ID;
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

const EVM_SPOKE_CHAIN_ID = (process.env.SPOKE_CHAIN_ID || DEFAULT_SPOKE_CHAIN_ID) as EvmChainId & SpokeChainId; // Default to Avalanche
const SPOKE_RPC_URL = process.env.SPOKE_RPC_URL || DEFAULT_SPOKE_RPC_URL;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);

const spokeEvmWallet = new EvmWalletProvider(privateKey as Hex, EVM_SPOKE_CHAIN_ID, SPOKE_RPC_URL);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const hubProvider = new EvmHubProvider({
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
});

const spokeCfg = spokeChainConfig[EVM_SPOKE_CHAIN_ID] as EvmSpokeChainConfig;
const spokeProvider = new EvmSpokeProvider(spokeEvmWallet, spokeCfg);

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

// Initialize ConcentratedLiquidityService
const concentratedLiquidityConfig = getConcentratedLiquidityConfig(HUB_CHAIN_ID);
const concentratedLiquidityService = new ConcentratedLiquidityService(concentratedLiquidityConfig, hubProvider);

async function depositRaw(token: Address, amount: bigint) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  console.log(walletAddress);

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data: '0x',
    },
    spokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function depositTo(token: Address, amount: bigint, recipient: Address) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
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
      from: walletAddress,
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
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: recipient,
      amount,
    },
    hubProvider,
    spokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: Address, amount: bigint) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(token, hubWallet, amount, spokeProvider.chainConfig.chain.id);

  const txHash = await SpokeService.deposit(
    {
      from: walletAddress,
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
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildBorrowData(
    hubWallet,
    walletAddress,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: Address, amount: bigint) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildWithdrawData(
    hubWallet,
    walletAddress,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: Address, amount: bigint) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildRepayData(token, hubWallet, amount, spokeProvider.chainConfig.chain.id);

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
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
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
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

  const txHash = await sodax.solver.createIntent(intent, spokeProvider);

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
  const walletClient = spokeProvider.walletProvider;
  const walletAddress = (await walletClient.getWalletAddress()) as Address;

  console.log('Using account:', walletAddress);

  // Get the creator's wallet on the hub chain
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
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
    srcAddress: walletAddress,
    dstAddress: walletAddress,
    solver: '0x0000000000000000000000000000000000000000' as Address,
    data: '0x' as Hex,
  };

  console.log('Intent to fill:', intent);
  console.log('Input amount:', inputAmount.toString());
  console.log('Output amount:', outputAmount.toString());

  try {
    // Prepare the transaction request
    const req = {
      account: walletAddress,
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
    const rawTx = {
      from: walletAddress,
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
          0n,
        ],
      }),
      value: 0n,
    } satisfies EvmRawTransaction;

    // Estimate gas with the same account that will send the transaction
    const { request } = await spokeProvider.publicClient.simulateContract(req);
    console.log('[fillIntent] request', request);

    // Send the transaction using the same request object
    const txHash = await walletClient.sendTransaction(rawTx);

    console.log('[fillIntent] txHash', txHash);

    const txReceipt = await waitForTransactionReceipt(txHash, spokeProvider.walletProvider);

    console.log(txReceipt);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
}

// uses spoke assets to create intents
async function cancelIntent(intentCreateTxHash: string) {
  const intent = await sodax.solver.getIntent(intentCreateTxHash as Hash);

  const txResult = await sodax.solver.cancelIntent(intent, spokeProvider);

  if (txResult.ok) {
    console.log('[cancelIntent] txHash', txResult.value);
  } else {
    console.error('[cancelIntent] error', txResult.error);
  }
}

async function getIntent(txHash: string) {
  const intent = await sodax.solver.getIntent(txHash as Hash);
  console.log(intent);
}

// requires 2 raw deposits to be made first
// uses max amounts so needs some buffer
async function supplyLiquidity(
  token0: Address,
  token1: Address,
  tickLower: bigint,
  tickUpper: bigint,
  liquidity: bigint,
  amount0: bigint,
  amount1: bigint,
) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );

  // Get position manager address from config
  const positionManager = concentratedLiquidityService.config.clPositionManager;

  // Encode the crosschain supply liquidity call
  const data: Hex = await concentratedLiquidityService.encodeCrosschainSupplyLiquidity(
    spokeProvider.chainConfig.chain.id,
    token0,
    token1,
    tickLower,
    tickUpper,
    liquidity,
    amount0,
    amount1,
    hubWallet,
    positionManager,
  );

  // Execute the transaction via wallet call
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider);

  console.log('[supplyLiquidity] txHash', txHash);
}

// requires 2 raw deposits to be made first
async function burnPosition(
  currency0: Address,
  currency1: Address,
  tokenId: bigint,
  minAmount0: bigint,
  minAmount1: bigint,
) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );

  // Get position manager address from config
  const positionManager = concentratedLiquidityService.config.clPositionManager;

  // Encode the crosschain supply liquidity call
  const data: Hex = await concentratedLiquidityService.encodeCrosschainBurnPosition(
    spokeProvider.chainConfig.chain.id,
    currency0,
    currency1,
    tokenId,
    minAmount0,
    minAmount1,
    hubWallet,
    walletAddress,
    positionManager,
  );

  // Execute the transaction via wallet call
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider);

  console.log('[Burn positions  ] txHash', txHash);
}

// requires 2 raw deposits to be made first
async function increaseLiquidity(
  token0: Address,
  token1: Address,
  tokenId: bigint,
  liquidity: bigint,
  amount0Max: bigint,
  amount1Max: bigint,
) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );

  // Get position manager address from config
  const positionManager = concentratedLiquidityService.config.clPositionManager;

  // Encode the crosschain increase liquidity call
  const data: Hex = await concentratedLiquidityService.encodeCrosschainIncreaseLiquidity(
    spokeProvider.chainConfig.chain.id,
    token0,
    token1,
    tokenId,
    liquidity,
    amount0Max,
    amount1Max,
    positionManager,
    hubWallet,
  );

  // Execute the transaction via wallet call
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider);

  console.log('[increaseLiquidity] txHash', txHash);
}

// requires raw deposits to be made first for unwrapping tokens
async function decreaseLiquidity(
  token0: Address,
  token1: Address,
  tokenId: bigint,
  liquidity: bigint,
  amount0Min: bigint,
  amount1Min: bigint,
) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddress,
    hubProvider,
  );

  // Get position manager address from config
  const positionManager = concentratedLiquidityService.config.clPositionManager;

  // Encode the crosschain decrease liquidity call
  const data: Hex = await concentratedLiquidityService.encodeCrosschainDecreaseLiquidity(
    spokeProvider.chainConfig.chain.id,
    token0,
    token1,
    tokenId,
    liquidity,
    amount0Min,
    amount1Min,
    hubWallet,
    walletAddress,
    positionManager,
  );

  // Execute the transaction via wallet call
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider);

  console.log('[decreaseLiquidity] txHash', txHash);
}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2]; // Get function name from command line argument

  if (functionName === 'depositRaw') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await depositRaw(token, amount);
  } else if (functionName === 'deposit') {
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
  } else if (functionName === 'supplyLiquidity') {
    const token0 = process.argv[3] as Address; // Get token0 address from command line argument
    const token1 = process.argv[4] as Address; // Get token1 address from command line argument
    const tickLower = BigInt(process.argv[5]); // Get tickLower from command line argument
    const tickUpper = BigInt(process.argv[6]); // Get tickUpper from command line argument
    const liquidity = BigInt(process.argv[7]); // Get liquidity from command line argument
    const amount0 = BigInt(process.argv[8]); // Get amount0 from command line argument
    const amount1 = BigInt(process.argv[9]); // Get amount1 from command line argument
    await supplyLiquidity(token0, token1, tickLower, tickUpper, liquidity, amount0, amount1);
  } else if (functionName === 'burnPosition') {
    const currency0 = process.argv[3] as Address; // Get currency0 address from command line argument
    const currency1 = process.argv[4] as Address; // Get currency1 address from command line argument
    const tokenId = BigInt(process.argv[5]); // Get tokenId from command line argument
    const minAmount0 = BigInt(process.argv[6]); // Get minAmount0 from command line argument
    const minAmount1 = BigInt(process.argv[7]); // Get minAmount1 from command line argument
    await burnPosition(currency0, currency1, tokenId, minAmount0, minAmount1);
  } else if (functionName === 'increaseLiquidity') {
    const token0 = process.argv[3] as Address; // Get token0 address from command line argument
    const token1 = process.argv[4] as Address; // Get token1 address from command line argument
    const tokenId = BigInt(process.argv[5]); // Get tokenId from command line argument
    const liquidity = BigInt(process.argv[6]); // Get liquidity from command line argument
    const amount0Max = BigInt(process.argv[7]); // Get amount0Max from command line argument
    const amount1Max = BigInt(process.argv[8]); // Get amount1Max from command line argument
    await increaseLiquidity(token0, token1, tokenId, liquidity, amount0Max, amount1Max);
  } else if (functionName === 'decreaseLiquidity') {
    const token0 = process.argv[3] as Address; // Get token0 address from command line argument
    const token1 = process.argv[4] as Address; // Get token1 address from command line argument
    const tokenId = BigInt(process.argv[5]); // Get tokenId from command line argument
    const liquidity = BigInt(process.argv[6]); // Get liquidity from command line argument
    const amount0Min = BigInt(process.argv[7]); // Get amount0Min from command line argument
    const amount1Min = BigInt(process.argv[8]); // Get amount1Min from command line argument
    await decreaseLiquidity(token0, token1, tokenId, liquidity, amount0Min, amount1Min);
  } else {
    console.log(
      'Function not recognized. Please use "deposit", "withdrawAsset", "supply", "borrow", "withdraw", "repay", "createIntent", "fillIntent", "cancelIntent", "getIntent", "supplyLiquidity", "burnPosition", "increaseLiquidity", or "decreaseLiquidity".',
    );
  }
}

main();
