// apps/demo/src/components/dex/Setup.tsx
import React, { type JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wallet } from 'lucide-react';
import type { ChainType } from '@sodax/sdk';
import type { ChainId } from '@sodax/types';
import { getXChainType, useEvmSwitchChain, type XAccount } from '@sodax/wallet-sdk-react';
import { ChainSelector } from '@/components/shared/ChainSelector';

interface SetupProps {
  selectedChainId: ChainId;
  selectChainId: (chainId: ChainId) => void;
  xAccount: XAccount | null;
  openWalletModal: () => void;
  disconnect: (chainType: ChainType) => void;
}

export function Setup({
  selectedChainId,
  selectChainId,
  xAccount,
  openWalletModal,
  disconnect,
}: SetupProps): JSX.Element {
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chain Selection */}
        <div className="space-y-2">
          <Label htmlFor="chain">Select Chain</Label>
          {selectedChainId ? (
            <ChainSelector selectedChainId={selectedChainId} selectChainId={selectChainId} />
          ) : (
            <p className="text-sm text-muted-foreground">Please select a chain</p>
          )}
          <p className="text-xs text-muted-foreground">Selected chain: {selectedChainId || 'None'}</p>
        </div>

        {/* Wallet Connection */}
        <div className="space-y-2">
          <Label>Wallet</Label>
          {xAccount?.address ? (
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="font-mono text-sm">
                  {xAccount.address.slice(0, 6)}...{xAccount.address.slice(-4)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedChainId) {
                      disconnect(getXChainType(selectedChainId) as ChainType);
                    }
                  }}
                >
                  Disconnect
                </Button>
                {isWrongChain && (
                  <Button className="w-full max-w-[120px]" type="button" variant="default" onClick={handleSwitchChain}>
                    Switch Chain
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-md border-dashed">
              <p className="text-sm text-muted-foreground">Connect your wallet to manage liquidity</p>
              <Button onClick={openWalletModal}>Connect Wallet</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
