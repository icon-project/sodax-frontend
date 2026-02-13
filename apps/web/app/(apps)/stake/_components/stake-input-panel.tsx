import type React from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { cn, formatTokenAmount } from '@/lib/utils';
import { CustomSlider } from '@/components/ui/customer-slider';
import StakeDialog from './stake-dialog/stake-dialog';
import UnstakeDialog from './unstake-dialog/unstake-dialog';
import { getChainName } from '@/constants/chains';
import { STAKE_MODE } from '../_stores/stake-store';
import { useStakeState } from '../_stores/stake-store-provider';
import { useStakeActions } from '../_stores/stake-store-provider';
import { useXAccount, useXBalances, getXChainType } from '@sodax/wallet-sdk-react';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { AnimatePresence, motion } from 'framer-motion';

export function StakeInputPanel(): React.JSX.Element {
  const router = useRouter();

  const { selectedToken, stakeValue, stakeTypedValue, stakeMode, userXSodaBalance } = useStakeState();
  const { setStakeTypedValue } = useStakeActions();

  const openModal = useModalStore(state => state.openModal);

  const currentNetwork = selectedToken ? selectedToken.xChainId : undefined;
  const { address } = useXAccount(currentNetwork);
  const walletConnected = !!address;
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState<boolean>(false);
  const [isUnstakeDialogOpen, setIsUnstakeDialogOpen] = useState<boolean>(false);

  const { data: balances } = useXBalances({
    xChainId: currentNetwork || 'sonic',
    xTokens: selectedToken ? [selectedToken] : [],
    address,
  });
  const balance = selectedToken ? balances?.[selectedToken.address] || 0n : 0n;
  const formattedBalance = selectedToken ? formatTokenAmount(balance, selectedToken.decimals) : '0';
  const formattedUserXSodaBalance = userXSodaBalance ? formatTokenAmount(userXSodaBalance, 18) : '0';

  const handleConnect = (): void => {
    const chainId = selectedToken?.xChainId || 'sonic';
    const chainType = getXChainType(chainId);
    openModal(MODAL_ID.WALLET_MODAL, {
      isExpanded: false,
      primaryChainType: chainType || 'EVM',
    });
  };

  const handleBuySoda = (): void => {
    router.push('/swap');
  };

  const handleStake = (): void => {
    setIsStakeDialogOpen(true);
  };

  const handleUnstake = (): void => {
    setIsUnstakeDialogOpen(true);
  };

  const sliderMaxValue = useMemo(() => {
    return stakeMode === STAKE_MODE.STAKING ? Number(formattedBalance) : Number(formattedUserXSodaBalance);
  }, [stakeMode, formattedBalance, formattedUserXSodaBalance]);

  const isSliderDisabled = useMemo(() => {
    return !selectedToken || !walletConnected || sliderMaxValue === 0;
  }, [selectedToken, walletConnected, sliderMaxValue]);
  return (
    <>
      <div className="w-full px-(--layout-space-big) pt-26 pb-8 flex flex-col justify-start items-start gap-8 sm:gap-4 isolate">
        <div className="w-full flex flex-col sm:flex-row sm:gap-2 justify-between items-center">
          <CustomSlider
            defaultValue={[0]}
            max={sliderMaxValue === 0 ? 1 : sliderMaxValue}
            step={0.01}
            value={[Number(stakeTypedValue)]}
            onValueChange={value => setStakeTypedValue(value[0] ? value[0].toString() : '')}
            className="h-10 data-[orientation=horizontal]:h-1 data-[disabled]:!opacity-100"
            trackClassName="bg-cream-white data-[orientation=horizontal]:h-1"
            rangeClassName={cn('[background-size:20px_20px]', 'bg-cherry-bright')}
            thumbClassName={cn(
              'cursor-pointer bg-white !border-white border-gray-400 w-6 h-6 [filter:drop-shadow(0_2px_24px_#EDE6E6)] group-data-[disabled]:pointer-events-none group-data-[disabled]:hover:ring-0 group-data-[disabled]:!outline-none group-data-[disabled]:bg-cream-white group-data-[disabled]:!border-cream-white',
            )}
            disabled={isSliderDisabled}
          />

          <div className="w-full flex gap-2 flex-1 mt-4 sm:mt-0">
            <InputGroup
              className={cn(
                'border-cream-white border-4 w-30 h-10 rounded-full outline-none shadow-none',
                isSliderDisabled && 'pointer-events-none',
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={stakeMode === STAKE_MODE.STAKING ? 'SODA' : 'xSODA'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="flex"
                >
                  <InputGroupInput
                    type="number"
                    placeholder="0"
                    value={stakeTypedValue}
                    onChange={e => setStakeTypedValue(e.target.value)}
                    disabled={isSliderDisabled}
                    className={cn(
                      "pl-6 pr-4 text-espresso text-(length:--body-comfortable) placeholder:text-clay-light font-['InterRegular']",
                    )}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText
                      className={cn(
                        'text-cherry-grey text-(length:--body-comfortable) font-normal font-["InterRegular"]',
                        stakeTypedValue && 'hidden',
                      )}
                    >
                      {stakeMode === STAKE_MODE.STAKING ? 'SODA' : 'xSODA'}
                    </InputGroupText>
                  </InputGroupAddon>
                </motion.div>
              </AnimatePresence>
            </InputGroup>

            <AnimatePresence mode="wait">
              <motion.div
                key={stakeMode === STAKE_MODE.STAKING ? 'SODA' : 'xSODA'}
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="flex"
              >
                {stakeMode === STAKE_MODE.STAKING ? (
                  !walletConnected && selectedToken ? (
                    <Button variant="cherry" className="px-6" onClick={() => handleConnect()}>
                      Connect {getChainName(selectedToken.xChainId)}
                    </Button>
                  ) : balance > 0n ? (
                    <Button
                      variant="cherry"
                      className="px-6 w-25"
                      onClick={handleStake}
                      disabled={!selectedToken || !walletConnected || stakeValue === 0n || stakeValue > balance}
                    >
                      Stake
                    </Button>
                  ) : (
                    <Button variant="cherry" className="px-6" onClick={handleBuySoda}>
                      Buy SODA
                    </Button>
                  )
                ) : !walletConnected && selectedToken ? (
                  <Button variant="cherry" className="px-6" onClick={() => handleConnect()}>
                    Connect {getChainName(selectedToken.xChainId)}
                  </Button>
                ) : (
                  <Button
                    variant="cherry"
                    className="px-6 w-25"
                    onClick={handleUnstake}
                    disabled={!selectedToken || !walletConnected || stakeValue === 0n || stakeValue > userXSodaBalance}
                  >
                    Unstake
                  </Button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <StakeDialog open={isStakeDialogOpen} onOpenChange={setIsStakeDialogOpen} selectedToken={selectedToken} />
      <UnstakeDialog open={isUnstakeDialogOpen} onOpenChange={setIsUnstakeDialogOpen} selectedToken={selectedToken} />
    </>
  );
}
