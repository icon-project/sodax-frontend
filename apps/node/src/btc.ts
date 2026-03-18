import 'dotenv/config';
import { encodeFunctionData, keccak256, type Address, type Hash, type Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  BitcoinSpokeProvider,
  EvmWalletAbstraction,
  spokeChainConfig,
  SpokeService,
  IntentsAbi,
  type CreateIntentParams,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  type EvmRawTransaction,
  getHubChainConfig,
  encodeAddress,
  Payload,
  type RadfiConfig,
  waitUntilIntentExecuted,
} from '@sodax/sdk';
import { EvmWalletProvider, BitcoinWalletProvider } from '@sodax/wallet-sdk-core';
import {
  SONIC_MAINNET_CHAIN_ID,
  type HubChainId,
  type SpokeChainId,
  BITCOIN_MAINNET_CHAIN_ID,
  type BitcoinSpokeChainConfig,
  getIntentRelayChainId,
} from '@sodax/types';
import { solverConfig } from './config.js';
import type { BitcoinWalletConfig } from '@sodax/wallet-sdk-core';
import { sleep } from '@injectivelabs/utils';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const DEFAULT_SPOKE_CHAIN_ID = BITCOIN_MAINNET_CHAIN_ID;
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.testnet.soniclabs.com' : 'https://rpc.soniclabs.com';

const BTC_SPOKE_CHAIN_ID = (process.env.SPOKE_CHAIN_ID || DEFAULT_SPOKE_CHAIN_ID) as SpokeChainId; // Default to Bitcoin

const WALLET_MODE = (process.env.WALLET_MODE || 'USER') as 'TRADING' | 'USER';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const config: BitcoinWalletConfig = {
  type: 'PRIVATE_KEY',
  network: IS_TESTNET ? 'TESTNET' : 'MAINNET',
  privateKey: privateKey as Hex,
  addressType: 'P2WPKH',
};

const radfiConfig: RadfiConfig = {
  url: IS_TESTNET ? 'https://api.signet.radfi.co/api' : 'https://api.canary.radfi.co/api',
  apiKey: 'YOUR_API_KEY',
  umsUrl: IS_TESTNET ? 'https://signet.ums.radfi.co/api' : 'https://ums.radfi.co/api',
};

const spokeBitcoinWallet = new BitcoinWalletProvider(config);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  swaps: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const hubProvider = new EvmHubProvider({
  config: hubConfig,
  configService: sodax.config,
});

const spokeCfg = spokeChainConfig[BTC_SPOKE_CHAIN_ID] as BitcoinSpokeChainConfig;
const spokeProvider = new BitcoinSpokeProvider(spokeBitcoinWallet, spokeCfg, radfiConfig, WALLET_MODE);

const relayerBackendUrl = IS_TESTNET
  ? 'https://53naa6u2qd.execute-api.us-east-1.amazonaws.com/prod'
  : 'https://n7gem91bcb.execute-api.us-east-1.amazonaws.com/prod';

async function submitData(tx_hash: string, address: Address, payload: Hex | null) {
  let data = {};
  if (payload == null) {
    data = {
      action: 'submit',
      params: {
        chain_id: Number(getIntentRelayChainId(spokeCfg.chain.id)),
        tx_hash: tx_hash,
      },
    };
  } else {
    const payloadData =
      tx_hash === 'withdraw'
        ? JSON.parse(payload)
        : {
            address: address,
            payload: payload,
          };
    data = {
      action: 'submit',
      params: {
        chain_id: Number(getIntentRelayChainId(spokeCfg.chain.id)),
        tx_hash: tx_hash,
        data: payloadData,
      },
    };
  }

  try {
    const request = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    console.log('HTTP Request:', {
      relayerBackendUrl,
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    const response = await fetch(relayerBackendUrl, request);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Response:', result);
    return result;
  } catch (error) {
    console.error('Error submitting data:', error);
    return null;
  }
}
async function depositTo(token: Address, amount: bigint, recipient: Address) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const tradingWalletAddress = await spokeProvider.radfi.getTradingWallet(walletAddress);
  console.log('tradingWalletAddress', WALLET_MODE, tradingWalletAddress, walletAddress);
  const spokeAddress =
    spokeProvider.walletMode === 'TRADING' ? (tradingWalletAddress.tradingAddress as Address) : walletAddress;
  const spokeAddressBytes = encodeAddress(BITCOIN_MAINNET_CHAIN_ID, spokeAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    spokeAddressBytes,
    hubProvider,
  );
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    spokeProvider.chainConfig.chain.id,
    sodax.config,
  );

  console.log('[depositTo] data', data);
  const accessToken = await getRadfiAccessToken(walletAddress);
  const hashedData = keccak256(data);
  const txHash: string = await SpokeService.deposit(
    {
      from: spokeAddress,
      token,
      amount,
      data: hashedData,
      accessToken,
    },
    spokeProvider,
    hubProvider,
  );
  console.log('[depositTo] txHash', txHash);

  await sleep(3);
  const res = await submitData(txHash, hubWallet, data);
  console.log(res);
}

async function getRadfiAccessToken(walletAddress: string) {
  const message = 'Login to Radfi via Sodax';
  const bip322Signature = await spokeProvider.walletProvider.signBip322Message(message);

  if (!spokeProvider.walletProvider.getPublicKey) {
    throw new Error('Missing public key');
  }
  const response = await spokeProvider.radfi.authenticate({
    message,
    signature: bip322Signature,
    address: walletAddress,
    publicKey: await spokeProvider.walletProvider.getPublicKey(),
  });
  // On frontend, we can save accesstoken/refreshToken to local storage
  //@ts-ignore
  return response.accessToken;
}

async function withdrawAsset(token: Address, amount: bigint, recipient: Address, useTradingWallet = false) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const walletAddressBytes = encodeAddress(BITCOIN_MAINNET_CHAIN_ID, walletAddress);
  const tradingWalletAddress = await spokeProvider.radfi.getTradingWallet(walletAddress);
  console.log('tradingWalletAddress', WALLET_MODE, tradingWalletAddress, walletAddress);
  const spokeAddressBytes = encodeAddress(
    BITCOIN_MAINNET_CHAIN_ID,
    WALLET_MODE === 'TRADING' ? (tradingWalletAddress.tradingAddress as Address) : walletAddress,
  );
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    spokeAddressBytes,
    hubProvider,
  );

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: encodeAddress(BITCOIN_MAINNET_CHAIN_ID, recipient),
      amount,
    },
    hubProvider,
    spokeProvider.chainConfig.chain.id,
  );

  const withdrawData: string = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider, false, false);

  const res = await submitData('withdraw', hubWallet, withdrawData as Hex);
  console.log(res);
}

async function supply(token: Address, amount: bigint, useTradingWallet = false) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const walletAddressBytes = encodeAddress(BITCOIN_MAINNET_CHAIN_ID, walletAddress);
  const tradingWalletAddress = await spokeProvider.radfi.getTradingWallet(walletAddress);
  const spokeAddressBytes = encodeAddress(
    BITCOIN_MAINNET_CHAIN_ID,
    useTradingWallet ? (tradingWalletAddress.tradingAddress as Address) : walletAddress,
  );
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    spokeAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(spokeProvider.chainConfig.chain.id, token, amount, hubWallet);

  const accessToken = await getRadfiAccessToken(walletAddress);
  const hashedData = keccak256(data);
  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data: hashedData,
      accessToken,
    },
    spokeProvider,
    hubProvider,
  );
  console.log('[depositTo] txHash', txHash);

  const res = await submitData(txHash, hubWallet, data);
  console.log(res);
}

async function borrow(token: Address, amount: bigint, useTradingWallet = false) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const tradingWalletAddress = await spokeProvider.radfi.getTradingWallet(walletAddress);
  const spokeAddressBytes = encodeAddress(
    BITCOIN_MAINNET_CHAIN_ID,
    useTradingWallet ? (tradingWalletAddress.tradingAddress as Address) : walletAddress,
  );
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    spokeAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildBorrowData(
    hubWallet,
    walletAddress,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
  );

  const withdrawData: string = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider, false, false);

  const res = await submitData('withdraw', hubWallet, withdrawData as Hex);
  console.log(res);
}

async function withdraw(token: Address, amount: bigint, useTradingWallet = false) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const walletAddressBytes = encodeAddress(BITCOIN_MAINNET_CHAIN_ID, walletAddress);
  const tradingWalletAddress = await spokeProvider.radfi.getTradingWallet(walletAddress);
  const spokeAddressBytes = encodeAddress(
    BITCOIN_MAINNET_CHAIN_ID,
    useTradingWallet ? (tradingWalletAddress.tradingAddress as Address) : walletAddress,
  );
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    spokeAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildWithdrawData(
    hubWallet,
    walletAddress,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
  );

  const withdrawData: string = await SpokeService.callWallet(hubWallet, data, spokeProvider, hubProvider, false, false);

  const res = await submitData('withdraw', hubWallet, withdrawData as Hex);
  console.log(res);
}

async function repay(token: Address, amount: bigint, useTradingWallet = false) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const walletAddressBytes = encodeAddress(BITCOIN_MAINNET_CHAIN_ID, walletAddress);
  const tradingWalletAddress = await spokeProvider.radfi.getTradingWallet(walletAddress);
  const spokeAddressBytes = encodeAddress(
    BITCOIN_MAINNET_CHAIN_ID,
    useTradingWallet ? (tradingWalletAddress.tradingAddress as Address) : walletAddress,
  );
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    spokeAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildRepayData(spokeProvider.chainConfig.chain.id, token, amount, hubWallet);

  const accessToken = await getRadfiAccessToken(walletAddress);
  const hashedData = keccak256(data);
  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data: hashedData,
      accessToken,
    },
    spokeProvider,
    hubProvider,
  );
  console.log('[depositTo] txHash', txHash);

  const res = await submitData(txHash, hubWallet, data);
  console.log(res);
}

// uses spoke assets to create intents
async function createIntent(amount: bigint, inputToken: Address, outputChainId: SpokeChainId, dstAddress: Address) {
  const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
  const walletAddressBytes = encodeAddress(BITCOIN_MAINNET_CHAIN_ID, walletAddress);
  const tradingWalletAddress = await spokeProvider.radfi.getTradingWallet(walletAddress);
  const spokeAddressBytes = encodeAddress(
    BITCOIN_MAINNET_CHAIN_ID,
    WALLET_MODE === 'TRADING' ? (tradingWalletAddress.tradingAddress as Address) : walletAddress,
  );
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    spokeAddressBytes,
    hubProvider,
  );
  const intent = {
    inputToken: inputToken,
    outputToken: '0x0000000000000000000000000000000000000000',
    inputAmount: amount,
    minOutputAmount: 0n,
    deadline: 0n,
    allowPartialFill: false,
    srcChain: spokeProvider.chainConfig.chain.id,
    dstChain: outputChainId,
    srcAddress: walletAddress,
    dstAddress: dstAddress,
    solver: '0x0000000000000000000000000000000000000000',
    data: '0x',
  } satisfies CreateIntentParams;

  const accessToken = await getRadfiAccessToken(walletAddress);
  spokeProvider.setRadfiAccessToken(accessToken);
  const res = await sodax.swaps.swap({
    intentParams: intent,
    spokeProvider,
  });

  console.log('[createIntent] res', res);

  //@ts-ignore
  //   const res = await submitData(txHash.value[0], hubWallet, txHash.value[2]);

  //    const packet = await waitUntilIntentExecuted({
  //           intentRelayChainId:getIntentRelayChainId(spokeCfg.chain.id).toString(),
  //           // @ts-ignore
  //           spokeTxHash: txHash.value[0],
  //           timeout:120000,
  //           apiUrl: relayerBackendUrl,
  //         });

  //    if (!packet.ok) {
  //           return {
  //             ok: false,
  //             error: packet.error,
  //           };
  //         }
  //   const dstIntentTxHash = packet.value.dst_tx_hash;
  //  const result = await sodax.swaps.postExecution({
  //         intent_tx_hash: dstIntentTxHash as `0x${string}`,
  //       });
  //   console.log('[createIntent] txHash', txHash);
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
    // const { request } = await spokeProvider.publicClient.simulateContract(req);
    // console.log('[fillIntent] request', request);

    // // Send the transaction using the same request object
    // const txHash = await walletClient.sendTransaction(rawTx);

    // console.log('[fillIntent] txHash', txHash);

    // const txReceipt = await waitForTransactionReceipt(txHash, spokeProvider.walletProvider);

    // console.log(txReceipt);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
}

// uses spoke assets to create intents
async function cancelIntent(intentCreateTxHash: string) {
  const intent = await sodax.swaps.getIntent(intentCreateTxHash as Hash);

  const txResult = await sodax.swaps.cancelIntent(intent, spokeProvider);

  if (txResult.ok) {
    console.log('[cancelIntent] txHash', txResult.value);
  } else {
    console.error('[cancelIntent] error', txResult.error);
  }
}

async function getIntent(txHash: string) {
  const intent = await sodax.swaps.getIntent(txHash as Hash);
  console.log(intent);
}

async function getIntentState(txHash: string) {
  const intentState = await sodax.swaps.getFilledIntent(txHash as Hash);
  console.log(intentState);
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
    const inputToken = process.argv[4] as Address; // Get input token address from command line argument
    const outputChainId = process.argv[5] as SpokeChainId; // Get output chain ID from command line argument
    const dstAddress = process.argv[6] as Address; // Get destination address from command line argument
    await createIntent(amount, inputToken, outputChainId, dstAddress);
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
  } else if (functionName === 'getIntentState') {
    const txHash = process.argv[3]; // Get txHash from command line argument
    await getIntentState(txHash);
  } else {
    console.log(
      'Function not recognized. Please use "deposit", "withdrawAsset", "supply", "borrow", "withdraw", "repay", "createIntent", "fillIntent", "cancelIntent", "getIntent", or "getIntentState".',
    );
  }
}

main();
