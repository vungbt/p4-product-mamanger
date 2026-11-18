import { IconButton } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import BrandLogo from '@/libraries/brand-logo';
import LanguageSwitcher from '@/libraries/language-switcher';
import UserAccountMenu from '@/libraries/user-account-menu';

export default function AdminTopbar() {
  const { t } = useTranslation();

  return (
    <>
      <Link
        to={ROUTES.admin.dashboard}
        className="flex shrink-0 items-center gap-2 font-semibold text-ink"
      >
        <BrandLogo variant="mark" height={32} />
        {t('app.admin')}
      </Link>
      <div className="ms-auto flex shrink-0 items-center gap-1">
        <LanguageSwitcher />
        <IconButton icon="bell" variant="ghost" label={t('common.notifications')} />
        <UserAccountMenu portal="admin" />
      </div>
    </>
  );
}
