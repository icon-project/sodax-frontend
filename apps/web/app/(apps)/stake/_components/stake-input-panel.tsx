import type React from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { XToken, SpokeChainId } from '@sodax/types';
import { spokeChainConfig, supportedSpokeChains } from '@sodax/sdk';
import { useStakeActions, useStakeState } from '../_stores/stake-store-provider';
import { SodaAsset } from './soda-asset';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useXAccount, useXBalances, getXChainType } from '@sodax/wallet-sdk-react';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { cn, formatBalance, formatTokenAmount } from '@/lib/utils';
import { CustomSlider } from '@/components/ui/customer-slider';
import StakeDialog from './stake-dialog/stake-dialog';
import UnstakeDialog from './unstake-dialog/unstake-dialog';
import { getChainName } from '@/constants/chains';
import { STAKE_MODE } from '../_stores/stake-store';

export function StakeInputPanel(): React.JSX.Element {
  const router = useRouter();

  const { selectedToken, stakeValue, stakeTypedValue, stakeMode, userXSodaBalance } = useStakeState();
  const { setSelectedToken, setStakeTypedValue, setStakeValueByPercent } = useStakeActions();

  const openModal = useModalStore(state => state.openModal);

  // Get all SODA tokens from all supported chains
  const sodaTokens = useMemo((): XToken[] => {
    const tokens: XToken[] = [];
    for (const chainId of supportedSpokeChains) {
      const chainConfig = spokeChainConfig[chainId as SpokeChainId];
      if (chainConfig?.supportedTokens && 'SODA' in chainConfig.supportedTokens) {
        const sodaToken = chainConfig.supportedTokens.SODA as XToken;
        if (sodaToken) {
          tokens.push(sodaToken);
        }
      }
    }
    return tokens; // Fallback to current token if none found
  }, []);

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

  const maxValue = useMemo(() => {
    return stakeMode === STAKE_MODE.STAKING ? balance : userXSodaBalance;
  }, [stakeMode, balance, userXSodaBalance]);

  const sliderMaxValue = useMemo(() => {
    return stakeMode === STAKE_MODE.STAKING ? Number(formattedBalance) : Number(formattedUserXSodaBalance);
  }, [stakeMode, formattedBalance, formattedUserXSodaBalance]);

  return (
    <>
      <div className="w-full px-(--layout-space-big) pt-10 pb-8 flex flex-col justify-start items-start gap-8 sm:gap-4">
        <div className="w-full flex justify-start items-center gap-3">
          <SodaAsset
            selectedToken={selectedToken}
            tokens={sodaTokens}
            setSelectNetworkToken={token => setSelectedToken(token)}
          />
          <div className="flex flex-col gap-[2px]">
            <div className="font-['Inter'] flex items-center text-(length:--body-super-comfortable) text-espresso">
              <span>{stakeMode === STAKE_MODE.STAKING ? 'Stake SODA' : 'Unstake xSODA'}</span>
              {/* <ChevronDownIcon className="w-4 h-4 text-clay ml-1" /> */}
            </div>
            <div className="font-['Inter'] flex items-center text-(length:--body-small) text-clay">
              {!selectedToken ? (
                <span>Choose a network</span>
              ) : !walletConnected ? (
                <span>Wallet not connected</span>
              ) : balance > 0n ? (
                <div className="flex items-center gap-1">
                  <span>Balance: {sliderMaxValue}</span>
                  {stakeMode === STAKE_MODE.UNSTAKING &&
                    [5, 10].map(percent => (
                      <Button
                        key={percent}
                        variant="default"
                        className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] text-[9px] font-bold font-['InterRegular'] uppercase text-clay -mt-[2px] hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso"
                        onClick={() => {
                          setStakeValueByPercent(percent, maxValue);
                        }}
                      >
                        {percent}%
                      </Button>
                    ))}
                  <Button
                    variant="default"
                    className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] text-[9px] font-bold font-['InterRegular'] uppercase text-clay -mt-[2px] hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso"
                    onClick={() => {
                      setStakeValueByPercent(100, maxValue);
                    }}
                  >
                    MAX
                  </Button>
                </div>
              ) : (
                <span>No SODA in wallet</span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-6 sm:gap-2 justify-between items-center">
          <CustomSlider
            defaultValue={[0]}
            max={sliderMaxValue}
            step={0.0001}
            value={[Number(stakeTypedValue)]}
            onValueChange={value => setStakeTypedValue(value[0] ? value[0].toString() : '')}
            className="h-10 data-[orientation=horizontal]:h-1"
            trackClassName="bg-cream-white data-[orientation=horizontal]:h-1"
            rangeClassName={cn('[background-size:20px_20px] ', 'bg-cherry-bright')}
            thumbClassName="cursor-pointer bg-white !border-white border-gray-400 w-6 h-6 [filter:drop-shadow(0_2px_24px_#EDE6E6)]"
            disabled={
              !selectedToken || !walletConnected || (stakeMode === STAKE_MODE.UNSTAKING && userXSodaBalance === 0n)
            }
          />

          <div className="w-full flex gap-2">
            <Input
              type="number"
              placeholder={stakeMode === STAKE_MODE.STAKING ? '0 SODA' : '0 xSODA'}
              value={stakeTypedValue}
              onChange={e => setStakeTypedValue(e.target.value)}
              disabled={!selectedToken || !walletConnected}
              className="pl-6 pr-4 rounded-[32px] min-w-[100px]"
            />

            {stakeMode === STAKE_MODE.STAKING ? (
              !walletConnected && selectedToken ? (
                <Button variant="cherry" className="px-6" onClick={() => handleConnect()}>
                  Connect {getChainName(selectedToken.xChainId)}
                </Button>
              ) : balance > 0n ? (
                <Button
                  variant="cherry"
                  className="px-6"
                  onClick={handleStake}
                  disabled={!selectedToken || !walletConnected || stakeValue === 0n || stakeValue > balance}
                >
                  {userXSodaBalance > 0n ? 'Stake more' : 'Stake'}
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
                className="px-6"
                onClick={handleUnstake}
                disabled={!selectedToken || !walletConnected || stakeValue === 0n || stakeValue > userXSodaBalance}
              >
                Unstake
              </Button>
            )}
          </div>
        </div>
      </div>
      <StakeDialog
        open={isStakeDialogOpen}
        onOpenChange={setIsStakeDialogOpen}
        selectedToken={selectedToken}
        tokens={sodaTokens}
      />
      <UnstakeDialog
        open={isUnstakeDialogOpen}
        onOpenChange={setIsUnstakeDialogOpen}
        selectedToken={selectedToken}
        tokens={sodaTokens}
      />
    </>
  );
}
