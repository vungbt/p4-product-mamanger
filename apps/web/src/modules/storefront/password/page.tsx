import { axiosClient } from '@p4/api-client';
import { type AuthSession, writeAuthSession } from '@p4/auth';
import type { LoginResponse, UpdatePasswordInput } from '@p4/shared';
import { Button, Form, FormField, FormSubmit, InputPassword, useAppForm, z } from '@p4/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';

export default function StorefrontPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasPassword = Boolean(user?.hasPassword);

  const schema = useMemo(
    () => ({
      currentPassword: hasPassword
        ? z.string().min(1, t('auth.currentPasswordRequired'))
        : z.string().optional(),
      newPassword: z.string().min(6, t('auth.passwordMinLength')),
      confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired')),
    }),
    [hasPassword, t],
  );

  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    onSubmit: async ({ value }) => {
      if (value.newPassword !== value.confirmPassword) {
        toast.error(t('auth.passwordMismatch'));
        return;
      }

      try {
        const body: UpdatePasswordInput = {
          currentPassword: hasPassword ? value.currentPassword : undefined,
          newPassword: value.newPassword,
        };
        const response = await axiosClient.patch<UpdatePasswordInput, { data: LoginResponse }>(
          '/auth/password',
          body,
        );
        writeAuthSession(response.data as AuthSession);
        toast.success(t('auth.passwordUpdated'));
        navigate(ROUTES.storefront.shop, { replace: true });
      } catch (error) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: string }).message)
            : t('auth.passwordUpdateFailed');
        toast.error(message);
      }
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-background px-6 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-neutral-border bg-neutral-white p-8 shadow-2xl sm:p-10">
        <Link to={ROUTES.storefront.shop} aria-label={t('auth.backToShop')}>
          <BrandLogo variant="header" height={36} />
        </Link>
        <h1 className="mt-8 text-heading-5 font-bold text-neutral-text-primary">
          {hasPassword ? t('auth.changePassword') : t('auth.setPassword')}
        </h1>
        <p className="mt-2 text-14 text-neutral-text-secondary">
          {hasPassword ? t('auth.changePasswordHint') : t('auth.setPasswordHint')}
        </p>

        <Form form={form} schema={schema} className="mt-8 space-y-5">
          {hasPassword ? (
            <FormField name="currentPassword" label={t('auth.currentPassword')} required>
              <InputPassword autoComplete="current-password" />
            </FormField>
          ) : null}
          <FormField name="newPassword" label={t('auth.newPassword')} required>
            <InputPassword autoComplete="new-password" />
          </FormField>
          <FormField name="confirmPassword" label={t('auth.confirmPassword')} required>
            <InputPassword autoComplete="new-password" />
          </FormField>
          <FormSubmit form={form}>
            {(isSubmitting) => (
              <Button type="submit" size="large" className="w-full" loading={isSubmitting}>
                {t('auth.savePassword')}
              </Button>
            )}
          </FormSubmit>
        </Form>
      </section>
    </main>
  );
}
