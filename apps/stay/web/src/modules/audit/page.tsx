import {
  Alert,
  Avatar,
  Button,
  DateRangePicker,
  EmptyState,
  IconButton,
  Input,
  KpiCard,
  KpiGrid,
  Pagination,
  Select,
  Tag,
  Timeline,
  Tooltip,
} from '@itclabs/react-ui';
import { useAuditLogs } from '@stay/sdk/react';
import type { AuditListQuery } from '@stay/sdk/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FILTER_WIDE, FilterBar } from '@/libraries/filter-bar';
import { LoadingRows } from '@/libraries/forms/page-states';
import { Refreshing } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { AuditDetailDialog } from './audit-detail';
import {
  type AuditEntry,
  actionLabel,
  auditTarget,
  dayKey,
  dayLabel,
  fieldChanges,
  formatDateTime,
  initials,
  RESOURCE_LABELS,
  relativeTime,
  resourceLabel,
  verbMeta,
} from './audit-format';

const PAGE_SIZE = 20;
/** Recent entries the summary cards are computed from (the API's largest page). */
const SAMPLE_SIZE = 100;
const filterFields = ['actorId', 'action', 'resourceType', 'resourceId', 'from', 'to'] as const;

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), 300);

    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <Input
      type="search"
      icon="search"
      label={t('audit.search')}
      aria-label={t('audit.search')}
      rootClassName={FILTER_WIDE}
      placeholder="Mã hành động, loại dữ liệu hoặc mã bản ghi"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  );
}

/** Summary of the recent entries matching the filters: totals by kind of action, top actor. */
function AuditSummary({ total, sample }: { total: number; sample: AuditEntry[] }) {
  const counts = { create: 0, update: 0, finance: 0, remove: 0, other: 0 };
  const actors = new Map<string, number>();

  for (const entry of sample) {
    counts[verbMeta(entry.action).group]++;
    const name = entry.actorName ?? 'Hệ thống';

    actors.set(name, (actors.get(name) ?? 0) + 1);
  }
  const [topActor, topCount] = [...actors.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
  const scope =
    total > sample.length ? `Trong ${sample.length} thay đổi gần nhất` : 'Theo bộ lọc hiện tại';

  return (
    <KpiGrid columns={4} aria-label="Tóm tắt lịch sử">
      <KpiCard
        label="Tổng thay đổi"
        value={total.toLocaleString('vi-VN')}
        hint="Theo bộ lọc hiện tại"
        icon="history"
        tone="brand"
        compact
      />
      <KpiCard
        label="Tạo · Sửa"
        value={`${counts.create} · ${counts.update}`}
        hint={scope}
        icon="edit"
        tone="info"
        compact
      />
      <KpiCard
        label="Phát hành, thu tiền · Xoá, huỷ"
        value={`${counts.finance} · ${counts.remove}`}
        hint={scope}
        icon="receipt"
        tone={counts.remove ? 'warning' : 'success'}
        compact
      />
      <KpiCard
        label="Thao tác nhiều nhất"
        value={<span className="block truncate">{topActor}</span>}
        hint={topCount ? `${topCount} thay đổi · ${scope.toLowerCase()}` : scope}
        icon="users"
        compact
      />
    </KpiGrid>
  );
}

/** One entry as a sentence: who did what to which record, when, and how much changed. */
function AuditItem({ entry, onOpen }: { entry: AuditEntry; onOpen: () => void }) {
  const { t } = useTranslation();
  const verb = verbMeta(entry.action);
  const target = auditTarget(entry);
  const changed = fieldChanges(entry.changes).length;
  const actor = entry.actorName ?? t('audit.system');
  const sentence = `${actor} ${verb.label.toLowerCase()} ${resourceLabel(entry.resourceType)} ${target.name}`;

  return (
    <div className="flex min-w-0 items-start gap-3" data-testid="audit-entry">
      <Avatar alt="" fallback={initials(actor)} size="sm" className="mt-0.5 shrink-0" />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-ink">
          <span className="font-semibold">{actor}</span>
          <Tag tone={verb.tone} size="sm">
            {verb.label}
          </Tag>
          <span className="text-muted">{resourceLabel(entry.resourceType)}</span>
          {target.name ? (
            target.href ? (
              <Link className="min-w-0 break-all font-semibold text-accent" to={target.href}>
                {target.name}
              </Link>
            ) : (
              <span className="min-w-0 break-all font-semibold">{target.name}</span>
            )
          ) : null}
          {entry.outcome === 'failure' ? (
            <Tag tone="danger" size="sm">
              {t('audit.failure')}
            </Tag>
          ) : null}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-ui-sm text-muted">
          <Tooltip
            content={formatDateTime(entry.createdAt)}
            triggerAsChild
            trigger={
              <time dateTime={entry.createdAt} className="cursor-help">
                {relativeTime(entry.createdAt)}
              </time>
            }
          />
          {target.context ? <span>· {target.context}</span> : null}
          {changed ? <span>· {changed} trường thay đổi</span> : null}
        </p>
      </div>
      <IconButton
        icon="view"
        variant="ghost"
        size="sm"
        label={`${t('audit.details')}: ${sentence}`}
        onClick={onOpen}
      />
    </div>
  );
}

function groupByDay(entries: AuditEntry[]) {
  const groups: { key: string; entries: AuditEntry[] }[] = [];

  for (const entry of entries) {
    const key = dayKey(new Date(entry.createdAt));
    const last = groups.at(-1);

    if (last?.key === key) last.entries.push(entry);
    else groups.push({ key, entries: [entry] });
  }
  return groups;
}

/** O-26 audit log: summary cards, filters, entries grouped by day and a detail dialog. */
export default function AuditPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { buildingId, buildings, selectBuilding } = useActiveBuilding();
  const previousBuilding = useRef<string | null>(null);

  const page = Math.max(1, Number(params.get('page')) || 1);
  const sortOrder = params.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  const filters = {
    q: params.get('q') || undefined,
    ...Object.fromEntries(filterFields.map((field) => [field, params.get(field) || undefined])),
    buildingId: buildingId ?? undefined,
  };
  const query: AuditListQuery = {
    ...filters,
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder,
  };
  const logs = useAuditLogs(query);
  const sample = useAuditLogs({
    ...filters,
    page: 1,
    pageSize: SAMPLE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const selected = params.get('entry');

  const update = (values: Record<string, string>, resetPage = true) => {
    setParams(() => {
      const next = latestSearchParams();

      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) {
        next.delete('page');
        next.delete('entry');
      }
      return next;
    });
  };

  // Keep `?buildingId=` and the active building in step (shared links open the right building).
  useEffect(() => {
    if (!buildingId) return;
    if (previousBuilding.current === null) {
      const requested = params.get('buildingId');

      if (requested && buildings.some(({ id }) => id === requested) && requested !== buildingId) {
        previousBuilding.current = requested;
        selectBuilding(requested);
        return;
      }
      previousBuilding.current = buildingId;
      if (requested === buildingId) return;
      setParams(
        () => {
          const next = latestSearchParams();

          next.set('buildingId', buildingId);
          return next;
        },
        { replace: true },
      );
      return;
    }
    if (previousBuilding.current === buildingId) {
      const requested = params.get('buildingId');

      if (requested && requested !== buildingId && buildings.some(({ id }) => id === requested)) {
        previousBuilding.current = requested;
        selectBuilding(requested);
      }
      return;
    }
    previousBuilding.current = buildingId;
    setParams(
      () => {
        const next = latestSearchParams();

        next.set('buildingId', buildingId);
        next.delete('page');
        next.delete('entry');
        return next;
      },
      { replace: true },
    );
  }, [buildingId, buildings, params, selectBuilding, setParams]);

  const sampleRows = sample.data?.data ?? [];
  const actorOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const entry of sampleRows)
      if (entry.actorId) options.set(entry.actorId, entry.actorName ?? entry.actorId);
    const current = params.get('actorId');

    if (current && !options.has(current)) options.set(current, current);
    return [...options].map(([value, label]) => ({ value, label }));
  }, [sampleRows, params]);
  const actionOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const entry of sampleRows)
      options.set(entry.action, actionLabel(entry.action, entry.resourceType));
    const current = params.get('action');

    if (current && !options.has(current)) options.set(current, current);
    return [...options]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [sampleRows, params]);
  const resourceOptions = Object.keys(RESOURCE_LABELS).map((value) => ({
    value,
    label: resourceLabel(value).replace(/^./, (letter) => letter.toUpperCase()),
  }));

  const from = params.get('from');
  const to = params.get('to');
  const resourceId = params.get('resourceId');
  const rows = logs.data?.data ?? [];
  const meta = logs.data?.meta;

  return (
    <section className="grid min-w-0 gap-5">
      <ScreenHeader
        title={t('nav.audit')}
        description="Ai đã làm gì, lúc nào: mọi thay đổi dữ liệu của toà đang chọn."
      />

      {meta && sample.data ? <AuditSummary total={meta.total} sample={sampleRows} /> : null}

      <FilterBar>
        <SearchField value={params.get('q') ?? ''} onChange={(q) => update({ q })} />
        <Select
          label="Người thực hiện"
          placeholder="Tất cả"
          clearable
          value={params.get('actorId')}
          options={actorOptions}
          onValueChange={(value) => update({ actorId: value ?? '' })}
        />
        <Select
          label={t('audit.action')}
          placeholder="Tất cả thao tác"
          clearable
          value={params.get('action')}
          options={actionOptions}
          onValueChange={(value) => update({ action: value ?? '' })}
        />
        <Select
          label={t('audit.resourceType')}
          placeholder="Tất cả"
          clearable
          value={params.get('resourceType')}
          options={resourceOptions}
          onValueChange={(value) => update({ resourceType: value ?? '' })}
        />
        <DateRangePicker
          label="Khoảng thời gian"
          rootClassName={FILTER_WIDE}
          clearable
          value={from && to ? { from, to } : null}
          onValueChange={(value) => update({ from: value?.from ?? '', to: value?.to ?? '' })}
        />
        <Select
          label="Thứ tự"
          value={sortOrder}
          searchable={false}
          options={[
            { value: 'desc', label: t('audit.newest') },
            { value: 'asc', label: t('audit.oldest') },
          ]}
          onValueChange={(value) => update({ sortOrder: value === 'asc' ? 'asc' : '' })}
        />
      </FilterBar>

      {resourceId ? (
        <Alert
          tone="info"
          action={
            <Button variant="secondary" size="sm" onClick={() => update({ resourceId: '' })}>
              {t('audit.clear')}
            </Button>
          }
        >
          Đang xem lịch sử của bản ghi <span className="break-all font-mono">{resourceId}</span>.
        </Alert>
      ) : null}

      {logs.isPending ? (
        <LoadingRows rows={4} />
      ) : logs.isError && !logs.data ? (
        <Alert
          tone="danger"
          role="alert"
          title={t('errors.loadFailed')}
          action={
            <Button variant="secondary" size="sm" onClick={() => void logs.refetch()}>
              {t('errors.retry')}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState icon="history" size="compact" variant="no-results" title={t('audit.empty')} />
      ) : (
        <Refreshing active={logs.isFetching}>
          <section className="grid min-w-0 gap-4" aria-label={t('nav.audit')}>
            {groupByDay(rows).map((group) => (
              <section key={group.key} aria-labelledby={`audit-day-${group.key}`}>
                <h2
                  id={`audit-day-${group.key}`}
                  className="mb-2 text-ui-sm font-semibold text-muted"
                >
                  {dayLabel(group.key)}
                  <span className="font-normal"> · {group.entries.length} thay đổi</span>
                </h2>
                <Timeline
                  showStatus={false}
                  items={group.entries.map((entry) => ({
                    id: entry.id,
                    state: 'completed',
                    title: (
                      <AuditItem entry={entry} onOpen={() => update({ entry: entry.id }, false)} />
                    ),
                  }))}
                />
              </section>
            ))}
          </section>
        </Refreshing>
      )}

      {meta && meta.totalPages > 1 ? (
        <Pagination
          pageIndex={page - 1}
          pageCount={meta.totalPages}
          onPageChange={(index) =>
            update({ page: index > 0 ? String(index + 1) : '', entry: '' }, false)
          }
          aria-label={t('audit.pagination')}
        />
      ) : null}

      {selected ? (
        <AuditDetailDialog id={selected} onClose={() => update({ entry: '' }, false)} />
      ) : null}
    </section>
  );
}
