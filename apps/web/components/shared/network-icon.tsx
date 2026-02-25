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
import { KaiaIcon } from '@/components/icons/chains/kaia';
import { RedbellyIcon } from '@/components/icons/chains/redbelly';

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
  KAIA_MAINNET_CHAIN_ID,
  REDBELLY_MAINNET_CHAIN_ID,
} from '@sodax/types';
interface NetworkIconProps {
  id: string;
  className?: string;
  hasBalance?: boolean;
  /** When true, use drop-shadow + box-shadow (swap network picker only). */
  swapPickerShadow?: boolean;
}

function renderIcons(id: string): React.ReactNode {
  return (
    <>
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
      {id === KAIA_MAINNET_CHAIN_ID && <KaiaIcon />}
      {id === REDBELLY_MAINNET_CHAIN_ID && <RedbellyIcon />}
    </>
  );
}

export default function NetworkIcon({
  id,
  className,
  hasBalance = false,
  swapPickerShadow = false,
}: NetworkIconProps): React.JSX.Element {
  // Same as main: always show border (ring-2). When wallet connected and we know there is balance, use thicker ring.
  const ringClass = hasBalance ? 'ring-[6px] ring-white' : 'ring-2 ring-white';

  if (swapPickerShadow) {
    // Swap network picker: thick ring + shadow only when chain has balance; otherwise minimal ring (match Stake).
    const networkIconInPickerBoxShadow = 'shadow-[-2px_0_8px_0_rgba(175,145,145,0.40)]';
    const networkIconInPickerRing = hasBalance ? 'ring-[5px] ring-white' : 'ring-2 ring-white';
    return (
      <div
        className={`flex shrink-0 w-4 h-4 items-center justify-center rounded-[4px] bg-white ${networkIconInPickerRing} ${hasBalance ? networkIconInPickerBoxShadow : ''} ${className}`}
      >
        {renderIcons(id)}
      </div>
    );
  }

  // Neutral gray shadow (designer: previous rgba(175,145,145) was too dark and color off).
  const shadowClass = hasBalance
    ? 'shadow-[-4px_0_6px_0_rgba(0,0,0,0.08)]'
    : 'shadow-[-2px_0_4px_0_rgba(0,0,0,0.06)]';
  return (
    <div className={`flex items-center justify-center rounded ${ringClass} ${shadowClass} w-4 h-4 ${className}`}>
      {renderIcons(id)}
    </div>
  );
}
