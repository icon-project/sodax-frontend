import { sodax } from '@/app/config';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHubProvider } from '@/hooks/useHubProvider';
import { sdkChainIdMap, useHubWallet } from '@/hooks/useHubWallet';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import {
  type EvmHubProvider,
  EvmSpokeService,
  type IntentRelayRequest,
  MoneyMarketService,
  type SubmitTxResponse,
  submitTransaction,
} from '@new-world/sdk';
import type { XToken } from '@new-world/xwagmi';
import { getXChainType, useXAccount } from '@new-world/xwagmi';
import { useState } from 'react';
import { parseUnits } from 'viem';

export function SupplyButton({ token }: { token: XToken }) {
  const { address } = useXAccount(getXChainType(token.xChainId));

  const hubProvider = useHubProvider('sonic-blaze');
  const spokeProvider = useSpokeProvider(token.xChainId);
  const { data: hubWallet } = useHubWallet(token.xChainId, address, hubProvider as EvmHubProvider);

  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSupply = async () => {
    if (!hubWallet) {
      console.log('hubWallet is not found');
      return;
    }
    if (!spokeProvider) {
      console.log('spokeProvider is not found');
      return;
    }
    if (!hubProvider) {
      console.log('hubProvider is not found');
      return;
    }

    setIsLoading(true);

    try {
      const data = sodax.moneyMarket.supplyData(
        token.address,
        hubWallet,
        parseUnits(amount, token.decimals),
        // @ts-ignore
        sdkChainIdMap[token.xChainId],
      );

      // TODO: use SpokeService.deposit instead of EvmSpokeService.deposit
      const txHash = await EvmSpokeService.deposit(
        {
          from: address as `0x${string}`,
          token: token.address as `0x${string}`,
          amount: parseUnits(amount, token.decimals),
          data,
        },
        spokeProvider,
        hubProvider,
      );

      console.log('txHash', txHash);
      const request = {
        action: 'submit',
        params: {
          chain_id: '6',
          tx_hash: txHash,
        },
      } satisfies IntentRelayRequest<'submit'>;

      // TODO: use the correct endpoint
      const response: SubmitTxResponse = await submitTransaction(
        request,
        'https://53naa6u2qd.execute-api.us-east-1.amazonaws.com/prod',
      );

      setOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      window.alert('Error submitting transaction');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Supply</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supply {token.symbol}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center gap-2">
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              <span>{token.symbol}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button className="w-full" type="button" variant="default" onClick={handleSupply} disabled={isLoading}>
            Supply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
