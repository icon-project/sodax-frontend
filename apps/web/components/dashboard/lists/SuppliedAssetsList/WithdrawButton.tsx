import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHubProvider } from '@/hooks/useHubProvider';
import { useHubWallet } from '@/hooks/useHubWallet';
import { useMoneyMarketConfig } from '@/hooks/useMoneyMarketConfig';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import type { EvmHubProvider, IntentRelayRequest, SubmitTxResponse } from '@new-world/sdk';
import { MoneyMarketService, SpokeService, submitTransaction } from '@new-world/sdk';
import type { XToken } from '@new-world/xwagmi';
import { getXChainType, useXAccount } from '@new-world/xwagmi';
import { useState } from 'react';
import type { Hash, Hex } from 'viem';
import { parseUnits } from 'viem';

export function WithdrawButton({ token }: { token: XToken }) {
  const { address } = useXAccount(getXChainType('0xa869.fuji'));

  const moneyMarketConfig = useMoneyMarketConfig();
  const hubProvider = useHubProvider('sonic-blaze');
  const spokeProvider = useSpokeProvider('0xa869.fuji');
  const { data: hubWallet } = useHubWallet('0xa869.fuji', address, hubProvider as EvmHubProvider);

  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWithdraw = async () => {
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

    const data: Hex = MoneyMarketService.withdrawData(
      hubWallet,
      spokeProvider.walletProvider.walletClient.account.address,
      '0x0000000000000000000000000000000000000000',
      parseUnits(amount, token.decimals),
      spokeProvider.chainConfig.chain.id,
      hubProvider,
      moneyMarketConfig,
    );

    const txHash: Hash = await SpokeService.callWallet(
      spokeProvider.walletProvider.walletClient.account.address,
      data,
      spokeProvider,
      hubProvider,
    );

    console.log('[withdraw] txHash', txHash);

    try {
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

      console.log('response', response);
    } catch (error) {
      console.log('error', error);
    } finally {
      setOpen(false);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Withdraw</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw {token.symbol}</DialogTitle>
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
          <Button className="w-full" type="button" variant="default" onClick={handleWithdraw} disabled={isLoading}>
            {isLoading ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
