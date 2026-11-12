import {
  Button,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  InputPassword,
  useAppForm,
} from '@itclabs/react-ui';
import { createStayAuthClient } from '@stay/sdk/auth';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as v from 'valibot';
import { FormError } from '@/libraries/forms/page-states';

const auth = createStayAuthClient('/api');
const schema = { password: v.pipe(v.string(), v.minLength(8, 'Mật khẩu tối thiểu 8 ký tự.')) };

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const token = params.get('token');
  const form = useAppForm({
    defaultValues: { password: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      const result = await auth.resetPassword({ newPassword: value.password, token: token ?? '' });

      if (result.error)
        setError('Link không hợp lệ hoặc đã hết hạn. Liên hệ chủ trọ để được hỗ trợ.');
      else {
        form.reset();
        setSaved(true);
      }
    },
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="grid w-full max-w-sm gap-4 rounded-panel border border-line bg-surface p-5">
        <h1 className="text-ui-lg font-semibold">Đặt mật khẩu</h1>
        {saved ? (
          <p>Đã đặt mật khẩu. Bạn có thể đăng nhập bằng email được mời.</p>
        ) : !token || params.has('error') ? (
          <p role="alert">Link không hợp lệ hoặc đã hết hạn.</p>
        ) : (
          <Form form={form} schema={schema} className="grid gap-4">
            <FormLayout size="full">
              <FormSection>
                <FormGrid columns={1}>
                  <FormError message={error} />
                  <FormField name="password" label="Mật khẩu mới" required>
                    <InputPassword autoComplete="new-password" />
                  </FormField>
                </FormGrid>
              </FormSection>
              <FormActions>
                <FormSubmit form={form}>
                  {(submitting) => (
                    <Button type="submit" loading={submitting}>
                      Lưu mật khẩu
                    </Button>
                  )}
                </FormSubmit>
              </FormActions>
            </FormLayout>
          </Form>
        )}
        <Link to="/login">Đăng nhập</Link>
      </div>
    </main>
  );
}
