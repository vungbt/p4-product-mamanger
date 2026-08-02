import { Button, Input, InputPassword } from '@p4/ui';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import LanguageSwitcher from '@/libraries/language-switcher';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(username, password, 'admin');
      toast.success(t('auth.adminLoginSuccess'));
      navigate(ROUTES.admin.dashboard, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? t(error.message, { defaultValue: t('auth.loginFailed') })
          : t('auth.loginFailed');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-sm space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-2 font-semibold text-neutral-text-primary">
          {t('auth.adminTitle')}
        </h1>
        <LanguageSwitcher />
      </div>
      <p className="text-14 text-neutral-text-secondary">{t('auth.adminDemo')}</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input
          label={t('common.username')}
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <InputPassword
          label={t('common.password')}
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" loading={loading} className="w-full">
          {loading ? t('common.loggingIn') : t('common.login')}
        </Button>
      </form>
    </div>
  );
}
