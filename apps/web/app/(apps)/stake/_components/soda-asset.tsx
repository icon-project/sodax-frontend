// apps/web/app/(apps)/stake/_components/soda-asset.tsx
import CurrencyLogo from '@/components/shared/currency-logo';
import type { ChainId, XToken } from '@sodax/types';
import { useRef } from 'react';
import { useClickAway } from 'react-use';
import { NetworkPicker } from './network-picker';
import { useStakeActions, useStakeState } from '../_stores/stake-store-provider';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';

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
  const { isNetworkPickerOpened } = useStakeState();
  const { setIsNetworkPickerOpened } = useStakeActions();
  const assetRef = useRef<HTMLDivElement>(null);
  const chainId = (selectedToken?.xChainId || token?.xChainId) as ChainId;
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(chainId);
  // Ref is logo only; clicks on "Stake SODA" text are "away" and close picker (mousedown). See selector panel onMouseDown/ignoreNextToggle.
  useClickAway(assetRef, event => {
    const target = event.target as HTMLElement;
    if (target.closest('.network-picker-container') === null) setIsNetworkPickerOpened(false);
  });

  return (
    <div onClick={() => setIsNetworkPickerOpened(!isNetworkPickerOpened)} className="relative" ref={assetRef}>
      <div className="flex items-center justify-center gap-2 cursor-pointer">
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
                if (isWrongChain) {
                  handleSwitchChain();
                }
              }}
              reference={assetRef.current} // Floating UI anchor; picker is portaled to body
            />
          )}
        </div>
      </div>
    </div>
  );
}
