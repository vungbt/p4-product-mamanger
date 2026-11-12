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
import { toast } from '@itclabs/react-ui/toast';
import { usePortalCreateMaintenance, usePortalUploadImage } from '@stay/sdk/react';
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_MAX_PHOTOS,
  MAINTENANCE_SEVERITIES,
  type MaintenanceCategory,
  type MaintenanceSeverity,
} from '@stay/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { imageProblem } from './claim-form';
import { portalPaths } from './portal-ui';
import { MAINTENANCE_CATEGORY_LABELS, MAINTENANCE_SEVERITY_LABELS } from './request-labels';

const FIELDS = ['title', 'description', 'category', 'severity'] as const;

const schema = {
  category: v.picklist(MAINTENANCE_CATEGORIES, 'Chọn hạng mục.'),
  severity: v.picklist(MAINTENANCE_SEVERITIES, 'Chọn mức độ.'),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Nhập tiêu đề.'),
    v.maxLength(200, 'Tiêu đề tối đa 200 ký tự.'),
  ),
  description: v.pipe(v.string(), v.maxLength(2000, 'Mô tả tối đa 2000 ký tự.')),
};

/** T-08 `/p/maintenance/new`: hạng mục, mức độ, mô tả, tối đa 5 ảnh. */
export default function PortalMaintenanceNewPage() {
  const create = usePortalCreateMaintenance();
  const upload = usePortalUploadImage();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      uploadFiles: [] as File[],
      category: 'other' as MaintenanceCategory,
      severity: 'normal' as MaintenanceSeverity,
      title: '',
      description: '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      if (files.length > MAINTENANCE_MAX_PHOTOS) {
        setError(`Chỉ gửi tối đa ${MAINTENANCE_MAX_PHOTOS} ảnh.`);
        return;
      }
      const problem = files.map(imageProblem).find(Boolean);

      if (problem) {
        setError(problem);
        return;
      }
      try {
        const photoFileIds: string[] = [];

        for (const file of files)
          photoFileIds.push(await upload.mutateAsync({ purpose: 'maintenance_photo', file }));
        await create.mutateAsync({
          title: value.title.trim(),
          description: value.description.trim(),
          category: value.category,
          severity: value.severity,
          photoFileIds,
        });
        allowNavigation();
        toast.success('Đã gửi báo hỏng cho chủ trọ.');
        navigate(portalPaths.maintenance);
      } catch (cause) {
        const errors = apiFormErrors(cause, FIELDS, 'Không gửi được. Vui lòng thử lại.');

        for (const field of FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  const { prompt, allowNavigation } = useUnsavedChanges(dirty || files.length > 0);

  return (
    <>
      <h1 className="text-heading font-bold">Báo hỏng mới</h1>
      <Form
        noValidate
        form={form}
        schema={schema}
        className="grid min-w-0 gap-4 rounded-panel border border-line bg-surface p-4"
        aria-label="Báo hỏng mới"
      >
        <FormLayout size="full">
          <FormSection>
            <FormGrid columns={1}>
              {prompt}
              <FormError message={error} />
              <FormField name="category" label="Hạng mục" required>
                <Select
                  options={MAINTENANCE_CATEGORIES.map((category) => ({
                    value: category,
                    label: MAINTENANCE_CATEGORY_LABELS[category],
                  }))}
                />
              </FormField>
              <FormField name="severity" label="Mức độ" required>
                <Select
                  options={MAINTENANCE_SEVERITIES.map((severity) => ({
                    value: severity,
                    label: MAINTENANCE_SEVERITY_LABELS[severity],
                  }))}
                />
              </FormField>
              <FormField name="title" label="Tiêu đề" required>
                <Input maxLength={200} placeholder="Ví dụ: Vòi nước nhà tắm bị rò" />
              </FormField>
              <FormField name="description" label="Mô tả">
                <Textarea maxLength={2000} rows={4} />
              </FormField>
              <div className="grid gap-1">
                <form.AppField
                  name="uploadFiles"
                  listeners={{
                    onChange: ({ value: files }) => {
                      setFiles(files);
                    },
                  }}
                >
                  {(field) => (
                    <field.UploadField
                      id="portal-maintenance-photos"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      label={`Ảnh (tối đa ${MAINTENANCE_MAX_PHOTOS})`}
                      maxBytes={10485760}
                      maxFiles={MAINTENANCE_MAX_PHOTOS}
                    />
                  )}
                </form.AppField>
                {files.length > 0 ? (
                  <p className="text-ui-sm text-muted">Đã chọn {files.length} ảnh.</p>
                ) : null}
              </div>
              <p className="text-ui-sm text-muted">Mỗi phòng gửi tối đa 10 báo hỏng mỗi ngày.</p>
            </FormGrid>
          </FormSection>
          <FormActions>
            <Button variant="secondary" onClick={() => navigate(portalPaths.maintenance)}>
              Huỷ
            </Button>
            <FormSubmit form={form}>
              {(submitting) => (
                <Button type="submit" loading={submitting}>
                  Gửi báo hỏng
                </Button>
              )}
            </FormSubmit>
          </FormActions>
        </FormLayout>
      </Form>
    </>
  );
}
