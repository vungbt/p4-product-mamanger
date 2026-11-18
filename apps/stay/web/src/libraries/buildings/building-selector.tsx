import { cn, Icon, Select } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useActiveBuilding } from './building-provider';

/**
 * Header building switcher. With fewer than two buildings there is nothing to choose: the
 * selector is hidden and only the active building's name is shown (from `sm` up).
 */
export function BuildingSelector({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { buildings, building, buildingId, selectBuilding } = useActiveBuilding();

  if (!building) return null;

  if (buildings.length < 2) {
    return (
      <span
        className={cn(
          'hidden items-center gap-1.5 text-ui-sm font-medium text-muted sm:inline-flex',
          className,
        )}
        data-testid="active-building"
        data-building-code={building.code}
      >
        <Icon name="building" className="size-4" aria-hidden />
        <span className="sr-only">{t('building.label')}:</span>
        {building.name}
      </span>
    );
  }

  const options = buildings.map(({ id, name }) => ({ value: id, label: name }));

  return (
    <Select
      aria-label={t('building.label')}
      placeholder={t('building.placeholder')}
      options={options}
      value={buildingId}
      onValueChange={(id) => {
        if (id) selectBuilding(id);
      }}
      size="sm"
      searchable={buildings.length > 6}
      rootClassName={cn('w-44 sm:w-56', className)}
      data-testid="building-selector"
    />
  );
}
