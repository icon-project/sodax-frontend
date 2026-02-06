'use client';

import { useState, useEffect } from 'react';
import { CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SONIC_MAINNET_CHAIN_ID, type ChainId, type Address, type XToken } from '@sodax/types';
import { toast } from '@/components/ui/sonner';
import { InfoIcon, Settings2 } from 'lucide-react';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { getChainName } from '@/constants/chains';
import type { useFeeClaimPreferences } from '../hooks/useFeeClaimPreferences';
import { PartnerDestinationPicker } from './partner-destination-picker';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import NetworkIcon from '@/components/shared/network-icon';
import { cn } from '@/lib/utils';

export function PartnerPreferencesCard(props: {
  address: Address;
  prefs: ReturnType<typeof useFeeClaimPreferences>['data'];
  updateMutation: ReturnType<typeof useFeeClaimPreferences>['updateMutation'];
  usdcDestinations: XToken[];
}) {
  const { sodax } = useSodaxContext();
  const { address, prefs, updateMutation, usdcDestinations } = props;

  const [dstChain, setDstChain] = useState<ChainId>(SONIC_MAINNET_CHAIN_ID);
  const [dstToken, setDstToken] = useState<Address | null>(null);

  /** UI STATE */
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const hasChanged = prefs ? prefs.dstChain !== dstChain || prefs.outputToken !== dstToken : true;
  const isButtonDisabled = updateMutation.isPending || !dstToken || !hasChanged;

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(SONIC_MAINNET_CHAIN_ID);
  const isFirstTimeSet = !prefs;

  /** Sync saved prefs → local state */
  useEffect(() => {
    if (!prefs) return;

    if (prefs.dstChain !== 'not configured') {
      setDstChain(prefs.dstChain);
    }

    setDstToken(prefs.outputToken);
  }, [prefs]);

  const handleSave = () => {
    if (!dstToken) return;

    const contractAddress = sodax?.partners?.feeClaim?.config?.protocolIntentsContract;
    if (!contractAddress) {
      toast.error('SDK Error: Protocol Intents Contract missing');
      return;
    }

    updateMutation.mutate(
      {
        outputToken: dstToken as Address,
        dstChain,
        dstAddress: address,
      },
      {
        onSuccess: () => {
          toast.success(isFirstTimeSet ? 'Saved!' : 'Updated!');
          setIsPickerOpen(false);
        },

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        onError: (err: any) => {
          const msg = err?.shortMessage || err?.message || 'Update failed';
          toast.error(`Update failed: ${msg}`);
        },
      },
    );
  };

  const getButtonLabel = () => {
    if (updateMutation.isPending) return 'Saving claim network…';
    if (!prefs) return 'Save claim network';
    if (!hasChanged) return ' Network saved';
    return 'Save claim network';
  };

  return (
    <main id="preferences-card" className="bg-transparent w-full max-w-md scroll-mt-24">
      <CardContent className="px-0">
        <div
          className={cn(
            'relative rounded-2xl border bg-cream-white px-4 py-4 transition-colors',
            isPickerOpen ? 'border-cherry/40' : 'border-cherry-grey',
          )}
        >
          {/* HEADER - Title + Chain badge in top-right */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-md font-bold flex items-center gap-2 text-clay">
                <Settings2 className="w-4 h-4 text-cherry" />
                Your claim network{' '}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center">
                      <InfoIcon className="w-4 h-4 text-clay-light cursor-default mt-px" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    variant="soft"
                    side="top"
                    align="center"
                    sideOffset={6}
                    className="text-clay bg-white"
                  >
                    Choose which network receives your USDC
                  </TooltipContent>
                </Tooltip>
              </CardTitle>

              {/* Chain badge - top right corner */}
              {dstToken && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-grey/30 text-[11px] text-clay-light whitespace-nowrap">
                  <NetworkIcon id={dstChain} className="w-3 h-3" />
                  <span className="font-medium">{getChainName(dstChain)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-clay">
              <span>Fees are converted to USDC and sent to:</span>
            </div>
          </div>

          {/* MAIN CONTENT - Picker left, Button right */}
          <div className="flex items-center justify-between gap-4 min-h-[80px]">
            {/* LEFT: Picker anchored to bottom-left */}
            <div className="flex flex-col justify-center mx-auto">
              <PartnerDestinationPicker
                availableChains={usdcDestinations}
                selectedChainId={dstChain}
                onChange={token => {
                  setDstChain(token.xChainId);
                  setDstToken(token.address as Address);
                }}
                onOpenChange={setIsPickerOpen}
              />
            </div>

            {/* RIGHT: Button in middle-right */}
            <div className="flex items-center mx-auto">
              {isWrongChain ? (
                <Button variant="cherry" className="px-6 py-4 text-sm" onClick={handleSwitchChain}>
                  Switch to {getChainName(SONIC_MAINNET_CHAIN_ID)}
                </Button>
              ) : (
                <Button
                  variant="cherry"
                  className={cn('px-6 py-4 text-sm transition-opacity', !hasChanged && 'opacity-50')}
                  onClick={handleSave}
                  disabled={isButtonDisabled}
                  aria-label={hasChanged ? 'Save claim network preferences' : 'No changes to save'}
                >
                  {getButtonLabel()}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </main>
  );
}
