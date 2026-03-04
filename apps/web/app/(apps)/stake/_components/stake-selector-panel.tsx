import type React from 'react';
import { useRef, useMemo, useEffect } from 'react';
import { useClickAway } from 'react-use';
import { cn, formatTokenAmount } from '@/lib/utils';
import { STAKE_MODE } from '../_stores/stake-store';
import type { XToken } from '@sodax/types';
import {
  supportedSpokeChains,
  spokeChainConfig,
  INJECTIVE_MAINNET_CHAIN_ID,
  REDBELLY_MAINNET_CHAIN_ID,
} from '@sodax/sdk';
import type { SpokeChainId } from '@sodax/types';
import { useStakeActions, useStakeState } from '../_stores/stake-store-provider';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';
import { stakeModeVariants } from '@/constants/animation';
import { AnimatePresence, motion } from 'framer-motion';
import { SodaAsset } from './soda-asset';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { useAllChainXSodaBalances } from '@/hooks/useAllChainXSodaBalances';

export function StakeSelectorPanel(): React.JSX.Element {
  const assetRef = useRef<HTMLDivElement>(null);
  // Skip next onClick toggle when picker was closed by click-away on same gesture (mousedown vs click).
  const ignoreNextToggleRef = useRef(false);
  const { setSelectedToken, setIsNetworkPickerOpened, setStakeValueByPercent } = useStakeActions();
  const { isNetworkPickerOpened, stakeMode, selectedToken, userXSodaBalance } = useStakeState();
  const { address } = useXAccount(selectedToken?.xChainId);
  const walletConnected = !!address;
  const { data: balances } = useXBalances({
    xChainId: selectedToken?.xChainId || 'sonic',
    xTokens: selectedToken ? [selectedToken] : [],
    address,
  });
  const balance =
    stakeMode === STAKE_MODE.STAKING
      ? selectedToken
        ? balances?.[selectedToken.address] || 0n
        : 0n
      : userXSodaBalance;

  const formattedBalance =
    stakeMode === STAKE_MODE.STAKING
      ? selectedToken
        ? formatTokenAmount(balance, selectedToken.decimals)
        : '0'
      : formatTokenAmount(balance, 18);
  // Get all SODA tokens from all supported chains
  const sodaTokens = useMemo((): XToken[] => {
    const tokens: XToken[] = [];
    for (const chainId of supportedSpokeChains) {
      const chainConfig = spokeChainConfig[chainId as SpokeChainId];
      if (chainConfig?.supportedTokens && 'SODA' in chainConfig.supportedTokens) {
        const sodaToken = chainConfig.supportedTokens.SODA as XToken;
        if (
          sodaToken &&
          sodaToken.xChainId !== INJECTIVE_MAINNET_CHAIN_ID &&
          sodaToken.xChainId !== REDBELLY_MAINNET_CHAIN_ID
        ) {
          tokens.push(sodaToken);
        }
      }
    }
    return tokens;
  }, []);

  const chainIds = useMemo(() => sodaTokens.map(token => token.xChainId), [sodaTokens]);
  const allChainXSodaBalances = useAllChainXSodaBalances(chainIds);

  // Pre-select network when user has an active xSODA position (balance > 0 on any chain)
  useEffect(() => {
    if (selectedToken !== null) return;

    let bestToken: XToken | null = null;
    let bestBalance = 0n;

    for (const token of sodaTokens) {
      const balance = allChainXSodaBalances.get(token.xChainId) ?? 0n;
      if (balance > bestBalance) {
        bestBalance = balance;
        bestToken = token;
      }
    }

    if (bestToken !== null && bestBalance > 0n) {
      setSelectedToken(bestToken);
    }
  }, [sodaTokens, allChainXSodaBalances, selectedToken, setSelectedToken]);

  useClickAway(assetRef, event => {
    const target = event.target as HTMLElement;
    if (target.closest('.network-picker-container') !== null) return;
    if (target.closest('[data-stake-trigger]') !== null) ignoreNextToggleRef.current = true;
    setIsNetworkPickerOpened(false);
  });

  return (
    <div className="absolute top-10 left-(--layout-space-big) z-10">
      {/* mode="wait" so exit finishes before Stake SODA ↔ Unstake xSODA enter. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stakeMode}
          initial={{ opacity: 0, x: 32 }}
          animate="enter"
          exit="exit"
          variants={stakeModeVariants}
          className="flex items-center"
        >
          {stakeMode === STAKE_MODE.STAKING && (
            <SodaAsset
              selectedToken={selectedToken}
              tokens={sodaTokens}
              setSelectNetworkToken={token => setSelectedToken(token)}
            />
          )}
          {stakeMode === STAKE_MODE.UNSTAKING && (
            <SodaAsset
              selectedToken={selectedToken}
              tokens={sodaTokens}
              setSelectNetworkToken={token => setSelectedToken(token)}
              isXSoda={true}
            />
          )}

          <div
            data-stake-trigger
            onMouseDown={() => {
              if (isNetworkPickerOpened) ignoreNextToggleRef.current = true;
            }}
            onClick={() => {
              if (ignoreNextToggleRef.current) {
                ignoreNextToggleRef.current = false;
                return;
              }
              setIsNetworkPickerOpened(!isNetworkPickerOpened);
            }}
            className={cn('flex justify-start items-center cursor-pointer h-12', isNetworkPickerOpened && 'blur-sm')}
          >
            <div className="flex flex-col gap-[2px] ml-(--layout-space-small)">
              <div className=" flex items-center text-(length:--body-super-comfortable) text-espresso">
                <span>{stakeMode === STAKE_MODE.STAKING ? 'Stake SODA' : 'Unstake xSODA'}</span>
                <ChevronDownIcon
                  className={cn(
                    'w-4 h-4 text-clay ml-1 transition-transform duration-200',
                    isNetworkPickerOpened && 'rotate-180',
                  )}
                />
              </div>
              <div className="flex items-center text-(length:--body-small) text-clay">
                {!selectedToken ? (
                  <span>Choose a network</span>
                ) : !walletConnected ? (
                  <span>Wallet not connected</span>
                ) : balance > 0n ? (
                  <div className="flex items-center gap-1">
                    <span>Balance: {formattedBalance}</span>
                    {stakeMode === STAKE_MODE.UNSTAKING &&
                      [5, 10].map(percent => (
                        <Button
                          key={percent}
                          variant="default"
                          className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] text-[9px] font-bold uppercase text-clay -mt-[2px] hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso"
                          onClick={e => {
                            e.stopPropagation(); // Don't toggle network picker.
                            setStakeValueByPercent(percent, balance);
                          }}
                        >
                          {percent}%
                        </Button>
                      ))}
                    <Button
                      variant="default"
                      className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] text-[9px] font-bold uppercase text-clay -mt-[2px] hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso"
                      onClick={e => {
                        e.stopPropagation(); // Don't toggle network picker.
                        setStakeValueByPercent(100, balance);
                      }}
                    >
                      MAX
                    </Button>
                  </div>
                ) : (
                  <span>No {stakeMode === STAKE_MODE.STAKING ? 'SODA' : 'xSODA'} in wallet</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
