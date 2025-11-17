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

interface NetworkIconProps {
  imageSrc: string;
  className?: string;
}

export default function NetworkIcon({ imageSrc, className }: NetworkIconProps): React.JSX.Element {
  return (
    <div className={`ring-2 ring-white shadow-[-2px_0px_2px_0px_rgba(175,145,145,1)] rounded w-4 h-4 ${className}`}>
      {imageSrc === 'ICON' && <IcxIcon />}
      {imageSrc === 'Avalanche' && <AvalancheIcon />}
      {imageSrc === 'Base' && <BaseIcon />}
      {imageSrc === 'BSC' && <BnbIcon />}
      {imageSrc === 'Polygon' && <PolygonIcon />}
      {imageSrc === 'Solana' && <SolIcon />}
      {imageSrc === 'Stellar' && <StellarIcon />}
      {imageSrc === 'Sui' && <SuiIcon />}
      {imageSrc === 'Injective' && <InjectiveIcon />}
      {imageSrc === 'Sonic' && <SonicIcon />}
      {imageSrc === 'Optimism' && <OptimismIcon />}
      {imageSrc === 'Arbitrum' && <ArbitrumIcon />}
      {imageSrc === 'LightLink' && <LightLinkIcon />}
      {imageSrc === 'Hyper' && <HyperIcon />}
      {imageSrc === 'Ethereum' && <EthereumIcon />}
    </div>
  );
}
