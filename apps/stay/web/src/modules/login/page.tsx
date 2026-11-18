import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormField,
  FormSubmit,
  Input,
  InputPassword,
  useAppForm,
} from '@itclabs/react-ui';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { BRAND, BrandMark } from '@/brand';
import { useAuth } from '@/libraries/session/auth-provider';
import { LoginError } from '@/libraries/session/session';
import { forgetEmail, readRememberedEmail, rememberEmail } from './remembered-email';

/** C-01: after sign-in `GuestOnly` returns to the page the user wanted (default Tổng quan). */
export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, expired } = useAuth();
  const [savedEmail] = useState(readRememberedEmail);
  const [remember, setRemember] = useState(Boolean(savedEmail));
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () => ({
      email: v.pipe(v.string(), v.trim(), v.email(t('auth.emailInvalid'))),
      password: v.pipe(v.string(), v.minLength(8, t('auth.passwordMin'))),
    }),
    [t],
  );

  const errorMessage = (error: unknown) => {
    if (!(error instanceof LoginError) || error.reason === 'failed') return t('auth.failed');
    if (error.reason === 'invalid') return t('auth.invalidCredentials');
    return t('auth.tooManyAttempts', {
      count: Math.max(1, Math.ceil((error.retryAfterSeconds ?? 60) / 60)),
    });
  };

  const navigate = useNavigate();
  const form = useAppForm({
    defaultValues: { email: savedEmail, password: '' },
    onSubmit: async ({ value }) => {
      setFormError(null);

      try {
        await signIn(value.email, value.password);
        if (remember) rememberEmail(value.email.trim());
        else forgetEmail();
      } catch (error) {
        setFormError(errorMessage(error));
      }
    },
  });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12" />
          <div>
            <h1 className="text-heading font-bold text-ink">{t('auth.title')}</h1>
            <p className="mt-1 text-ui-sm text-muted">{t('auth.subtitle')}</p>
          </div>
        </div>

        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel sm:p-6">
          <Form form={form} schema={schema} className="grid gap-4" noValidate>
            {formError ? (
              <Alert tone="danger" role="alert" data-testid="login-error">
                {formError}
              </Alert>
            ) : expired ? (
              <Alert tone="info">{t('auth.sessionExpired')}</Alert>
            ) : null}

            <FormField name="email" label={t('auth.email')} required className="mb-0">
              <Input
                type="email"
                icon="mail"
                inputMode="email"
                autoComplete="username"
                placeholder={t('auth.emailPlaceholder')}
                autoFocus={!savedEmail}
              />
            </FormField>

            <FormField name="password" label={t('auth.password')} required className="mb-0">
              <InputPassword
                icon="key"
                autoComplete="current-password"
                placeholder={t('auth.passwordPlaceholder')}
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
                autoFocus={Boolean(savedEmail)}
              />
            </FormField>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                label={t('auth.rememberEmail')}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-accent"
                onClick={() => {
                  const email = form.getFieldValue('email').trim();

                  navigate(
                    email
                      ? `/forgot-password?email=${encodeURIComponent(email)}`
                      : '/forgot-password',
                  );
                }}
              >
                {t('auth.forgotPassword')}
              </Button>
            </div>

            <FormSubmit form={form}>
              {(isSubmitting) => (
                <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                  {isSubmitting ? t('auth.submitting') : t('auth.submit')}
                </Button>
              )}
            </FormSubmit>
          </Form>
        </div>

        <p className="mt-6 text-center text-ui-sm text-muted">
          {BRAND.name} · {t('app.tagline')}
        </p>
      </div>
    </main>
  );
}
