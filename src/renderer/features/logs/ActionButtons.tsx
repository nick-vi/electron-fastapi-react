import { Button } from '@renderer/components/Button';

type Props = {
  isReady: boolean;
  isLoading: boolean;
  onFetchData: () => void;
  onFetchLogs: () => void;
  onClearLogs: () => void;
};

export function ActionButtons({
  isReady,
  isLoading,
  onFetchData,
  onFetchLogs,
  onClearLogs,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={onFetchData}
        disabled={!isReady || isLoading}
        variant="primary"
        size="md"
      >
        Fetch Data
      </Button>
      <Button
        onClick={onFetchLogs}
        disabled={!isReady || isLoading}
        variant="success"
        size="md"
      >
        Generate Logs
      </Button>
      <Button
        onClick={onClearLogs}
        variant="danger"
        size="md"
      >
        Clear Logs
      </Button>
    </div>
  );
}