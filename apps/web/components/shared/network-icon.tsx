import { AvalancheIcon } from '@/components/icons/chains/avalanche';
import { BaseIcon } from '@/components/icons/chains/base';
import { BnbIcon } from '@/components/icons/chains/bnb';
import { PolygonIcon } from '@/components/icons/chains/polygon';
import { SolIcon } from '@/components/icons/chains/sol';
import { StellarIcon } from '@/components/icons/chains/stellar';
import { SuiIcon } from '@/components/icons/chains/sui';
import { InjectiveIcon } from '@/components/icons/chains/injective';
import { SonicIcon } from '@/components/icons/chains/sonic';
import { OptimismIcon } from '@/components/icons/chains/optimism';
import { ArbitrumIcon } from '@/components/icons/chains/arbitrum';
import { LightLinkIcon } from '@/components/icons/chains/lightlink';
import { IcxIcon } from '@/components/icons/chains/icon';
import { HyperIcon } from '@/components/icons/chains/hyper';
import { EthereumIcon } from '@/components/icons/chains/ethereum';
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

interface NetworkIconProps {
  id: string;
  className?: string;
}

export default function NetworkIcon({ id, className }: NetworkIconProps): React.JSX.Element {
  return (
    <div className={`ring-2 ring-white shadow-[-2px_0px_2px_0px_rgba(175,145,145,1)] rounded w-4 h-4 ${className}`}>
      {id === ICON_MAINNET_CHAIN_ID && <IcxIcon />}
      {id === AVALANCHE_MAINNET_CHAIN_ID && <AvalancheIcon />}
      {id === BASE_MAINNET_CHAIN_ID && <BaseIcon />}
      {id === BSC_MAINNET_CHAIN_ID && <BnbIcon />}
      {id === POLYGON_MAINNET_CHAIN_ID && <PolygonIcon />}
      {id === SOLANA_MAINNET_CHAIN_ID && <SolIcon />}
      {id === STELLAR_MAINNET_CHAIN_ID && <StellarIcon />}
      {id === SUI_MAINNET_CHAIN_ID && <SuiIcon />}
      {id === INJECTIVE_MAINNET_CHAIN_ID && <InjectiveIcon />}
      {id === SONIC_MAINNET_CHAIN_ID && <SonicIcon />}
      {id === OPTIMISM_MAINNET_CHAIN_ID && <OptimismIcon />}
      {id === ARBITRUM_MAINNET_CHAIN_ID && <ArbitrumIcon />}
      {id === LIGHTLINK_MAINNET_CHAIN_ID && <LightLinkIcon />}
      {id === HYPEREVM_MAINNET_CHAIN_ID && <HyperIcon />}
      {id === ETHEREUM_MAINNET_CHAIN_ID && <EthereumIcon />}
    </div>
  );
}
