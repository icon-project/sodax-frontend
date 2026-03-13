import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRadfiSession, useBitcoinBalance, useFundTradingWallet } from '@sodax/dapp-kit';
import type { BitcoinSpokeProvider } from '@sodax/sdk';
import { formatUnits, parseUnits } from 'viem';
import { Loader2 } from 'lucide-react';

interface BitcoinSetupPanelProps {
  spokeProvider: BitcoinSpokeProvider;
  onReadyChange: (isReady: boolean) => void;
}

export const BitcoinSetupPanel = ({ spokeProvider, onReadyChange }: BitcoinSetupPanelProps) => {
  const { walletAddress, isAuthed, tradingAddress, login, isLoginPending } = useRadfiSession(spokeProvider);

  const { data: btcBalance, isLoading: isBalanceLoading } = useBitcoinBalance(tradingAddress);
  const { data: nativeBalance, isLoading: isNativeBalanceLoading } = useBitcoinBalance(walletAddress);

  const { mutateAsync: fundWallet, isPending: isFunding } = useFundTradingWallet(spokeProvider);
  const [fundAmount, setFundAmount] = useState('');

  useEffect(() => {
    const isReady = isAuthed && !!tradingAddress && (btcBalance ? btcBalance > 0n : false);
    onReadyChange(isReady);
  }, [isAuthed, tradingAddress, btcBalance, onReadyChange]);

  const handleFund = async () => {
    if (!fundAmount || Number.isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) return;
    try {
      await fundWallet(parseUnits(fundAmount, 8));
      setFundAmount('');
    } catch (e) {
      console.error('Failed to top up trading wallet', e);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 mt-4 bg-muted/30 rounded-lg border border-border">
      <h3 className="font-semibold text-sm">Bitcoin Trading Setup</h3>

      {/* Step 1: Authentication */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${isAuthed ? 'bg-green-500' : 'bg-blue-500'}`}>
            1
          </div>
          Radfi Authentication
        </span>
        {isAuthed ? (
          <span className="text-xs text-green-500 font-medium">Authenticated ✓</span>
        ) : (
          <Button size="sm" onClick={login} disabled={isLoginPending || !walletAddress}>
            {isLoginPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Login Message
          </Button>
        )}
      </div>

      {/* Step 2: Trading Wallet + Balance (shown after auth) */}
      {isAuthed && (
        <div className="flex flex-col gap-3 border-t border-border pt-4 mt-2">

          {/* Trading wallet address */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${tradingAddress ? 'bg-green-500' : 'bg-blue-500'}`}>
                2
              </div>
              Trading Wallet
            </span>
            {tradingAddress ? (
              <span className="text-xs text-muted-foreground font-mono" title={tradingAddress}>
                {tradingAddress.slice(0, 8)}...{tradingAddress.slice(-6)}
              </span>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Balance + fund */}
          {tradingAddress && (
            <div className="flex flex-col gap-3 border-t border-border pt-3 mt-1">

              {/* Step badge */}
              <span className="text-sm font-medium flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${btcBalance && btcBalance > 0n ? 'bg-green-500' : 'bg-blue-500'}`}>
                  3
                </div>
                Fund Trading Wallet
              </span>

              {/* Balance comparison */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-2">
                  <span className="text-xs text-muted-foreground">Your Wallet</span>
                  <span className="text-sm font-medium">
                    {isNativeBalanceLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `${formatUnits(nativeBalance ?? 0n, 8)} BTC`
                    )}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-2">
                  <span className="text-xs text-muted-foreground">Trading Wallet</span>
                  <span className={`text-sm font-medium ${btcBalance && btcBalance > 0n ? 'text-green-500' : ''}`}>
                    {isBalanceLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `${formatUnits(btcBalance ?? 0n, 8)} BTC`
                    )}
                  </span>
                </div>
              </div>

              {/* Fund input */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Top up trading wallet (e.g. 0.001 BTC)"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={handleFund} disabled={isFunding || !fundAmount}>
                  {isFunding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Top Up
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
