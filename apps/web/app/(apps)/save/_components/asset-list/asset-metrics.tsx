import { Separator } from '@/components/ui/separator';
import { AlertCircleIcon } from 'lucide-react';

export default function AssetMetrics({ apy, deposits }: { apy: string; deposits: string }) {
  return (
    <div className="flex h-12">
      <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
      <InfoBlock value={apy} label="Current APY" />
      <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
      <InfoBlock value={deposits} label="All deposits" />
    </div>
  );
}

function InfoBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col px-(--layout-space-normal) justify-center h-12">
      <div className="text-espresso text-(length:--subtitle) font-['InterBold']">{value}</div>
      <div className="flex gap-1 text-clay-light text-(length:--body-small)">
        {label} <AlertCircleIcon className="w-4 h-4" />
      </div>
    </div>
  );
}
