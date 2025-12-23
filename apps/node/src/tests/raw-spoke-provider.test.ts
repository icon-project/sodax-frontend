import 'dotenv/config';
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (): string {
  return this.toString();
};

import {
  EvmRawSpokeProvider,
  Sodax,
  type Hex,
  spokeChainConfig,
  ARBITRUM_MAINNET_CHAIN_ID,
  SonicRawSpokeProvider,
  SONIC_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  SolanaRawSpokeProvider,
  SpokeService,
  SUI_MAINNET_CHAIN_ID,
  SuiRawSpokeProvider,
} from '@sodax/sdk';
import { EvmWalletProvider, SolanaWalletProvider, SuiWalletProvider } from '@sodax/wallet-sdk-core';
import { Keypair } from '@solana/web3.js';
import bs58 from "bs58";

const evmPrivateKey = process.env.EVM_PRIVATE_KEY as Hex;
const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;
const iconPrivateKey = process.env.ICON_PRIVATE_KEY;
const stellarPrivateKey = process.env.STELLAR_PRIVATE_KEY;
const suiWalletMnemonics = process.env.SUI_MNEMONICS;

if (!solanaPrivateKey || !evmPrivateKey || !iconPrivateKey || !stellarPrivateKey || !suiWalletMnemonics) {
  throw new Error('private keys environment variables are required');
}

const sodax = new Sodax();

const arbWalletProvider = new EvmWalletProvider({
  privateKey: evmPrivateKey as Hex,
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
});

const sonicWalletProvider = new EvmWalletProvider({
  privateKey: evmPrivateKey as Hex,
  chainId: SONIC_MAINNET_CHAIN_ID,
});

const suiWalletProvider = new SuiWalletProvider({
  rpcUrl: 'https://fullnode.testnet.sui.io',
  mnemonics: suiWalletMnemonics,
});

// used test solana wallet address due to Solana private key not working
const keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(solanaPrivateKey)));
const solanaWallet = new SolanaWalletProvider({
  privateKey: keypair.secretKey,
  endpoint: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl,
});

const [arbWalletAddress, sonicWalletAddress, suiWalletAddress, solanaWalletAddress] = await Promise.all([
  arbWalletProvider.getWalletAddress(),
  sonicWalletProvider.getWalletAddress(),
  suiWalletProvider.getWalletAddress(),
  solanaWallet.getWalletAddress(),
]);
const suiRawSpokeProvider = new SuiRawSpokeProvider(spokeChainConfig[SUI_MAINNET_CHAIN_ID], suiWalletAddress);
const arbRawSpokeProvider = new EvmRawSpokeProvider(arbWalletAddress, spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID]);

const sonicRawSpokeProvider = new SonicRawSpokeProvider(sonicWalletAddress, spokeChainConfig[SONIC_MAINNET_CHAIN_ID]);

const solanaRawSpokeProvider = new SolanaRawSpokeProvider({
  connection: { rpcUrl: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl },
  walletAddress: solanaWalletAddress,
  chainConfig: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID],
});

async function createArbToSonicIntent() {
  const createArbToSonicIntentResult = await sodax.swaps.createIntent({
    intentParams: {
      inputToken: spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken, // ETH token
      outputToken: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].nativeToken, // SONIC token
      inputAmount: BigInt(1e13), // 0.00001 ETH
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: arbRawSpokeProvider.chainConfig.chain.id,
      dstChain: sonicRawSpokeProvider.chainConfig.chain.id,
      srcAddress: arbWalletAddress,
      dstAddress: sonicWalletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: arbRawSpokeProvider,
    raw: true,
  });

  if (createArbToSonicIntentResult.ok) {
    const [rawTx, intent] = createArbToSonicIntentResult.value;
    const gasEstimate = await SpokeService.estimateGas(rawTx, arbRawSpokeProvider);

    console.log('createArbToSonicIntentResult', JSON.stringify(rawTx, null, 2));
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create intent', createArbToSonicIntentResult.error);
  }
}

async function createSolToArbIntent() {
  const result = await sodax.swaps.createIntent({
    intentParams: {
      inputToken: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].nativeToken, // SOL token
      outputToken: spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken, // ETH token
      inputAmount: BigInt(1e3), // 0.000001 SOL
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: solanaRawSpokeProvider.chainConfig.chain.id,
      dstChain: sonicRawSpokeProvider.chainConfig.chain.id,
      srcAddress: solanaWalletAddress,
      dstAddress: sonicWalletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: solanaRawSpokeProvider,
    raw: true,
  });

  if (result.ok) {
    const [rawTx, intent] = result.value;
    const gasEstimate = await SpokeService.estimateGas(rawTx, solanaRawSpokeProvider);

    console.log('createArbToSonicIntentResult', JSON.stringify(rawTx, null, 2));
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create intent', result.error);
  }
}

async function createSuiToArbIntent() {
  const result = await sodax.swaps.createIntent({
    intentParams: {
      inputToken: spokeChainConfig[SUI_MAINNET_CHAIN_ID].nativeToken, // SUI token
      outputToken: spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken, // ETH token
      inputAmount: BigInt(1e3), // 0.000001 SUI
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: suiRawSpokeProvider.chainConfig.chain.id,
      dstChain: arbRawSpokeProvider.chainConfig.chain.id,
      srcAddress: suiWalletAddress,
      dstAddress: arbWalletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: suiRawSpokeProvider,
    raw: true,
  });

  if (result.ok) {
    const [rawTx, intent] = result.value;
    const gasEstimate = await SpokeService.estimateGas(rawTx, suiRawSpokeProvider);

    console.log('result', JSON.stringify(rawTx, null, 2));
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create intent', result.error);
  }
}

async function main() {
  // await createArbToSonicIntent();
  // await createSolToArbIntent();
  await createSuiToArbIntent();
}

main();
