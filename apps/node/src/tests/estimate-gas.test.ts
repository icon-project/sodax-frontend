import 'dotenv/config';
import {
  type Hex,
  ICON_MAINNET_CHAIN_ID,
  IconSpokeProvider,
  Sodax,
  SONIC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  SpokeService,
} from '@sodax/sdk';
import { EvmWalletProvider, IconWalletProvider } from '@sodax/wallet-sdk-core';

const sodax = new Sodax();

const iconSpokeProvider = new IconSpokeProvider(
  new IconWalletProvider({
    privateKey: process.env.ICON_PRIVATE_KEY as Hex,
    rpcUrl: 'https://ctz.solidwallet.io/api/v3',
  }),
  spokeChainConfig[ICON_MAINNET_CHAIN_ID],
);

const evmWallet = new EvmWalletProvider({
  privateKey: process.env.EVM_PRIVATE_KEY as Hex,
  chainId: SONIC_MAINNET_CHAIN_ID,
});

async function main() {
  const rawTx = await sodax.migration.createMigrateIcxToSodaIntent(
    {
      address: spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken,
      amount: BigInt(1e18),
      to: await evmWallet.getWalletAddress(),
    },
    iconSpokeProvider,
    true,
  );

  console.log('rawTx', rawTx);

  if (!rawTx.ok) {
    console.error('Failed to create migration intent', rawTx.error);
    return;
  }

  const gasEstimate = await SpokeService.estimateGas(rawTx.value, iconSpokeProvider);
  console.log('gasEstimate', gasEstimate);
}

main();
