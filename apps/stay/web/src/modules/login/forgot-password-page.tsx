import { Button, Form, FormField, FormSubmit, Input, useAppForm } from '@itclabs/react-ui';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as v from 'valibot';
import { BrandMark } from '@/brand';
import { FormError } from '@/libraries/forms/page-states';
import { getAuthClient } from '@/libraries/session/session';

const schema = {
  email: v.pipe(v.string(), v.trim(), v.email('Nhập địa chỉ email hợp lệ.')),
};

/**
 * Requests a password reset email. The answer is the same whether or not the address has an
 * account, so the page never reveals who is registered.
 */
export default function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { email: params.get('email') ?? '' },
    onSubmit: async ({ value }) => {
      setError(null);
      const email = value.email.trim().toLowerCase();
      const result = await getAuthClient().requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error && result.error.status !== 404)
        setError('Chưa gửi được email. Vui lòng thử lại sau ít phút.');
      else setSentTo(email);
    },
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="grid w-full max-w-sm gap-5">
        <div className="grid justify-items-center gap-3 text-center">
          <BrandMark className="size-12" />
          <h1 className="text-section font-bold text-ink">Quên mật khẩu</h1>
          <p className="text-ui-sm text-muted">
            Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt mật khẩu mới.
          </p>
        </div>
        <div className="grid gap-4 rounded-panel border border-line bg-surface p-5">
          {sentTo ? (
            <p role="status" data-testid="forgot-password-sent">
              Nếu <strong>{sentTo}</strong> có tài khoản, email đặt mật khẩu đã được gửi. Mở hộp thư
              (cả mục Spam) và bấm liên kết trong thư; liên kết hết hạn sau ít phút.
            </p>
          ) : (
            <Form form={form} schema={schema} className="grid gap-4">
              <FormError message={error} />
              <FormField name="email" label="Email" required>
                <Input type="email" autoComplete="email" autoFocus />
              </FormField>
              <FormSubmit form={form}>
                {(submitting) => (
                  <Button type="submit" loading={submitting}>
                    Gửi liên kết đặt mật khẩu
                  </Button>
                )}
              </FormSubmit>
            </Form>
          )}
        </div>
        <Link to="/login" className="text-center text-ui-sm text-accent">
          Quay lại đăng nhập
        </Link>
      </div>
    </main>
  );
}
