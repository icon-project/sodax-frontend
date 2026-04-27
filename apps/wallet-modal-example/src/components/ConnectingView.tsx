import type { ChainType } from '@sodax/types';

type ConnectingViewProps = {
  chainType: ChainType;
  connectorName: string;
  onCancel: () => void;
};

export function ConnectingView({ chainType, connectorName, onCancel }: ConnectingViewProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      <p className="text-sm text-gray-700">
        Waiting for <span className="font-semibold">{connectorName}</span> on{' '}
        <span className="font-semibold">{chainType}</span>…
      </p>
      <p className="text-xs text-gray-500">Approve the request in your wallet popup.</p>
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-gray-600 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
