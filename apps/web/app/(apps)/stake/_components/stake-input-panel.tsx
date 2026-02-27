// apps/web/app/(apps)/stake/_components/stake-input-panel.tsx
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { cn, formatTokenAmount, validateChainAddress } from '@/lib/utils';
import { CustomSlider } from '@/components/ui/customer-slider';
import StakeDialog from './stake-dialog/stake-dialog';
import UnstakeDialog from './unstake-dialog/unstake-dialog';
import { getChainName } from '@/constants/chains';
import { STAKE_MODE } from '../_stores/stake-store';
import { useStakeState } from '../_stores/stake-store-provider';
import { useStakeActions } from '../_stores/stake-store-provider';
import { useXAccount, useXBalances, getXChainType, useWalletProvider } from '@sodax/wallet-sdk-react';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { AnimatePresence, motion } from 'framer-motion';
import { STELLAR_MAINNET_CHAIN_ID } from '@sodax/types';
import { useValidateStellarAccount } from '@/hooks/useValidateStellarAccount';
import { useActivateStellarAccount } from '@/hooks/useActivateStellarAccount';
import { useValidateStellarTrustline } from '@/hooks/useValidateStellarTrustline';
import { useRequestTrustline, useSpokeProvider } from '@sodax/dapp-kit';
import { Loader2 } from 'lucide-react';
import type { SpokeProvider } from '@sodax/sdk';
import { parseUnits } from 'viem';
import { ErrorDialog } from '@/components/shared/error-dialog';

export function StakeInputPanel(): React.JSX.Element {
  const router = useRouter();

  const { selectedToken, stakeValue, stakeTypedValue, stakeMode, userXSodaBalance, isLoadingStakingInfo } =
    useStakeState();
  const { setStakeTypedValue } = useStakeActions();

  const openModal = useModalStore(state => state.openModal);

  const currentNetwork = selectedToken ? selectedToken.xChainId : undefined;
  const { address } = useXAccount(currentNetwork);
  const walletConnected = !!address;
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState<boolean>(false);
  const [isUnstakeDialogOpen, setIsUnstakeDialogOpen] = useState<boolean>(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { data: balances } = useXBalances({
    xChainId: currentNetwork || 'sonic',
    xTokens: selectedToken ? [selectedToken] : [],
    address,
  });
  const balance = selectedToken ? balances?.[selectedToken.address] || 0n : 0n;
  const formattedBalance = selectedToken ? formatTokenAmount(balance, selectedToken.decimals) : '0';
  const formattedUserXSodaBalance = userXSodaBalance ? formatTokenAmount(userXSodaBalance, 18) : '0';

  // Stellar wallet activation and trustline checks
  const isStellarChain = selectedToken?.xChainId === STELLAR_MAINNET_CHAIN_ID;
  const { data: stellarAccountValidation } = useValidateStellarAccount(isStellarChain ? address : undefined);
  const {
    activateStellarAccount,
    isLoading: isActivatingStellarAccount,
    isActivated: isActivatedStellarAccount,
  } = useActivateStellarAccount();
  const handleActivateStellarAccount = async (): Promise<void> => {
    if (!address) {
      return;
    }
    try {
      await activateStellarAccount({ address });
    } catch (error) {
      const errorMsg = 'Failed to activate Stellar account. Please try again.';
      setErrorMessage(errorMsg);
      setIsErrorDialogOpen(true);
    }
  };

  const { data: stellarTrustlineValidation } = useValidateStellarTrustline(
    isStellarChain ? address : undefined,
    isStellarChain ? selectedToken : undefined,
  );

  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);
  const {
    requestTrustline,
    isLoading: isRequestingTrustline,
    isRequested: hasTrustline,
    error: trustlineError,
  } = useRequestTrustline(selectedToken?.address);
  const handleRequestTrustline = async (): Promise<void> => {
    if (!selectedToken || !spokeProvider) {
      return;
    }
    try {
      await requestTrustline({
        token: selectedToken.address,
        amount: parseUnits('1', selectedToken.decimals),
        spokeProvider: spokeProvider as SpokeProvider,
      });
    } catch (error) {
      const errorMsg = 'Failed to add Stellar trustline. Please try again.';
      setErrorMessage(errorMsg);
      setIsErrorDialogOpen(true);
    }
  };

  // Monitor trustline error from hook
  useEffect(() => {
    if (trustlineError) {
      const errorMsg = 'Failed to add Stellar trustline. Please try again.';
      setErrorMessage(errorMsg);
      setIsErrorDialogOpen(true);
    }
  }, [trustlineError]);

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

  useEffect(() => {
    if (sliderMaxValue === 0 && !isLoadingStakingInfo && (!stakeTypedValue || stakeTypedValue === '0')) {
      setStakeTypedValue('0');
    }
  }, [sliderMaxValue, setStakeTypedValue, isLoadingStakingInfo, stakeTypedValue]);

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
                  ) : isStellarChain &&
                    !isActivatedStellarAccount &&
                    stellarAccountValidation?.ok === false &&
                    validateChainAddress(address, 'STELLAR') ? (
                    <Button
                      variant="cherry"
                      className="px-6"
                      onClick={handleActivateStellarAccount}
                      disabled={isActivatingStellarAccount}
                    >
                      {isActivatingStellarAccount ? 'Activating Stellar Account' : 'Activate Stellar Account'}
                      {isActivatingStellarAccount && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    </Button>
                  ) : isStellarChain &&
                    stellarTrustlineValidation?.ok === false &&
                    !hasTrustline &&
                    validateChainAddress(address || '', 'STELLAR') ? (
                    <Button
                      variant="cherry"
                      className="px-6"
                      onClick={handleRequestTrustline}
                      disabled={isRequestingTrustline}
                    >
                      {isRequestingTrustline ? 'Adding Stellar Trustline' : 'Add Stellar Trustline'}
                      {isRequestingTrustline && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
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
                ) : isStellarChain &&
                  !isActivatedStellarAccount &&
                  stellarAccountValidation?.ok === false &&
                  validateChainAddress(address, 'STELLAR') ? (
                  <Button
                    variant="cherry"
                    className="px-6"
                    onClick={handleActivateStellarAccount}
                    disabled={isActivatingStellarAccount}
                  >
                    {isActivatingStellarAccount ? 'Activating Stellar Account' : 'Activate Stellar Account'}
                    {isActivatingStellarAccount && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  </Button>
                ) : isStellarChain &&
                  stellarTrustlineValidation?.ok === false &&
                  !hasTrustline &&
                  validateChainAddress(address || '', 'STELLAR') ? (
                  <Button
                    variant="cherry"
                    className="px-6"
                    onClick={handleRequestTrustline}
                    disabled={isRequestingTrustline || stakeValue === 0n}
                  >
                    {isRequestingTrustline ? 'Adding Stellar Trustline' : 'Add Stellar Trustline'}
                    {isRequestingTrustline && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
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
      <ErrorDialog
        open={isErrorDialogOpen}
        onOpenChange={setIsErrorDialogOpen}
        errorMessage={errorMessage}
        title="Transaction failed"
      />
    </>
  );
}
