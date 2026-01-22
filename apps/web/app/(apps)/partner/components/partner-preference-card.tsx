'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChainSelectDropdown } from '@/components/shared/chain-select-dropdown';
import { SONIC_MAINNET_CHAIN_ID, spokeChainConfig, type ChainId, type Address } from '@sodax/types';
import { toast } from '@/components/ui/sonner';
import { Settings2 } from 'lucide-react';
import { useFeeClaimPreferences } from '../utils/useFeeClaimPreferences';

export function PartnerPreferencesCard({ address }: { address: Address }) {
  const { data: prefs, updateMutation, isLoading } = useFeeClaimPreferences(address);

  const [dstChain, setDstChain] = useState<ChainId>(SONIC_MAINNET_CHAIN_ID);
  // Defaulting to USDC for the demo/standard UX
  const [dstToken, setDstToken] = useState<string>('');

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
        onSuccess: () => toast.success('Preferences updated successfully'),
        onError: err => toast.error(`Failed to update: ${err.message}`),
      },
    );
  };

  return (
    <Card className="border-cherry-grey/20 bg-white/50 backdrop-blur-sm mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-bold flex items-center gap-2 text-clay">
          <Settings2 className="w-4 h-4 text-cherry" />
          Auto-Swap Configuration
        </CardTitle>
        <p className="text-xs text-clay-medium">
          Set your preferred destination for all fee claims. All tokens will be swapped and sent here automatically.
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
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-clay-light">Target Asset</Label>
            {/* You can replace this with a TokenSelectDropdown later */}
            <select
              className="w-full h-10 px-3 rounded-md border border-clay-light/20 bg-white text-sm"
              value={dstToken}
              onChange={e => setDstToken(e.target.value)}
            >
              <option value="">Select Token...</option>
              <option value="0x2921986d3d17411b2d993021ec95029e92383769">USDC (Sonic)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="cherry" size="sm" onClick={handleSave} disabled={updateMutation.isPending || !dstToken}>
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
