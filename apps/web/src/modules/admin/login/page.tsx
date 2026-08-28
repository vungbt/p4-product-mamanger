import {
  Button,
  Checkbox,
  Form,
  FormField,
  FormSubmit,
  Input,
  InputPassword,
  RenderIcon,
  toastError,
  toastInfo,
  toastSuccess,
  useAppForm,
  v,
} from '@p4/ui';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';
import LanguageSwitcher from '@/libraries/language-switcher';

const REMEMBER_KEY = 'p4_admin_remember_email';

function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const year = new Date().getFullYear();
  const savedEmail = readRememberedEmail();
  const [remember, setRemember] = useState(Boolean(savedEmail));

  const schema = useMemo(
    () => ({
      email: v.pipe(v.string(), v.email(t('auth.emailInvalid'))),
      password: v.pipe(v.string(), v.minLength(1, t('auth.passwordRequired'))),
    }),
    [t],
  );

  const form = useAppForm({
    defaultValues: {
      email: savedEmail,
      password: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await login(value.email, value.password, 'admin');
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, value.email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        toastSuccess(t('auth.adminLoginSuccess'));
        navigate(ROUTES.admin.dashboard, { replace: true });
      } catch (error) {
        const message =
          error instanceof Error
            ? t(error.message, { defaultValue: t('auth.loginFailed') })
            : t('auth.loginFailed');
        toastError(message);
      }
    },
  });

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-primary-background px-4 py-10 sm:px-6"
      data-portal="admin"
    >
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-warning/12 blur-3xl" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-3xl bg-neutral-white p-6 shadow-2xl shadow-primary/15 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <BrandLogo variant="header" height={34} />
            </div>
            <h1 className="text-title-1 font-bold text-neutral-black sm:text-heading-5">
              {t('auth.adminPortalTitle')}
            </h1>
            <p className="mt-1.5 text-13 text-neutral-text-secondary">
              {t('auth.adminPortalSubtitle')}
            </p>
          </div>

          <Form form={form} schema={schema} className="space-y-4">
            <FormField
              name="email"
              label={t('auth.adminStaffEmail')}
              required
              size="large"
              className="mb-0"
            >
              <Input
                type="email"
                icon="envelope"
                placeholder={t('auth.adminStaffEmailPlaceholder')}
                autoComplete="email"
                color="neutral"
                variant="outline"
              />
            </FormField>

            <div className="relative">
              <button
                type="button"
                className="absolute right-0 top-0 z-10 text-13 font-medium text-primary hover:text-primary-clicked"
                onClick={() => toastInfo(t('auth.forgotPasswordSoon'))}
              >
                {t('auth.forgotPasswordShort')}
              </button>
              <FormField
                name="password"
                label={t('auth.adminSecurePassword')}
                required
                size="large"
                className="mb-0"
              >
                <InputPassword
                  icon="key"
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                  color="neutral"
                  variant="outline"
                />
              </FormField>
            </div>

            <Checkbox
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              label={t('auth.adminRememberSession')}
              color="primary"
              size="middle"
            />

            <FormSubmit form={form}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  loading={isSubmitting}
                  size="large"
                  className="w-full"
                  icon="shield-check"
                >
                  {isSubmitting ? t('common.loggingIn') : t('auth.adminSecureLogin')}
                </Button>
              )}
            </FormSubmit>
          </Form>

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-primary-background px-4 py-3.5">
            <RenderIcon name="shield-check" className="!mt-0.5 !h-4 !w-4 shrink-0 text-primary" />
            <div>
              <p className="text-11 font-bold uppercase tracking-[0.12em] text-primary">
                {t('auth.adminAuthorizedBadge')}
              </p>
              <p className="mt-1 text-12 leading-relaxed text-neutral-text-secondary">
                {t('auth.adminSecurityNotice')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-center">
          <Link
            to={ROUTES.storefront.shop}
            className="text-13 font-medium text-neutral-text-secondary transition-colors hover:text-primary"
          >
            {t('auth.backToShop')}
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-12 text-neutral-text-secondary">
            <a href="#privacy" className="hover:text-primary">
              {t('auth.privacy')}
            </a>
            <span>·</span>
            <a href="#support" className="hover:text-primary">
              {t('auth.adminSupport')}
            </a>
            <span>·</span>
            <a href="#terms" className="hover:text-primary">
              {t('auth.terms')}
            </a>
          </div>
          <p className="text-11 text-neutral-placeholder">{t('auth.loginCopyright', { year })}</p>
        </div>
      </div>
    </main>
  );
}
