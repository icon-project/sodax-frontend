import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { XToken } from '@sodax/types';
import { useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import { NetworkPicker } from '../../save/_components/token-asset/network-picker';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import { formatBalance } from '@/lib/utils';

export function SodaAsset({
  selectedToken,
  tokens,
  setSelectNetworkToken,
}: {
  selectedToken: XToken | null;
  tokens: XToken[];
  setSelectNetworkToken: (network: XToken) => void;
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

  const currentNetwork = selectedToken ? selectedToken.xChainId : token.xChainId;
  const { address } = useXAccount(currentNetwork);
  const walletConnected = !!address;

  const { data: balances } = useXBalances({
    xChainId: currentNetwork,
    xTokens: [selectedToken || token],
    address,
  });
  const balance = balances?.[selectedToken?.address || token.address] || 0n;
  const formattedBalance = formatUnits(balance, selectedToken?.decimals || token.decimals);
  return (
    <div onClick={() => setIsNetworkPickerOpened(!isNetworkPickerOpened)} className="relative" ref={assetRef}>
      <div className="flex items-center justify-center gap-2">
        <div className="relative">
          {selectedToken ? (
            <CurrencyLogo currency={selectedToken} isGroup={false} tokenCount={tokens.length} />
          ) : (
            <CurrencyLogo currency={token} isGroup={true} tokenCount={tokens.length} />
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

        <div className="flex flex-col gap-1">
          <div className="font-['InterRegular'] flex items-center justify-center text-(length:--body-small) transition-all h-[18px] text-clay">
            <span>Stake SODA</span>
            <ChevronDownIcon className="w-2 h-2 text-clay ml-1" />
          </div>
          <div className="font-['InterRegular'] flex items-center justify-center text-(length:--body-small) transition-all h-[18px] text-clay">
            {!selectedToken ? (
              <span>Choose a network</span>
            ) : !walletConnected ? (
              <span>Wallet not connected</span>
            ) : balance > 0n ? (
              <span>BALANCE: {formatBalance(formattedBalance, 0)} SODA</span>
            ) : (
              <span>No SODA</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
