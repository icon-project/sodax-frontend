import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { XToken } from '@sodax/types';
import { useRef } from 'react';
import { useClickAway } from 'react-use';
import { useSaveState, useSaveActions } from '../../_stores/save-store-provider';
import { NetworkPicker } from './network-picker';

export function MultiAsset({
  tokens,
  setSelectNetworkToken,
}: { tokens: XToken[]; setSelectNetworkToken: (network: XToken) => void }): React.JSX.Element {
  const token = tokens[0] || ({} as XToken);
  const { isNetworkPickerOpened } = useSaveState();
  const { setIsNetworkPickerOpened } = useSaveActions();
  const assetRef = useRef<HTMLDivElement>(null);
  useClickAway(assetRef, () => setIsNetworkPickerOpened(false));
  return (
    <div onClick={() => setIsNetworkPickerOpened(true)} className="relative" ref={assetRef}>
      <CurrencyLogo currency={token} isGroup={true} tokenCount={tokens.length} />
      {!isNetworkPickerOpened && (
        <div className="font-['InterRegular'] flex items-center justify-center text-(length:--body-small) mt-2 transition-all h-[18px] text-clay">
          {token.symbol}
          <ChevronDownIcon className="w-2 h-2 text-clay ml-1" />
        </div>
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
  );
}
