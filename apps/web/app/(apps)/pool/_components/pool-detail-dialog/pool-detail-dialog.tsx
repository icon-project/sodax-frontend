import type React from 'react';
import { useEffect, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import CurrencyLogo from '@/components/shared/currency-logo';
import { sodaToken, xSodaToken } from '../pool-network-selector';
import { XIcon } from 'lucide-react';
import { usePoolState } from '../../_stores/pool-store-provider';
import { PoolLiquidityChart, type LiquidityBucket } from './pool-liquidity-chart';

type PoolDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolAprPercent?: number | null;
  pairPrice?: number | null;
  poolId?: string | null;
};

export function PoolDetailDialog({
  open,
  onOpenChange,
  poolAprPercent,
  pairPrice,
  poolId = '0x1fbed2bab018dd01756162d135964186addbab00158eda8013de8a15948995cd',
}: PoolDetailDialogProps): React.ReactElement {
  const { minPrice, maxPrice } = usePoolState();
  const [buckets, setBuckets] = useState<LiquidityBucket[]>([]);
  const [totalLiquidityUsd, setTotalLiquidityUsd] = useState<string>('0');
  const [calculatedVolume24hUsd, setCalculatedVolume24hUsd] = useState<number>(0);
  useEffect((): (() => void) => {
    if (!poolId) {
      setCalculatedVolume24hUsd(0);
      return () => undefined;
    }

    const controller = new AbortController();
    const loadVolume = async (): Promise<void> => {
      try {
        const volumeResponse = await fetch(`/api/pool/volume?poolId=${encodeURIComponent(poolId)}`, {
          signal: controller.signal,
        });
        if (!volumeResponse.ok) {
          setCalculatedVolume24hUsd(0);
          return;
        }
        const volumeData = (await volumeResponse.json()) as { totalVolumeUsd?: string | number };
        const parsedTotalVolumeUsd = Number(volumeData.totalVolumeUsd ?? 0);
        setCalculatedVolume24hUsd(Number.isFinite(parsedTotalVolumeUsd) ? parsedTotalVolumeUsd : 0);
      } catch {
        if (!controller.signal.aborted) {
          setCalculatedVolume24hUsd(0);
        }
      }
    };

    void loadVolume();
    return () => {
      controller.abort();
    };
  }, [poolId]);

  useEffect((): (() => void) => {
    if (!poolId) {
      setBuckets([]);
      return () => undefined;
    }

    const controller = new AbortController();
    const loadLiquidity = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/pool/liquidity?poolId=${encodeURIComponent(poolId)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setBuckets([]);
          return;
        }

        const data = (await response.json()) as { buckets: LiquidityBucket[]; total_liquidity_usd: string };
        const totalLiquidityUsd = String(data.total_liquidity_usd ?? '0');
        setBuckets(Array.isArray(data.buckets) ? (data.buckets as LiquidityBucket[]) : []);
        setTotalLiquidityUsd(totalLiquidityUsd);
      } catch {
        if (!controller.signal.aborted) {
          setBuckets([]);
        }
      }
    };

    void loadLiquidity();

    return () => {
      controller.abort();
    };
  }, [poolId]);

  const formatUsd = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] h-80 p-12 pb-8! bg-vibrant-white" hideCloseButton>
        <DialogTitle className="flex w-full justify-end h-4 relative p-0">
          <DialogClose asChild>
            <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
          </DialogClose>
        </DialogTitle>
        <div className="self-stretch inline-flex flex-col justify-start items-center gap-4">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="self-stretch inline-flex justify-between items-start">
              <div className="flex justify-start items-center gap-3">
                <div className="flex">
                  <CurrencyLogo currency={sodaToken} hideNetwork className="relative" />
                  <CurrencyLogo currency={xSodaToken} className="relative -ml-4" hideNetwork />
                </div>
                <div className="inline-flex flex-col justify-center items-start gap-0.5">
                  <div className="inline-flex justify-start items-center gap-2">
                    <div className="justify-center text-(length:--body-super-comfortable) text-base font-normal font-['Inter'] leading-5">
                      SODA / xSODA
                    </div>
                  </div>
                  <div className="inline-flex justify-start items-center gap-2">
                    <div className="justify-center text-(length:--body-small) text-clay font-normal font-['Inter'] leading-4">
                      24H fees
                    </div>
                    <div className="justify-center text-(length:--body-small) text-espresso font-bold font-['Inter'] leading-4">
                      {formatUsd(calculatedVolume24hUsd * 0.001)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-12 px-2 mix-blend-multiply bg-almost-white rounded-lg inline-flex flex-col justify-center items-end">
                <div className="text-center justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
                  POOL APR
                </div>
                <div className="text-center justify-start text-espresso text-base font-bold font-['Inter'] leading-5">
                  {poolAprPercent?.toFixed(2) ?? '0.00'}%
                </div>
              </div>
            </div>
            <div className="inline-flex justify-start items-start gap-2">
              <div className="h-6 px-2 py-1 mix-blend-multiply bg-almost-white rounded-[256px] flex justify-center items-center gap-1">
                <div className="flex align-center justify-center gap-1">
                  <span className="text-espresso text-(length:--body-fine-print) font-bold font-['Inter'] flex">
                    {formatUsd(Number(totalLiquidityUsd))}
                  </span>
                  <span className="text-clay text-(length:--body-fine-print) font-normal font-['Inter'] flex">
                    Pool balance
                  </span>
                </div>
              </div>
              <div className="h-6 px-2 py-1 mix-blend-multiply bg-almost-white rounded-[256px] flex justify-center items-center gap-1">
                <div className="flex align-center justify-center gap-1">
                  <span className="text-espresso text-(length:--body-fine-print) font-bold font-['Inter'] flex">
                    {formatUsd(calculatedVolume24hUsd)}
                  </span>
                  <span className="text-clay text-(length:--body-fine-print) font-normal font-['Inter'] flex">
                    24H volume
                  </span>
                </div>
              </div>
            </div>
            <PoolLiquidityChart buckets={buckets} minPrice={minPrice} maxPrice={maxPrice} pairPrice={pairPrice} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PoolDetailDialog;
