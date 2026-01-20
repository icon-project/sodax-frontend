import { Loader2Icon, MinusIcon } from 'lucide-react';

type DisconnectAllProps = {
  onClick: () => void;
  isPending: boolean;
};

export function DisconnectAll({ onClick, isPending }: DisconnectAllProps): React.ReactElement {
  return (
    <div
      onClick={onClick}
      className="flex items-center -mx-4 h-12 relative bg-vibrant-white p-4 rounded-2xl overflow-hidden cursor-pointer mix-blend-multiply"
    >
      <div className="flex-1 text-left">
        <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-tight">
          Disconnect All
        </div>
      </div>
      <div className="w-6 h-6 bg-clay/10 rounded-full flex items-center justify-center transition-colors">
        {isPending ? (
          <Loader2Icon className="w-5 h-5 text-clay animate-spin" />
        ) : (
          <MinusIcon className="w-4 h-4 text-clay" />
        )}
      </div>
    </div>
  );
}
