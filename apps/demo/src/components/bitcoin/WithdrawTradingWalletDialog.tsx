import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RadfiMaxSpentResponse } from '@sodax/sdk';
import { Loader2, ArrowRight, Info } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';

interface WithdrawTradingWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradingAddress: string;
  tradingBalance: bigint;
  connectorName: string;
  connectorIcon: string;
  onWithdraw: (amount: string, withdrawTo: string) => Promise<{ txId: string; fee: number }>;
  isWithdrawing: boolean;
  onFetchMax: (withdrawTo: string) => Promise<RadfiMaxSpentResponse | undefined>;
}

const truncateAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

const SODAX_ICON = '/sodax-symbol.svg';

export const WithdrawTradingWalletDialog = ({
  open,
  onOpenChange,
  tradingAddress,
  tradingBalance,
  connectorName,
  connectorIcon,
  onWithdraw,
  isWithdrawing,
  onFetchMax,
}: WithdrawTradingWalletDialogProps) => {
  const [amount, setAmount] = useState('');
  const [withdrawTo, setWithdrawTo] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxSatsAmt, setMaxSatsAmt] = useState<number | undefined>(undefined);
  const [isLoadingMax, setIsLoadingMax] = useState(false);
  const [fee, setFee] = useState<number | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setWithdrawTo('');
      setSuccess(false);
      setError(null);
      setMaxSatsAmt(undefined);
      setFee(null);
    }
  }, [open]);

  const handleFetchMax = async () => {
    if (!withdrawTo) return;
    setIsLoadingMax(true);
    try {
      const result = await onFetchMax(withdrawTo);
      if (result) {
        const maxSats = Math.floor(result.maxSatsAmt);
        const feeSats = Math.ceil(result.fee);
        setMaxSatsAmt(maxSats);
        setFee(feeSats);
        setAmount(formatUnits(BigInt(maxSats), 8));
      }
    } catch (e) {
      console.error('Failed to fetch max withdrawable:', e);
      setMaxSatsAmt(undefined);
      setError(e instanceof Error ? e.message : 'Failed to fetch max amount');
    } finally {
      setIsLoadingMax(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !withdrawTo || Number(amount) <= 0) return;
    setError(null);
    try {
      const result = await onWithdraw(parseUnits(amount, 8).toString(), withdrawTo);
      setFee(result.fee);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdraw failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw to wallet</DialogTitle>
          <DialogDescription>
            Withdraw BTC from your trading wallet to any Bitcoin address
          </DialogDescription>
        </DialogHeader>

        {/* From -> To visual */}
        <div className="flex items-start justify-center gap-6 py-4">
          {/* From: Trading wallet */}
          <div className="flex flex-col items-center gap-2 w-[140px]">
            <span className="text-xs text-muted-foreground font-medium">From trading wallet</span>
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
              <img src={SODAX_ICON} alt="Sodax" className="w-9 h-9 object-contain" />
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {truncateAddress(tradingAddress)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatUnits(tradingBalance, 8)} BTC
            </span>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-5 w-5 text-muted-foreground mt-8 shrink-0" />

          {/* To: Personal wallet */}
          <div className="flex flex-col items-center gap-2 w-[140px]">
            <span className="text-xs text-muted-foreground font-medium">To personal wallet</span>
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
              <img src={connectorIcon} alt={connectorName} className="w-9 h-9 object-contain" />
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {withdrawTo ? truncateAddress(withdrawTo) : '---'}
            </span>
            <span className="text-xs text-muted-foreground invisible">placeholder</span>
          </div>
        </div>

        {/* Withdraw to address */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Withdraw to</span>
          <Input
            type="text"
            placeholder="Bitcoin address (e.g. bc1q...)"
            value={withdrawTo}
            onChange={e => setWithdrawTo(e.target.value)}
            className="h-9 text-sm font-mono"
          />
          <span className="text-xs text-muted-foreground">
            SegWit address recommended for lower fees
          </span>
        </div>

        {/* Amount + Max */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Amount (BTC)</span>
            <span className="text-xs text-muted-foreground">
              Balance: <span className="font-medium text-foreground">{formatUnits(tradingBalance, 8)} BTC</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="h-9 text-sm flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleFetchMax}
              disabled={isLoadingMax || !withdrawTo}
              className="shrink-0 h-9"
            >
              {isLoadingMax ? <Loader2 className="h-4 w-4 animate-spin" /> : 'MAX'}
            </Button>
          </div>
          {maxSatsAmt !== undefined && fee !== null && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Max: <span className="font-medium text-foreground">{formatUnits(BigInt(maxSatsAmt), 8)} BTC</span>
              </span>
              <span>
                Fee: <span className="font-medium text-foreground">{fee} sats</span>
              </span>
            </div>
          )}
        </div>

        {/* Withdraw button */}
        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || !amount || !withdrawTo || Number(amount) <= 0}
          className="w-full"
        >
          {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Withdraw
        </Button>

        {success && (
          <p className="text-xs text-green-500 text-center">Withdrawal submitted successfully!</p>
        )}

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Network fee is deducted from the trading wallet balance. The recipient receives the full amount.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
