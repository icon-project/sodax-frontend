import { describe, expect, it } from 'vitest';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  type SpokeChainId,
  type Token,
  LIGHTLINK_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from '@sodax/types';
import { createPublicClient, http, type Address } from 'viem';
import { sonic } from 'viem/chains';
import { vaultTokenAbi } from '../shared/abis/vaultToken.abi.js';
import { Sodax } from '../index.js';

describe('e2e', () => {
  /**
   * E2e integration tests to be used locally to verify the sdk is working as expected.
   * These tests are not run in CI.
   */

  const sodax = new Sodax();

  const sonicPublicClient = createPublicClient({
    chain: sonic,
    transport: http(sonic.rpcUrls.default.http[0]),
  });

  // date: 10.07.2025
  const solverCompatibleAssets: Record<SpokeChainId, Address[]> = {
    [AVALANCHE_MAINNET_CHAIN_ID]: [
      '0xc9e4f0B6195F389D9d2b639f2878B7674eB9D8cD', // AVAX
      '0x41Fd5c169e014e2A657B9de3553f7a7b735Fe47A', // USDT
      '0x41abF4B1559FF709Ef8150079BcB26DB1Fffd117', // USDC
    ],
    [BASE_MAINNET_CHAIN_ID]: [
      '0x70178089842be7f8e4726b33f0d1569db8021faa', // ETH
      '0x55e0Ad45eB97493B3045eEE417fb6726CB85dfd4', // weETH
      '0x72E852545B024ddCbc5b70C1bCBDAA025164259C', // USDC
      '0x494aaEaEfDF5964d4Ed400174e8c5b98C00957aA', // wstETH
      '0x2803a23a3BA6b09e57D1c71deC0D9eFdBB00A27F', // cbBTC
    ],
    [OPTIMISM_MAINNET_CHAIN_ID]: [
      '0xad332860dd3b6f0e63f4f66e9457900917ac78cd', // ETH
      '0xb7C213CbD24967dE9838fa014668FDDB338f724B', // USDC
      '0x61e26f611090CdC6bc79A7Bf156b0fD10f1fC212', // wstETH
      '0xc168067d95109003805aC865ae556e8476DC69bc', // USDT
    ],
    [ARBITRUM_MAINNET_CHAIN_ID]: [
      '0xdcd9578b51ef55239b6e68629d822a8d97c95b86', // ETH
      '0xfB0ACB1b2720B620935F50a6dd3F7FEA52b2FCBe', // wBTC
      '0x08D5cf039De35627fD5C0f48B8AF4a1647a462E8', // weETH
      '0x2D5A7837D68b0c2CC4b14C2af2a1F0Ef420DDDc5', // wstETH
      '0x96Fc8540736f1598b7E235e6dE8814062b3b5d3B', // tBTC
      '0x3C0a80C6a1110fC80309382b3989eC626c135eE9', // USDT
      '0xdB7BdA65c3a1C51D64dC4444e418684677334109', // USDC
    ],
    [POLYGON_MAINNET_CHAIN_ID]: [
      '0x9ee17486571917837210824b0d4cadfe3b324d12', // POL
      '0xa36893ba308b332FDEbfa95916D1dF3a2e3CF8B3', // USDC
    ],
    [BSC_MAINNET_CHAIN_ID]: [
      '0x13b70564b1ec12876b20fab5d1bb630311312f4f', // BNB
      '0x57fC2aC5701e463ae261AdBd6C99FBeB48Ce5293', // ETHB
      '0xD8A24c71FEa5bB81c66C01e532dE7d9B11e13905', // BTCB
      '0x9D58508AD10d34048a11640735Ca5075bbA07b35', // USDC
    ],
    [ICON_MAINNET_CHAIN_ID]: [
      '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F', // wICX
      '0x654dddf32a9a2ac53f5fb54bf1e93f66791f8047', // bnUSD
    ],
    [INJECTIVE_MAINNET_CHAIN_ID]: [
      '0xd375590b4955f6ea5623f799153f9b787a3bd319', // INJ
      '0x4Bc1211fAA06Fb50Ff61a70331F56167AE511057', // USDC
    ],
    [STELLAR_MAINNET_CHAIN_ID]: [
      '0x8ac68af223907fb1b893086601a3d99e00f2fa9d', // XLM
      '0x348007B53F25A9A857aB8eA81ec9E3CCBCf440f2', // USDC
    ],
    [SOLANA_MAINNET_CHAIN_ID]: [
      '0x0c09e69a4528945de6d16c7e469dea6996fdf636', // SOL
      '0xC3f020057510ffE10Ceb882e1B48238b43d78a5e', // USDC
    ],
    [SUI_MAINNET_CHAIN_ID]: [
      '0x4676b2a551b25c04e235553c1c81019337384673', // SUI
      '0x5635369c8a29A081d26C2e9e28012FCa548BA0Cb', // USDC
      '0x039666bd0cbc96a66c40e8541af465beaa81aa7e', // afSUI
      '0xb202c674c9a79b5681e981ba0daa782b3ceeebbe', // mSUI
      '0x67a26d11fce15e8b33ac97230d36cae1c52c35e7', // haSUI
      '0x025715bcda08db06c795cd5bf944e2081468d99a', // vSUI
      '0xac509404f3a3ca3f7766baf65be45a52b1cfccd7', // yapSUI
      '0x514569c788b096595672e0f68ec72387a22ac67b', // trevinSUI
    ],
    [SONIC_MAINNET_CHAIN_ID]: [],
    [HYPEREVM_MAINNET_CHAIN_ID]: [],
    [LIGHTLINK_MAINNET_CHAIN_ID]: [],
    [ETHEREUM_MAINNET_CHAIN_ID]: [],
  };

  it('Verify money market supported tokens as hub assets are contained in the Soda token vaults', async () => {
    const vaultGetAllTokenInfoMap = new Map<string, Address[]>();

    for (const spokeChain of sodax.config.getSupportedSpokeChains()) {
      console.log('************************************************');
      const supportedTokens: readonly Token[] = Object.values(
        sodax.config.getSupportedMoneyMarketTokensByChainId(spokeChain),
      );

      for (const token of supportedTokens) {
        console.log('--------------------------------');
        console.log(`${spokeChain} ${token.symbol} ${token.address}`);
        const hubAsset = sodax.config.getHubAssetInfo(spokeChain, token.address);

        if (!hubAsset) {
          throw new Error(`Hub asset not found for token ${token.address} on chain ${spokeChain}`);
        }

        const vaultAddress = hubAsset.vault;

        if (!vaultGetAllTokenInfoMap.has(vaultAddress)) {
          const [assets] = await sonicPublicClient.readContract({
            address: vaultAddress,
            abi: vaultTokenAbi,
            functionName: 'getAllTokenInfo',
            args: [],
          });

          vaultGetAllTokenInfoMap.set(
            vaultAddress,
            assets.map(asset => asset.toLowerCase() as Address),
          );
        }

        const vaultAssets = vaultGetAllTokenInfoMap.get(vaultAddress);

        if (!vaultAssets) {
          throw new Error(`Vault assets not found for token ${vaultAddress} on chain ${spokeChain}`);
        }

        console.log(`vaultAddress: ${vaultAddress}, assets:`, vaultAssets);
        console.log(
          `${spokeChain} ${token.symbol} ${hubAsset.asset} ${vaultAssets.includes(hubAsset.asset.toLowerCase() as Address)}`,
        );

        if (
          !vaultAssets.includes(hubAsset.asset.toLowerCase() as Address) &&
          hubAsset.asset.toLowerCase() !== '0x0000000000000000000000000000000000000000'
        ) {
          throw new Error(`Hub asset ${hubAsset.asset} not found in vault ${vaultAddress} on chain ${spokeChain}`);
        }
        expect(
          vaultAssets.includes(hubAsset.asset.toLowerCase() as Address) ||
            hubAsset.asset.toLowerCase() === '0x0000000000000000000000000000000000000000',
        ).toBe(true);
      }
    }
  }, 100000);

  it('Verify money market supported tokens as hub assets are contained in the Soda token vaults', async () => {
    for (const [spokeChain, assets] of Object.entries(solverCompatibleAssets)) {
      console.log('************************************************');
      console.log(`${spokeChain} ${assets.length} assets`);
      console.log('--------------------------------');
      for (const asset of assets) {
        const originalToken = sodax.config.getOriginalAssetAddress(spokeChain as SpokeChainId, asset);
        console.log(`${spokeChain} ${asset} ${originalToken}`);
        expect(originalToken).toBeDefined();
      }
    }
  });
});
