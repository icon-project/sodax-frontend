import CurrencyLogo from '@/components/shared/currency-logo';
import type { XToken } from '@sodax/types';
import { useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import { NetworkPicker } from '../../save/_components/token-asset/network-picker';

export function SodaAsset({
  selectedToken,
  tokens,
  setSelectNetworkToken,
  isXSoda = false,
}: {
  selectedToken: XToken | null;
  tokens: XToken[];
  setSelectNetworkToken: (network: XToken) => void;
  isXSoda?: boolean;
}): React.JSX.Element {
  const token = tokens[0] || ({} as XToken);
  const [isNetworkPickerOpened, setIsNetworkPickerOpened] = useState(false);
  const assetRef = useRef<HTMLDivElement>(null);
  useClickAway(assetRef, event => {
    const target = event.target as HTMLElement;
    const isInNetworkPicker = target.closest('.network-picker-container') !== null;
    if (!isInNetworkPicker) {
      setIsNetworkPickerOpened(false);
    }
  });

  return (
    <div onClick={() => setIsNetworkPickerOpened(!isNetworkPickerOpened)} className="relative" ref={assetRef}>
      <div className="flex items-center justify-center gap-2">
        <div className="relative">
          {selectedToken ? (
            <CurrencyLogo
              currency={selectedToken}
              isGroup={false}
              tokenCount={tokens.length}
              logoSrc={isXSoda ? '/coin/xsoda.png' : undefined}
            />
          ) : (
            <CurrencyLogo
              currency={token}
              isGroup={true}
              tokenCount={tokens.length}
              logoSrc={isXSoda ? '/coin/xsoda.png' : undefined}
            />
          )}
          {isNetworkPickerOpened && (
            <NetworkPicker
              isClicked={isNetworkPickerOpened}
              tokens={tokens}
              tokenSymbol={token.symbol}
              onSelect={token => {
                setIsNetworkPickerOpened(false);
                setSelectNetworkToken(token);
              }}
              reference={assetRef.current}
            />
          )}
        </div>
      </div>
    </div>
  );
}
