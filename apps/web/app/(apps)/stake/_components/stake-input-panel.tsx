// apps/web/app/(apps)/stake/_components/stake-input-panel.tsx
// Input panel component for staking with token selector, balance, slider, and input field

import type React from 'react';
import { useMemo } from 'react';
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
    console.log('stake');
  };

  return (
    <div className="w-full flex flex-col justify-start items-start gap-2">
      <div className="flex flex-col justify-start items-start">
        <div className="px-8 pt-10 pb-8 flex flex-col justify-start items-start gap-4">
          <div className="inline-flex justify-start items-center gap-3">
            <SodaAsset
              selectedToken={selectedToken}
              tokens={sodaTokens}
              setSelectNetworkToken={token => setSelectedToken(token)}
            />
          </div>

          <div>
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
    </div>
  );
}
