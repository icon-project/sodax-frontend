'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ConnectWalletButton from '@/components/ui/connect-wallet-button';
import TermsConfirmationModal from '@/components/ui/terms-confirmation-modal';
import { WalletModal } from '@/components/shared/wallet-modal';
// import { useWallet } from '../../hooks/useWallet';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import TabItem from '@/components/ui/tab-item';
import { tabConfigs } from '@/components/ui/tab-config';
import { ChevronRight, ArrowUpFromLine, ArrowDownToLine, ArrowDownUp, Settings, Loader2, Check } from 'lucide-react';
import Sidebar from '@/components/landing/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DecoratedButton } from '@/components/landing/decorated-button';
import { useXAccounts, useXConnect, useXDisconnect, useXAccount, useXBalances } from '@sodax/wallet-sdk';
import type { XConnector } from '@sodax/wallet-sdk';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnimatedTooltip } from '@/components/ui/AnimatedTooltip';
import type { ChainType, XToken } from '@sodax/types';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { formatUnits } from 'viem';
import {
  spokeChainConfig,
  Sodax,
  type IconSpokeProvider,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type IcxCreateRevertMigrationParams,
  type SonicSpokeProvider,
} from '@sodax/sdk';
import { parseUnits } from 'viem';
import { useSpokeProvider } from '@sodax/dapp-kit';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NetworkInputDisplay from '@/components/ui/network-input-display';

const ConnectedChainsDisplay = ({ onClick }: { onClick?: () => void }): React.JSX.Element => {
  const xAccounts = useXAccounts();

  const connectedChains = Object.entries(xAccounts)
    .filter(([_, account]) => account?.address)
    .map(([chainType, account]) => ({
      chainType,
      address: account?.address,
      icon: chainType === 'ICON' ? '/coin/icx1.png' : '/coin/s1.png',
    }));

  if (connectedChains.length === 0) {
    return <></>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center cursor-pointer" onClick={onClick}>
        {connectedChains.map((chain, index) => (
          <div key={chain.chainType} className="relative">
            <Image
              data-property-1={chain.chainType}
              className="rounded shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.20)] outline outline-3 outline-white"
              src={chain.icon}
              alt={chain.chainType}
              width={20}
              height={20}
            />
          </div>
        ))}
      </div>
      <Button
        variant="cherry"
        className="w-10 h-10 p-3 bg-cherry-bright rounded-[256px] inline-flex justify-center items-center gap-2 cursor-pointer"
      >
        <Settings className="w-4 h-4 text-white" />
      </Button>
    </div>
  );
};

const SharedContent = (): React.JSX.Element => {
  return (
    <div data-property-1="Default" className=" inline-flex flex-col justify-start items-start gap-4">
      <div className=" mix-blend-multiply justify-end">
        <span className="text-yellow-dark font-bold leading-9 !text-(size:--app-title)">SODAX </span>
        <span className="text-yellow-dark font-normal font-[shrikhand] leading-9 !text-(size:--app-title)">
          migration
        </span>
      </div>
      <div className=" mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(size:--subtitle)">
        Swap 1:1 between ICX and SODA.
      </div>
    </div>
  );
};

const SwapContent = (): React.JSX.Element => {
  return <div className="mt-8"></div>;
};

const SavingsContent = (): React.JSX.Element => {
  return <div className="mt-8"></div>;
};

const LoansContent = (): React.JSX.Element => {
  return <div className="mt-8"></div>;
};

const MigrateContent = ({ onOpenWalletModal }: { onOpenWalletModal: () => void }): React.JSX.Element => {
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [shouldTriggerWallet, setShouldTriggerWallet] = useState<boolean>(false);
  const [icxInputValue, setIcxInputValue] = useState<string>('');
  const [sodaInputValue, setSodaInputValue] = useState<string>('');
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  const [migrationResult, setMigrationResult] = useState<{ spokeTxHash: string; hubTxHash: string } | null>(null);
  const [migrationError, setMigrationError] = useState<string>('');
  const [isICXToSoda, setIsICXToSoda] = useState<boolean>(true);

  // Approval states for SODA->ICX migration
  const [isApprovalNeeded, setIsApprovalNeeded] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [approvalChecked, setApprovalChecked] = useState<boolean>(false);

  const xAccounts = useXAccounts();
  const iconSpokeProvider = useSpokeProvider(ICON_MAINNET_CHAIN_ID);
  const sonicSpokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID);

  // Get ICON account and balance
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

  const connectedWalletsCount = Object.values(xAccounts).filter(xAccount => xAccount?.address).length;
  const hasTwoWalletsConnected = connectedWalletsCount >= 2;

  // Get Sonic account (Sonic uses EVM chain type)
  const { address: sonicAddress } = useXAccount('EVM');

  // Get SODA balance for Sonic network
  const sodaToken = {
    address: '0x8515352CB9832D1d379D52366D1E995ADd358420', // SODA token address on Sonic
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

  // Check approval status for SODA->ICX migration
  const checkApprovalStatus = async (): Promise<void> => {
    if (!sonicAddress || !iconAddress || isICXToSoda) {
      setApprovalChecked(true);
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
        console.error('Sonic spoke provider not available');
        setIsApprovalNeeded(true);
        setApprovalChecked(true);
        return;
      }

      const isAllowedResult = await sodax.migration.isAllowanceValid(revertParams, 'revert', sonicSpokeProvider);

      if (isAllowedResult.ok) {
        setIsApprovalNeeded(!isAllowedResult.value);
      } else {
        console.error('Failed to check allowance:', isAllowedResult.error);
        setIsApprovalNeeded(true);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setIsApprovalNeeded(true);
    } finally {
      setApprovalChecked(true);
    }
  };

  // Handle approval for SODA tokens
  const handleApprove = async (): Promise<void> => {
    if (!sonicAddress || !iconAddress) {
      console.error('Sonic or ICON address not connected');
      return;
    }

    const inputValue = sodaInputValue;
    if (!inputValue || Number(inputValue) <= 0) {
      console.error('Invalid SODA amount');
      return;
    }

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
        console.error('Sonic spoke provider not available');
        setMigrationError('Sonic spoke provider not available');
        setShowErrorDialog(true);
        return;
      }

      const approveResult = await sodax.migration.approve(revertParams, 'revert', sonicSpokeProvider, false);

      if (approveResult.ok) {
        console.log('Approval transaction hash:', approveResult.value);
        // const approveTxResult = await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
        // console.log('Approval transaction confirmed:', approveTxResult);

        setIsApprovalNeeded(false);
        setApprovalChecked(false);
        await checkApprovalStatus();
      } else {
        console.error('Failed to approve tokens:', approveResult.error);
        setMigrationError('Failed to approve SODA tokens. Please try again.');
        setShowErrorDialog(true);
      }
    } catch (error) {
      console.error('Approval error:', error);
      setMigrationError(error instanceof Error ? error.message : 'An unexpected error occurred during approval.');
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
  }, [isICXToSoda, sonicAddress, iconAddress, sodaInputValue]);

  const handleConnectWallets = (): void => {
    onOpenWalletModal();
  };

  const handleIcxInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setIcxInputValue(e.target.value);
    if (isICXToSoda) {
      setSodaInputValue(e.target.value);
    }
  };

  const handleSodaInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSodaInputValue(e.target.value);
    if (!isICXToSoda) {
      setIcxInputValue(e.target.value);
    }
  };

  const handleIcxInputFocus = (): void => {
    setShowTooltip(true);
  };

  const handleTooltipComplete = (): void => {
    setShowTooltip(false);
  };

  const handleMaxClick = (): void => {
    if (iconAddress && icxBalance > 0n) {
      setIcxInputValue(formattedIcxBalanceFixed);
      if (isICXToSoda) {
        setSodaInputValue(formattedIcxBalanceFixed);
      }
    }
  };

  const handleSodaMaxClick = (): void => {
    if (sonicAddress && sodaBalance > 0n) {
      const formattedSodaBalanceFixed = Number(formattedSodaBalance).toFixed(2);
      setSodaInputValue(formattedSodaBalanceFixed);
      if (!isICXToSoda) {
        setIcxInputValue(formattedSodaBalanceFixed);
      }
    }
  };

  // Sync input values when direction changes
  useEffect(() => {
    if (isICXToSoda) {
      setSodaInputValue(icxInputValue);
    } else {
      setIcxInputValue(sodaInputValue);
    }
  }, [isICXToSoda, icxInputValue, sodaInputValue]);

  const handleMigrate = async (): Promise<void> => {
    if (!sonicAddress) {
      console.error('Sonic address not connected');
      return;
    }

    if (!iconAddress) {
      console.error('ICON address not connected');
      return;
    }

    const inputValue = isICXToSoda ? icxInputValue : sodaInputValue;
    if (!inputValue || Number(inputValue) <= 0) {
      console.error(`Invalid ${isICXToSoda ? 'ICX' : 'SODA'} amount`);
      return;
    }

    setIsMigrating(true);

    try {
      // Initialize SODAX SDK
      const sodax = new Sodax({
        hubProviderConfig: {
          hubRpcUrl: 'https://rpc.soniclabs.com',
          chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
        },
      });

      // Convert input amount to bigint (assuming 18 decimals)
      const amountToMigrate = parseUnits(inputValue, 18);

      if (isICXToSoda) {
        // ICX to SODA migration
        const migrationParams = {
          address: spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken, // ICX native token address
          amount: amountToMigrate,
          to: sonicAddress as `0x${string}`, // Recipient address on Sonic
        };

        const result = await sodax.migration.migrateIcxToSoda(
          migrationParams,
          iconSpokeProvider as IconSpokeProvider,
          30000, // 30 second timeout
        );

        if (result.ok) {
          const [spokeTxHash, hubTxHash] = result.value;

          setMigrationResult({
            spokeTxHash,
            hubTxHash,
          });
          setShowSuccessDialog(true);

          // Clear input values after successful migration
          setIcxInputValue('');
          setSodaInputValue('');
        } else {
          setMigrationError('ICX to SODA migration failed. Please try again.');
          setShowErrorDialog(true);
        }
      } else {
        // SODA to ICX migration
        const revertParams = {
          amount: amountToMigrate,
          to: iconAddress as `hx${string}`,
        } satisfies IcxCreateRevertMigrationParams;

        const result = await sodax.migration.revertMigrateSodaToIcx(
          revertParams,
          sonicSpokeProvider as SonicSpokeProvider,
          30000, // 30 second timeout
        );

        if (result.ok) {
          const [hubTxHash, spokeTxHash] = result.value;

          setMigrationResult({
            spokeTxHash,
            hubTxHash,
          });
          setShowSuccessDialog(true);

          // Clear input values after successful migration
          setIcxInputValue('');
          setSodaInputValue('');
        } else {
          setMigrationError('SODA to ICX migration failed. Please try again.');
          setShowErrorDialog(true);
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationError(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setShowErrorDialog(true);
    } finally {
      setIsMigrating(false);
    }
  };

  // Determine button states for different scenarios
  const getButtonStates = (): {
    showTwoButtons: boolean;
    approveButton: {
      text: string;
      disabled: boolean;
      onClick: () => void;
      loading: boolean;
    };
    migrateButton: {
      text: string;
      disabled: boolean;
      onClick: () => void;
      loading: boolean;
    };
    singleButton: {
      text: string;
      disabled: boolean;
      onClick: () => void;
      loading: boolean;
    };
  } => {
    if (!hasTwoWalletsConnected) {
      return {
        showTwoButtons: false,
        approveButton: { text: '', disabled: true, onClick: () => {}, loading: false },
        migrateButton: { text: '', disabled: true, onClick: () => {}, loading: false },
        singleButton: {
          text: 'Connect wallets',
          disabled: false,
          onClick: handleConnectWallets,
          loading: false,
        },
      };
    }

    const inputValue = isICXToSoda ? icxInputValue : sodaInputValue;
    const hasValidAmount = Number(inputValue) >= 1;

    if (!hasValidAmount) {
      return {
        showTwoButtons: false,
        approveButton: { text: '', disabled: true, onClick: () => {}, loading: false },
        migrateButton: { text: '', disabled: true, onClick: () => {}, loading: false },
        singleButton: {
          text: 'Enter amount',
          disabled: true,
          onClick: () => {},
          loading: false,
        },
      };
    }

    if (isMigrating) {
      return {
        showTwoButtons: true,
        approveButton: { text: 'Approved', disabled: true, onClick: () => {}, loading: false },
        migrateButton: { text: '', disabled: true, onClick: () => {}, loading: false },
        singleButton: {
          text: 'Migrating',
          disabled: true,
          onClick: () => {},
          loading: true,
        },
      };
    }

    // For soda->icx case, show two buttons when approval is needed
    if (!isICXToSoda && isApprovalNeeded) {
      return {
        showTwoButtons: true,
        approveButton: {
          text: isApproving ? 'Approving' : 'Approve',
          disabled: isApproving,
          onClick: handleApprove,
          loading: isApproving,
        },
        migrateButton: {
          text: 'Migrate',
          disabled: true, // Disabled until approval is successful
          onClick: handleMigrate,
          loading: false,
        },
        singleButton: { text: '', disabled: true, onClick: () => {}, loading: false },
      };
    }

    // For soda->icx case when approval is not needed (after successful approval)
    if (!isICXToSoda && !isApprovalNeeded && approvalChecked) {
      return {
        showTwoButtons: true,
        approveButton: {
          text: 'Approved',
          disabled: true,
          onClick: () => {},
          loading: false,
        },
        migrateButton: {
          text: 'Migrate',
          disabled: false, // Enabled after approval is successful
          onClick: handleMigrate,
          loading: false,
        },
        singleButton: { text: '', disabled: true, onClick: () => {}, loading: false },
      };
    }

    // For all other cases, show single button
    return {
      showTwoButtons: false,
      approveButton: { text: '', disabled: true, onClick: () => {}, loading: false },
      migrateButton: { text: '', disabled: true, onClick: () => {}, loading: false },
      singleButton: {
        text: 'Migrate',
        disabled: false,
        onClick: handleMigrate,
        loading: false,
      },
    };
  };

  const buttonStates = getButtonStates();

  return (
    <div style={{ gap: 'var(--layout-space-comfortable)' }} className="flex flex-col w-full">
      <div className="inline-flex flex-col justify-start items-start gap-2">
        <div className=" flex flex-col justify-start items-start gap-2">
          <div className="relative">
            <NetworkInputDisplay
              iconSrc={isICXToSoda ? '/coin/icx.png' : '/coin/soda.png'}
              secondaryIconSrc={isICXToSoda ? '/coin/icx1.png' : '/coin/s1.png'}
              label={isICXToSoda ? 'ICON Network' : 'Sonic Network'}
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
                <div className="absolute -top-20 left-15 mt-2 z-50">
                  <AnimatedTooltip onComplete={handleTooltipComplete} />
                </div>
              )}
            </NetworkInputDisplay>
            <button
              type="button"
              className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-offset-[-4px] border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
              onClick={() => setIsICXToSoda(!isICXToSoda)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <title>Arrow down</title>
                <g clip-path="url(#clip0_9664_9869)">
                  <path
                    d="M5.5 8.5L3.5 10.5L1.5 8.5"
                    stroke="#483534"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M3.5 10.5V4.5"
                    stroke="#483534"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M10.5 3.5L8.5 1.5L6.5 3.5"
                    stroke="black"
                    stroke-width="1.33333"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M8.5 7.5V1.5"
                    stroke="black"
                    stroke-width="1.33333"
                    stroke-linecap="round"
                    stroke-linejoin="round"
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
            label={isICXToSoda ? 'Sonic Network' : 'ICON Network'}
            description="To"
            tokenSymbol={isICXToSoda ? 'SODA' : 'ICX'}
            availableAmount={isICXToSoda ? 'Receive' : 'Receive'}
            inputValue={isICXToSoda ? sodaInputValue : icxInputValue}
            onInputChange={isICXToSoda ? handleSodaInputChange : handleIcxInputChange}
            readOnly
            showMaxButton={false}
          />
        </div>
      </div>
      <div className="flex flex-col" style={{ gap: 'var(--layout-space-comfortable)' }}>
        <div className="inline-flex flex-col justify-start items-start gap-4">
          {buttonStates.showTwoButtons ? (
            <div className="flex gap-2">
              <Button
                variant="cherry"
                className="w-full bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white w-34"
                onClick={buttonStates.approveButton.onClick}
                disabled={buttonStates.approveButton.disabled}
              >
                {buttonStates.approveButton.loading ? (
                  <>
                    {buttonStates.approveButton.text}
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  </>
                ) : (
                  <>
                    {buttonStates.approveButton.text}
                    {buttonStates.approveButton.text === 'Approved' && <Check className="w-4 h-4 ml-2" />}
                  </>
                )}
              </Button>
              <Button
                variant="cherry"
                className="w-full bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white w-58"
                onClick={buttonStates.migrateButton.onClick}
                disabled={buttonStates.migrateButton.disabled}
              >
                {buttonStates.migrateButton.loading ? (
                  <>
                    {buttonStates.migrateButton.text}
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  </>
                ) : (
                  buttonStates.migrateButton.text
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="cherry"
              className="w-full sm:w-[232px] bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white"
              onClick={buttonStates.singleButton.onClick}
              disabled={buttonStates.singleButton.disabled}
            >
              {buttonStates.singleButton.loading ? (
                <>
                  {buttonStates.singleButton.text}
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                </>
              ) : (
                buttonStates.singleButton.text
              )}
            </Button>
          )}
          <div className="text-center justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
            Takes ~1 min · Network fee: ~0.02 ICX
          </div>
        </div>
        <div
          className=" mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2"
          style={{ padding: 'var(--layout-space-comfortable)' }}
        >
          <div className=" inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply">
              <img src="/symbol.png" alt="" />
            </div>
            <div className="flex-1 justify-center text-espresso font-bold font-['InterRegular'] leading-snug text-(size:--body-super-comfortable)">
              {isICXToSoda ? "You're migrating to Sonic" : "You're migrating to ICON"}
            </div>
          </div>
          <div className=" justify-center text-clay font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
            {isICXToSoda
              ? "You won't need S token to receive your SODA. But you will for any future transactions on Sonic."
              : "You won't need S token to receive your ICX. But you will for any future transactions on ICON."}
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md md:max-w-[480px] p-12">
          <DialogHeader>
            <div className="flex flex-row justify-between items-center">
              <div className="inline-flex justify-start items-center gap-2">
                <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
                <div className="mix-blend-multiply justify-end text-espresso font-['InterRegular'] font-bold leading-snug text-(size:--subtitle)">
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
                <div className="mix-blend-multiply justify-end text-espresso font-['InterRegular'] font-bold leading-snug text-(size:--subtitle)">
                  Transaction failed
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <p className="text-clay-light font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
              {migrationError || 'An error occurred during migration. Please try again.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const getTabContent = (tabValue: string, onOpenWalletModal?: () => void): React.JSX.Element => {
  switch (tabValue) {
    case 'swap':
      return <SwapContent />;
    case 'savings':
      return <SavingsContent />;
    case 'loans':
      return <LoansContent />;
    case 'migrate':
      return <MigrateContent onOpenWalletModal={onOpenWalletModal || (() => {})} />;
    default:
      return <SwapContent />;
  }
};

const AppsContainer = () => {
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingWalletConnection, setPendingWalletConnection] = useState<{
    xConnector: XConnector;
    xChainType: string;
  } | null>(null);
  const [connectedWalletName, setConnectedWalletName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('migrate');
  const [arrowPosition, setArrowPosition] = useState(252);
  const [mobileArrowPosition, setMobileArrowPosition] = useState(0);
  const { mutateAsync: xConnect } = useXConnect();
  const xDisconnect = useXDisconnect();
  const xAccounts = useXAccounts();
  const connectedChains = Object.entries(xAccounts)
    .filter(([_, account]) => account?.address)
    .map(([chainType, account]) => ({
      chainType,
      address: account?.address,
    }));
  // const { isRegistering, notification, mounted, handleWalletClick, isConnected, address } = useWallet();

  const handleConnectWallets = (): void => {
    setShowWalletModal(true);
  };

  const handleWalletSelected = async (xConnector: XConnector, xChainType: string): Promise<void> => {
    const walletName =
      typeof xConnector === 'object' && xConnector !== null && 'name' in xConnector
        ? (xConnector as { name: string }).name
        : 'Wallet';
    setConnectedWalletName(walletName);

    try {
      // await xConnect(xConnector);
      setPendingWalletConnection({ xConnector, xChainType });
      setShowTermsModal(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnectedWalletName('');
      setShowWalletModal(true);
    }
  };

  const handleTermsAccepted = async (): Promise<void> => {
    if (pendingWalletConnection) {
      try {
        console.log('Terms accepted, completing wallet connection flow:', pendingWalletConnection);
        const { xConnector, xChainType } = pendingWalletConnection;

        setPendingWalletConnection(null);
        setConnectedWalletName('');
        setShowTermsModal(false);

        setShowWalletModal(true);
        if (connectedChains.length >= 2) {
          setTimeout(() => {
            setShowWalletModal(false);
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to complete wallet connection flow:', error);
        setPendingWalletConnection(null);
        setConnectedWalletName('');
        setShowTermsModal(false);
      }
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    if (pendingWalletConnection) {
      const { xChainType } = pendingWalletConnection;
      xDisconnect(xChainType as ChainType);
    }
  };

  const desktopTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const mobileTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const mobileTabsContainerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const toggle = (): void => setIsOpen(!isOpen);
  const [openRewardDialog, setOpenRewardDialog] = useState(false);

  // Update arrow position when active tab changes
  useEffect(() => {
    const updateArrowPosition = (): void => {
      const desktopActiveTabElement = desktopTabRefs.current[activeTab];
      const mobileActiveTabElement = mobileTabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;
      const mobileContainerElement = mobileTabsContainerRef.current;
      // Update desktop arrow position
      if (desktopActiveTabElement && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const tabRect = desktopActiveTabElement.getBoundingClientRect();
        const relativeTop = tabRect.top - containerRect.top;
        setArrowPosition(relativeTop - 30); // Use relative position from parent container
      }

      // Update mobile arrow position
      if (mobileActiveTabElement && mobileContainerElement) {
        const mobileContainerRect = mobileContainerElement.getBoundingClientRect();
        const tabRect = mobileActiveTabElement.getBoundingClientRect();
        const relativeLeft = tabRect.left - mobileContainerRect.left;
        const tabWidth = tabRect.width;
        setMobileArrowPosition(relativeLeft + tabWidth / 2 - 48); // Center the arrow on the tab
      }
    };

    updateArrowPosition();
    // const timeoutId = setTimeout(updateArrowPosition, 100);
    // return () => clearTimeout(timeoutId);
  }, [activeTab]);

  useEffect(() => {
    const handleResize = (): void => {
      const desktopActiveTabElement = desktopTabRefs.current[activeTab];
      const mobileActiveTabElement = mobileTabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;
      const mobileContainerElement = mobileTabsContainerRef.current;

      // Update desktop arrow position
      if (desktopActiveTabElement && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const tabRect = desktopActiveTabElement.getBoundingClientRect();
        const relativeTop = tabRect.top - containerRect.top;
        setArrowPosition(relativeTop - 30); // Use relative position from parent container
      }

      // Update mobile arrow position
      if (mobileActiveTabElement && mobileContainerElement) {
        const mobileContainerRect = mobileContainerElement.getBoundingClientRect();
        const tabRect = mobileActiveTabElement.getBoundingClientRect();
        const relativeLeft = tabRect.left - mobileContainerRect.left;
        const tabWidth = tabRect.width;
        setMobileArrowPosition(relativeLeft + tabWidth / 2 - 50);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab]);

  const handleTabChange = (value: string): void => {
    setActiveTab(value);
  };

  const setDesktopTabRef =
    (value: string) =>
    (el: HTMLButtonElement | null): void => {
      desktopTabRefs.current[value] = el;
    };

  const setMobileTabRef =
    (value: string) =>
    (el: HTMLButtonElement | null): void => {
      mobileTabRefs.current[value] = el;
    };

  return (
    <div className="bg-cream-white min-h-screen pb-24 md:pb-0 w-[100vw] overflow-x-hidden">
      <Sidebar isOpen={isOpen} toggle={toggle} setOpenRewardDialog={setOpenRewardDialog} />
      <div className=" h-60 pt-10 relative inline-flex flex-col justify-start items-center gap-2 w-full">
        <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
        <div className="w-full max-w-[1200px] justify-between items-center h-10 z-1 inline-flex px-6">
          <div className="flex justify-start items-center">
            <div className="flex lg:hidden mr-2 text-white cursor-pointer" onClick={toggle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-label="Menu">
                <title>Menu</title>
                <path fill="#fff" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
              </svg>
            </div>
            <div
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} className="mr-2" />
              {/* <span className="font-black text-2xl text-white logo-word hidden sm:flex">SODAX</span> */}
              <svg
                className="hidden lg:block"
                xmlns="http://www.w3.org/2000/svg"
                width="84"
                height="18"
                viewBox="0 0 84 18"
                fill="none"
                aria-label="SODAX"
              >
                <title>SODAX</title>
                <path
                  d="M10.5058 7.32721C10.0229 7.20648 9.53998 7.08576 9.05708 6.96503C7.30656 6.54249 5.76732 6.18032 5.70696 5.15415C5.70696 3.97708 7.18584 3.91672 7.63856 3.91672C8.24219 3.91672 8.81563 4.06762 9.20799 4.33926C9.66071 4.64107 9.90216 5.09379 9.87198 5.60687H14.2785C14.037 1.26076 10.0531 0.626953 7.66874 0.626953C4.71097 0.626953 1.30048 1.98511 1.30048 5.81814C1.30048 8.86646 3.89607 9.59081 6.40112 10.285L6.67276 10.3755C9.44944 11.1602 10.2643 11.4017 10.2643 12.3675C10.2643 13.5747 9.11744 13.9973 8.06110 13.9973C6.70294 13.9973 5.85786 13.5747 5.52587 12.7297C5.40514 12.458 5.34478 12.126 5.34478 11.7639H0.666672C0.817578 17.0154 6.49167 17.2871 7.63856 17.2871C9.35890 17.2871 14.9726 16.8947 14.9726 11.8544C14.9726 8.957 12.7090 7.93084 10.5058 7.32721Z"
                  fill="white"
                />
                <path
                  d="M24.9324 0.626953C20.1939 0.626953 16.8739 4.06763 16.8739 8.957C16.8739 13.8464 20.1939 17.2871 24.9324 17.2871C29.6708 17.2871 32.9908 13.8464 32.9908 8.957C32.9908 4.06763 29.6708 0.626953 24.9324 0.626953ZM24.9324 13.5446C23.3026 13.5446 21.5521 12.3373 21.5521 8.957C21.5521 5.57669 23.3026 4.36944 24.9324 4.36944C26.5622 4.36944 28.3127 5.57669 28.3127 8.957C28.3127 12.3373 26.5622 13.5446 24.9324 13.5446Z"
                  fill="white"
                />
                <path
                  d="M50.3752 8.92597C50.3752 7.05473 49.8621 0.988281 43.2222 0.988281H35.1939V16.8938H42.2564C47.4777 16.8938 50.3752 14.0568 50.3752 8.92597ZM39.872 13.0608V4.85149H41.6226C45.3952 4.85149 45.697 7.92999 45.697 8.86561C45.697 10.435 45.2141 13.0608 41.9847 13.0608H39.872Z"
                  fill="white"
                />
                <path
                  d="M61.6629 14.6011L62.3571 16.9251H67.1861L61.3913 1.01953H56.7132L50.858 16.9251H55.5361L56.2605 14.6011H61.6629ZM58.9466 6.12018H59.2182L60.7575 11.4019H57.2866L58.9466 6.12018Z"
                  fill="white"
                />
                <path
                  d="M77.7194 16.9281H83.3332L77.6591 8.50752L82.7597 1.05273H77.5987L75.0937 5.61012L72.5584 1.05273H67.0956L72.317 8.47734L66.5523 16.9281H71.8944L74.8522 11.9482L77.7194 16.9281Z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="justify-center text-cream hidden sm:flex ml-8 gap-1">
              <span className="text-xs font-bold font-[InterRegular] leading-none">Money, as it</span>
              <span className="text-xs font-normal font-[Shrikhand] leading-none mt-[1px]">should</span>
              <span className="text-xs font-bold font-[InterRegular] leading-none">be</span>
            </div>
          </div>
          <div className="flex justify-end items-center">
            <div className="hidden lg:flex justify-end items-center gap-4">
              <Link href="/">
                <span className="text-cream font-[InterMedium] transition-all hover:text-vibrant-white cursor-pointer text-(size:--body-comfortable)">
                  About
                </span>
              </Link>
              <Link href="/">
                <span className="text-cream font-[InterMedium] transition-all hover:text-vibrant-white cursor-pointer text-(size:--body-comfortable)">
                  Partners
                </span>
              </Link>
              <Link href="/">
                <span className="text-cream font-[InterMedium] transition-all hover:text-vibrant-white cursor-pointer text-(size:--body-comfortable)">
                  Community
                </span>
              </Link>
            </div>
            <div className="inline-flex justify-center items-start relative mr-2 ml-5">
              {/* <ConnectWalletButton
                onWalletClick={handleWalletClick}
                onConnectModalChange={setConnectModalOpen}
                buttonText={{
                  default: 'connect',
                  connecting: 'connecting...',
                  registering: 'registering...',
                }}
              ></ConnectWalletButton> */}
              {(() => {
                const xAccounts = useXAccounts();
                const connectedWalletsCount = Object.values(xAccounts).filter(xAccount => xAccount?.address).length;

                if (connectedWalletsCount >= 2) {
                  return <ConnectedChainsDisplay onClick={() => setShowWalletModal(true)} />;
                }
                return <DecoratedButton onClick={() => setShowWalletModal(true)}>connect</DecoratedButton>;
              })()}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[100vw] md:w-[full] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent p-0 shadow-none border-0 data-[state=open]:animate-none z-50 m-auto md:-mt-34 -mt-36 h-wekit">
        <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
          <div className="flex justify-center items-start min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-224px)] z-50">
            {/* Desktop sidebar */}
            <div
              className="hidden md:flex md:w-[264px] lg:w-[304px] flex flex-col justify-center items-start lg:pt-4"
              style={{ height: '-webkit-fill-available' }}
            >
              <div
                ref={tabsContainerRef}
                className="md:w-[264px] lg:w-[304px] p-[120px_32px] lg:p-[120px_56px] flex flex-col items-start gap-[8px] rounded-tl-[2rem] bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] min-h-[calc(100vh-104px)] lg:min-h-[calc(100vh-256px)] h-full relative"
              >
                <TabsList data-orientation="vertical" className="grid min-w-25 gap-y-8 shrink-0 bg-transparent p-0">
                  {tabConfigs.map(tab => (
                    <TabItem
                      key={tab.value}
                      value={tab.value}
                      type={tab.type}
                      label={tab.label}
                      isActive={activeTab === tab.value}
                      setTabRef={setDesktopTabRef(tab.value)}
                      className="px-0 cursor-pointer"
                    />
                  ))}
                </TabsList>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="80"
                  viewBox="0 0 16 80"
                  fill="none"
                  aria-label="Deposit Dialog"
                  className="absolute hidden md:block transition-all duration-300 ease-in-out z-51"
                  style={{ top: `${arrowPosition}px`, right: '63px' }}
                >
                  <title>Deposit Dialog</title>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.76995e-07 40C3.92926e-07 38.125 0.941131 37.1741 1.88235 36.6667C11.1437 31.6736 16 18.033 16 -1.90798e-07L16 80C16 61.967 11.1437 48.3264 1.88235 43.3333C0.941131 42.8259 5.61065e-07 41.875 4.76995e-07 40Z"
                    fill="#F9F7F5"
                  />
                </svg>
              </div>
            </div>

            <div
              className="w-full md:w-[calc(100%-200px)] lg:w-[784px] min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)] p-[80px_16px] pb-10 md:p-[120px_48px] lg:p-[120px_80px] flex items-start gap-[8px] rounded-tl-[2rem] rounded-tr-[2rem] border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] to-transparent relative md:-ml-16 border-b-0"
              style={{ backgroundColor: '#F5F2F2' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="80"
                height="16"
                viewBox="0 0 80 16"
                fill="none"
                className="absolute transition-all duration-300 ease-in-out md:hidden"
                style={{ bottom: '-1px', left: `${mobileArrowPosition}px` }}
                aria-label="Deposit Dialog"
              >
                <title>Deposit Dialog</title>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M40 -1.27146e-06C41.875 -1.27357e-06 42.8259 0.941129 43.3333 1.88235C48.3264 11.1437 61.967 16 80 16L-5.08584e-07 16C18.033 16 31.6736 11.1437 36.6667 1.88235C37.1741 0.941129 38.125 -1.26935e-06 40 -1.27146e-06Z"
                  fill="#EDE6E6"
                />
              </svg>
              {tabConfigs.map(tab => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div className="flex flex-col w-full" style={{ gap: 'var(--layout-space-comfortable)' }}>
                    <SharedContent />
                    {getTabContent(tab.value, () => setShowWalletModal(true))}
                  </div>
                </TabsContent>
              ))}
            </div>

            {/* Mobile bottom tabs */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[96px] ">
              <div className="relative">
                <div ref={mobileTabsContainerRef} className="w-full px-4 py-4 bg-cream-white h-[96px] flex">
                  <TabsList data-orientation="horizontal" className="grid grid-cols-4 gap-4 bg-transparent py-0">
                    {tabConfigs.map(tab => (
                      <TabItem
                        key={tab.value}
                        value={tab.value}
                        type={tab.type}
                        label={tab.label}
                        isActive={activeTab === tab.value}
                        isMobile={true}
                        setTabRef={setMobileTabRef(tab.value)}
                      />
                    ))}
                  </TabsList>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onDismiss={() => setShowWalletModal(false)}
        onWalletSelected={handleWalletSelected}
      />

      <TermsConfirmationModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onAccept={handleTermsAccepted}
        onDisconnect={handleDisconnect}
        walletName={connectedWalletName}
      />
    </div>
  );
};

export default AppsContainer;
