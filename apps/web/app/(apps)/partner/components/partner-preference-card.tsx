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

export function PartnerPreferencesCard({ address }: { address: Address }) {
  const { data: prefs, updateMutation } = useFeeClaimPreferences(address);
  const [isLocked, setIsLocked] = useState(false);

  const [dstChain, setDstChain] = useState<ChainId>(SONIC_MAINNET_CHAIN_ID);
  const [dstToken, setDstToken] = useState<'' | Address>('');
  const SONIC_USDC_ADDRESS = '0x2921986d3d17411b2d993021ec95029e92383769';

  // Sync local state when preferences load
  useEffect(() => {
    if (prefs) {
      setDstChain(prefs.dstChain as ChainId);
      setDstToken(prefs.outputToken);
    }
  }, [prefs]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        outputToken: dstToken as Address,
        dstChain: dstChain,
        dstAddress: address, // Usually sending to the same wallet
      },
      {
        onSuccess: () => {
          setIsLocked(true);
          toast.success('Auto-swap destination set', {
            description: `Fees will be sent to USDC on ${dstChain}`,
          });
        },
        onError: err => toast.error(`Failed to update: ${err.message}`),
      },
    );
  };

  return (
    <main className="bg-transparent w-1/2">
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
              disabled={isLocked}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-clay-light">Target Asset</Label>
            <TokenSelectDropdown
              selectedToken={dstToken}
              onSelectToken={token => setDstToken(token)}
              tokens={[
                {
                  address: SONIC_USDC_ADDRESS,
                  symbol: 'USDC',
                },
              ]}
              disabled={isLocked}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="cherry"
            className="px-8 py-5"
            size="sm"
            onClick={handleSave}
            disabled={isLocked || updateMutation.isPending || !dstToken}
          >
            {updateMutation.isPending ? 'Setting destination…' : isLocked ? 'Destination Set ✓' : 'Confirm'}
          </Button>
        </div>
      </CardContent>
    </main>
  );
}
