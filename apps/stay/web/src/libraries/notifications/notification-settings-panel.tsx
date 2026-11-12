import { Alert, Button, Switch } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import type {
  NotificationGroup,
  NotificationPreferences,
  NotificationSettings,
} from '@stay/shared';
import { useEffect, useState } from 'react';
import {
  type BrowserSubscription,
  currentEndpoint,
  type PushScope,
  type PushState,
  pushPermission,
  rememberPrompt,
  subscribeBrowser,
  unsubscribeBrowser,
} from './push';

const GROUP_LABELS: Record<NotificationGroup, string> = {
  payments: 'Chuyển khoản và thanh toán',
  invoices: 'Hoá đơn mới',
  reminders: 'Nhắc việc (chốt số, hạn thanh toán)',
  requests: 'Báo hỏng và yêu cầu',
  announcements: 'Thông báo của chủ trọ',
};

interface Props {
  scope: PushScope;
  settings: NotificationSettings;
  /** Event groups this audience receives. */
  groups: readonly NotificationGroup[];
  saving: boolean;
  onSave: (preferences: NotificationPreferences) => Promise<unknown>;
  onSubscribe: (subscription: BrowserSubscription) => Promise<unknown>;
  onUnsubscribe: (endpoint: string) => Promise<unknown>;
  /** Inside a titled section: sub-headings become `h3`. */
  nested?: boolean;
}

/**
 * Per-person notification settings: email and browser channels, event groups (saved on each
 * toggle) and this browser's push state, with re-enabling after an earlier denial.
 */
export function NotificationSettingsPanel({
  scope,
  settings,
  groups,
  saving,
  onSave,
  onSubscribe,
  onUnsubscribe,
  nested = false,
}: Props) {
  const Heading = nested ? 'h3' : 'h2';
  const [permission, setPermission] = useState<PushState>(() => pushPermission());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void currentEndpoint().then((endpoint) => setSubscribed(Boolean(endpoint)));
  }, []);

  const save = (changes: Partial<NotificationPreferences>) => {
    const next = {
      email: settings.email,
      push: settings.push,
      mutedGroups: settings.mutedGroups,
      ...changes,
    };

    onSave(next).catch(() => toast.error('Không lưu được cài đặt. Vui lòng thử lại.'));
  };

  const toggleGroup = (group: NotificationGroup, on: boolean) =>
    save({
      mutedGroups: on
        ? settings.mutedGroups.filter((item) => item !== group)
        : [...settings.mutedGroups, group],
    });

  const enableBrowser = async () => {
    if (!settings.pushPublicKey) return;
    setBusy(true);
    try {
      const result = await subscribeBrowser(settings.pushPublicKey);

      if (typeof result === 'string') {
        rememberPrompt(scope, result);
        setPermission(result);
        if (result === 'denied') toast.error('Trình duyệt đang chặn thông báo của trang này.');
        return;
      }
      rememberPrompt(scope, 'granted');
      await onSubscribe(result);
      if (!settings.push) save({ push: true });
      setPermission('granted');
      setSubscribed(true);
      toast.success('Đã bật thông báo trên trình duyệt này.');
    } catch {
      toast.error('Không bật được thông báo trình duyệt. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const disableBrowser = async () => {
    setBusy(true);
    try {
      const endpoint = await unsubscribeBrowser();

      if (endpoint) await onUnsubscribe(endpoint);
      setSubscribed(false);
      toast.success('Đã tắt thông báo trên trình duyệt này.');
    } catch {
      toast.error('Không tắt được thông báo trình duyệt. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5" data-testid="notification-settings">
      <p className="text-ui-sm text-muted">
        Thông báo trong ứng dụng luôn hiển thị. Các lựa chọn dưới đây áp dụng cho email và thông báo
        trình duyệt.
      </p>

      <section className="grid gap-3" aria-labelledby="notification-channels">
        <Heading id="notification-channels" className="font-semibold">
          Kênh nhận
        </Heading>
        <Switch
          label="Email"
          checked={settings.email}
          disabled={saving}
          onCheckedChange={(email) => save({ email })}
        />
        {!settings.emailAvailable ? (
          <p className="text-ui-sm text-muted">Hệ thống chưa cấu hình gửi email.</p>
        ) : !settings.hasEmail ? (
          <p className="text-ui-sm text-muted">Chưa có email trong hồ sơ nên chưa thể gửi email.</p>
        ) : null}
        <Switch
          label="Thông báo trình duyệt"
          checked={settings.push}
          disabled={saving}
          onCheckedChange={(push) => save({ push })}
        />
      </section>

      <section className="grid gap-3" aria-labelledby="notification-browser">
        <Heading id="notification-browser" className="font-semibold">
          Trình duyệt này
        </Heading>
        {!settings.pushPublicKey ? (
          <p className="text-ui-sm text-muted">Hệ thống chưa cấu hình thông báo trình duyệt.</p>
        ) : permission === 'unsupported' ? (
          <p className="text-ui-sm text-muted">
            Trình duyệt này không hỗ trợ thông báo. Trên iPhone, hãy thêm trang vào Màn hình chính.
          </p>
        ) : permission === 'denied' ? (
          <Alert tone="warning">
            Trình duyệt đang chặn thông báo. Bấm biểu tượng ổ khoá cạnh địa chỉ trang → Thông báo →
            Cho phép, rồi tải lại trang.
          </Alert>
        ) : subscribed && permission === 'granted' ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-ui-sm">Đang nhận thông báo trên trình duyệt này.</p>
            <Button
              variant="secondary"
              size="sm"
              loading={busy}
              onClick={() => void disableBrowser()}
            >
              Tắt trên trình duyệt này
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-ui-sm text-muted">Trình duyệt này chưa nhận thông báo.</p>
            <Button size="sm" loading={busy} onClick={() => void enableBrowser()}>
              Bật thông báo trình duyệt
            </Button>
          </div>
        )}
      </section>

      <section className="grid gap-3" aria-labelledby="notification-groups">
        <Heading id="notification-groups" className="font-semibold">
          Loại thông báo
        </Heading>
        {groups.map((group) => (
          <Switch
            key={group}
            label={GROUP_LABELS[group]}
            checked={!settings.mutedGroups.includes(group)}
            disabled={saving}
            onCheckedChange={(on) => toggleGroup(group, on)}
          />
        ))}
      </section>
    </div>
  );
}
