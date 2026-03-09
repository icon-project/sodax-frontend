import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircleIcon } from 'lucide-react';
import { formatCurrencyCompact } from '@/lib/utils';
import { SAVE_TOOLTIPS } from '../constants';

type AssetMetricsProps = {
  apy: string;
  deposits: number;
  assetType?: string;
};

type InfoBlockProps = {
  value: string;
  label: string;
  tooltipContent: string;
};

export default function AssetMetrics({ apy, deposits, assetType = 'asset' }: AssetMetricsProps): React.JSX.Element {
  return (
    <div className="flex h-12">
      <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
      <InfoBlock value={apy} label="Current APY" tooltipContent={SAVE_TOOLTIPS.apy} />
      <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
      <InfoBlock
        value={formatCurrencyCompact(deposits)}
        label="All deposits"
        tooltipContent={`Total ${assetType} in this market.`}
      />
    </div>
  );
}

function InfoBlock({ value, label, tooltipContent }: InfoBlockProps): React.JSX.Element {
  return (
    <div className="flex flex-col px-(--layout-space-normal) justify-center h-12">
      <div className="text-espresso text-(length:--subtitle) font-['InterBold']">{value}</div>
      <div className="flex gap-1 text-clay-light text-(length:--body-small)">
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-clay-light">
              <AlertCircleIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={10}
            className="bg-white px-4 py-2 text-espresso rounded-full text-(length:--body-small)"
          >
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
