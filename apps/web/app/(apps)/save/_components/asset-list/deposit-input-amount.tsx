import { useEffect, useMemo, useRef, useState } from 'react';
import type { XToken } from '@sodax/types';
import { useXAccount, getXChainType } from '@sodax/wallet-sdk-react';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { formatBalance } from '@/lib/utils';
import { formatUnits, parseUnits } from 'viem';
import { chainIdToChainName } from '@/providers/constants';
import { useSaveActions, useSaveState } from '../../_stores/save-store-provider';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ArrowLeft } from 'lucide-react';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import DepositDialog from '../deposit-dialog/deposit-dialog';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import AmountInputSlider from '../amount-input-slider';
import { useRouter } from 'next/navigation';
interface DepositInputAmountProps {
  selectedToken: XToken | null;
  tokens: XToken[];
  onBack?: () => void;
  apy: string;
}

export default function DepositInputAmount({ selectedToken, tokens, onBack, apy }: DepositInputAmountProps) {
  const router = useRouter();
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const { setDepositValue } = useSaveActions();
  const { depositValue } = useSaveState();
  const [progress, setProgress] = useState([0]);
  const previousTokenAddressRef = useRef<string | undefined>(selectedToken?.address);
  const openModal = useModalStore(state => state.openModal);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState<boolean>(false);
  const allChainBalances = useAllChainBalances();
  const balance = selectedToken
    ? (allChainBalances[selectedToken.address]?.find(entry => entry.chainId === selectedToken.xChainId)?.balance ?? 0n)
    : 0n;

  const { data: tokenPrice } = useTokenPrice(selectedToken as XToken);

  const maxValue = useMemo(() => {
    return Number(formatBalance(formatUnits(balance, selectedToken?.decimals ?? 0), tokenPrice ?? 0));
  }, [balance, selectedToken, tokenPrice]);

  const monthlyYield = useMemo(() => {
    if (depositValue === 0 || !tokenPrice) {
      return 0;
    }

    const depositValueUSD = depositValue * tokenPrice;
    return (depositValueUSD * Number(apy.replace('%', ''))) / 100 / 12;
  }, [depositValue, tokenPrice, apy]);

  const isSimulate = !(sourceAddress && balance > 0n);
  // Reset progress to 0 when token changes
  useEffect(() => {
    const currentTokenAddress = selectedToken?.address;
    if (previousTokenAddressRef.current !== currentTokenAddress) {
      setProgress([0]);
      setDepositValue(0);
      previousTokenAddressRef.current = currentTokenAddress;
    }
  }, [selectedToken, setDepositValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;

    // Allow empty input temporarily while typing
    if (inputValue === '') {
      setProgress([0]);
      setDepositValue(0);
      return;
    }

    // Parse the input value
    const numericValue = Number.parseFloat(inputValue);

    // Check if it's a valid number
    if (Number.isNaN(numericValue)) {
      return;
    }

    // Use the correct max value based on simulation mode
    const effectiveMaxValue = isSimulate ? 10000 / (tokenPrice ?? 1) : maxValue;

    // Clamp the value between 0 and max
    const clampedValue = Math.max(0, Math.min(numericValue, effectiveMaxValue));
    setProgress([clampedValue]);
    setDepositValue(clampedValue);
  };

  const handleConnect = () => {
    const chainType = getXChainType(selectedToken?.xChainId || 'sonic') || 'EVM';
    openModal(MODAL_ID.WALLET_MODAL, {
      isExpanded: false,
      primaryChainType: chainType,
    });
  };

  const getHelperText = () => {
    return (
      <>
        {depositValue > 0 ? (
          <>
            <div className="flex gap-2">
              <span className="text-clay-light">Yield/mo:</span>
              <span className="font-['InterRegular'] text-espresso font-medium">
                {monthlyYield > 0 ? `~$${formatBalance(monthlyYield.toString(), tokenPrice ?? 0)}` : '-'}
              </span>
              <AlertCircleIcon width={16} height={16} className="text-clay" />
            </div>
          </>
        ) : (
          'To show your funds'
        )}
      </>
    );
  };

  return (
    <>
      <div className="flex gap-2 items-center h-12">
        {!sourceAddress || balance === 0n ? (
          <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso">
            {depositValue > 0 ? (
              <div className="flex gap-1">
                <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso font-bold">
                  ${formatBalance((depositValue * (tokenPrice ?? 0)).toString(), tokenPrice ?? 0)}
                </div>
                <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">
                  worth of {selectedToken?.symbol}
                </div>
              </div>
            ) : (
              'Choose an amount to simulate yield.'
            )}
          </div>
        ) : (
          <>
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso font-bold">
              ${formatBalance((depositValue * (tokenPrice ?? 0)).toString(), tokenPrice ?? 0)}
            </div>
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">
              worth of {selectedToken?.symbol}
            </div>
          </>
        )}
      </div>
      <AmountInputSlider
        value={progress}
        onValueChange={value => {
          setProgress(value);
          setDepositValue(value[0] ?? 0);
        }}
        maxValue={isSimulate ? 10000 / (tokenPrice ?? 1) : maxValue}
        isSimulate={isSimulate}
        tokenSymbol={tokens[0]?.symbol || selectedToken?.symbol || ''}
        onInputChange={handleInputChange}
      />
      <div className="flex gap-2 items-center -mt-2 mb-7">
        <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay-light">
          {isSimulate ? (
            sourceAddress ? (
              `Add ${selectedToken?.symbol} to your ${chainIdToChainName(selectedToken?.xChainId || 'sonic')} wallet or swap via SODAX.`
            ) : (
              `Connect your ${chainIdToChainName(selectedToken?.xChainId || 'sonic')} wallet to continue.`
            )
          ) : (
            <div className="flex gap-2">
              <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay-light">
                Available:
              </div>
              <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay">
                {formatBalance(
                  (
                    Number(
                      formatUnits(
                        isSimulate
                          ? parseUnits((10000 / (tokenPrice ?? 1)).toString(), selectedToken?.decimals ?? 0)
                          : balance,
                        selectedToken?.decimals ?? 0,
                      ),
                    ) - depositValue
                  ).toString(),
                  tokenPrice ?? 0,
                )}{' '}
                {selectedToken?.symbol}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 items-center mb-8 transition-all duration-300">
        <div className="flex gap-(--layout-space-small)">
          {onBack && (
            <Button
              variant="cream"
              className="w-10 h-10"
              onMouseDown={() => {
                onBack();
                setDepositValue(0);
              }}
            >
              <ArrowLeft />
            </Button>
          )}

          {!sourceAddress && (
            <Button variant="cherry" className="w-39 mix-blend-multiply shadow-none" onMouseDown={handleConnect}>
              Connect {chainIdToChainName(selectedToken?.xChainId || 'sonic')}
            </Button>
          )}

          {sourceAddress && (
            <>
              {balance === 0n && (
                <Button
                  variant="cherry"
                  className="w-27 mix-blend-multiply shadow-none"
                  onMouseDown={() => router.push('/swap')}
                >
                  Get {selectedToken?.symbol}
                </Button>
              )}
              {balance > 0n && (
                <Button
                  variant="cherry"
                  className="w-27 mix-blend-multiply shadow-none"
                  disabled={!selectedToken || depositValue === 0 || !(sourceAddress && balance > 0n)}
                  onMouseDown={() => {
                    setIsDepositDialogOpen(true);
                  }}
                >
                  Continue
                </Button>
              )}
              <DepositDialog
                open={isDepositDialogOpen}
                onOpenChange={setIsDepositDialogOpen}
                selectedToken={selectedToken}
                tokens={tokens}
              />
            </>
          )}
        </div>

        <span className="text-clay text-(length:--body-small) font-['InterRegular']">{getHelperText()}</span>
      </div>
    </>
  );
}
