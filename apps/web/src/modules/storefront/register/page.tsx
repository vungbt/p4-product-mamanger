import {
  Button,
  Divider,
  Form,
  FormField,
  FormSubmit,
  Input,
  InputPassword,
  toastError,
  toastInfo,
  toastSuccess,
  useAppForm,
  z,
} from '@p4/ui';
import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import BrandLogo from '@/libraries/brand-logo';
import GoogleLoginButton from '@/libraries/google-login-button';
import LanguageSwitcher from '@/libraries/language-switcher';

export default function StorefrontRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const schema = useMemo(
    () => ({
      fullName: z.string().min(2, t('auth.fullNameRequired')),
      email: z.string().email(t('auth.emailInvalid')),
      password: z.string().min(6, t('auth.passwordMinLength')),
      confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired')),
    }),
    [t],
  );

  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmPassword) {
        toastError(t('auth.passwordMismatch'));
        return;
      }

      toastInfo(t('auth.registerSoon'));
    },
  });

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-primary-background"
      data-portal="storefront"
    >
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-warning/15 blur-3xl" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
        <Link to={ROUTES.storefront.shop} aria-label={t('auth.backToShop')}>
          <BrandLogo variant="header" height={36} />
        </Link>
        <LanguageSwitcher />
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-156px)] w-full max-w-7xl items-center gap-12 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:px-12 lg:py-12">
        <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-white via-neutral-white to-primary-background p-6 shadow-2xl shadow-primary/15 sm:p-9 lg:mx-0 xl:p-11">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-warning to-primary/30" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mb-8">
            <span className="mb-4 inline-flex rounded-full bg-primary-background px-3 py-1.5 text-12 font-semibold uppercase tracking-[0.14em] text-primary">
              {t('auth.memberEyebrow')}
            </span>
            <h1 className="text-heading-5 font-bold leading-tight text-neutral-black sm:text-heading-4">
              {t('auth.registerTitle')}
            </h1>
            <p className="mt-3 text-15 leading-relaxed text-neutral-text-secondary">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          <Form form={form} schema={schema} className="relative space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                name="fullName"
                label={t('auth.fullName')}
                required
                size="large"
                className="mb-0"
              >
                <Input placeholder={t('auth.fullNamePlaceholder')} autoComplete="name" />
              </FormField>
              <FormField
                name="email"
                label={t('auth.email')}
                required
                size="large"
                className="mb-0"
              >
                <Input placeholder={t('auth.emailPlaceholder')} autoComplete="email" type="email" />
              </FormField>
            </div>

            <FormField
              name="password"
              label={t('common.password')}
              required
              size="large"
              className="mb-0"
            >
              <InputPassword
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="new-password"
              />
            </FormField>

            <FormField
              name="confirmPassword"
              label={t('auth.confirmPassword')}
              required
              size="large"
              className="mb-0"
            >
              <InputPassword
                placeholder={t('auth.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
            </FormField>

            <FormSubmit form={form}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  loading={isSubmitting}
                  size="large"
                  className="w-full"
                  iconRight="arrow-right"
                >
                  {t('auth.createAccount')}
                </Button>
              )}
            </FormSubmit>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <Divider />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-neutral-white px-3 text-12 font-medium uppercase tracking-[0.14em] text-neutral-text-secondary">
                  {t('auth.or')}
                </span>
              </div>
            </div>

            <GoogleLoginButton
              onSuccess={() => {
                toastSuccess(t('auth.loginSuccess'));
                navigate(ROUTES.storefront.shop, { replace: true });
              }}
            />

            <p className="text-center text-12 leading-relaxed text-neutral-text-secondary">
              <Trans
                i18nKey="auth.registerAgreement"
                components={{
                  terms: (
                    <a
                      href="#terms"
                      className="font-medium text-neutral-text-primary underline underline-offset-2 hover:text-primary"
                    >
                      {t('auth.terms')}
                    </a>
                  ),
                  privacy: (
                    <a
                      href="#privacy"
                      className="font-medium text-neutral-text-primary underline underline-offset-2 hover:text-primary"
                    >
                      {t('auth.privacy')}
                    </a>
                  ),
                }}
              />
            </p>
          </Form>

          <p className="relative mt-7 text-center text-14 text-neutral-text-secondary">
            {t('auth.alreadyMember')}{' '}
            <Link
              to={ROUTES.storefront.login}
              className="font-semibold text-primary hover:text-primary-clicked"
            >
              {t('common.login')}
            </Link>
          </p>
        </div>

        <aside className="relative hidden min-h-[620px] lg:block">
          <div className="absolute left-0 top-4 w-[72%] overflow-hidden rounded-[2rem] border-4 border-neutral-white shadow-2xl transition-transform duration-500 hover:-translate-y-2">
            <img
              src="/showcase/register-flatlay-v1.jpg"
              alt="Bộ sưu tập thời trang thành viên P4 Store"
              className="h-[500px] w-full object-cover"
            />
          </div>

          <div className="absolute right-0 top-24 w-[48%] rotate-3 overflow-hidden rounded-3xl border-4 border-neutral-white shadow-2xl transition-transform duration-500 hover:rotate-0 hover:scale-105">
            <img
              src="/showcase/register-sneaker-v1.jpg"
              alt="Giày thành viên P4 Store"
              className="h-72 w-full object-cover"
            />
          </div>

          <div className="absolute bottom-6 right-10 w-[45%] -rotate-3 overflow-hidden rounded-3xl border-4 border-neutral-white shadow-2xl transition-transform duration-500 hover:rotate-0 hover:scale-105">
            <img
              src="/showcase/register-package-v1.jpg"
              alt="Hộp quà thành viên P4 Store"
              className="h-64 w-full object-cover"
            />
          </div>

          <div className="absolute bottom-20 left-5 max-w-xs rounded-2xl border border-white/35 bg-neutral-black/45 p-5 text-white shadow-2xl shadow-neutral-black/25 backdrop-blur-xl">
            <p className="text-12 font-semibold uppercase tracking-[0.16em] text-primary">
              {t('auth.memberBenefitEyebrow')}
            </p>
            <h2 className="mt-2 text-title-1 font-bold">{t('auth.memberBenefitTitle')}</h2>
            <p className="mt-2 text-14 leading-relaxed text-white/80">
              {t('auth.memberBenefitSubtitle')}
            </p>
          </div>
        </aside>
      </section>

      <footer className="relative z-20 mx-auto w-full max-w-7xl px-6 pb-6 text-12 text-neutral-text-secondary sm:px-10 lg:px-12">
        {t('auth.loginCopyright', { year })}
      </footer>
    </main>
  );
}
