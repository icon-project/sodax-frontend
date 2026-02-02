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
} from '@sodax/types';
import { IconTransparentIcon } from '../icons/chains/icon-transparent';
import { AvalancheTransparentIcon } from '../icons/chains/avalanche-transparent';
import { BaseTransparentIcon } from '../icons/chains/base-transparent';
import { BnbTransparentIcon } from '../icons/chains/bnb-transparent';
import { PolygonTransparentIcon } from '../icons/chains/polygon-transparent';
import { SolTransparentIcon } from '../icons/chains/sol-transparent';
import { StellarTransparentIcon } from '../icons/chains/stellar-transparent';
import { SuiTransparentIcon } from '../icons/chains/sui-transparent';
import { InjectiveTransparentIcon } from '../icons/chains/injective-transparent';
import { SonicTransparentIcon } from '../icons/chains/sonic-transparent';
import { OptimismTransparentIcon } from '../icons/chains/optimism-transparent';
import { ArbitrumTransparentIcon } from '../icons/chains/arbitrum-transparent';
import { HyperTransparentIcon } from '../icons/chains/hyper-transparent';
import { EthereumTransparentIcon } from '../icons/chains/ethereum-transparent';

interface NetworkTransparentIconProps {
  id: string;
  className?: string;
}

export default function NetworkTransparentIcon({ id, className }: NetworkTransparentIconProps): React.JSX.Element {
  return (
    <>
      {id === ICON_MAINNET_CHAIN_ID && <IconTransparentIcon />}
      {id === AVALANCHE_MAINNET_CHAIN_ID && <AvalancheTransparentIcon />}
      {id === BASE_MAINNET_CHAIN_ID && <BaseTransparentIcon />}
      {id === BSC_MAINNET_CHAIN_ID && <BnbTransparentIcon />}
      {id === POLYGON_MAINNET_CHAIN_ID && <PolygonTransparentIcon />}
      {id === SOLANA_MAINNET_CHAIN_ID && <SolTransparentIcon />}
      {id === STELLAR_MAINNET_CHAIN_ID && <StellarTransparentIcon />}
      {id === SUI_MAINNET_CHAIN_ID && <SuiTransparentIcon />}
      {id === INJECTIVE_MAINNET_CHAIN_ID && <InjectiveTransparentIcon />}
      {id === SONIC_MAINNET_CHAIN_ID && <SonicTransparentIcon />}
      {id === OPTIMISM_MAINNET_CHAIN_ID && <OptimismTransparentIcon />}
      {id === ARBITRUM_MAINNET_CHAIN_ID && <ArbitrumTransparentIcon />}
      {id === HYPEREVM_MAINNET_CHAIN_ID && <HyperTransparentIcon />}
      {id === ETHEREUM_MAINNET_CHAIN_ID && <EthereumTransparentIcon />}
    </>
  );
}
