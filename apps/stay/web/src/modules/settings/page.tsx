import { Icon, type IconName } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { type AbilityCheck, canOpen, useAbility } from '@/libraries/ability';
import { ScreenHeader } from '@/libraries/screen-header';
import { ROUTES } from '@/routing/route-configs';

type SettingsLink = {
  key: 'services' | 'billing' | 'buildings' | 'members' | 'expenseCategories' | 'announcements';
  icon: IconName;
  href: string;
  ability: AbilityCheck;
};

const LINKS: SettingsLink[] = [
  {
    key: 'expenseCategories',
    icon: 'creditCard',
    href: '/settings/expense-categories',
    ability: { action: 'manage', subject: 'Expense' },
  },
  {
    key: 'services',
    icon: 'receipt',
    href: ROUTES.services,
    ability: { action: 'manage', subject: 'Settings' },
  },
  {
    key: 'billing',
    icon: 'calendar',
    href: ROUTES.billing,
    ability: { action: 'manage', subject: 'Settings' },
  },
  {
    key: 'buildings',
    icon: 'buildings',
    href: ROUTES.buildings,
    ability: { action: 'manage', subject: 'Building' },
  },
  {
    key: 'announcements',
    icon: 'megaphone',
    href: '/announcements',
    ability: { action: 'update', subject: 'Building' },
  },
  {
    key: 'members',
    icon: 'users',
    href: '/settings/members',
    ability: { action: 'manage', subject: 'Member' },
  },
];

/** Cài đặt hub (owner): links to the system settings screens the user may open. */
export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const ability = useAbility();

  const links = LINKS.filter((link) => canOpen(ability, link.ability));

  return (
    <div className="grid gap-6">
      <ScreenHeader title={t('hub.title')} description={t('hub.description')} />

      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.key}>
            <Link
              to={link.href}
              className="flex h-full gap-4 rounded-panel border border-line bg-surface p-4 shadow-panel transition-colors hover:bg-hover sm:p-5"
              data-testid={`settings-link-${link.key}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-accent">
                <Icon name={link.icon} className="size-5" aria-hidden />
              </span>
              <span className="grid min-w-0 gap-1">
                <span className="font-semibold text-ink">{t(`hub.links.${link.key}.title`)}</span>
                <span className="text-ui-sm text-muted">
                  {t(`hub.links.${link.key}.description`)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
