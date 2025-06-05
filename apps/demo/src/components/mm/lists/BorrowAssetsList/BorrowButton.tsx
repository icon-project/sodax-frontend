import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBorrow } from '@new-world/dapp-kit';
import type { XToken } from '@new-world/xwagmi';
import { useState } from 'react';
import { useEvmSwitchChain } from '@new-world/xwagmi';

export function BorrowButton({ token }: { token: XToken }) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  console.log('token', token, token.xChainId);
  const { borrow, isLoading, error, resetError } = useBorrow(token, token.xChainId);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(token.xChainId);

  const handleBorrow = async () => {
    try {
      await borrow(amount);
      setOpen(false);
    } catch (err) {
      console.error('Error in handleBorrow:', err);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setAmount('');
      resetError?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => {
            resetError?.();
            setOpen(true);
          }}
        >
          Borrow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Borrow {token.symbol}</DialogTitle>
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
        {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
        <DialogFooter className="sm:justify-start">
          {isWrongChain && (
            <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
              Switch Chain
            </Button>
          )}
          {!isWrongChain && (
            <Button className="w-full" type="button" variant="default" onClick={handleBorrow} disabled={isLoading}>
              {isLoading ? 'Borrowing...' : 'Borrow'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
