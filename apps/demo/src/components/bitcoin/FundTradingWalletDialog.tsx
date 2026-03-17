import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, Check, ArrowRight, Info } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';

interface FundTradingWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  tradingAddress: string;
  walletBalance: bigint;
  tradingBalance: bigint;
  connectorName: string;
  connectorIcon: string;
  onFund: (amount: bigint) => Promise<void>;
  isFunding: boolean;
}

const truncateAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

const SODAX_ICON = '/sodax-symbol.svg';

export const FundTradingWalletDialog = ({
  open,
  onOpenChange,
  walletAddress,
  tradingAddress,
  walletBalance,
  tradingBalance,
  connectorName,
  connectorIcon,
  onFund,
  isFunding,
}: FundTradingWalletDialogProps) => {
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [fundSuccess, setFundSuccess] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(tradingAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFund = async () => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) return;
    try {
      await onFund(parseUnits(amount, 8));
      setAmount('');
      setFundSuccess(true);
      setTimeout(() => setFundSuccess(false), 3000);
    } catch {
      // error handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit using {connectorName}</DialogTitle>
          <DialogDescription>
            Transfer BTC from your wallet to your Radfi trading wallet
          </DialogDescription>
        </DialogHeader>

        {/* From → To visual */}
        <div className="flex items-center justify-center gap-6 py-4">
          {/* From */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">From parent wallet</span>
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
              <img src={connectorIcon} alt={connectorName} className="w-9 h-9 object-contain" />
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {truncateAddress(walletAddress)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatUnits(walletBalance, 8)} BTC
            </span>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-5 w-5 text-muted-foreground mt-[-24px]" />

          {/* To */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">To trading wallet</span>
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
        </div>

        {/* Trading wallet address — copyable */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Transfer BTC to your trading wallet address</span>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5 border border-border">
            <span className="text-sm font-mono text-muted-foreground break-all flex-1">
              {tradingAddress}
            </span>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              title="Copy address"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            Estimated Time <span className="text-green-500">~10 minutes</span>
          </span>
        </div>

        {/* Quick fund */}
        <div className="flex items-center gap-2 pt-2">
          <Input
            type="number"
            placeholder="Amount in BTC (e.g. 0.001)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={handleFund} disabled={isFunding || !amount} className="shrink-0">
            {isFunding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Top Up
          </Button>
        </div>

        {fundSuccess && (
          <p className="text-xs text-green-500 text-center">Transaction submitted successfully!</p>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Your trading wallet is a 2-of-2 multisig with Radfi. You retain full custody — Radfi's co-sign expires after 3 months.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
