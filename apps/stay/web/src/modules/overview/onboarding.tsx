import { Icon, type IconName } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { type AbilityCheck, canOpen, useAbility } from '@/libraries/ability';
import { ROUTES } from '@/routing/route-configs';

type OnboardingStep = {
  key: 'prices' | 'rooms' | 'contracts';
  icon: IconName;
  href: string;
  /** Hidden for users who cannot open the step's screen. */
  ability?: AbilityCheck;
};

const STEPS: OnboardingStep[] = [
  {
    key: 'prices',
    icon: 'settings',
    href: ROUTES.services,
    ability: { action: 'manage', subject: 'Settings' },
  },
  { key: 'rooms', icon: 'building', href: ROUTES.roomBulk },
  { key: 'contracts', icon: 'clipboardText', href: '/contracts/new' },
];

/**
 * screens.md O-01 "Rỗng": prices → rooms → contracts. A building without rooms gets the guide;
 * otherwise the same steps stay available as quick setup links.
 */
export function OnboardingSteps({ empty }: { empty: boolean }) {
  const { t } = useTranslation();
  const ability = useAbility();

  const steps = STEPS.filter((step) => !step.ability || canOpen(ability, step.ability));

  return (
    <section
      aria-labelledby="onboarding-title"
      className="min-w-0 rounded-panel border border-line bg-surface p-5 shadow-panel sm:p-6"
      data-testid="onboarding"
    >
      <h2 id="onboarding-title" className="text-section font-semibold text-ink">
        {t('overview.onboardingTitle')}
      </h2>
      <p className="mt-1 text-control text-muted">
        {t(empty ? 'overview.onboardingDescription' : 'overview.onboardingSetupDescription')}
      </p>

      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.key} className="min-w-0">
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
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
