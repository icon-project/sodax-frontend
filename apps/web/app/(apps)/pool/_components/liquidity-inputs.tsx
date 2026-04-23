'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { InputGroupAddon } from '@/components/ui/input-group';
import { InputGroupInput } from '@/components/ui/input-group';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import type { SpokeChainId } from '@sodax/types';
import type { XToken } from '@sodax/types';
import { SwitchChainDialog } from '@/components/shared/switch-chain-dialog';
import { chainIdToChainName } from '@/providers/constants';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useAllChainXSodaBalances } from '@/hooks/useAllChainXSodaBalances';
import { InputGroupButton } from '@/components/ui/input-group';
import { STAKE_ROUTE, SWAP_ROUTE } from '@/constants/routes';
import { spokeChainConfig } from '@sodax/sdk';
import { cn, formatTokenAmount, validateChainAddress } from '@/lib/utils';
import { formatUnits, parseUnits } from 'viem';
import { SupplyDialog } from './supply-dialog';
import RecoverLockedSodaDialog from './recover-locked-soda-dialog';
import { usePoolState } from '../_stores/pool-store-provider';
import { usePoolContext, useLiquidityForm } from '../_hooks';
import { POOL_KEY } from '../_constants';
import { SONIC_MAINNET_CHAIN_ID, STELLAR_MAINNET_CHAIN_ID } from '@sodax/types';
import { useValidateStellarAccount } from '@/hooks/useValidateStellarAccount';
import { useActivateStellarAccount } from '@/hooks/useActivateStellarAccount';
import {
  createWithdrawParamsProps,
  useDexWithdraw,
  usePoolBalances,
  useRequestTrustline,
  useStellarTrustlineCheck,
} from '@sodax/dapp-kit';
import type { SpokeProvider } from '@sodax/sdk';
import { Loader2 } from 'lucide-react';
import { ErrorDialog } from '@/components/shared/error-dialog';

export function LiquidityInputs(): React.JSX.Element {
  const router = useRouter();
  const [isSupplyDialogOpen, setIsSupplyDialogOpen] = useState<boolean>(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
  const [isSwitchChainDialogOpen, setIsSwitchChainDialogOpen] = useState<boolean>(false);
  const [isRecoveryActive, setIsRecoveryActive] = useState<boolean>(false);
  const { isManagePositionDialogOpen } = usePoolState();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { selectedChainId, address, poolData, poolSpokeAssets, spokeProvider } = usePoolContext();
  const { sodaAmount, xSodaAmount, handleSodaAmountChange, handleXSodaAmountChange } = useLiquidityForm();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(
    (selectedChainId as SpokeChainId) ?? SONIC_MAINNET_CHAIN_ID,
  );
  const { data: balances } = usePoolBalances({
    poolData,
    poolKey: POOL_KEY,
    spokeProvider: spokeProvider as SpokeProvider,
    enabled: !isSupplyDialogOpen && !isManagePositionDialogOpen,
  });
  const allChainSodaBalances = useAllChainBalances({ onlySodaTokens: true });
  const allChainXSodaBalances = useAllChainXSodaBalances(selectedChainId ? [selectedChainId] : []);
  const isWalletConnected = Boolean(address);
  const selectedSodaBalance = useMemo((): bigint => {
    if (!selectedChainId) {
      return 0n;
    }
    const selectedChainConfig = spokeChainConfig[selectedChainId];
    const selectedSodaToken =
      selectedChainConfig?.supportedTokens && 'SODA' in selectedChainConfig.supportedTokens
        ? (selectedChainConfig.supportedTokens.SODA as XToken)
        : undefined;

    if (!selectedSodaToken) {
      return 0n;
    }

    const selectedSodaBalanceEntry = (allChainSodaBalances[selectedSodaToken.address] || []).find(
      balanceEntry => balanceEntry.chainId === selectedChainId,
    );

    return selectedSodaBalanceEntry?.balance ?? 0n;
  }, [allChainSodaBalances, selectedChainId]);
  const selectedXSodaBalance = selectedChainId ? (allChainXSodaBalances.get(selectedChainId) ?? 0n) : 0n;
  const hasNoSodaBalance = isWalletConnected && selectedSodaBalance <= 0n;
  const hasNoXSodaBalance = isWalletConnected && selectedXSodaBalance <= 0n;
  const hasSodaBalance = isWalletConnected && selectedSodaBalance > 0n;
  const hasXSodaBalance = isWalletConnected && selectedXSodaBalance > 0n;
  const canShowAnyMaxButton = isWalletConnected && (selectedSodaBalance > 0n || selectedXSodaBalance > 0n);
  const selectedChainConfig = selectedChainId ? spokeChainConfig[selectedChainId] : undefined;
  const selectedSodaToken =
    selectedChainConfig?.supportedTokens && 'SODA' in selectedChainConfig.supportedTokens
      ? (selectedChainConfig.supportedTokens.SODA as XToken)
      : undefined;
  const sodaValue = useMemo(
    (): bigint => parseUnits(sodaAmount, selectedSodaToken?.decimals ?? 18),
    [sodaAmount, selectedSodaToken?.decimals],
  );
  const xSodaValue = useMemo((): bigint => parseUnits(xSodaAmount, 18), [xSodaAmount]);
  const hasValidSodaInput = sodaAmount.trim().length > 0 && sodaValue > 0n && sodaValue <= selectedSodaBalance;
  const hasValidXSodaInput = xSodaAmount.trim().length > 0 && xSodaValue > 0n && xSodaValue <= selectedXSodaBalance;
  const isOverMax = sodaValue > selectedSodaBalance || xSodaValue > selectedXSodaBalance;

  const waLocSodaDecimals = poolData?.token0.decimals ?? 18;
  const waLocSodaBalance = balances?.token0Balance ?? 0n;
  const waLocSodaMinBalance = parseUnits('1', waLocSodaDecimals);
  const waLocSodaReserveBalance = parseUnits('0.001', waLocSodaDecimals);
  const hasWithdrawableWaLocSoda = isWalletConnected && waLocSodaBalance > waLocSodaMinBalance;
  const waLocSodaWithdrawAmount =
    waLocSodaBalance > waLocSodaReserveBalance ? waLocSodaBalance - waLocSodaReserveBalance : 0n;

  const hasPoolContext = poolData !== null && poolSpokeAssets !== null;
  const hasSelectedNetwork = selectedChainId !== null;
  const canContinue =
    isWalletConnected && hasSelectedNetwork && hasPoolContext && hasValidSodaInput && hasValidXSodaInput;
  const isStellarChain = selectedChainId === STELLAR_MAINNET_CHAIN_ID;

  const { data: stellarAccountValidation } = useValidateStellarAccount(isStellarChain ? address : undefined);
  const {
    activateStellarAccount,
    isLoading: isActivatingStellarAccount,
    isActivated: isActivatedStellarAccount,
  } = useActivateStellarAccount();

  const trustlineCheckAmount = sodaValue > 0n ? sodaValue : undefined;
  const { data: hasSufficientTrustline } = useStellarTrustlineCheck(
    selectedSodaToken?.address,
    trustlineCheckAmount,
    spokeProvider,
    selectedChainId ?? undefined,
  );
  const {
    requestTrustline,
    isLoading: isRequestingTrustline,
    isRequested: hasTrustline,
    error: trustlineError,
  } = useRequestTrustline(selectedSodaToken?.address);
  const withdrawMutation = useDexWithdraw();

  const handleBuySoda = (): void => {
    router.push(SWAP_ROUTE);
  };
  const handleGetXSoda = (): void => {
    router.push(STAKE_ROUTE);
  };
  const handleWithdrawWaLocSoda = async (): Promise<void> => {
    if (selectedChainId !== null && isWrongChain) {
      setIsSwitchChainDialogOpen(true);
      return;
    }
    if (!spokeProvider || !poolData || !poolSpokeAssets) {
      setErrorMessage('Withdraw is unavailable. Please ensure wallet and pool data are loaded.');
      setIsErrorDialogOpen(true);
      return;
    }
    if (waLocSodaWithdrawAmount <= 0n) {
      return;
    }
    setIsRecoveryActive(true);
    try {
      await withdrawMutation.mutateAsync({
        params: createWithdrawParamsProps({
          tokenIndex: 0,
          amount: formatUnits(waLocSodaWithdrawAmount, waLocSodaDecimals),
          poolData,
          poolSpokeAssets,
        }),
        spokeProvider,
      });
    } catch (withdrawError) {
      const message = withdrawError instanceof Error ? withdrawError.message : 'Failed to withdraw waLocSODA.';
      setErrorMessage(message);
      setIsErrorDialogOpen(true);
      setIsRecoveryActive(false);
    }
  };
  const handleOpenSupplyDialog = (): void => {
    if (!canContinue) {
      return;
    }
    setIsSupplyDialogOpen(true);
  };
  const handleActivateStellarAccount = async (): Promise<void> => {
    if (!address) {
      return;
    }
    try {
      await activateStellarAccount({ address });
    } catch {
      const errorMsg = 'Failed to activate Stellar account. Please try again.';
      setErrorMessage(errorMsg);
      setIsErrorDialogOpen(true);
    }
  };
  const handleRequestTrustline = async (): Promise<void> => {
    if (!selectedSodaToken || !spokeProvider) {
      return;
    }
    try {
      await requestTrustline({
        token: selectedSodaToken.address,
        amount: sodaValue,
        spokeProvider: spokeProvider as SpokeProvider,
      });
    } catch {
      const errorMsg =
        'To set up this trustline on the Stellar network, your wallet requires a minimum balance in XLM. Please add funds and try again.';
      setErrorMessage(errorMsg);
      setIsErrorDialogOpen(true);
    }
  };
  useEffect((): void => {
    if (trustlineError) {
      const errorMsg =
        'To set up this trustline on the Stellar network, your wallet requires a minimum balance in XLM. Please add funds and try again.';
      setErrorMessage(errorMsg);
      setIsErrorDialogOpen(true);
    }
  }, [trustlineError]);

  const handleSwitchChainClick = (): void => {
    void handleSwitchChain();
  };

  useEffect((): void => {
    if (!hasWithdrawableWaLocSoda) {
      setIsRecoveryActive(false);
    }
  }, [hasWithdrawableWaLocSoda]);

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
                  {formatTokenAmount(selectedSodaBalance, selectedSodaToken?.decimals ?? 18)}
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
                handleSodaAmountChange(event.target.value);
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
                handleSodaAmountChange(formatUnits(selectedSodaBalance, selectedSodaToken?.decimals ?? 18).trim());
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
                handleXSodaAmountChange(event.target.value);
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
                handleXSodaAmountChange(formatUnits(selectedXSodaBalance, 18).trim());
              }}
            >
              MAX
            </InputGroupButton>
          ) : null}
        </InputGroup>
        {isWalletConnected ? (
          isStellarChain &&
          !isActivatedStellarAccount &&
          stellarAccountValidation?.ok === false &&
          validateChainAddress(address, 'STELLAR') ? (
            <Button
              variant="cherry"
              onClick={handleActivateStellarAccount}
              className="px-6"
              disabled={isActivatingStellarAccount}
            >
              {isActivatingStellarAccount ? 'Activating Stellar' : 'Activate Stellar'}
              {isActivatingStellarAccount && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </Button>
          ) : isStellarChain &&
            sodaValue > 0n &&
            hasSufficientTrustline === false &&
            !hasTrustline &&
            validateChainAddress(address || '', 'STELLAR') ? (
            <Button variant="cherry" onClick={handleRequestTrustline} className="px-6" disabled={isRequestingTrustline}>
              {isRequestingTrustline ? 'Adding Stellar Trustline' : 'Add Stellar Trustline'}
              {isRequestingTrustline && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </Button>
          ) : !hasNoSodaBalance && hasNoXSodaBalance ? (
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
          <Button
            data-type="default"
            variant="cherry"
            disabled={true}
            className="h-10 min-w-28 px-6 py-2 rounded-[240px] flex justify-center items-center gap-1 w-full md:w-auto"
          >
            Continue
          </Button>
        )}
      </div>
      <SupplyDialog
        open={isSupplyDialogOpen}
        onOpenChange={setIsSupplyDialogOpen}
        poolData={poolData}
        poolSpokeAssets={poolSpokeAssets}
      />
      <RecoverLockedSodaDialog
        open={hasWithdrawableWaLocSoda && !isSupplyDialogOpen && !isManagePositionDialogOpen}
        onRecover={() => void handleWithdrawWaLocSoda()}
        isRecovering={isRecoveryActive}
        recoverAmount={waLocSodaWithdrawAmount}
        recoverDecimals={waLocSodaDecimals}
      />
      <ErrorDialog
        open={isErrorDialogOpen}
        onOpenChange={setIsErrorDialogOpen}
        errorMessage={errorMessage}
        title="Your wallet needs a small reserve"
      />
      {selectedChainId !== null && (
        <SwitchChainDialog
          open={isSwitchChainDialogOpen}
          onOpenChange={setIsSwitchChainDialogOpen}
          chainName={chainIdToChainName(selectedChainId)}
          onSwitchChain={handleSwitchChainClick}
          titleAction="recover locked SODA"
          description={`Your locked SODA is on ${chainIdToChainName(selectedChainId)}. Switch network to recover it.`}
        />
      )}
    </>
  );
}
