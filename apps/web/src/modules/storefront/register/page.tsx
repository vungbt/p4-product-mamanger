import {
  Button,
  Divider,
  Form,
  FormField,
  FormSubmit,
  Icon,
  Input,
  InputPassword,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as v from 'valibot';
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
      fullName: v.pipe(v.string(), v.minLength(2, t('auth.fullNameRequired'))),
      email: v.pipe(v.string(), v.email(t('auth.emailInvalid'))),
      password: v.pipe(v.string(), v.minLength(6, t('auth.passwordMinLength'))),
      confirmPassword: v.pipe(v.string(), v.minLength(1, t('auth.confirmPasswordRequired'))),
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
        toast.error(t('auth.passwordMismatch'));
        return;
      }

      toast.info(t('auth.registerSoon'));
    },
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-50" data-portal="storefront">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-warning-700/15 blur-3xl" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
        <Link to={ROUTES.storefront.shop} aria-label={t('auth.backToShop')}>
          <BrandLogo variant="header" height={36} />
        </Link>
        <LanguageSwitcher />
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-156px)] w-full max-w-7xl items-center gap-12 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:px-12 lg:py-12">
        <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-surface via-surface to-brand-50 p-6 shadow-2xl shadow-accent/15 sm:p-9 lg:mx-0 xl:p-11">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-warning-700 to-accent/30" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mb-8">
            <span className="mb-4 inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {t('auth.memberEyebrow')}
            </span>
            <h1 className="text-heading font-bold leading-tight text-ink sm:text-title">
              {t('auth.registerTitle')}
            </h1>
            <p className="mt-3 text-body leading-relaxed text-muted">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          <Form form={form} schema={schema} className="relative grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField name="fullName" label={t('auth.fullName')} required className="mb-0">
                <Input size="lg" placeholder={t('auth.fullNamePlaceholder')} autoComplete="name" />
              </FormField>
              <FormField name="email" label={t('auth.email')} required className="mb-0">
                <Input
                  size="lg"
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                  type="email"
                />
              </FormField>
            </div>

            <FormField name="password" label={t('common.password')} required className="mb-0">
              <InputPassword
                size="lg"
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="new-password"
              />
            </FormField>

            <FormField
              name="confirmPassword"
              label={t('auth.confirmPassword')}
              required
              className="mb-0"
            >
              <InputPassword
                size="lg"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
            </FormField>

            <FormSubmit form={form}>
              {(isSubmitting) => (
                <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
                  {t('auth.createAccount')}
                  <Icon name="arrowRight" />
                </Button>
              )}
            </FormSubmit>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <Divider />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  {t('auth.or')}
                </span>
              </div>
            </div>

            <GoogleLoginButton
              onSuccess={() => {
                toast.success(t('auth.loginSuccess'));
                navigate(ROUTES.storefront.shop, { replace: true });
              }}
            />

            <p className="text-center text-xs leading-relaxed text-muted">
              <Trans
                i18nKey="auth.registerAgreement"
                components={{
                  terms: (
                    <a
                      href="#terms"
                      className="font-medium text-ink underline underline-offset-2 hover:text-accent"
                    >
                      {t('auth.terms')}
                    </a>
                  ),
                  privacy: (
                    <a
                      href="#privacy"
                      className="font-medium text-ink underline underline-offset-2 hover:text-accent"
                    >
                      {t('auth.privacy')}
                    </a>
                  ),
                }}
              />
            </p>
          </Form>

          <p className="relative mt-7 text-center text-control text-muted">
            {t('auth.alreadyMember')}{' '}
            <Link
              to={ROUTES.storefront.login}
              className="font-semibold text-accent hover:text-brand-800"
            >
              {t('common.login')}
            </Link>
          </p>
        </div>

        <aside className="relative hidden min-h-[620px] lg:block">
          <div className="absolute left-0 top-4 w-[72%] overflow-hidden rounded-[2rem] border-4 border-surface shadow-2xl transition-transform duration-500 hover:-translate-y-2">
            <img
              src="/showcase/register-flatlay-v1.jpg"
              alt="Bộ sưu tập thời trang thành viên P4 Store"
              className="h-[500px] w-full object-cover"
            />
          </div>

          <div className="absolute right-0 top-24 w-[48%] rotate-3 overflow-hidden rounded-3xl border-4 border-surface shadow-2xl transition-transform duration-500 hover:rotate-0 hover:scale-105">
            <img
              src="/showcase/register-sneaker-v1.jpg"
              alt="Giày thành viên P4 Store"
              className="h-72 w-full object-cover"
            />
          </div>

          <div className="absolute bottom-6 right-10 w-[45%] -rotate-3 overflow-hidden rounded-3xl border-4 border-surface shadow-2xl transition-transform duration-500 hover:rotate-0 hover:scale-105">
            <img
              src="/showcase/register-package-v1.jpg"
              alt="Hộp quà thành viên P4 Store"
              className="h-64 w-full object-cover"
            />
          </div>

          <div className="absolute bottom-20 left-5 max-w-xs rounded-2xl border border-white/35 bg-black/45 p-5 text-white shadow-2xl shadow-black/25 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t('auth.memberBenefitEyebrow')}
            </p>
            <h2 className="mt-2 text-heading font-bold">{t('auth.memberBenefitTitle')}</h2>
            <p className="mt-2 text-control leading-relaxed text-white/80">
              {t('auth.memberBenefitSubtitle')}
            </p>
          </div>
        </aside>
      </section>

      <footer className="relative z-20 mx-auto w-full max-w-7xl px-6 pb-6 text-xs text-muted sm:px-10 lg:px-12">
        {t('auth.loginCopyright', { year })}
      </footer>
    </main>
  );
}
