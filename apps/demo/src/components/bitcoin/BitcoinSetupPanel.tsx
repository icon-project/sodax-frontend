import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRadfiSession, useTradingWalletBalance, useFundTradingWallet, useExpiredUtxos, useRenewUtxos, useRadfiWithdraw } from '@sodax/dapp-kit';
import { useXConnection, useXConnectors, useXConnect, useXDisconnect, XverseXConnector, type BtcWalletAddressType } from '@sodax/wallet-sdk-react';
import type { BitcoinSpokeProvider } from '@sodax/sdk';
import { detectBitcoinAddressType } from '@sodax/types';
import { formatUnits } from 'viem';
import { Loader2, Copy, ExternalLink, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { FundTradingWalletDialog } from './FundTradingWalletDialog';
import { WithdrawTradingWalletDialog } from './WithdrawTradingWalletDialog';
import { loadRadfiSession } from '@sodax/dapp-kit';

interface BitcoinSetupPanelProps {
  spokeProvider: BitcoinSpokeProvider;
  onReadyChange: (isReady: boolean) => void;
  nativeBalance?: bigint;
  isNativeBalanceLoading?: boolean;
  connectorName?: string;
  connectorIcon?: string;
  /** When true, skip balance > 0 check (destination side doesn't need existing balance) */
  isDestination?: boolean;
}

type BtcAddressType = BtcWalletAddressType;

export const BitcoinSetupPanel = ({ spokeProvider, onReadyChange, nativeBalance, isNativeBalanceLoading, connectorName = 'Wallet', connectorIcon = '', isDestination = false }: BitcoinSetupPanelProps) => {
  const { walletAddress, isAuthed, tradingAddress, login, isLoginPending } = useRadfiSession(spokeProvider);

  const { data: tradingBalance, isLoading: isBalanceLoading } = useTradingWalletBalance(spokeProvider, tradingAddress);

  const { mutateAsync: fundWallet, isPending: isFunding } = useFundTradingWallet(spokeProvider);
  const { data: expiredUtxos, isLoading: isExpiredLoading } = useExpiredUtxos(spokeProvider, tradingAddress);
  const { mutateAsync: renewUtxos, isPending: isRenewing } = useRenewUtxos(spokeProvider);
  const { mutateAsync: withdrawFromTradingWallet, isPending: isWithdrawing } = useRadfiWithdraw(spokeProvider);
  const [copied, setCopied] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Address type selector (Xverse only)
  const xConnection = useXConnection('BITCOIN');
  const xConnectors = useXConnectors('BITCOIN');
  const { mutateAsync: xConnect } = useXConnect();
  const xDisconnect = useXDisconnect();
  const [isSwitching, setIsSwitching] = useState(false);

  const activeConnector = xConnectors.find(c => c.id === xConnection?.xConnectorId);
  const isXverse = activeConnector instanceof XverseXConnector;

  // Detect current address type from connected address
  const currentAddressType: BtcAddressType = walletAddress
    ? (detectBitcoinAddressType(walletAddress) === 'P2TR' ? 'taproot' : 'segwit')
    : 'taproot';

  const handleAddressTypeChange = useCallback(async (newType: BtcAddressType) => {
    if (!isXverse || !activeConnector || newType === currentAddressType) return;
    setIsSwitching(true);
    try {
      const xverseConnector = activeConnector as XverseXConnector;
      xverseConnector.setAddressPurpose(newType);
      xDisconnect('BITCOIN');
      await xConnect(xverseConnector);
    } catch (e) {
      console.error('Failed to switch address type', e);
    } finally {
      setIsSwitching(false);
    }
  }, [isXverse, activeConnector, currentAddressType, xConnect, xDisconnect]);

  const copyAddress = () => {
    if (!tradingAddress) return;
    navigator.clipboard.writeText(tradingAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Destination side: only needs auth + trading wallet (receiving BTC, no spend required).
  // Source side: additionally needs balance > 0 and no expired UTXOs (spending from trading wallet).
  useEffect(() => {
    const isReady = isAuthed && !!tradingAddress && (
      isDestination || (
        (tradingBalance?.btcSatoshi ?? 0n) > 0n &&
        (!expiredUtxos || expiredUtxos.length === 0)
      )
    );
    onReadyChange(isReady);
  }, [isAuthed, tradingAddress, tradingBalance, expiredUtxos, isDestination, onReadyChange]);

  const handleFetchMax = useCallback(async (withdrawTo: string) => {
    if (!spokeProvider || !walletAddress) return undefined;
    const session = loadRadfiSession(walletAddress);
    const accessToken = session?.accessToken;
    if (!accessToken) return undefined;
    const balance = tradingBalance?.btcSatoshi ?? 0n;
    if (balance <= 0n) return undefined;
    return spokeProvider.radfi.getMaxWithdrawable(
      { userAddress: walletAddress, amount: balance.toString(), tokenId: '0:0', withdrawTo },
      accessToken,
    );
  }, [spokeProvider, walletAddress, tradingBalance]);

  const handleRenewUtxos = async () => {
    if (!expiredUtxos?.length) return;
    setRenewError(null);
    try {
      const txIdVouts = expiredUtxos.map(u => `${u.txId ?? u.id}:${u.vout}`);
      await renewUtxos({ txIdVouts });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to renew UTXOs';
      setRenewError(msg);
      console.error('Failed to renew UTXOs', e);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 mt-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Bitcoin Trading Setup</h3>

        {/* Address type selector — Xverse only */}
        {isXverse && (
          <div className="flex items-center gap-1 text-xs">
            {isSwitching && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            <button
              type="button"
              onClick={() => handleAddressTypeChange('taproot')}
              disabled={isSwitching}
              className={`px-2 py-0.5 rounded-l border cursor-pointer ${currentAddressType === 'taproot' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
            >
              Taproot
            </button>
            <button
              type="button"
              onClick={() => handleAddressTypeChange('segwit')}
              disabled={isSwitching}
              className={`px-2 py-0.5 rounded-r border cursor-pointer ${currentAddressType === 'segwit' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
            >
              Segwit
            </button>
          </div>
        )}
      </div>

      {/* Sign in — only shown before authenticated */}
      {!isAuthed && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sign in to trade</span>
          <Button size="sm" onClick={login} disabled={isLoginPending || !walletAddress}>
            {isLoginPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </div>
      )}

      {/* Trading Wallet (shown after auth — sign in step hidden) */}
      {isAuthed && (
        <div className="flex flex-col gap-3">

          {/* Trading wallet address + Top Up */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Trading Wallet
              </span>
              {tradingAddress && (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" onClick={() => setShowFundDialog(true)} disabled={isFunding}>
                    {isFunding ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                    Top Up
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowWithdrawDialog(true)} disabled={isWithdrawing}>
                    {isWithdrawing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                    Withdraw
                  </Button>
                </div>
              )}
            </div>
            {tradingAddress ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-mono" title={tradingAddress}>
                  {tradingAddress.slice(0, 8)}...{tradingAddress.slice(-6)}
                </span>
                <button type="button" onClick={copyAddress} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors" title="Copy address">
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </button>
                <a href={`https://mempool.space/address/${tradingAddress}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors" title="View on mempool.space">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Trading wallet balance */}
          {tradingAddress && (
            <div className="flex flex-col gap-3 border-t border-border pt-3 mt-1">
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
                  <span className={`text-sm font-medium ${tradingBalance && tradingBalance.btcSatoshi > 0n ? 'text-green-500' : ''}`}>
                    {isBalanceLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `${formatUnits(tradingBalance?.btcSatoshi ?? 0n, 8)} BTC`
                    )}
                  </span>
                </div>
              </div>

              {/* Fund dialog */}
              {walletAddress && tradingAddress && (
                <FundTradingWalletDialog
                  open={showFundDialog}
                  onOpenChange={setShowFundDialog}
                  walletAddress={walletAddress}
                  tradingAddress={tradingAddress}
                  walletBalance={nativeBalance ?? 0n}
                  tradingBalance={tradingBalance?.btcSatoshi ?? 0n}
                  connectorName={connectorName}
                  connectorIcon={connectorIcon}
                  onFund={async (amount) => {
                    await fundWallet(amount);
                  }}
                  isFunding={isFunding}
                />
              )}

              {/* Withdraw dialog */}
              {walletAddress && tradingAddress && (
                <WithdrawTradingWalletDialog
                  open={showWithdrawDialog}
                  onOpenChange={setShowWithdrawDialog}
                  tradingAddress={tradingAddress}
                  tradingBalance={tradingBalance?.btcSatoshi ?? 0n}
                  connectorName={connectorName}
                  connectorIcon={connectorIcon}
                  onWithdraw={async (amount, withdrawTo) => {
                    return withdrawFromTradingWallet({ amount, tokenId: '0:0', withdrawTo });
                  }}
                  isWithdrawing={isWithdrawing}
                  onFetchMax={handleFetchMax}
                />
              )}

              {/* Expired UTXOs — Renew section */}
              {!isExpiredLoading && expiredUtxos && expiredUtxos.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border pt-3 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      {expiredUtxos.length} Expired UTXO{expiredUtxos.length > 1 ? 's' : ''}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRenewUtxos}
                      disabled={isRenewing}
                      className="border-amber-500 text-amber-600 hover:bg-amber-50"
                    >
                      {isRenewing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Renew All
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These UTXOs have expired or are within 2 weeks of expiry. Renew them to continue trading.
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {expiredUtxos.map(utxo => (
                      <div key={`${utxo.txId ?? utxo.id}:${utxo.vout}`} className="flex items-center justify-between text-xs bg-background rounded px-2 py-1 border border-border">
                        <span className="font-mono text-muted-foreground truncate max-w-[200px]" title={`${utxo.txId ?? utxo.id}:${utxo.vout}`}>
                          {(utxo.txId ?? utxo.id)?.slice(0, 8)}...:{utxo.vout}
                        </span>
                        <span className="font-medium">{formatUnits(BigInt(utxo.value), 8)} BTC</span>
                      </div>
                    ))}
                  </div>
                  {renewError && (
                    <p className="text-xs text-red-500">{renewError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
