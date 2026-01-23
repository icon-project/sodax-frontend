import {
  NetworkEthereum,
  NetworkOptimism,
  NetworkBinanceSmartChain,
  NetworkAvalanche,
  NetworkArbitrumOne,
  NetworkSolana,
  NetworkSonic,
  NetworkBase,
  NetworkPolygon,
  NetworkStellar,
  NetworkSui,
  NetworkHyperEvm,
  NetworkLightlink,
  NetworkInjective,
  TokenICX,
} from '@web3icons/react';

import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
} from '@sodax/types';

interface NetworkTransparentIconProps {
  id: string;
  className?: string;
}

export default function NetworkTransparentIcon({ id, className }: NetworkTransparentIconProps): React.JSX.Element {
  return (
    <>
      {id === ICON_MAINNET_CHAIN_ID && <TokenICX />}
      {id === AVALANCHE_MAINNET_CHAIN_ID && <NetworkAvalanche width={20} height={20} />}
      {id === BASE_MAINNET_CHAIN_ID && <NetworkBase width={20} height={20} />}
      {id === BSC_MAINNET_CHAIN_ID && <NetworkBinanceSmartChain />}
      {id === POLYGON_MAINNET_CHAIN_ID && <NetworkPolygon />}
      {id === SOLANA_MAINNET_CHAIN_ID && <NetworkSolana width={20} height={20} />}
      {id === STELLAR_MAINNET_CHAIN_ID && <NetworkStellar />}
      {id === SUI_MAINNET_CHAIN_ID && <NetworkSui />}
      {id === INJECTIVE_MAINNET_CHAIN_ID && <NetworkInjective />}
      {id === SONIC_MAINNET_CHAIN_ID && <NetworkSonic width={20} height={20} />}
      {id === OPTIMISM_MAINNET_CHAIN_ID && <NetworkOptimism />}
      {id === ARBITRUM_MAINNET_CHAIN_ID && <NetworkArbitrumOne />}
      {id === LIGHTLINK_MAINNET_CHAIN_ID && <NetworkLightlink />}
      {id === HYPEREVM_MAINNET_CHAIN_ID && <NetworkHyperEvm />}
      {id === ETHEREUM_MAINNET_CHAIN_ID && <NetworkEthereum />}
    </>
  );
}
