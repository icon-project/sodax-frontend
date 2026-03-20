'use client';

import type React from 'react';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { InputGroupAddon } from '@/components/ui/input-group';
import { InputGroupInput } from '@/components/ui/input-group';
import { getXChainType, useXAccount } from '@sodax/wallet-sdk-react';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalStore } from '@/stores/modal-store-provider';
import type { SpokeChainId } from '@sodax/types';
import type { XToken } from '@sodax/types';
import { chainIdToChainName } from '@/providers/constants';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useAllChainXSodaBalances } from '@/hooks/useAllChainXSodaBalances';
import { InputGroupButton } from '@/components/ui/input-group';
import { STAKE_ROUTE, SWAP_ROUTE } from '@/constants/routes';
import { spokeChainConfig } from '@sodax/sdk';
import type { PoolData, PoolSpokeAssets } from '@sodax/sdk';
import { cn, formatTokenAmount } from '@/lib/utils';
import { formatUnits, parseUnits } from 'viem';
import { SupplyDialog } from './supply-dialog';

type LiquidityInputsProps = {
  selectedNetworkChainId: SpokeChainId | null;
  sodaAmount: string;
  xSodaAmount: string;
  onSodaAmountChange: (value: string) => void;
  onXSodaAmountChange: (value: string) => void;
  poolData: PoolData | null;
  poolSpokeAssets: PoolSpokeAssets | null;
};

export function LiquidityInputs({
  selectedNetworkChainId,
  sodaAmount,
  xSodaAmount,
  onSodaAmountChange,
  onXSodaAmountChange,
  poolData,
  poolSpokeAssets,
}: LiquidityInputsProps): React.JSX.Element {
  const router = useRouter();
  const openModal = useModalStore(state => state.openModal);
  const [isSupplyDialogOpen, setIsSupplyDialogOpen] = useState<boolean>(false);
  const { address } = useXAccount(selectedNetworkChainId ?? undefined);
  const allChainSodaBalances = useAllChainBalances({ onlySodaTokens: true });
  const allChainXSodaBalances = useAllChainXSodaBalances(
    selectedNetworkChainId ? [selectedNetworkChainId] : [],
  );
  const isWalletConnected = Boolean(address);
  const selectedSodaBalance = useMemo((): bigint => {
    if (!selectedNetworkChainId) {
      return 0n;
    }
    const selectedChainConfig = spokeChainConfig[selectedNetworkChainId];
    const selectedSodaToken =
      selectedChainConfig?.supportedTokens && 'SODA' in selectedChainConfig.supportedTokens
        ? (selectedChainConfig.supportedTokens.SODA as XToken)
        : undefined;

    if (!selectedSodaToken) {
      return 0n;
    }

    const selectedSodaBalanceEntry = (allChainSodaBalances[selectedSodaToken.address] || []).find(
      balanceEntry => balanceEntry.chainId === selectedNetworkChainId,
    );

    return selectedSodaBalanceEntry?.balance ?? 0n;
  }, [allChainSodaBalances, selectedNetworkChainId]);
  const selectedXSodaBalance = selectedNetworkChainId ? (allChainXSodaBalances.get(selectedNetworkChainId) ?? 0n) : 0n;
  const hasNoSodaBalance = isWalletConnected && selectedSodaBalance <= 0n;
  const hasNoXSodaBalance = isWalletConnected && selectedXSodaBalance <= 0n;
  const hasSodaBalance = isWalletConnected && selectedSodaBalance > 0n;
  const hasXSodaBalance = isWalletConnected && selectedXSodaBalance > 0n;
  const canShowAnyMaxButton = isWalletConnected && (selectedSodaBalance > 0n || selectedXSodaBalance > 0n);
  const sodaValue = useMemo((): bigint => parseUnits(sodaAmount, 18), [sodaAmount]);
  const xSodaValue = useMemo((): bigint => parseUnits(xSodaAmount, 18), [xSodaAmount]);
  const hasValidSodaInput = sodaAmount.trim().length > 0 && sodaValue > 0n && sodaValue <= selectedSodaBalance;
  const hasValidXSodaInput = xSodaAmount.trim().length > 0 && xSodaValue > 0n && xSodaValue <= selectedXSodaBalance;
  const isOverMax = sodaValue > selectedSodaBalance || xSodaValue > selectedXSodaBalance;
  const hasPoolContext = poolData !== null && poolSpokeAssets !== null;
  const hasSelectedNetwork = selectedNetworkChainId !== null;
  const canContinue = isWalletConnected && hasSelectedNetwork && hasPoolContext && hasValidSodaInput && hasValidXSodaInput;

  const handleOpenWalletModal = (): void => {
    if (!selectedNetworkChainId) {
      return;
    }
    openModal(MODAL_ID.WALLET_MODAL, { primaryChainType: getXChainType(selectedNetworkChainId) });
  };
  const handleBuySoda = (): void => {
    router.push(SWAP_ROUTE);
  };
  const handleGetXSoda = (): void => {
    router.push(STAKE_ROUTE);
  };
  const handleOpenSupplyDialog = (): void => {
    if (!canContinue) {
      return;
    }
    setIsSupplyDialogOpen(true);
  };

  return (
    <>
      <div className="self-stretch flex flex-col md:flex-row justify-start items-start gap-2 md:gap-4">
        <InputGroup className="h-10 pl-2 pr-4 bg-almost-white rounded-[32px] flex justify-between items-center w-full md:w-50 font-['InterRegular'] text-espresso shadow-none">
          <InputGroupAddon className="pl-0">
            <InputGroupText>
              <Image
                data-property-1="SODA"
                className="w-6 h-6 rounded-[256px]"
                src="/coin/soda.png"
                alt="SODA"
                width={24}
                height={24}
              />
            </InputGroupText>
          </InputGroupAddon>
          <div className="relative flex-1">
            {hasSodaBalance ? (
              <InputGroupAddon className="pointer-events-none absolute left-3 top-1 h-auto p-0">
                <InputGroupText className="text-clay text-[9px] leading-3">
                  {formatTokenAmount(selectedSodaBalance, 18)}
                </InputGroupText>
              </InputGroupAddon>
            ) : null}
            <InputGroupInput
              placeholder=""
              inputMode="decimal"
              type="number"
              value={sodaAmount}
              disabled={!isWalletConnected}
              onChange={event => {
                onSodaAmountChange(event.target.value);
              }}
              className={cn(
                hasNoSodaBalance ? 'text-negative!' : 'text-espresso!',
                sodaValue > selectedSodaBalance ? 'text-negative!' : 'text-espresso!',
                canShowAnyMaxButton && 'pr-4',
                hasSodaBalance && 'pt-3',
              )}
            />

            {sodaAmount.length === 0 ? (
              <span
                className={cn(
                  'pointer-events-none absolute inset-y-0 left-3 flex items-center gap-1 text-sm',
                  hasSodaBalance && 'top-3',
                )}
              >
                <span className={hasNoSodaBalance ? 'text-negative' : 'text-clay-light'}>0</span>
                <span className={hasNoSodaBalance ? 'text-negative' : 'text-cherry-grey'}>SODA</span>
              </span>
            ) : null}
          </div>

          {canShowAnyMaxButton && selectedSodaBalance > 0n ? (
            <InputGroupButton
              size="icon-xs"
              className="text-clay text-[9px] font-['InterRegular'] font-normal border-none! outline-none! leading-0"
              onClick={() => {
                onSodaAmountChange(formatUnits(selectedSodaBalance, 18).trim());
              }}
            >
              MAX
            </InputGroupButton>
          ) : null}
        </InputGroup>
        <InputGroup className="h-10 pl-2 pr-4 bg-almost-white rounded-[32px] flex justify-between items-center w-full md:w-50 font-['InterRegular'] text-espresso shadow-none">
          <InputGroupAddon className="pl-0">
            <InputGroupText>
              <Image
                data-property-1="xSODA"
                className="w-6 h-6 rounded-[256px]"
                src="/coin/xsoda.png"
                alt="xSODA"
                width={24}
                height={24}
              />
            </InputGroupText>
          </InputGroupAddon>
          <div className="relative flex-1">
            {hasXSodaBalance ? (
              <InputGroupAddon className="pointer-events-none absolute left-3 top-1 h-auto p-0">
                <InputGroupText className="text-clay text-[10px] leading-3">
                  {formatTokenAmount(selectedXSodaBalance, 18)}
                </InputGroupText>
              </InputGroupAddon>
            ) : null}
            <InputGroupInput
              placeholder=""
              inputMode="decimal"
              type="number"
              value={xSodaAmount}
              disabled={!isWalletConnected}
              onChange={event => {
                onXSodaAmountChange(event.target.value);
              }}
              className={cn(
                hasNoXSodaBalance ? 'text-negative!' : 'text-espresso!',
                xSodaValue > selectedXSodaBalance ? 'text-negative!' : 'text-espresso!',
                canShowAnyMaxButton && 'pr-4',
                hasXSodaBalance && 'pt-3',
              )}
            />

            {xSodaAmount.length === 0 ? (
              <span
                className={cn(
                  'pointer-events-none absolute inset-y-0 left-3 flex items-center gap-1 text-sm',
                  hasXSodaBalance && 'top-3',
                )}
              >
                <span className={hasNoXSodaBalance ? 'text-negative' : 'text-clay-light'}>0</span>
                <span className={hasNoXSodaBalance ? 'text-negative' : 'text-cherry-grey'}>xSODA</span>
              </span>
            ) : null}
          </div>

          {canShowAnyMaxButton && selectedXSodaBalance > 0n ? (
            <InputGroupButton
              size="icon-xs"
              className="text-clay text-[9px] font-['InterRegular'] font-normal border-none! outline-none! leading-0"
              onClick={() => {
                onXSodaAmountChange(formatUnits(selectedXSodaBalance, 18).trim());
              }}
            >
              MAX
            </InputGroupButton>
          ) : null}
        </InputGroup>
        {isWalletConnected ? (
          !hasNoSodaBalance && hasNoXSodaBalance ? (
            <Button variant="cherry" onClick={handleGetXSoda} className="px-6">
              Get xSODA
            </Button>
          ) : hasNoSodaBalance ? (
            <Button variant="cherry" onClick={handleBuySoda} className="px-6">
              Buy SODA
            </Button>
          ) : (
            <Button
              data-state={canContinue ? 'enabled' : 'disabled'}
              data-type="default"
              variant="cherry"
              disabled={!canContinue}
              className="h-10 min-w-28 px-6 py-2 rounded-[240px] flex justify-center items-center gap-1 w-full md:w-auto"
              onClick={handleOpenSupplyDialog}
            >
              {isOverMax ? 'Over max' : 'Continue'}
            </Button>
          )
        ) : (
          <Button variant="cherry" onClick={handleOpenWalletModal} className="px-6" disabled={!selectedNetworkChainId}>
            {selectedNetworkChainId ? `Connect ${chainIdToChainName(selectedNetworkChainId)}` : 'Select network'}
          </Button>
        )}
      </div>
      <SupplyDialog
        open={isSupplyDialogOpen}
        onOpenChange={setIsSupplyDialogOpen}
        poolData={poolData}
        poolSpokeAssets={poolSpokeAssets}
      />
    </>
  );
}
