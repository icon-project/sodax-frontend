import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWithdraw } from '@new-world/dapp-kit';
import type { XToken } from '@new-world/xwagmi';
import { useState } from 'react';

export function WithdrawButton({ token }: { token: XToken }) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const { withdraw, isLoading, error } = useWithdraw(token, '0xa869.fuji');

  const handleWithdraw = async () => {
    await withdraw(amount);
    if (!error) {
      setOpen(false);
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
