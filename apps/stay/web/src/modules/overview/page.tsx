import { Avatar, Icon, type IconName, Tag } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { type AbilityCheck, canOpen, useAbility } from '@/libraries/ability';
import { useAuth } from '@/libraries/session/auth-provider';
import { ROUTES } from '@/routing/route-configs';

type OnboardingStep = {
  key: 'prices' | 'rooms' | 'contracts';
  icon: IconName;
  href: string;
  /** Hidden for users who cannot open the step's screen. */
  ability?: AbilityCheck;
  /** The screen exists already (no "Sắp có" tag). */
  ready?: boolean;
};

const STEPS: OnboardingStep[] = [
  {
    key: 'prices',
    icon: 'settings',
    href: ROUTES.services,
    ability: { action: 'manage', subject: 'Settings' },
    ready: true,
  },
  { key: 'rooms', icon: 'building', href: ROUTES.roomBulk, ready: true },
  { key: 'contracts', icon: 'clipboardText', href: '/contracts' },
];

/**
 * O-01 placeholder (ST-19 builds the monthly overview): the signed-in user and the
 * empty-building onboarding of screens.md (prices → rooms → contracts).
 */
export default function OverviewPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const ability = useAbility();

  if (!user) return null;

  const steps = STEPS.filter((step) => !step.ability || canOpen(ability, step.ability));

  const name = user.displayName.trim() || user.email;

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="flex items-center gap-4">
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt=""
          fallback={name.charAt(0).toUpperCase()}
          size="lg"
        />
        <div className="min-w-0">
          <h1 className="text-heading font-bold text-ink">{t('overview.greeting', { name })}</h1>
          <p className="truncate text-ui-sm text-muted" data-testid="signed-in-user">
            {t('overview.signedInAs', { email: user.email, role: t(`roles.${user.role}`) })}
          </p>
        </div>
      </header>

      <section
        aria-labelledby="onboarding-title"
        className="rounded-panel border border-line bg-surface p-5 shadow-panel sm:p-6"
      >
        <h2 id="onboarding-title" className="text-section font-semibold text-ink">
          {t('overview.onboardingTitle')}
        </h2>
        <p className="mt-1 text-control text-muted">{t('overview.onboardingDescription')}</p>

        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.key}>
              <Link
                to={step.href}
                data-testid={`onboarding-step-${step.key}`}
                className="flex h-full gap-3 rounded-panel border border-line p-4 transition-colors hover:bg-hover"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-accent">
                  <Icon name={step.icon} className="size-5" aria-hidden />
                </span>
                <span className="grid min-w-0 gap-1">
                  <span className="text-eyebrow font-semibold uppercase text-muted">
                    {t('overview.stepLabel', { step: index + 1 })}
                  </span>
                  <span className="font-semibold text-ink">
                    {t(`overview.steps.${step.key}.title`)}
                  </span>
                  <span className="text-ui-sm text-muted">
                    {t(`overview.steps.${step.key}.description`)}
                  </span>
                  {step.ready ? null : (
                    <Tag size="sm" tone="brand" className="mt-1 w-fit">
                      {t('overview.soon')}
                    </Tag>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
