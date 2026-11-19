import {
  getAdminSizeGuidesIdQueryOptions,
  getAdminSizeGuidesQueryOptions,
  useApiSdk,
} from '@p4/api-sdk/react';
import { useTranslation } from 'react-i18next';
import { RemoteSelect, type RemoteSelectControlProps } from '@/libraries/remote-select';

const toOption = (row: { id: string; name: string }) => ({ value: row.id, label: row.name });

export function SizeGuideSelect(props: RemoteSelectControlProps) {
  const sdk = useApiSdk();

  const { t } = useTranslation();

  return (
    <RemoteSelect
      {...props}
      toOption={toOption}
      loadError={t('selects.loadFailed')}
      pageOptions={(q, page, pageSize) =>
        getAdminSizeGuidesQueryOptions(sdk, {
          params: { query: { q, page, pageSize, sortBy: 'name', sortOrder: 'asc' } },
        })
      }
      selectedOptions={(id) => getAdminSizeGuidesIdQueryOptions(sdk, { params: { path: { id } } })}
    />
  );
}
