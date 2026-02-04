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
import { cn } from '@/lib/utils';
import { CustomSlider } from '@/components/ui/customer-slider';
import StakeDialog from './stake-dialog/stake-dialog';

export function StakeInputPanel(): React.JSX.Element {
  const router = useRouter();

  const { selectedToken, stakeValue } = useStakeState();
  const { setSelectedToken, setStakeValue } = useStakeActions();

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

  const { data: balances } = useXBalances({
    xChainId: currentNetwork,
    xTokens: selectedToken ? [selectedToken] : [],
    address,
  });
  const balance = selectedToken ? balances?.[selectedToken.address] || 0n : 0n;

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

  return (
    <>
      <div className="w-full px-(--layout-space-big) pt-10 pb-8 flex flex-col justify-start items-start gap-8 sm:gap-4">
        <div className="w-full flex justify-start items-center gap-3">
          <SodaAsset
            selectedToken={selectedToken}
            tokens={sodaTokens}
            setSelectNetworkToken={token => setSelectedToken(token)}
          />
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-6 sm:gap-2 justify-between items-center">
          <CustomSlider
            defaultValue={[0]}
            max={10}
            step={0.0001}
            value={[stakeValue]}
            onValueChange={value => setStakeValue(value[0] ?? 0)}
            className="h-10 data-[orientation=horizontal]:h-1"
            trackClassName="bg-cream-white data-[orientation=horizontal]:h-1"
            rangeClassName={cn('[background-size:20px_20px] ', 'bg-cherry-bright')}
            thumbClassName="cursor-pointer bg-white !border-white border-gray-400 w-6 h-6 [filter:drop-shadow(0_2px_24px_#EDE6E6)]"
          />

          <div className="w-full flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={stakeValue}
              onChange={e => setStakeValue(Number(e.target.value))}
            />
            {!walletConnected ? (
              <Button variant="cherry" onClick={() => handleConnect()}>
                Connect Wallet
              </Button>
            ) : balance > 0n ? (
              <Button variant="cherry" onClick={handleStake}>
                Stake
              </Button>
            ) : (
              <Button variant="cherry" onClick={handleBuySoda}>
                Buy SODA
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
    </>
  );
}
