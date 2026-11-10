import { Alert, Button } from '@itclabs/react-ui';
import { getErrorMessage } from '@stay/sdk/shared';
import type { ContractStatus } from '@stay/shared';

export const CONTRACT_LABELS: Record<ContractStatus, string> = {
  draft: 'Nháp',
  active: 'Hiệu lực',
  ending: 'Đã báo trả',
  ended: 'Đã kết thúc',
  cancelled: 'Đã huỷ',
};

export function LoadError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Alert
      tone="danger"
      action={
        <Button variant="secondary" onClick={retry}>
          Thử lại
        </Button>
      }
    >
      {getErrorMessage(error, 'Không thể tải dữ liệu.')}
    </Alert>
  );
}
