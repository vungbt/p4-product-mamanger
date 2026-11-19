import { Button, Dialog, Icon, Input } from '@itclabs/react-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminPageLink } from './sidebar';

type AdminPageSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: AdminPageLink[];
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

/** Page finder opened from the sidebar search (Sidebar search template). */
export default function AdminPageSearch({ open, onOpenChange, pages }: AdminPageSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const needle = normalize(query);
  const results = pages.filter((page) =>
    normalize(`${page.section ?? ''} ${page.label}`).includes(needle),
  );

  const changeOpen = (next: boolean) => {
    if (!next) setQuery('');

    onOpenChange(next);
  };

  return (
    <Dialog
      title={t('adminSearch.title')}
      description={t('adminSearch.description')}
      open={open}
      onOpenChange={changeOpen}
      data-testid="admin-page-search"
    >
      <Input
        aria-label={t('adminSearch.label')}
        icon="search"
        placeholder={t('adminSearch.placeholder')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-4 grid max-h-72 gap-1 overflow-y-auto">
        {results.map((page) => (
          <Button
            key={page.id}
            variant="ghost"
            className="justify-start"
            href={page.href}
            onClick={() => changeOpen(false)}
          >
            {page.icon ? <Icon name={page.icon} /> : null}
            <span className="min-w-0 flex-1 truncate text-start">{page.label}</span>
            {page.section ? <span className="text-ui-sm text-muted">{page.section}</span> : null}
          </Button>
        ))}
        {results.length === 0 && (
          <p className="text-ui-sm text-muted" role="status">
            {t('adminSearch.empty')}
          </p>
        )}
      </div>
    </Dialog>
  );
}
