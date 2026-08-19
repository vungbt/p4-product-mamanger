import { Button, Form, FormField, FormSubmit, Input, InputPassword, useAppForm, z } from '@p4/ui';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';
import GoogleLoginButton from '@/libraries/google-login-button';
import LanguageSwitcher from '@/libraries/language-switcher';

const HERO_SLIDES = [
  { src: '/showcase/store-hero-v2.jpg', alt: 'Không gian trưng bày của P4 Store' },
  { src: '/showcase/sneakers-hero-v2.jpg', alt: 'Giày mới tại P4 Store' },
  { src: '/showcase/bag-hero-v2.jpg', alt: 'Túi thời trang tại P4 Store' },
] as const;

export default function StorefrontLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const year = new Date().getFullYear();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const schema = useMemo(
    () => ({
      email: z.string().email(t('auth.emailInvalid')),
      password: z.string().min(1, t('auth.passwordRequired')),
    }),
    [t],
  );

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await login(value.email, value.password, 'storefront');
        toast.success(t('auth.loginSuccess'));
        navigate(ROUTES.storefront.shop, { replace: true });
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
    <main className="flex min-h-screen bg-neutral-white" data-portal="storefront">
      <aside className="relative hidden min-h-screen w-[44%] overflow-hidden lg:block">
        {HERO_SLIDES.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
              activeSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent via-neutral-black/45 to-neutral-black/90" />
        <div className="absolute left-10 top-10 rounded-full border border-white/25 bg-neutral-black/15 px-4 py-2 text-12 font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md xl:left-14 xl:top-14">
          {t('auth.storefrontFeaturedBadge')} · {year}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-10 pb-36 text-white xl:p-14 xl:pb-40 2xl:p-16 2xl:pb-44">
          <div className="relative max-w-xl overflow-hidden rounded-2xl border border-white/35 bg-neutral-black/45 p-6 shadow-2xl shadow-neutral-black/30 backdrop-blur-xl xl:p-7">
            <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
            <p className="mb-3 text-12 font-semibold uppercase tracking-[0.18em] text-white/75">
              {t('auth.storefrontPanelEyebrow')}
            </p>
            <h1 className="text-heading-4 font-bold leading-tight xl:text-heading-3">
              {t('auth.storefrontWelcome')}
            </h1>
            <p className="mt-3 max-w-lg text-15 leading-relaxed text-white">
              {t('auth.storefrontWelcomeDesc')}
            </p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-8 flex items-end justify-between px-10 xl:bottom-10 xl:px-14 2xl:px-16">
          <div className="flex gap-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-label={t('auth.showcaseImage', { number: index + 1 })}
                aria-current={activeSlide === index}
                onClick={() => setActiveSlide(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  activeSlide === index ? 'w-10 bg-primary' : 'w-5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-label={t('auth.showcaseImage', { number: index + 1 })}
                onClick={() => setActiveSlide(index)}
                className={`h-14 w-11 overflow-hidden rounded-lg border-2 transition-all duration-300 xl:h-16 xl:w-12 ${
                  activeSlide === index
                    ? '-translate-y-1 border-primary shadow-lg'
                    : 'border-white/40 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={slide.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-screen w-full flex-col lg:w-[56%]">
        <header className="px-6 pt-6 sm:px-10 sm:pt-8 lg:px-14 xl:px-20 2xl:px-24">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between">
            <Link to={ROUTES.storefront.shop} aria-label={t('auth.backToShop')}>
              <BrandLogo variant="header" height={34} />
            </Link>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="flex flex-1 items-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20 2xl:px-24">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-9 space-y-3">
              <p className="text-12 font-semibold uppercase tracking-[0.14em] text-primary">
                {t('auth.storefrontPanelEyebrow')}
              </p>
              <h2 className="text-heading-5 font-bold leading-tight text-neutral-black sm:text-heading-4">
                {t('auth.storefrontSignInTitle')}
              </h2>
              <p className="max-w-md text-15 leading-relaxed text-neutral-text-secondary">
                {t('auth.storefrontSignInSubtitle')}
              </p>
            </div>

            <Form form={form} schema={schema} className="space-y-6">
              <FormField
                name="email"
                label={t('auth.email')}
                required
                size="large"
                className="mb-0"
              >
                <Input
                  type="email"
                  icon="envelope"
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                  color="neutral"
                  variant="outline"
                />
              </FormField>

              <div className="relative">
                <button
                  type="button"
                  className="absolute right-0 top-0 z-10 text-13 font-medium text-primary hover:text-primary-clicked"
                  onClick={() => toast.info(t('auth.forgotPasswordSoon'))}
                >
                  {t('auth.forgotPassword')}
                </button>
                <FormField
                  name="password"
                  label={t('common.password')}
                  required
                  size="large"
                  className="mb-0"
                >
                  <InputPassword
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete="current-password"
                    color="neutral"
                    variant="outline"
                  />
                </FormField>
              </div>

              <FormSubmit form={form}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    size="large"
                    className="w-full"
                    iconRight="arrow-right"
                  >
                    {isSubmitting ? t('common.loggingIn') : t('common.login')}
                  </Button>
                )}
              </FormSubmit>
            </Form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-neutral-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-neutral-white px-3 text-12 font-medium uppercase tracking-[0.14em] text-neutral-text-secondary">
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

            <p className="mt-7 text-center text-14 text-neutral-text-secondary">
              {t('auth.notMember')}{' '}
              <Link
                to={ROUTES.storefront.register}
                className="font-semibold text-primary hover:text-primary-clicked"
              >
                {t('auth.createAccount')}
              </Link>
            </p>

            <Link
              to={ROUTES.storefront.shop}
              className="mt-4 inline-flex w-full items-center justify-center text-14 font-semibold text-primary hover:text-primary-clicked"
            >
              {t('auth.backToShop')}
            </Link>
          </div>
        </div>

        <footer className="px-6 pb-6 sm:px-10 sm:pb-8 lg:px-14 xl:px-20 2xl:px-24">
          <p className="mx-auto w-full max-w-lg text-12 text-neutral-text-secondary">
            {t('auth.loginCopyright', { year })}
          </p>
        </footer>
      </section>
    </main>
  );
}
