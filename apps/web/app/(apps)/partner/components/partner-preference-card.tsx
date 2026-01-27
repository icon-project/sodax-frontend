'use client';

import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChainSelectDropdown } from '@/components/shared/chain-select-dropdown';
import { SONIC_MAINNET_CHAIN_ID, spokeChainConfig, type ChainId, type Address } from '@sodax/types';
import { toast } from '@/components/ui/sonner';
import { Settings2 } from 'lucide-react';
import { useFeeClaimPreferences } from '../utils/useFeeClaimPreferences';
import { TokenSelectDropdown } from '@/components/shared/token-select-dropdown';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { getChainName } from '@/constants/chains';
import { useQueryClient } from '@tanstack/react-query';

export function PartnerPreferencesCard({ address }: { address: Address }) {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();
  const { data: prefs, updateMutation } = useFeeClaimPreferences(address);

  const [dstChain, setDstChain] = useState<ChainId>(SONIC_MAINNET_CHAIN_ID);
  const [dstToken, setDstToken] = useState<Address | null>(null);
  const SonicUsdcToken = spokeChainConfig[SONIC_MAINNET_CHAIN_ID]?.supportedTokens?.USDC;

  // Using isFetching ensures the button stays disabled while the data is reloading
  const isRefetching = queryClient.isFetching({ queryKey: ['feeClaimPrefs', address] }) > 0;

  const hasChanged = prefs ? prefs.dstChain !== dstChain || prefs.outputToken !== dstToken : true;

  // Update the disabled condition
  const isButtonDisabled = updateMutation.isPending || isRefetching || !hasChanged || !dstToken;

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(SONIC_MAINNET_CHAIN_ID);

  // Sync local state when preferences load
  useEffect(() => {
    if (prefs) {
      setDstChain(prefs.dstChain as ChainId);
      setDstToken(prefs.outputToken);
    }
  }, [prefs]);

  const handleSave = () => {
    if (!dstToken) return;

    // Safety check for the contract address we found in the logs
    const contractAddress = sodax?.partners?.feeClaim?.config?.protocolIntentsContract;

    if (!contractAddress) {
      toast.error('SDK Error: Protocol Intents Contract missing');
      return;
    }

    updateMutation.mutate(
      {
        outputToken: dstToken as Address,
        dstChain: dstChain,
        dstAddress: address,
      },
      {
        onSuccess: () => {
          // Use 'feeClaimPrefs' to match the hook exactly
          queryClient.invalidateQueries({
            queryKey: ['feeClaimPrefs', address],
          });
          toast.success('Destination updated!');
        }, // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        onError: (err: any) => {
          // Use the robust error message logic to avoid "undefined"
          const msg = err?.shortMessage || err?.message || 'Update failed';
          toast.error(`Update failed: ${msg}`);
        },
      },
    );
  };

  return (
    <main id="preferences-card" className="bg-transparent w-1/2 scroll-mt-24">
      {' '}
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-bold flex items-center gap-2 text-clay">
          <Settings2 className="w-4 h-4 text-cherry" />
          Auto-Swap Destination
        </CardTitle>
        <p className="text-xs text-clay-medium">
          All fees will be automatically swapped to your target asset and sent to the selected network.{' '}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-clay-light">Receive on Chain</Label>
            <ChainSelectDropdown
              selectedChainId={dstChain}
              selectChainId={id => setDstChain(id as ChainId)}
              allowedChains={Object.values(spokeChainConfig).map(c => c.chain.id)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-clay-light">Target Asset</Label>
            <TokenSelectDropdown
              selectedToken={dstToken}
              onSelectToken={token => setDstToken(token)}
              tokens={[
                {
                  address: SonicUsdcToken?.address || '',
                  symbol: 'USDC',
                },
              ]}
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        <div className="flex justify-center">
          {isWrongChain ? (
            /* Force network switch if on the wrong chain */
            <Button variant="cherry" className="px-8 py-5" onClick={handleSwitchChain}>
              Switch to {getChainName(SONIC_MAINNET_CHAIN_ID)}
            </Button>
          ) : (
            /* The button is DISABLED if:
       1. A mutation is currently in flight (isPending)
       2. OR the current local state matches the saved preferences (!hasChanged)
       3. OR no destination token has been selected (!dstToken)
    */
            <Button variant="cherry" className="px-8 py-5" size="sm" onClick={handleSave} disabled={isButtonDisabled}>
              {updateMutation.isPending ? 'Updating...' : !hasChanged ? 'Destination Set ✓' : 'Update Destination'}
            </Button>
          )}
        </div>
      </CardContent>
    </main>
  );
}
