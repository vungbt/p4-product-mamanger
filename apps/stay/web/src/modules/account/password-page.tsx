import { Button, Form, FormField, FormSubmit, InputPassword, useAppForm } from '@itclabs/react-ui';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { FormError } from '@/libraries/forms/page-states';
import { useAuth } from '@/libraries/session/auth-provider';
import { getAuthClient, refreshSession } from '@/libraries/session/session';

export default function PasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const schema = {
    currentPassword: v.pipe(v.string(), v.minLength(1)),
    newPassword: v.pipe(v.string(), v.minLength(10, 'Mật khẩu cần ít nhất 10 ký tự')),
  };

  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      const result = await getAuthClient().changePassword({ ...value, revokeOtherSessions: true });

      if (result.error) {
        setError('Không thể đổi mật khẩu. Kiểm tra mật khẩu hiện tại và chọn mật khẩu mới.');
        return;
      }
      await refreshSession();
      form.reset();
      navigate('/', { replace: true });
    },
  });

  return (
    <main className="mx-auto grid w-full max-w-sm gap-4 p-5">
      <h1 className="text-heading font-bold">Đổi mật khẩu</h1>
      <p>Đặt mật khẩu riêng để tiếp tục sử dụng tài khoản.</p>
      <Form form={form} schema={schema} className="grid gap-4">
        <FormError message={error} />
        <FormField name="currentPassword" label="Mật khẩu hiện tại" required>
          <InputPassword autoComplete="current-password" />
        </FormField>
        <FormField name="newPassword" label="Mật khẩu mới" required>
          <InputPassword autoComplete="new-password" />
        </FormField>
        <FormSubmit form={form}>
          {(submitting) => (
            <Button type="submit" loading={submitting}>
              Lưu mật khẩu
            </Button>
          )}
        </FormSubmit>
      </Form>
      {!user?.mustChangePassword ? (
        <Link
          className="font-semibold text-accent"
          to={user?.role === 'tenant' ? '/my/notifications' : '/account/notifications'}
        >
          Cài đặt thông báo
        </Link>
      ) : null}
    </main>
  );
}
