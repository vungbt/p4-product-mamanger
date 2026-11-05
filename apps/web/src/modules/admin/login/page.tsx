import {
  Button,
  Checkbox,
  Form,
  FormField,
  FormSubmit,
  Icon,
  Input,
  InputPassword,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as v from 'valibot';
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
        toast.success(t('auth.adminLoginSuccess'));
        navigate(ROUTES.admin.dashboard, { replace: true });
      } catch (error) {
        const message =
          error instanceof Error
            ? t(error.message, { defaultValue: t('auth.loginFailed') })
            : t('auth.loginFailed');
        toast.error(message);
      }
    },
  });

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-50 px-4 py-10 sm:px-6"
      data-portal="admin"
    >
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-accent/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-warning-700/12 blur-3xl" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-3xl bg-surface p-6 shadow-2xl shadow-accent/15 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <BrandLogo variant="header" height={34} />
            </div>
            <h1 className="text-heading font-bold text-ink sm:text-heading">
              {t('auth.adminPortalTitle')}
            </h1>
            <p className="mt-1.5 text-ui-sm text-muted">{t('auth.adminPortalSubtitle')}</p>
          </div>

          <Form form={form} schema={schema} className="grid gap-4">
            <FormField name="email" label={t('auth.adminStaffEmail')} required className="mb-0">
              <Input
                size="lg"
                type="email"
                icon="mail"
                placeholder={t('auth.adminStaffEmailPlaceholder')}
                autoComplete="email"
              />
            </FormField>

            <div className="relative">
              <button
                type="button"
                className="absolute right-0 top-0 z-10 text-ui-sm font-medium text-accent hover:text-brand-800"
                onClick={() => toast.info(t('auth.forgotPasswordSoon'))}
              >
                {t('auth.forgotPasswordShort')}
              </button>
              <FormField
                name="password"
                label={t('auth.adminSecurePassword')}
                required
                className="mb-0"
              >
                <InputPassword
                  size="lg"
                  icon="key"
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                />
              </FormField>
            </div>

            <Checkbox
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
              label={t('auth.adminRememberSession')}
            />

            <FormSubmit form={form}>
              {(isSubmitting) => (
                <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
                  <Icon name="shieldCheck" />
                  {isSubmitting ? t('common.loggingIn') : t('auth.adminSecureLogin')}
                </Button>
              )}
            </FormSubmit>
          </Form>

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-brand-50 px-4 py-3.5">
            <Icon name="shieldCheck" className="!mt-0.5 !h-4 !w-4 shrink-0 text-accent" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                {t('auth.adminAuthorizedBadge')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t('auth.adminSecurityNotice')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-center">
          <Link
            to={ROUTES.storefront.shop}
            className="text-ui-sm font-medium text-muted transition-colors hover:text-accent"
          >
            {t('auth.backToShop')}
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
            <a href="#privacy" className="hover:text-accent">
              {t('auth.privacy')}
            </a>
            <span>·</span>
            <a href="#support" className="hover:text-accent">
              {t('auth.adminSupport')}
            </a>
            <span>·</span>
            <a href="#terms" className="hover:text-accent">
              {t('auth.terms')}
            </a>
          </div>
          <p className="text-xs text-muted">{t('auth.loginCopyright', { year })}</p>
        </div>
      </div>
    </main>
  );
}
