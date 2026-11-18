import {
  Button,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Input,
  Select,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import {
  useMaintenanceDetail,
  useMaintenanceMutations,
  useRooms,
  useStaySdk,
} from '@stay/sdk/react';
import { createUploadApi, getErrorMessage } from '@stay/sdk/shared';
import {
  MAINTENANCE_MAX_PHOTOS,
  STAY_UPLOAD_MAX_BYTES,
  STAY_UPLOAD_MIME_TYPES,
  type StayMaintenance,
} from '@stay/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { ScreenHeader } from '@/libraries/screen-header';

const FIELDS = ['roomId', 'title', 'description'] as const;

export default function MaintenanceFormPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('maintenance');
  const { buildingId } = useActiveBuilding();
  const query = useMaintenanceDetail(id);

  if (id && query.isPending) return <LoadingRows />;
  if (id && query.isError)
    return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  const job = id ? query.data : undefined;
  const scope = job?.buildingId ?? buildingId;

  if (!scope) return <p>{t('chooseBuilding')}</p>;
  return <JobForm key={`${scope}-${id}-${job?.version ?? 0}`} buildingId={scope} job={job} />;
}

function JobForm({ buildingId, job }: { buildingId: string; job?: StayMaintenance }) {
  const { t } = useTranslation('maintenance');
  const navigate = useNavigate();
  const rooms = useRooms(buildingId, { pageSize: 100 });
  const { create, update } = useMaintenanceMutations();
  const sdk = useStaySdk();
  const [files, setFiles] = useState<File[]>([]);
  const [photoIds, setPhotoIds] = useState(job?.photos.map((photo) => photo.fileId) ?? []);
  const [error, setError] = useState<string | null>(null);

  const uploader = useMemo(() => createUploadApi(sdk, { baseUrl: window.location.origin }), [sdk]);

  const form = useAppForm({
    defaultValues: {
      roomId: job?.roomId ?? '',
      title: job?.title ?? '',
      description: job?.description ?? '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      if (
        files.length + photoIds.length > MAINTENANCE_MAX_PHOTOS ||
        files.some(
          (file) =>
            !STAY_UPLOAD_MIME_TYPES.some((type) => type === file.type) ||
            file.size > STAY_UPLOAD_MAX_BYTES,
        )
      ) {
        setError(t('photoError'));
        return;
      }
      try {
        const attached = [...photoIds];

        for (const file of files)
          attached.push(
            await uploader.uploadImage({ purpose: 'maintenance_photo', buildingId, file }),
          );
        setPhotoIds(attached);
        setFiles([]);
        const body = {
          title: value.title.trim(),
          description: value.description.trim(),
          photoFileIds: attached,
        };
        const saved = job
          ? await update.mutateAsync({ id: job.id, body: { ...body, version: job.version } })
          : await create.mutateAsync({
              ...body,
              roomId: value.roomId,
              category: 'other',
              severity: 'normal',
            });

        allowNavigation();
        navigate(`/maintenance/${saved.id}`);
      } catch (cause) {
        const errors = apiFormErrors(cause, FIELDS, t('error'));

        for (const field of FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(
          isVersionConflict(cause)
            ? t('changed')
            : (errors.message ?? getErrorMessage(cause, t('error'))),
        );
      }
    },
  });

  const dirty = useFormDirty(form);
  const { prompt, allowNavigation } = useUnsavedChanges(
    dirty ||
      files.length > 0 ||
      photoIds.join() !== (job?.photos.map((photo) => photo.fileId).join() ?? ''),
  );
  const schema = {
    roomId: v.pipe(v.string(), v.minLength(1, t('required'))),
    title: v.pipe(v.string(), v.trim(), v.minLength(1, t('required')), v.maxLength(200)),
    description: v.pipe(v.string(), v.maxLength(2000)),
  };

  return (
    <div className="grid gap-5">
      <ScreenHeader title={t(job ? 'edit' : 'create')} />
      <Form form={form} schema={schema} aria-label={t(job ? 'edit' : 'create')}>
        <FormLayout>
          {prompt}
          <FormError message={error} />
          <FormSection title={t(job ? 'edit' : 'create')} variant="card">
            <FormGrid columns={1}>
              <FormField name="roomId" label={t('room')} required>
                <Select
                  disabled={Boolean(job)}
                  options={
                    rooms.data?.data.map((room) => ({ value: room.id, label: room.code })) ?? []
                  }
                />
              </FormField>
              <FormField name="title" label={t('jobTitle')} required>
                <Input maxLength={200} />
              </FormField>
              <FormField name="description" label={t('jobDescription')}>
                <Textarea maxLength={2000} rows={4} />
              </FormField>
              <label htmlFor="maintenance-photos" className="grid gap-2">
                {t('photos')}
                <Input
                  id="maintenance-photos"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setFiles([...(event.target.files ?? [])])}
                />
              </label>
              {files.map((file) => (
                <p key={file.name}>{file.name}</p>
              ))}
              <ul className="flex flex-wrap gap-3">
                {job?.photos
                  .filter((photo) => photoIds.includes(photo.fileId))
                  .map((photo) => (
                    <li key={photo.fileId}>
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={t('photo')}
                          className="size-24 rounded-control object-cover"
                        />
                      ) : null}
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setPhotoIds((ids) => ids.filter((id) => id !== photo.fileId))
                        }
                      >
                        {t('removePhoto')}
                      </Button>
                    </li>
                  ))}
              </ul>
              {rooms.isError ? (
                <LoadError error={rooms.error} onRetry={() => void rooms.refetch()} />
              ) : null}
            </FormGrid>
          </FormSection>
          <FormActions>
            <Button
              variant="secondary"
              onClick={() => navigate(job ? `/maintenance/${job.id}` : '/maintenance')}
            >
              {t('cancel')}
            </Button>
            <FormSubmit form={form}>
              {(submitting) => (
                <Button type="submit" loading={submitting}>
                  {t('save')}
                </Button>
              )}
            </FormSubmit>
          </FormActions>
        </FormLayout>
      </Form>
    </div>
  );
}
