import type { ChainType } from '@sodax/types';

type ErrorViewProps = {
  chainType: ChainType;
  connectorName: string;
  error: Error;
  onRetry: () => void;
  onBack: () => void;
};

export function ErrorView({ chainType, connectorName, error, onRetry, onBack }: ErrorViewProps) {
  return (
    <div className="space-y-3">
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <div className="font-medium">
          Failed to connect {connectorName} on {chainType}
        </div>
        <div className="mt-1 text-xs break-words">{error.message}</div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Pick another wallet
        </button>
      </div>
    </div>
  );
}
