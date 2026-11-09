import { cn, Select } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useBuilding } from './building-provider';

/** Header building switcher; hidden while the user has fewer than two buildings. */
export function BuildingSelector({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { buildings, buildingId, selectBuilding } = useBuilding();

  if (buildings.length < 2) return null;

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
