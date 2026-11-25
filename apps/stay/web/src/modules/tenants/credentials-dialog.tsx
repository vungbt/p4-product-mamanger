import { Button, Dialog } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { unwrap } from '@stay/sdk/shared';
import { useState } from 'react';
import { getStaySdk } from '@/libraries/session/session';

type Credentials = { login: string; password: string; appUrl: string };

export function TenantCredentialsAction({
  id,
  phone,
  email,
  accountIssued,
}: {
  id: string;
  phone: string;
  email: string | null;
  accountIssued: boolean;
}) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const [busy, setBusy] = useState(false);

  const [issued, setIssued] = useState(accountIssued);

  const message = credentials
    ? `Chào bạn! Đăng nhập Stay tại ${credentials.appUrl}\nTài khoản: ${credentials.login}\nMật khẩu tạm thời: ${credentials.password}\nVui lòng đổi mật khẩu ngay lần đăng nhập đầu tiên.`
    : '';

  const issue = async () => {
    setBusy(true);
    try {
      const result = unwrap(
        await getStaySdk().POST('/api/tenants/{id}/credentials', { params: { path: { id } } }),
      ).data;

      setCredentials(result);
      setIssued(true);
    } catch {
      toast.error('Không thể cấp tài khoản.');
    } finally {
      setBusy(false);
    }
  };

  const sendEmail = async () => {
    if (!credentials) return;
    setBusy(true);
    try {
      unwrap(
        await getStaySdk().POST('/api/tenants/{id}/credentials/email', {
          params: { path: { id } },
          body: { password: credentials.password },
        }),
      );
      toast.success('Đã gửi email.');
    } catch {
      toast.error('Không thể gửi email.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Đã sao chép.');
    } catch {
      toast.error('Không thể sao chép.');
    }
  };

  return (
    <>
      <Button variant="secondary" loading={busy} onClick={() => void issue()}>
        {issued ? 'Cấp lại mật khẩu' : 'Cấp tài khoản'}
      </Button>
      {credentials ? (
        <Dialog
          open
          title="Thông tin đăng nhập"
          description="Mật khẩu chỉ hiển thị lần này. Đóng để xoá khỏi màn hình."
          onOpenChange={(open) => {
            if (!open) setCredentials(null);
          }}
        >
          <dl className="grid gap-2">
            <dt>Tài khoản đăng nhập</dt>
            <dd>{credentials.login}</dd>
            <dt>Mật khẩu tạm thời</dt>
            <dd data-testid="temporary-password" className="font-mono">
              {credentials.password}
            </dd>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
              }}
            >
              Gửi SMS
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void copy();
                window.open(`https://zalo.me/${phone}`, '_blank', 'noopener,noreferrer');
              }}
            >
              Gửi Zalo
            </Button>
            {email ? (
              <Button variant="secondary" loading={busy} onClick={() => void sendEmail()}>
                Gửi email
              </Button>
            ) : null}
            <Button onClick={() => void copy()}>Sao chép</Button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
