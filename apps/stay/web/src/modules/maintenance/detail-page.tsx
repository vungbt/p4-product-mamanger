import {
  Button,
  DatePicker,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Icon,
  NumberInput,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import {
  useMaintenanceCategories,
  useMaintenanceDetail,
  useMaintenanceMutations,
} from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isIsoDate, type MaintenanceStatus, type StayMaintenance } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useCanOn } from '@/libraries/ability';
import { formatVnd, todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';

export default function MaintenanceDetailPage() {
  const { id = '' } = useParams();
  const query = useMaintenanceDetail(id);

  if (query.isPending) return <LoadingRows />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  return <JobDetail key={`${id}-${query.data.version}`} job={query.data} />;
}

function JobDetail({ job }: { job: StayMaintenance }) {
  const { t, i18n } = useTranslation('maintenance');
  const navigate = useNavigate();
  const { update } = useMaintenanceMutations();
  const canEdit = useCanOn('update', 'Maintenance', { buildingId: job.buildingId });
  const canExpense = useCanOn('create', 'Expense', { buildingId: job.buildingId });
  const canReadExpenses = useCanOn('manage', 'Expense', { buildingId: job.buildingId });
  const [expenseForm, setExpenseForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next: Partial<Record<MaintenanceStatus, MaintenanceStatus[]>> = {
    new: ['open'],
    open: ['in_progress'],
    in_progress: ['done', 'cancelled'],
  };
  const date = (value: string) =>
    new Date(value).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'vi-VN');

  const transition = async (status: MaintenanceStatus) => {
    setError(null);
    try {
      await update.mutateAsync({ id: job.id, body: { version: job.version, status } });
    } catch (cause) {
      setError(getErrorMessage(cause, t('error')));
    }
  };

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title={job.title}
        description={`${job.roomCode ?? ''} · ${t(`sources.${job.source}`)} · ${t(`statuses.${job.status}`)}`}
        action={
          canEdit ? (
            <>
              <Button variant="secondary" onClick={() => navigate(`/maintenance/${job.id}/edit`)}>
                <Icon name="edit" aria-hidden />
                {t('edit')}
              </Button>
              {(next[job.status] ?? []).map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'danger' : 'primary'}
                  disabled={update.isPending}
                  onClick={() => void transition(status)}
                >
                  {t(`statuses.${status}`)}
                </Button>
              ))}
            </>
          ) : undefined
        }
      />
      <FormError message={error} />
      <section className="grid gap-3 rounded-panel border border-line bg-surface p-4">
        <h2 className="break-words font-semibold">{job.title}</h2>
        <p>
          {job.roomCode} · {t(`sources.${job.source}`)} · {t(`statuses.${job.status}`)}
        </p>
        <p className="whitespace-pre-wrap break-words">{job.description}</p>
        <div className="flex flex-wrap gap-3">
          {job.photos.map((photo) =>
            photo.url ? (
              <a href={photo.url} key={photo.fileId} target="_blank" rel="noreferrer">
                <img
                  className="size-32 rounded-control object-cover"
                  src={photo.url}
                  alt={t('photo')}
                />
              </a>
            ) : null,
          )}
        </div>
      </section>
      <section
        aria-labelledby="maintenance-history-title"
        className="grid gap-3 rounded-panel border border-line bg-surface p-4"
      >
        <h2 id="maintenance-history-title" className="font-semibold">
          {t('history')}
        </h2>
        <ol className="grid gap-2">
          {job.history.map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              {date(entry.at)} · {t(`statuses.${entry.status}`)}
            </li>
          ))}
        </ol>
      </section>
      {job.source === 'tenant' ? (
        <section className="grid gap-3">
          <h2 className="font-semibold">{t('reply')}</h2>
          <p className="whitespace-pre-wrap break-words">{job.reply}</p>
          {canEdit ? <ReplyForm job={job} /> : null}
        </section>
      ) : null}
      <section className="grid gap-3 rounded-panel border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{t('expense')}</h2>
          {!job.expense &&
          canEdit &&
          canExpense &&
          !['cancelled', 'rejected'].includes(job.status) ? (
            <Button onClick={() => setExpenseForm(true)}>
              <Icon name="plus" aria-hidden />
              {t('recordExpense')}
            </Button>
          ) : null}
        </div>
        {job.expense ? (
          <>
            <p>
              {formatVnd(job.expense.amount)} · {job.expense.spentOn}
            </p>
            <p className="whitespace-pre-wrap break-words">{job.expense.note}</p>
            {canReadExpenses ? (
              <Link
                className="text-accent underline"
                to={`/expenses?period=${job.expense.period}&roomId=${job.roomId ?? ''}`}
              >
                {t('linkedExpense')}
              </Link>
            ) : null}
          </>
        ) : (
          <p>{t('noExpense')}</p>
        )}
        {expenseForm && !job.expense ? (
          <MaintenanceExpenseForm job={job} onCancel={() => setExpenseForm(false)} />
        ) : null}
      </section>
      <Link to="/maintenance" className="text-accent underline">
        {t('back')}
      </Link>
    </div>
  );
}

const EXPENSE_FIELDS = ['amount', 'spentOn', 'categoryId', 'note'] as const;

function MaintenanceExpenseForm({ job, onCancel }: { job: StayMaintenance; onCancel: () => void }) {
  const { t } = useTranslation('maintenance');
  const categories = useMaintenanceCategories();
  const { expense } = useMaintenanceMutations();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      amount: null as number | null,
      spentOn: todayIsoDate(),
      categoryId: '',
      note: '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await expense.mutateAsync({
          id: job.id,
          body: {
            amount: value.amount ?? 0,
            spentOn: value.spentOn,
            categoryId: value.categoryId,
            note: value.note || null,
          },
        });
      } catch (cause) {
        const errors = apiFormErrors(cause, EXPENSE_FIELDS, t('error'));

        for (const field of EXPENSE_FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  const schema = {
    amount: v.pipe(
      v.number(t('invalidAmount')),
      v.integer(t('invalidAmount')),
      v.minValue(1, t('invalidAmount')),
      v.maxValue(Number.MAX_SAFE_INTEGER),
    ),
    spentOn: v.pipe(
      v.string(),
      v.check((value: string) => isIsoDate(value), t('invalidDate')),
    ),
    categoryId: v.pipe(v.string(), v.minLength(1, t('required'))),
    note: v.pipe(v.string(), v.maxLength(2000)),
  };

  return (
    <Form form={form} schema={schema} aria-label={t('recordExpense')}>
      <FormLayout>
        <FormSection title={t('recordExpense')}>
          <FormError message={error} />
          <FormGrid columns={2}>
            <FormField name="amount" label={t('amount')} required>
              <NumberInput min={1} max={Number.MAX_SAFE_INTEGER} />
            </FormField>
            <FormField name="spentOn" label={t('spentOn')} required {...DATE_FIELD}>
              <DatePicker clearable={false} />
            </FormField>
            <FormField name="categoryId" label={t('category')} required>
              <Select
                options={
                  categories.data
                    ?.filter((category) => category.active)
                    .map((category) => ({ value: category.id, label: category.name })) ?? []
                }
              />
            </FormField>
            <FormField name="note" label={t('note')}>
              <Textarea maxLength={2000} />
            </FormField>
          </FormGrid>
          {categories.isError ? (
            <LoadError error={categories.error} onRetry={() => void categories.refetch()} />
          ) : null}
        </FormSection>
        <FormActions>
          <Button variant="secondary" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                {t('recordExpense')}
              </Button>
            )}
          </FormSubmit>
        </FormActions>
      </FormLayout>
    </Form>
  );
}

function ReplyForm({ job }: { job: StayMaintenance }) {
  const { t } = useTranslation('maintenance');
  const { update } = useMaintenanceMutations();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { reply: '' },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      try {
        await update.mutateAsync({
          id: job.id,
          body: { version: job.version, reply: value.reply },
        });
      } catch (cause) {
        setError(getErrorMessage(cause, t('error')));
      }
    },
  });

  return (
    <Form
      form={form}
      schema={{
        reply: v.pipe(v.string(), v.trim(), v.minLength(1, t('required')), v.maxLength(2000)),
      }}
      aria-label={t('reply')}
    >
      <FormLayout>
        <FormSection variant="card">
          <FormError message={error} />
          <FormGrid columns={1}>
            <FormField name="reply" label={t('replyText')} required>
              <Textarea maxLength={2000} />
            </FormField>
          </FormGrid>
        </FormSection>
        <FormActions>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                {t('sendReply')}
              </Button>
            )}
          </FormSubmit>
        </FormActions>
      </FormLayout>
    </Form>
  );
}
