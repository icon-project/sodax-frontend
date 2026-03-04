import { Sodax, SonicSpokeProvider, spokeChainConfig } from '@sodax/sdk';
import { type Hex, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { EvmWalletProvider } from '@sodax/wallet-sdk-core';
import 'dotenv/config';

// load PK from .env
const privateKey = process.env.EVM_PRIVATE_KEY;
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const spokeEvmWallet = new EvmWalletProvider({
  privateKey: privateKey as Hex,
  chainId: SONIC_MAINNET_CHAIN_ID,
  rpcUrl: 'https://rpc.soniclabs.com',
});

const spokeProvider = new SonicSpokeProvider(spokeEvmWallet, spokeChainConfig[HUB_CHAIN_ID]);

const sodax = new Sodax();

async function unstake(amount: bigint) {
  const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
  const result = await sodax.staking.unstake({ amount, account: walletAddress, action: 'unstake' }, spokeProvider);

  if (result.ok) {
    console.log('[unstake] txHash', result.value);
  } else {
    console.log('[unstake] error', result.error);
  }
}

await unstake(BigInt(1e18));
