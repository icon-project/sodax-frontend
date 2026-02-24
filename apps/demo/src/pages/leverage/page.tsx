import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, SolverEnv } from '@/zustand/useAppStore';
import { useHooksService } from '@/hooks/useHooksService';
import { scaleTokenAmount } from '@/lib/utils';
import { SodaTokens, SONIC_MAINNET_CHAIN_ID, getMoneyMarketConfig } from '@sodax/types';
import { poolAbi, SolverApiService } from '@sodax/sdk';
import { productionSolverConfig, stagingSolverConfig, devSolverConfig } from '@/constants';
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';
import {
  useGetUserHubWalletAddress,
  useUserReservesData,
  useReservesUsdFormat,
  useSpokeProvider,
} from '@sodax/dapp-kit';
import { useXAccount, useWalletProvider } from '@sodax/wallet-sdk-react';
import { EModeSelector } from '@/components/mm/EModeSelector';
import { createPublicClient, http, formatUnits, isAddress, erc20Abi } from 'viem';
import { sonic } from 'viem/chains';

const LENDING_POOL = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).lendingPool as `0x${string}`;

// Dedicated Sonic public client — avoids wagmi's unconfigured transport (rpcConfig has no sonic entry)
const sonicPublicClient = createPublicClient({
  chain: sonic,
  transport: http('https://rpc.soniclabs.com'),
  pollingInterval: 1_000,
});

const VAULT_TOKENS = Object.entries(SodaTokens).map(([key, token]) => ({
  key,
  symbol: token.symbol,
  address: token.address as `0x${string}`,
  decimals: token.decimals,
}));

const SLIPPAGE_PRESETS = [0.5, 1, 2] as const;

const solverConfigMap = {
  [SolverEnv.Production]: productionSolverConfig,
  [SolverEnv.Staging]: stagingSolverConfig,
  [SolverEnv.Dev]: devSolverConfig,
};

type OpResult = { txHash?: string; error?: string; approvalDone?: boolean; solverRelayed?: boolean } | null;

// ── Token-labelled input ──────────────────────────────────────────────────────
function TokenInput({
  value,
  onChange,
  symbol,
  readOnly = false,
  placeholder = '0.0',
}: {
  value: string;
  onChange: (v: string) => void;
  symbol: string;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        className={`pr-24 ${readOnly ? 'bg-muted text-muted-foreground cursor-default' : ''}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none select-none truncate max-w-20">
        {symbol}
      </span>
    </div>
  );
}

// ── Amount slider ─────────────────────────────────────────────────────────────
function AmountSlider({
  value,
  max,
  symbol,
  onChange,
  label,
}: {
  value: number;
  max: number;
  symbol: string;
  onChange: (v: number) => void;
  label: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          Max: {max > 0 ? max.toFixed(4) : '—'} {symbol}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max > 0 ? max : 1}
        step={max > 0 ? max / 1000 : 0.001}
        value={value}
        disabled={max <= 0}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span className="font-medium text-foreground">{value.toFixed(4)} {symbol}</span>
        <span>{pct.toFixed(0)}% of max</span>
      </div>
    </div>
  );
}

// ── Slippage selector ─────────────────────────────────────────────────────────
function SlippageSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [custom, setCustom] = useState('');
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">Slippage:</span>
      {SLIPPAGE_PRESETS.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => { onChange(s); setCustom(''); }}
          className={`px-2 py-0.5 text-xs rounded border transition-colors ${
            value === s && !custom
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:border-primary'
          }`}
        >
          {s}%
        </button>
      ))}
      <input
        type="number"
        placeholder="Custom"
        value={custom}
        min={0.01}
        max={50}
        step={0.1}
        onChange={e => {
          setCustom(e.target.value);
          const n = Number(e.target.value);
          if (n > 0) onChange(n);
        }}
        className="w-16 px-1.5 py-0.5 text-xs rounded border border-border focus:outline-none focus:border-primary"
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LeveragePage() {
  const { openWalletModal, selectedChainId, solverEnvironment } = useAppStore();
  const { hooksService, isReady } = useHooksService();
  const { isConnected, address: evmAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  // Hub wallet address for EModeSelector
  const xAccount = useXAccount(selectedChainId);
  const { data: hubWalletAddress } = useGetUserHubWalletAddress(selectedChainId, xAccount?.address);

  // Sonic position data
  const sonicWalletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const sonicAccount = useXAccount(SONIC_MAINNET_CHAIN_ID);

  // Sonic router (hub wallet) address — aTokens are minted to this address, not the raw wallet
  const { data: sonicHubWalletAddress } = useGetUserHubWalletAddress(
    SONIC_MAINNET_CHAIN_ID,
    sonicAccount?.address,
  );
  const sonicSpokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, sonicWalletProvider);

  const { data: userReservesData, isLoading: isReservesLoading } = useUserReservesData({
    spokeProvider: sonicSpokeProvider,
    address: sonicAccount?.address,
  });
  const userReserves = useMemo(() => userReservesData?.[0] ?? [], [userReservesData]);

  const { data: formattedReserves } = useReservesUsdFormat();

  // Raw Sonic address — used for all direct pool queries (not hub router)
  const rawSonicAddress = sonicAccount?.address as `0x${string}` | undefined;

  // getUserAccountData for raw Sonic address — sonicSpokeProvider routes through hub router
  // which won't reflect positions deposited directly to the lending pool
  const { data: rawAccountData } = useQuery({
    queryKey: ['getUserAccountData', rawSonicAddress],
    enabled: !!rawSonicAddress,
    refetchInterval: 10_000,
    queryFn: () =>
      sonicPublicClient.readContract({
        address: LENDING_POOL,
        abi: poolAbi,
        functionName: 'getUserAccountData',
        args: [rawSonicAddress as `0x${string}`],
      }),
  });

  // aToken addresses for balance fetching
  const aTokenAddresses = useMemo<`0x${string}`[]>(() => {
    if (!formattedReserves) return [];
    return VAULT_TOKENS.flatMap(token => {
      const reserve = formattedReserves.find(
        r => r.underlyingAsset.toLowerCase() === token.address.toLowerCase(),
      );
      const addr = reserve?.aTokenAddress;
      return addr && isAddress(addr) ? [addr as `0x${string}`] : [];
    });
  }, [formattedReserves]);
  const { data: aTokenBalancesMap, refetch: refetchATokenBalances } = useQuery({
    queryKey: ['aTokenBalancesRaw', rawSonicAddress, aTokenAddresses],
    enabled: !!rawSonicAddress && aTokenAddresses.length > 0,
    refetchInterval: 10_000,
    queryFn: async () => {
      const results = await sonicPublicClient.multicall({
        contracts: aTokenAddresses.map(aToken => ({
          address: aToken,
          abi: erc20Abi,
          functionName: 'balanceOf' as const,
          args: [rawSonicAddress as `0x${string}`],
        })),
      });
      const map = new Map<`0x${string}`, bigint>();
      aTokenAddresses.forEach((addr, i) => {
        const result = results[i];
        if (result.status === 'success') map.set(addr, result.result as bigint);
      });
      return map;
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getReserve = (addr: string) =>
    formattedReserves?.find(r => r.underlyingAsset.toLowerCase() === addr.toLowerCase());

  const getTokenPriceUSD = (addr: string): number =>
    addr ? Number(getReserve(addr)?.priceInUSD ?? 0) : 0;

  const getATokenBalance = (addr: string): bigint | undefined => {
    const reserve = getReserve(addr);
    if (!reserve?.aTokenAddress) return undefined;
    return aTokenBalancesMap?.get(reserve.aTokenAddress as `0x${string}`);
  };

  const getDebt = (addr: string): bigint => {
    const ur = userReserves.find(r => r.underlyingAsset.toLowerCase() === addr.toLowerCase());
    return ur?.scaledVariableDebt ?? 0n;
  };

  const fmtBal = (bal: bigint | undefined): string =>
    bal !== undefined ? Number(formatUnits(bal, 18)).toFixed(5) : '0';

  const getBorrowAPY = (addr: string): string => {
    const reserve = getReserve(addr);
    if (!reserve) return '-';
    const rate = Number(reserve.variableBorrowRate) / 1e27;
    return `${(((1 + rate / 31536000) ** 31536000 - 1) * 100).toFixed(2)}%`;
  };

  // Tokens with active positions (for deleverage)
  const suppliedTokens = useMemo(
    () =>
      VAULT_TOKENS.filter(t => {
        const reserve = formattedReserves?.find(
          r => r.underlyingAsset.toLowerCase() === t.address.toLowerCase(),
        );
        if (!reserve?.aTokenAddress) return false;
        const bal = aTokenBalancesMap?.get(reserve.aTokenAddress as `0x${string}`);
        return bal !== undefined && bal > 0n;
      }),
    [aTokenBalancesMap, formattedReserves],
  );

  const borrowedTokens = useMemo(
    () =>
      VAULT_TOKENS.filter(t => {
        const ur = userReserves.find(
          r => r.underlyingAsset.toLowerCase() === t.address.toLowerCase(),
        );
        return (ur?.scaledVariableDebt ?? 0n) > 0n;
      }),
    [userReserves],
  );

  // ── Leverage state ────────────────────────────────────────────────────────────
  const [levCollateral, setLevCollateral] = useState('');
  const [levDebt, setLevDebt] = useState('');
  const [levBorrowAmount, setLevBorrowAmount] = useState(0);
  const [levMinCollateral, setLevMinCollateral] = useState('');
  const [levSlippage, setLevSlippage] = useState<number>(0.5);
  const [levSubmitting, setLevSubmitting] = useState(false);
  const [levResult, setLevResult] = useState<OpResult>(null);

  const levCollateralSymbol = VAULT_TOKENS.find(t => t.address === levCollateral)?.symbol ?? '';
  const levDebtSymbol = VAULT_TOKENS.find(t => t.address === levDebt)?.symbol ?? '';

  // Max borrow accounting for the leverage loop:
  // Borrowed tokens are swapped → extra collateral is supplied → enabling more borrowing.
  // maxBorrowUSD = availableBorrowsUSD / (1 − blendedLTV × (1 − slippage))
  // rawAccountData[2] = availableBorrowsBase (USD, 8 decimals)
  // rawAccountData[4] = ltv (weighted avg, basis points e.g. 8000 = 80%)
  const levMaxBorrow = useMemo(() => {
    if (!levDebt || !formattedReserves || !rawAccountData) return 0;
    const reserve = formattedReserves.find(
      r => r.underlyingAsset.toLowerCase() === levDebt.toLowerCase(),
    );
    if (!reserve) return 0;
    const poolLiquidity = Number(formatUnits(BigInt(reserve.availableLiquidity), 18));
    const debtPriceUSD = Number(reserve.priceInUSD);
    const availableBorrowsUSD = Number(formatUnits(rawAccountData[2], 8));
    const blendedLTV = Number(rawAccountData[4]) / 10_000;
    const slippageFactor = 1 - levSlippage / 100;
    // denominator < 1 so maxBorrow > plain availableBorrows
    const denominator = 1 - blendedLTV * slippageFactor;
    const userBorrowInToken =
      denominator > 0 && debtPriceUSD > 0
        ? availableBorrowsUSD / (debtPriceUSD * denominator)
        : 0;
    return Math.max(0, Math.min(poolLiquidity, userBorrowInToken));
  }, [levDebt, formattedReserves, rawAccountData, levSlippage]);

  // Auto-calculate min collateral from borrow amount × price ratio × (1 − slippage)
  const levAutoCollateral = useMemo(() => {
    if (!levBorrowAmount || !levCollateral || !levDebt || !formattedReserves) return '';
    const debtPrice = Number(
      formattedReserves.find(r => r.underlyingAsset.toLowerCase() === levDebt.toLowerCase())?.priceInUSD ?? 0,
    );
    const collPrice = Number(
      formattedReserves.find(r => r.underlyingAsset.toLowerCase() === levCollateral.toLowerCase())?.priceInUSD ?? 0,
    );
    if (!debtPrice || !collPrice) return '';
    return ((levBorrowAmount * debtPrice) / collPrice * (1 - levSlippage / 100)).toFixed(6);
  }, [levBorrowAmount, levCollateral, levDebt, levSlippage, formattedReserves]);

  // Sync auto-collateral → levMinCollateral when slider or slippage changes
  const handleLevSlider = (v: number) => {
    setLevBorrowAmount(v);
    const debtPrice = getTokenPriceUSD(levDebt);
    const collPrice = getTokenPriceUSD(levCollateral);
    if (debtPrice && collPrice && levCollateral && levDebt) {
      setLevMinCollateral(((v * debtPrice) / collPrice * (1 - levSlippage / 100)).toFixed(6));
    }
  };

  const handleLevSlippage = (s: number) => {
    setLevSlippage(s);
    const debtPrice = getTokenPriceUSD(levDebt);
    const collPrice = getTokenPriceUSD(levCollateral);
    if (debtPrice && collPrice && levBorrowAmount && levCollateral && levDebt) {
      setLevMinCollateral(((levBorrowAmount * debtPrice) / collPrice * (1 - s / 100)).toFixed(6));
    }
  };

  // ── Deleverage state ──────────────────────────────────────────────────────────
  const [delCollateral, setDelCollateral] = useState('');
  const [delDebt, setDelDebt] = useState('');
  const [delWithdrawAmount, setDelWithdrawAmount] = useState(0);
  const [delMinRepay, setDelMinRepay] = useState('');
  const [delSlippage, setDelSlippage] = useState<number>(0.5);
  const [delSubmitting, setDelSubmitting] = useState(false);
  const [delResult, setDelResult] = useState<OpResult>(null);

  const delCollateralSymbol = VAULT_TOKENS.find(t => t.address === delCollateral)?.symbol ?? '';
  const delDebtSymbol = VAULT_TOKENS.find(t => t.address === delDebt)?.symbol ?? '';

  const delMaxWithdraw = useMemo(() => {
    if (!delCollateral || !formattedReserves) return 0;
    const reserve = formattedReserves.find(
      r => r.underlyingAsset.toLowerCase() === delCollateral.toLowerCase(),
    );
    if (!reserve?.aTokenAddress) return 0;
    const bal = aTokenBalancesMap?.get(reserve.aTokenAddress as `0x${string}`);
    return bal !== undefined ? Number(formatUnits(bal, 18)) : 0;
  }, [delCollateral, aTokenBalancesMap, formattedReserves]);

  const handleDelSlider = (v: number) => {
    setDelWithdrawAmount(v);
    const collPrice = getTokenPriceUSD(delCollateral);
    const debtPrice = getTokenPriceUSD(delDebt);
    if (collPrice && debtPrice && delCollateral && delDebt) {
      setDelMinRepay(((v * collPrice) / debtPrice * (1 - delSlippage / 100)).toFixed(6));
    }
  };

  const handleDelSlippage = (s: number) => {
    setDelSlippage(s);
    const collPrice = getTokenPriceUSD(delCollateral);
    const debtPrice = getTokenPriceUSD(delDebt);
    if (collPrice && debtPrice && delWithdrawAmount && delCollateral && delDebt) {
      setDelMinRepay(((delWithdrawAmount * collPrice) / debtPrice * (1 - s / 100)).toFixed(6));
    }
  };

  // ── Submit handlers ───────────────────────────────────────────────────────────

  // ── Deposit state ─────────────────────────────────────────────────────────────
  const [depToken, setDepToken] = useState('');
  const [depAmount, setDepAmount] = useState(0);
  const [depStatus, setDepStatus] = useState<'idle' | 'approving' | 'supplying'>('idle');
  const [depResult, setDepResult] = useState<OpResult>(null);

  const depTokenMeta = VAULT_TOKENS.find(t => t.address === depToken);
  const depTokenSymbol = depTokenMeta?.symbol ?? '';

  // Query token balance directly via sonicPublicClient — wagmi has no Sonic RPC configured
  const { data: depBalanceRaw, refetch: refetchDepBalance } = useQuery({
    queryKey: ['depTokenBalance', rawSonicAddress, depToken],
    enabled: !!rawSonicAddress && !!depToken,
    queryFn: async () => {
      if (!rawSonicAddress || !depToken) return 0n;
      return sonicPublicClient.readContract({
        address: depToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [rawSonicAddress],
      });
    },
  });
  const depMaxAmount = depBalanceRaw !== undefined
    ? Number(formatUnits(depBalanceRaw, depTokenMeta?.decimals ?? 18))
    : 0;

  const handleDeposit = async () => {
    const userAddress = sonicAccount?.address as `0x${string}` | undefined;
    if (!walletClient || !walletClient.account || !depToken || depAmount <= 0 || !userAddress) return;
    setDepStatus('approving');
    setDepResult(null);
    try {
      // Ensure wallet is on Sonic before sending any transactions
      await switchChainAsync({ chainId: 146 });

      const amountWei = scaleTokenAmount(depAmount.toString(), depTokenMeta?.decimals ?? 18);

      // Check allowance
      const allowance = await sonicPublicClient.readContract({
        address: depToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, LENDING_POOL],
      });

      if (allowance < amountWei) {
        const approveTx = await walletClient.writeContract({
          address: depToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [LENDING_POOL, amountWei],
          chain: sonic,
          account: walletClient.account,
        });
        await sonicPublicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      setDepStatus('supplying');

      const supplyTx = await walletClient.writeContract({
        address: LENDING_POOL,
        abi: poolAbi,
        functionName: 'supply',
        args: [depToken as `0x${string}`, amountWei, userAddress, 0],
        chain: sonic,
        account: walletClient.account,
      });
      await sonicPublicClient.waitForTransactionReceipt({ hash: supplyTx });

      setDepResult({ txHash: supplyTx });
      setDepAmount(0);
      refetchDepBalance();
      refetchATokenBalances();
    } catch (err) {
      setDepResult({ error: (err as Error).message });
    } finally {
      setDepStatus('idle');
    }
  };

  const handleLeverage = async () => {
    if (!hooksService || !levCollateral || !levDebt || !levBorrowAmount || !levMinCollateral) return;
    setLevSubmitting(true);
    setLevResult(null);
    try {
      const collateralToken = VAULT_TOKENS.find(t => t.address === levCollateral);
      const debtToken = VAULT_TOKENS.find(t => t.address === levDebt);
      const res = await hooksService.createLeverageIntentWithPrerequisites(
        {
          collateralAsset: levCollateral as `0x${string}`,
          debtAsset: levDebt as `0x${string}`,
          collateralAmount: scaleTokenAmount(levMinCollateral, collateralToken?.decimals ?? 18).toString(),
          borrowAmount: scaleTokenAmount(levBorrowAmount.toString(), debtToken?.decimals ?? 18).toString(),
        },
        146,
        { autoApprove: true },
      );
      if (res.ok) {
        const solverConfig = solverConfigMap[solverEnvironment];
        const relayRes = await SolverApiService.postExecution({ intent_tx_hash: res.value.txHash }, solverConfig);
        if (!relayRes.ok) {
          console.warn('[Leverage] Solver relay failed:', relayRes.error);
        }
        setLevResult({
          txHash: res.value.txHash,
          approvalDone: res.value.prerequisites.creditDelegationApproved,
          solverRelayed: relayRes.ok,
        });
      } else {
        setLevResult({ error: (res.error as Error)?.message || 'Unknown error' });
      }
    } catch (err) {
      setLevResult({ error: (err as Error).message });
    } finally {
      setLevSubmitting(false);
    }
  };

  const handleDeleverage = async () => {
    if (!hooksService || !delCollateral || !delDebt || !delWithdrawAmount || !delMinRepay) return;
    setDelSubmitting(true);
    setDelResult(null);
    try {
      const collateralToken = VAULT_TOKENS.find(t => t.address === delCollateral);
      const debtToken = VAULT_TOKENS.find(t => t.address === delDebt);
      const res = await hooksService.createDeleverageIntentWithPrerequisites(
        {
          collateralAsset: delCollateral as `0x${string}`,
          debtAsset: delDebt as `0x${string}`,
          withdrawAmount: scaleTokenAmount(delWithdrawAmount.toString(), collateralToken?.decimals ?? 18).toString(),
          repayAmount: scaleTokenAmount(delMinRepay, debtToken?.decimals ?? 18).toString(),
        },
        146,
        { autoApprove: true },
      );
      if (res.ok) {
        const solverConfig = solverConfigMap[solverEnvironment];
        const relayRes = await SolverApiService.postExecution({ intent_tx_hash: res.value.txHash }, solverConfig);
        if (!relayRes.ok) {
          console.warn('[Deleverage] Solver relay failed:', relayRes.error);
        }
        setDelResult({
          txHash: res.value.txHash,
          approvalDone: res.value.prerequisites.aTokenApproved,
          solverRelayed: relayRes.ok,
        });
      } else {
        setDelResult({ error: (res.error as Error)?.message || 'Unknown error' });
      }
    } catch (err) {
      setDelResult({ error: (err as Error).message });
    } finally {
      setDelSubmitting(false);
    }
  };

  // index 5 = healthFactor (18 decimals)
  const healthFactor = rawAccountData ? Number(formatUnits(rawAccountData[5], 18)) : undefined;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-4 mt-10 max-w-2xl">
      {isConnected && <EModeSelector hubWalletAddress={hubWalletAddress} />}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leverage / Deleverage</CardTitle>
            {healthFactor !== undefined && Number.isFinite(healthFactor) && (
              <span className="text-sm text-muted-foreground">
                Health Factor:{' '}
                <span className="font-semibold text-foreground">{healthFactor.toFixed(2)}</span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Button onClick={openWalletModal} className="w-full">
              Connect Wallet
            </Button>
          ) : (
            <Tabs defaultValue="leverage">
              <TabsList className="w-full">
                <TabsTrigger value="leverage" className="flex-1">Leverage</TabsTrigger>
                <TabsTrigger value="deleverage" className="flex-1">Deleverage</TabsTrigger>
                <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
              </TabsList>

              {/* ── LEVERAGE ── */}
              <TabsContent value="leverage" className="space-y-5 mt-4">
                <p className="text-xs text-muted-foreground">
                  Borrow the debt asset → solver swaps → extra collateral is supplied to your position.
                  Credit delegation is approved automatically if needed.
                </p>

                {/* Asset selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Collateral Asset</Label>
                    <Select
                      value={levCollateral}
                      onValueChange={v => { setLevCollateral(v); setLevBorrowAmount(0); setLevMinCollateral(''); }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
                      <SelectContent>
                        {VAULT_TOKENS.map(t => (
                          <SelectItem key={t.key} value={t.address}>{t.symbol}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {levCollateral && (
                      <p className="text-xs text-muted-foreground">
                        Supplied: {fmtBal(getATokenBalance(levCollateral))} {levCollateralSymbol}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Debt Asset</Label>
                    <Select
                      value={levDebt}
                      onValueChange={v => { setLevDebt(v); setLevBorrowAmount(0); setLevMinCollateral(''); }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
                      <SelectContent>
                        {VAULT_TOKENS.map(t => (
                          <SelectItem key={t.key} value={t.address}>{t.symbol}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {levDebt && (
                      <p className="text-xs text-muted-foreground">
                        APY: {getBorrowAPY(levDebt)} · Debt: {fmtBal(getDebt(levDebt))} {levDebtSymbol}
                      </p>
                    )}
                  </div>
                </div>

                <SlippageSelector value={levSlippage} onChange={handleLevSlippage} />

                {/* Borrow slider */}
                <AmountSlider
                  label={`Borrow Amount${levDebtSymbol ? ` (${levDebtSymbol})` : ''}`}
                  value={levBorrowAmount}
                  max={levMaxBorrow}
                  symbol={levDebtSymbol}
                  onChange={handleLevSlider}
                />
                {levMaxBorrow === 0 && levDebt && (
                  <p className="text-xs text-amber-600">
                    No borrow capacity — supply collateral on the Money Market first.
                  </p>
                )}

                {/* Min collateral out */}
                <div className="space-y-1">
                  <Label>Min Collateral Out{levCollateralSymbol ? ` (${levCollateralSymbol})` : ''}</Label>
                  <TokenInput
                    value={levMinCollateral || levAutoCollateral}
                    onChange={setLevMinCollateral}
                    symbol={levCollateralSymbol}
                    placeholder={levAutoCollateral || '0.0'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated from price ratio at {levSlippage}% slippage. Edit to set custom minimum.
                  </p>
                </div>

                {/* Summary */}
                {levBorrowAmount > 0 && levCollateral && levDebt && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You borrow</span>
                      <span className="font-medium">{levBorrowAmount.toFixed(4)} {levDebtSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min collateral received</span>
                      <span className="font-medium">{levMinCollateral || levAutoCollateral} {levCollateralSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage tolerance</span>
                      <span className="font-medium">{levSlippage}%</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleLeverage}
                  disabled={levSubmitting || !isReady || !levCollateral || !levDebt || levBorrowAmount <= 0 || !(levMinCollateral || levAutoCollateral)}
                  className="w-full"
                >
                  {levSubmitting ? 'Processing… (approval may be needed)' : 'Leverage'}
                </Button>

                <ResultDisplay result={levResult} />
              </TabsContent>

              {/* ── DELEVERAGE ── */}
              <TabsContent value="deleverage" className="space-y-5 mt-4">
                <p className="text-xs text-muted-foreground">
                  Withdraw collateral aTokens → solver swaps → debt is repaid.
                  aToken approval is handled automatically if needed.
                </p>

                {!isReservesLoading && suppliedTokens.length === 0 && borrowedTokens.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No active positions found. Supply and borrow on the Money Market first.
                  </p>
                ) : (
                  <>
                    {/* Asset selectors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Collateral Asset</Label>
                        <Select
                          value={delCollateral}
                          onValueChange={v => { setDelCollateral(v); setDelWithdrawAmount(0); setDelMinRepay(''); }}
                          disabled={suppliedTokens.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              isReservesLoading ? 'Loading…' :
                              suppliedTokens.length === 0 ? 'No positions' :
                              'Select token'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliedTokens.map(t => (
                              <SelectItem key={t.key} value={t.address}>
                                {t.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {delCollateral && (
                          <p className="text-xs text-muted-foreground">
                            Supplied: {fmtBal(getATokenBalance(delCollateral))} {delCollateralSymbol}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Debt Asset</Label>
                        <Select
                          value={delDebt}
                          onValueChange={v => { setDelDebt(v); setDelMinRepay(''); }}
                          disabled={borrowedTokens.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              isReservesLoading ? 'Loading…' :
                              borrowedTokens.length === 0 ? 'No debt' :
                              'Select token'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {borrowedTokens.map(t => (
                              <SelectItem key={t.key} value={t.address}>
                                {t.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {delDebt && (
                          <p className="text-xs text-muted-foreground">
                            Owed: {fmtBal(getDebt(delDebt))} {delDebtSymbol}
                          </p>
                        )}
                      </div>
                    </div>

                    <SlippageSelector value={delSlippage} onChange={handleDelSlippage} />

                    {/* Withdraw slider */}
                    <AmountSlider
                      label={`Withdraw Amount${delCollateralSymbol ? ` (${delCollateralSymbol})` : ''}`}
                      value={delWithdrawAmount}
                      max={delMaxWithdraw}
                      symbol={delCollateralSymbol}
                      onChange={handleDelSlider}
                    />

                    {/* Min repay */}
                    <div className="space-y-1">
                      <Label>Min Repay Amount{delDebtSymbol ? ` (${delDebtSymbol})` : ''}</Label>
                      <TokenInput
                        value={delMinRepay}
                        onChange={setDelMinRepay}
                        symbol={delDebtSymbol}
                        placeholder="0.0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-calculated at {delSlippage}% slippage. Edit to set custom minimum.
                      </p>
                    </div>

                    {/* Summary */}
                    {delWithdrawAmount > 0 && delCollateral && delDebt && (
                      <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">You withdraw</span>
                          <span className="font-medium">{delWithdrawAmount.toFixed(4)} {delCollateralSymbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min debt repaid</span>
                          <span className="font-medium">{delMinRepay || '—'} {delDebtSymbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Slippage tolerance</span>
                          <span className="font-medium">{delSlippage}%</span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleDeleverage}
                      disabled={delSubmitting || !isReady || !delCollateral || !delDebt || delWithdrawAmount <= 0 || !delMinRepay}
                      className="w-full"
                    >
                      {delSubmitting ? 'Processing… (approval may be needed)' : 'Deleverage'}
                    </Button>

                    <ResultDisplay result={delResult} />
                  </>
                )}
              </TabsContent>
              {/* ── DEPOSIT ── */}
              <TabsContent value="deposit" className="space-y-5 mt-4">
                <p className="text-xs text-muted-foreground">
                  Supply SodaTokens directly to the Sonic lending pool.
                  ERC20 approval is handled automatically if needed.
                </p>

                <div className="space-y-1">
                  <Label>Asset</Label>
                  <Select
                    value={depToken}
                    onValueChange={v => { setDepToken(v); setDepAmount(0); setDepResult(null); }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select SodaToken" /></SelectTrigger>
                    <SelectContent>
                      {VAULT_TOKENS.map(t => (
                        <SelectItem key={t.key} value={t.address}>{t.symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {depToken && (
                    <p className="text-xs text-muted-foreground">
                      Wallet: {depMaxAmount.toFixed(5)} {depTokenSymbol}
                      {' · '}Supplied: {fmtBal(getATokenBalance(depToken))} {depTokenSymbol}
                    </p>
                  )}
                </div>

                <AmountSlider
                  label={`Amount${depTokenSymbol ? ` (${depTokenSymbol})` : ''}`}
                  value={depAmount}
                  max={depMaxAmount}
                  symbol={depTokenSymbol}
                  onChange={setDepAmount}
                />
                {depMaxAmount === 0 && depToken && (
                  <p className="text-xs text-amber-600">
                    No {depTokenSymbol} in wallet. Acquire some first.
                  </p>
                )}

                {depAmount > 0 && depToken && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depositing</span>
                      <span className="font-medium">{depAmount.toFixed(4)} {depTokenSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New supplied total</span>
                      <span className="font-medium">
                        {(depAmount + Number(fmtBal(getATokenBalance(depToken)))).toFixed(4)} {depTokenSymbol}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleDeposit}
                  disabled={depStatus !== 'idle' || !depToken || depAmount <= 0 || !walletClient}
                  className="w-full"
                >
                  {depStatus === 'approving'
                    ? 'Approving…'
                    : depStatus === 'supplying'
                      ? 'Supplying…'
                      : 'Deposit'}
                </Button>

                {depResult && (
                  <ResultDisplay result={{ ...depResult, approvalDone: depResult.approvalDone }} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Result display ────────────────────────────────────────────────────────────
function ResultDisplay({ result }: { result: OpResult }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm break-all">
        {result.error}
      </div>
    );
  }

  if (result.txHash) {
    return (
      <div className="mt-2 p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm break-all">
        <p className="font-medium">Intent Created</p>
        {result.approvalDone && <p className="text-xs mb-1">✓ Approval completed automatically</p>}
        {result.solverRelayed === true && <p className="text-xs mb-1">✓ Relayed to solver</p>}
        {result.solverRelayed === false && (
          <p className="text-xs mb-1 text-amber-600">⚠ Solver relay failed — check console</p>
        )}
        <a
          href={`https://sonicscan.org/tx/${result.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {result.txHash}
        </a>
      </div>
    );
  }

  return null;
}
