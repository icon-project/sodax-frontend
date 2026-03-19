import 'dotenv/config';
import type { Address, Hex } from 'viem';
import {
  AleoSpokeProvider,
  AleoSpokeService,
  EvmAssetManagerService,
  EvmHubProvider,
  EvmWalletAbstraction,
  spokeChainConfig,
  type AleoSpokeChainConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  getHubChainConfig,
  getMoneyMarketConfig,
  encodeAddress,
  type SolverConfigParams,
} from '@sodax/sdk';
import { AleoWalletProvider } from '@sodax/wallet-sdk-core';
import {
  ALEO_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  type SonicSpokeChainConfig,
  type HubChainId,
  type HttpUrl,
  getIntentRelayChainId,
} from '@sodax/types';

const ALEO_CHAIN_ID = ALEO_MAINNET_CHAIN_ID;
const aleoChainConfig = spokeChainConfig[ALEO_CHAIN_ID] as AleoSpokeChainConfig;
const ALEO_RPC_URL = process.env.ALEO_RPC_URL || aleoChainConfig.rpcUrl;
const ALEO_PRIVATE_KEY = process.env.ALEO_PRIVATE_KEY;
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const PROVABLE_API_KEY = process.env.PROVABLE_API_KEY;
const PROVABLE_CONSUMER_ID = process.env.PROVABLE_CONSUMER_ID;
const PROVABLE_DELEGATE_URL = process.env.PROVABLE_DELEGATE_URL;
const HUB_RPC_URL = process.env.HUB_RPC_URL || 'https://rpc.soniclabs.com';
const RELAYER_API_ENDPOINT = process.env.RELAYER_API_ENDPOINT as HttpUrl;
const destinationChainConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID] as SonicSpokeChainConfig;
const IS_TESTNET = process.env.IS_TESTNET;
if (!ALEO_PRIVATE_KEY) throw new Error('ALEO_PRIVATE_KEY is required');
if (!ALEO_PRIVATE_KEY.startsWith('APrivateKey1')) throw new Error('Invalid ALEO_PRIVATE_KEY');
if (!PROVABLE_API_KEY) throw new Error('PROVABLE_API_KEY is required');
if (!PROVABLE_CONSUMER_ID) throw new Error('PROVABLE_CONSUMER_ID is required');
const solverConfig = {
  intentsContract: '0x0427eD01190d8a3f441877B36E87cB8E8A2Ace3c',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const aleoWalletProvider = new AleoWalletProvider({
  type: 'privateKey',
  rpcUrl: ALEO_RPC_URL,
  privateKey: ALEO_PRIVATE_KEY,
  network: IS_TESTNET ? 'testnet' : 'mainnet',
  delegate: {
    apiKey: PROVABLE_API_KEY,
    consumerId: PROVABLE_CONSUMER_ID,
    url: PROVABLE_DELEGATE_URL,
  },
});

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  swaps: solverConfig,
  hubProviderConfig: hubConfig,
  relayerApiEndpoint: RELAYER_API_ENDPOINT,
} satisfies SodaxConfig);

const hubProvider = new EvmHubProvider({
  config: hubConfig,
  configService: sodax.config,
});

const aleoSpokeProvider = new AleoSpokeProvider(aleoChainConfig, aleoWalletProvider, ALEO_RPC_URL);

async function submitData(tx_hash: string, address: Address, payload: Hex | null) {
  let data = {};
  if (payload == null) {
    data = {
      action: 'submit',
      params: {
        chain_id: String(getIntentRelayChainId(aleoChainConfig.chain.id)),
        tx_hash: tx_hash,
      },
    };
  } else {
    data = {
      action: 'submit',
      params: {
        chain_id: String(getIntentRelayChainId(aleoChainConfig.chain.id)),
        tx_hash: tx_hash,
        data: {
          address: address,
          payload: payload,
        },
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
      RELAYER_API_ENDPOINT,
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    const response = await fetch(RELAYER_API_ENDPOINT, request);

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

async function getUserWallet() {
  const walletAddress = await aleoSpokeProvider.walletProvider.getWalletAddress();
  console.log('WalletAddress: ', walletAddress);
  const walletAddressBytes = encodeAddress(aleoSpokeProvider.chainConfig.chain.id, walletAddress);
  console.log('chainId: ', aleoSpokeProvider.chainConfig.chain.id);
  return await EvmWalletAbstraction.getUserHubWalletAddress(
    aleoSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
}

// Approve and deposit the underlying asset token and then mint shares to the recipient address (user's hub wallet)
async function depositTo(token: string, amount: number, recipient: Address) {
  const walletAddress = await aleoSpokeProvider.walletProvider.getWalletAddress();
  const data = '0x';
  const txId = await AleoSpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    aleoSpokeProvider,
    hubProvider,
  );
  const userWallet = await getUserWallet();
  console.log('userWallet ✌️:', userWallet);

  const res = await submitData(txId, userWallet, null);
  console.log(res);

  console.log('[depositTo] txId', txId);
}

async function withdrawAsset(token: string, amount: number, recipient: string) {
  const walletAddress = await aleoSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(aleoSpokeProvider.chainConfig.chain.id, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    aleoSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: encodeAddress(aleoSpokeProvider.chainConfig.chain.id, recipient),
      amount: BigInt(amount),
    },
    hubProvider,
    aleoSpokeProvider.chainConfig.chain.id,
  );

  const txId = await AleoSpokeService.callWallet(hubWallet, data, aleoSpokeProvider, hubProvider);
  const res = await submitData(txId, hubWallet, data);
  console.log('Response: ', res);
  console.log('[withdrawAsset] txId', txId);
}

async function createIntent(amount: number, inputToken: string, outputToken: string) {
  const walletAddress = await aleoSpokeProvider.walletProvider.getWalletAddress();
  const userWallet = await getUserWallet();

  const result = await sodax.swaps.createIntent({
    intentParams: {
      inputToken,
      outputToken,
      inputAmount: BigInt(amount),
      minOutputAmount: 0n,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
      allowPartialFill: false,
      srcChain: aleoSpokeProvider.chainConfig.chain.id,
      //   dstChain: aleoSpokeProvider.chainConfig.chain.id,
      dstChain: destinationChainConfig.chain.id,
      srcAddress: walletAddress,
      dstAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: aleoSpokeProvider,
  });

  if (!result.ok) {
    console.error('[createIntent] Failed:', result.error);
    throw new Error(`createIntent failed: ${result.error.code}`);
  }

  const [txId, intent, data] = result.value;
  console.log('[createIntent] txId:', txId);
  console.log('[createIntent] intentId:', intent.intentId);

  const res = await submitData(txId as string, userWallet, data);
  console.log('[createIntent] submitData response:', res);
}

async function swap(amount: number, inputToken: string, outputToken: string) {
  const walletAddress = await aleoSpokeProvider.walletProvider.getWalletAddress();

  const userWallet = await getUserWallet();

  const result = await sodax.swaps.swap({
    intentParams: {
      inputToken,
      outputToken,
      inputAmount: BigInt(amount),
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: aleoSpokeProvider.chainConfig.chain.id,
      dstChain: destinationChainConfig.chain.id,
      srcAddress: walletAddress,
      dstAddress: userWallet,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: aleoSpokeProvider,
  });

  if (!result.ok) {
    console.error('[swap] Failed:', result.error);
    throw new Error(`swap failed: ${result.error.code}`);
  }

  const [executionResponse, intent, deliveryInfo] = result.value;
  console.log('[swap] intentId:', intent.intentId);
  console.log('[swap] srcTxHash:', deliveryInfo.srcTxHash);
  console.log('[swap] dstTxHash:', deliveryInfo.dstTxHash);
  console.log('[swap] executionResponse:', executionResponse);
}

async function getBalance(token: string) {
  const balance = await AleoSpokeService.getDeposit(token, aleoSpokeProvider);
  console.log('[getBalance] token:', token);
  console.log('[getBalance] balance:', balance.toString());
}

async function getSimulateDepositParams(token: string, amount: number) {
  const walletAddress = await aleoSpokeProvider.walletProvider.getWalletAddress();
  const params = await AleoSpokeService.getSimulateDepositParams(
    {
      from: walletAddress,
      token,
      amount,
      data: '0x',
    },
    aleoSpokeProvider,
    hubProvider,
  );
  console.log('[getSimulateDepositParams] spokeChainID:', params.spokeChainID);
  console.log('[getSimulateDepositParams] token (hex):', params.token);
  console.log('[getSimulateDepositParams] from:', params.from);
  console.log('[getSimulateDepositParams] to:', params.to);
  console.log('[getSimulateDepositParams] amount:', params.amount.toString());
  console.log('[getSimulateDepositParams] data (keccak256):', params.data);
  console.log('[getSimulateDepositParams] srcAddress:', params.srcAddress);

  // Basic sanity checks
  if (params.token === '0x') throw new Error('token field is empty — encoding failed');
  if (params.from === '0x') throw new Error('from field is empty — encoding failed');
  if (params.to === '0x') throw new Error('to field is empty — hub wallet lookup failed');
  if (params.srcAddress === '0x') throw new Error('srcAddress is empty — encoding failed');
  console.log('[getSimulateDepositParams] ✓ all fields populated');
}

async function estimateGas(token: string, amount: number) {
  const walletAddress = await aleoSpokeProvider.walletProvider.getWalletAddress();
  const rawTx = await AleoSpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data: '0x',
    },
    aleoSpokeProvider,
    hubProvider,
    true,
  );

  const gasEstimate = await AleoSpokeService.estimateGas(rawTx, aleoSpokeProvider);
  console.log('[estimateGas] tx:', rawTx);
  console.log('[estimateGas] gasEstimate:', gasEstimate);
}

async function main() {
  const functionName = process.argv[2];

  if (functionName === 'deposit') {
    const token = process.argv[3];
    const amount = Number(process.argv[4]);
    const recipient = process.argv[5] as Address;
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3];
    const amount = Number(process.argv[4]);
    const recipient = process.argv[5] as Hex;
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'createIntent') {
    const amount = Number(process.argv[3]);
    const inputToken = process.argv[4];
    const outputToken = process.argv[5];
    await createIntent(amount, inputToken, outputToken);
  } else if (functionName === 'swap') {
    const amount = Number(process.argv[3]);
    const inputToken = process.argv[4];
    const outputToken = process.argv[5];
    await swap(amount, inputToken, outputToken);
  } else if (functionName === 'getBalance') {
    const token = process.argv[3];
    await getBalance(token);
  } else if (functionName === 'getSimulateDepositParams') {
    const token = process.argv[3];
    const amount = Number(process.argv[4]);
    await getSimulateDepositParams(token, amount);
  } else if (functionName === 'estimateGas') {
    const token = process.argv[3];
    const amount = Number(process.argv[4]);
    await estimateGas(token, amount);
  } else {
    console.log(
      'Usage: pnpm aleo <function> [args...]\n' +
        'Functions:\n' +
        '  deposit <token> <amount> <recipient> [native]  - Deposit tokens to hub\n' +
        '  withdrawAsset <token> <amount> <recipient>      - Withdraw tokens from hub\n' +
        '  supply <token> <amount>                          - Supply to lending pool\n' +
        '  borrow <token> <amount>                          - Borrow from lending pool\n' +
        '  withdraw <token> <amount>                        - Withdraw from lending pool\n' +
        '  repay <token> <amount>                           - Repay lending pool debt\n' +
        '  createIntent <amount> <inputToken> <outputToken>           - Create swap intent (step 1 only)\n' +
        '  swap <amount> <inputToken> <outputToken>        - Full swap (intent + relay + execute)\n' +
        '  getBalance <token>                               - Get deposited balance for a token\n' +
        '  getSimulateDepositParams <token> <amount>        - Get simulation params and verify encoding\n',
      '  estimateGas <token> <amount>                     - Estimate Aleo gas for a deposit\n',
    );
  }
}

main().catch(error => {
  console.error('Error: ', error);
  console.error('Error:', error.message);
  process.exit(1);
});
