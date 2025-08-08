'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';

import { useWalletUI } from '../_context/wallet-ui';

// SODAX SDK + hooks
import { useXAccounts, useXAccount, useXBalances } from '@sodax/wallet-sdk';
import { useSpokeProvider } from '@sodax/dapp-kit';
import {
  Sodax,
  spokeChainConfig,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type IconSpokeProvider,
  type SonicSpokeProvider,
  type IcxCreateRevertMigrationParams,
} from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import type { XToken } from '@sodax/types';
import { parseUnits, formatUnits } from 'viem';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import NetworkInputDisplay from '@/components/ui/network-input-display';

function SharedContent() {
  return (
    <div className="inline-flex flex-col justify-start items-start gap-4">
      <div className="mix-blend-multiply justify-end">
        <span className="text-yellow-dark font-bold leading-9 !text-(size:--app-title)">SODAX </span>
        <span className="text-yellow-dark font-normal font-[shrikhand] leading-9 !text-(size:--app-title)">
          migration
        </span>
      </div>
      <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(size:--subtitle)">
        Swap 1:1 between ICX and SODA.
      </div>
    </div>
  );
}

export default function MigratePage() {
  const { openWalletModal } = useWalletUI();

  // migration state (ported from your tab)
  const [icxInputValue, setIcxInputValue] = useState('');
  const [sodaInputValue, setSodaInputValue] = useState('');
  const [isICXToSoda, setIsICXToSoda] = useState(true);

  const [isPopoverOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ spokeTxHash: string; hubTxHash: string } | null>(null);
  const [migrationError, setMigrationError] = useState('');

  // Approval SODA -> ICX
  const [isApprovalNeeded, setIsApprovalNeeded] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalChecked, setApprovalChecked] = useState(false);

  const xAccounts = useXAccounts();
  const connectedWalletsCount = Object.values(xAccounts).filter(a => a?.address).length;
  const hasTwoWalletsConnected = connectedWalletsCount >= 2;

  const iconSpokeProvider = useSpokeProvider(ICON_MAINNET_CHAIN_ID);
  const sonicSpokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID);

  // ICON account + balance
  const { address: iconAddress } = useXAccount(ICON_MAINNET_CHAIN_ID);
  const icxToken = {
    ...spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
    xChainId: ICON_MAINNET_CHAIN_ID,
  } as XToken;
  const { data: balances } = useXBalances({
    xChainId: ICON_MAINNET_CHAIN_ID,
    xTokens: [icxToken],
    address: iconAddress,
  });
  const icxBalance = balances?.[icxToken.address] || 0n;
  const formattedIcxBalance = formatUnits(icxBalance, icxToken.decimals);
  const formattedIcxBalanceFixed = Number(formattedIcxBalance).toFixed(2);

  // Sonic account + SODA balance
  const { address: sonicAddress } = useXAccount('EVM');
  const sodaToken = {
    address: '0x8515352CB9832D1d379D52366D1E995ADd358420',
    decimals: 18,
    symbol: 'SODA',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  } as XToken;
  const { data: sodaBalances } = useXBalances({
    xChainId: SONIC_MAINNET_CHAIN_ID,
    xTokens: [sodaToken],
    address: sonicAddress,
  });
  const sodaBalance = sodaBalances?.[sodaToken.address] || 0n;
  const formattedSodaBalance = formatUnits(sodaBalance, sodaToken.decimals);
  const formattedSodaBalanceFixed = Number(formattedSodaBalance).toFixed(2);

  // approval check for SODA -> ICX
  const checkApprovalStatus = async () => {
    if (!sonicAddress || !iconAddress || isICXToSoda) {
      setApprovalChecked(true);
      setIsApprovalNeeded(false);
      return;
    }
    try {
      const sodax = new Sodax({
        hubProviderConfig: {
          hubRpcUrl: 'https://rpc.soniclabs.com',
          chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
        },
      });
      const inputValue = sodaInputValue;
      if (!inputValue || Number(inputValue) <= 0) {
        setIsApprovalNeeded(false);
        setApprovalChecked(true);
        return;
      }
      const amountToMigrate = parseUnits(inputValue, 18);
      const revertParams = {
        amount: amountToMigrate,
        to: iconAddress as `hx${string}`,
      } satisfies IcxCreateRevertMigrationParams;

      if (!sonicSpokeProvider) {
        setIsApprovalNeeded(true);
        setApprovalChecked(true);
        return;
      }
      const isAllowedResult = await sodax.migration.isAllowanceValid(revertParams, 'revert', sonicSpokeProvider);
      setIsApprovalNeeded(!(isAllowedResult.ok && isAllowedResult.value));
    } catch {
      setIsApprovalNeeded(true);
    } finally {
      setApprovalChecked(true);
    }
  };

  const handleApprove = async () => {
    if (!sonicAddress || !iconAddress) return;
    const inputValue = sodaInputValue;
    if (!inputValue || Number(inputValue) <= 0) return;

    setIsApproving(true);
    try {
      const sodax = new Sodax({
        hubProviderConfig: {
          hubRpcUrl: 'https://rpc.soniclabs.com',
          chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
        },
      });
      const amountToMigrate = parseUnits(inputValue, 18);
      const revertParams = {
        amount: amountToMigrate,
        to: iconAddress as `hx${string}`,
      } satisfies IcxCreateRevertMigrationParams;

      if (!sonicSpokeProvider) {
        setMigrationError('Sonic provider not available');
        setShowErrorDialog(true);
        return;
      }
      const approveResult = await sodax.migration.approve(revertParams, 'revert', sonicSpokeProvider, false);
      if (approveResult.ok) {
        setIsApprovalNeeded(false);
        setApprovalChecked(false);
        await checkApprovalStatus();
      } else {
        setMigrationError('Failed to approve SODA tokens. Please try again.');
        setShowErrorDialog(true);
      }
    } catch (e: unknown) {
      setMigrationError(e instanceof Error ? e.message : 'Unexpected error during approval.');
      setShowErrorDialog(true);
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (!isICXToSoda && sonicAddress && iconAddress) {
      setApprovalChecked(false);
      checkApprovalStatus();
    } else {
      setApprovalChecked(true);
      setIsApprovalNeeded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isICXToSoda, sonicAddress, iconAddress, sodaInputValue]);

  // inputs + helpers
  const handleConnectWallets = () => openWalletModal();
  const handleIcxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIcxInputValue(e.target.value);
    if (isICXToSoda) setSodaInputValue(e.target.value);
  };
  const handleSodaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSodaInputValue(e.target.value);
    if (!isICXToSoda) setIcxInputValue(e.target.value);
  };
  const handleIcxInputFocus = () => setShowTooltip(true);
  const handleTooltipComplete = () => setShowTooltip(false);

  const handleMaxClick = () => {
    if (iconAddress && icxBalance > 0n) {
      setIcxInputValue(formattedIcxBalanceFixed);
      if (isICXToSoda) setSodaInputValue(formattedIcxBalanceFixed);
    }
  };
  const handleSodaMaxClick = () => {
    if (sonicAddress && sodaBalance > 0n) {
      setSodaInputValue(formattedSodaBalanceFixed);
      if (!isICXToSoda) setIcxInputValue(formattedSodaBalanceFixed);
    }
  };

  useEffect(() => {
    if (isICXToSoda) setSodaInputValue(icxInputValue);
    else setIcxInputValue(sodaInputValue);
  }, [isICXToSoda]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMigrate = async () => {
    if (!sonicAddress) {
      setMigrationError('Sonic address not connected');
      setShowErrorDialog(true);
      return;
    }
    if (!iconAddress) {
      setMigrationError('ICON address not connected');
      setShowErrorDialog(true);
      return;
    }

    const inputValue = isICXToSoda ? icxInputValue : sodaInputValue;
    const n = Number(inputValue);
    if (!inputValue || isNaN(n) || n <= 0) return;

    // Validate balance before migration
    if (isICXToSoda) {
      const inputAmount = parseUnits(inputValue, 18);
      if (inputAmount > icxBalance) {
        setMigrationError('Please insert available amount.');
        setShowErrorDialog(true);
        return;
      }
    } else {
      const inputAmount = parseUnits(inputValue, 18);
      if (inputAmount > sodaBalance) {
        setMigrationError('Please insert available amount.');
        setShowErrorDialog(true);
        return;
      }
    }

    setIsMigrating(true);
    try {
      const sodax = new Sodax({
        hubProviderConfig: {
          hubRpcUrl: 'https://rpc.soniclabs.com',
          chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
        },
      });
      const amountToMigrate = parseUnits(inputValue, 18);

      if (isICXToSoda) {
        if (!iconSpokeProvider) {
          setMigrationError('ICON provider unavailable. Reconnect your ICON wallet.');
          setShowErrorDialog(true);
          return;
        }
        const params = {
          address: spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken,
          amount: amountToMigrate,
          to: sonicAddress as `0x${string}`,
        };
        const result = await sodax.migration.migrateIcxToSoda(params, iconSpokeProvider as IconSpokeProvider, 30000);
        if (result.ok) {
          const [spokeTxHash, hubTxHash] = result.value;
          setMigrationResult({ spokeTxHash, hubTxHash });
          setShowSuccessDialog(true);
          setIcxInputValue('');
          setSodaInputValue('');
        } else {
          setMigrationError('ICX to SODA migration failed. Please try again.');
          setShowErrorDialog(true);
        }
      } else {
        if (!sonicSpokeProvider) {
          setMigrationError('Sonic provider unavailable. Reconnect your Sonic wallet.');
          setShowErrorDialog(true);
          return;
        }
        const revertParams = {
          amount: amountToMigrate,
          to: iconAddress as `hx${string}`,
        } satisfies IcxCreateRevertMigrationParams;
        const result = await sodax.migration.revertMigrateSodaToIcx(
          revertParams,
          sonicSpokeProvider as SonicSpokeProvider,
          30000,
        );
        if (result.ok) {
          const [hubTxHash, spokeTxHash] = result.value;
          setMigrationResult({ spokeTxHash, hubTxHash });
          setShowSuccessDialog(true);
          setIcxInputValue('');
          setSodaInputValue('');
        } else {
          setMigrationError('SODA to ICX migration failed. Please try again.');
          setShowErrorDialog(true);
        }
      }
    } catch (e: unknown) {
      setMigrationError(e instanceof Error ? e.message : 'An unexpected error occurred.');
      setShowErrorDialog(true);
    } finally {
      setIsMigrating(false);
    }
  };

  // CTA state machine
  const getButtonStates = () => {
    if (!hasTwoWalletsConnected)
      return {
        mode: 'single',
        text: 'Connect wallets',
        disabled: false,
        loading: false,
        onClick: handleConnectWallets,
      } as const;

    const inputValue = isICXToSoda ? icxInputValue : sodaInputValue;
    const hasValidAmount = Number(inputValue) > 0;

    if (!hasValidAmount)
      return { mode: 'single', text: 'Enter amount', disabled: true, loading: false, onClick: () => {} } as const;

    if (isMigrating)
      return { mode: 'single', text: 'Migrating', disabled: true, loading: true, onClick: () => {} } as const;

    if (!isICXToSoda && isApprovalNeeded)
      return {
        mode: 'dual' as const,
        approve: {
          text: isApproving ? 'Approving' : 'Approve',
          disabled: isApproving,
          loading: isApproving,
          onClick: handleApprove,
        },
        migrate: { text: 'Migrate', disabled: true, loading: false, onClick: handleMigrate },
      };

    if (!isICXToSoda && !isApprovalNeeded && approvalChecked)
      return {
        mode: 'dual' as const,
        approve: { text: 'Approved', disabled: true, loading: false, onClick: () => {} },
        migrate: { text: 'Migrate', disabled: false, loading: false, onClick: handleMigrate },
      };

    return { mode: 'single', text: 'Migrate', disabled: false, loading: false, onClick: handleMigrate } as const;
  };

  const buttonStates = getButtonStates();

  return (
    <div className="flex flex-col w-full" style={{ gap: 'var(--layout-space-comfortable)' }}>
      <SharedContent />

      {/* Inputs + direction toggle */}
      <div className="inline-flex flex-col justify-start items-start gap-2">
        <div className="relative w-full">
          <NetworkInputDisplay
            iconSrc={isICXToSoda ? '/coin/icx.png' : '/coin/soda.png'}
            secondaryIconSrc={isICXToSoda ? '/coin/icx1.png' : '/coin/s1.png'}
            label={isICXToSoda ? 'ICON' : 'Sonic'}
            description="From"
            tokenSymbol={isICXToSoda ? 'ICX' : 'SODA'}
            availableAmount={
              isICXToSoda
                ? iconAddress
                  ? `${formattedIcxBalanceFixed} available`
                  : '0 available'
                : sonicAddress
                  ? `${formattedSodaBalanceFixed} available`
                  : '0 available'
            }
            inputValue={isICXToSoda ? icxInputValue : sodaInputValue}
            onInputChange={isICXToSoda ? handleIcxInputChange : handleSodaInputChange}
            onInputFocus={isICXToSoda ? handleIcxInputFocus : undefined}
            onMaxClick={isICXToSoda ? handleMaxClick : handleSodaMaxClick}
            disabled={isICXToSoda ? !iconAddress || icxBalance === 0n : !sonicAddress || sodaBalance === 0n}
          >
            {showTooltip && isICXToSoda && (
              <div className="absolute -top-20 left-[60px] mt-2 z-50">{/* Your AnimatedTooltip here */}</div>
            )}
          </NetworkInputDisplay>

          <button
            type="button"
            className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
            onClick={() => {
              setIsICXToSoda(v => !v);
              setIcxInputValue(0);
              setSodaInputValue(0);
            }}
            aria-label="Switch direction"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <title>Arrow down</title>
              <g clipPath="url(#clip0_9664_9869)">
                <path
                  d="M5.5 8.5L3.5 10.5L1.5 8.5"
                  stroke="#483534"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.5 10.5V4.5"
                  stroke="#483534"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.5 3.5L8.5 1.5L6.5 3.5"
                  stroke="black"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 7.5V1.5"
                  stroke="black"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_9664_9869">
                  <rect width="12" height="12" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>

        <NetworkInputDisplay
          iconSrc={isICXToSoda ? '/coin/soda.png' : '/coin/icx.png'}
          secondaryIconSrc={isICXToSoda ? '/coin/s1.png' : '/coin/icx1.png'}
          label={isICXToSoda ? 'Sonic' : 'ICON'}
          description="To"
          tokenSymbol={isICXToSoda ? 'SODA' : 'ICX'}
          availableAmount="Receive"
          inputValue={isICXToSoda ? sodaInputValue : icxInputValue}
          readOnly
          showMaxButton={false}
        />
      </div>

      {/* CTAs */}
      <div className="inline-flex flex-col justify-start items-start gap-4">
        {buttonStates.mode === 'dual' ? (
          <div className="flex gap-2">
            <Button
              variant="cherry"
              className="w-full bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white w-[136px]"
              onClick={buttonStates.approve.onClick}
              disabled={buttonStates.approve.disabled}
            >
              {buttonStates.approve.loading ? (
                <>
                  {buttonStates.approve.text}
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : (
                <>
                  {buttonStates.approve.text}
                  {buttonStates.approve.text === 'Approved' && <Check className="w-4 h-4 ml-2" />}
                </>
              )}
            </Button>
            <Button
              variant="cherry"
              className="w-full bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white w-[232px]"
              onClick={buttonStates.migrate.onClick}
              disabled={buttonStates.migrate.disabled}
            >
              {buttonStates.migrate.loading ? (
                <>
                  {buttonStates.migrate.text}
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : (
                buttonStates.migrate.text
              )}
            </Button>
          </div>
        ) : (
          <Button
            variant="cherry"
            className="w-full sm:w-[232px] bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white"
            onClick={buttonStates.onClick}
            disabled={buttonStates.disabled}
          >
            {buttonStates.loading ? (
              <>
                {buttonStates.text}
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              </>
            ) : (
              buttonStates.text
            )}
          </Button>
        )}
        <div className="text-center justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          Typically ~1 min. Network fee applies.
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md md:max-w-[480px] p-12">
          <DialogHeader>
            <div className="flex flex-row justify-between items-center">
              <div className="inline-flex justify-start items-center gap-2">
                <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
                <div className="mix-blend-multiply text-espresso font-['InterRegular'] font-bold leading-snug text-(size:--subtitle)">
                  Transaction completed
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="text-clay-light">
            <p className="font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
              Your new assets are now in your wallet. Make sure you have native gas to transact with them.
            </p>
          </div>
          <div className="text-clay-light font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
            Need help?{' '}
            <span className="underline hover:text-cherry-brighter transition-colors cursor-pointer">
              Join our Discord
            </span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md md:max-w-[480px] p-12">
          <DialogHeader>
            <div className="flex flex-row justify-between items-center">
              <div className="inline-flex justify-start items-center gap-2">
                <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
                <div className="mix-blend-multiply text-espresso font-['InterRegular'] font-bold leading-snug text-(size:--subtitle)">
                  Transaction failed
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-clay-light font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
              {migrationError || 'An error occurred during migration. Please try again.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
