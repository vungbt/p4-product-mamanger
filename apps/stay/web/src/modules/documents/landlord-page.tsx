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
  Input,
  Skeleton,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useLandlordProfile, useUpdateLandlordProfile } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { type LandlordProfile, SIGNATURE_IMAGE_MAX_BYTES } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError, LoadError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { ScreenHeader } from '@/libraries/screen-header';
import { SignaturePad } from '@/libraries/signature-pad';

export function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Invalid file'));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function LandlordForm({ profile }: { profile: LandlordProfile }) {
  const { t } = useTranslation('documents');

  const update = useUpdateLandlordProfile();

  const [error, setError] = useState<string | null>(null);

  const [signature, setSignature] = useState(profile.signatureImage);

  const [savedSignature, setSavedSignature] = useState(profile.signatureImage);

  const [version, setVersion] = useState(profile.version);

  const signatureForm = useAppForm({ defaultValues: { uploadFiles: [] as File[] } });

  const form = useAppForm({
    defaultValues: {
      fullName: profile.fullName,
      birthDate: profile.birthDate ?? '',
      idNumber: profile.idNumber ?? '',
      idIssuedAt: profile.idIssuedAt ?? '',
      idIssuedBy: profile.idIssuedBy ?? '',
      permanentAddress: profile.permanentAddress ?? '',
      phone: profile.phone ?? '',
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const saved = await update.mutateAsync({
          ...value,
          birthDate: value.birthDate || null,
          idIssuedAt: value.idIssuedAt || null,
          signatureImage: signature,
          version,
        });

        setVersion(saved.version);
        setSavedSignature(signature);
        form.reset(value);
        toast.success(t('saved'));
      } catch (cause) {
        setError(getErrorMessage(cause, t('failed')));
      }
    },
  });

  const dirty = useFormDirty(form);

  const { prompt } = useUnsavedChanges(dirty || signature !== savedSignature);

  return (
    <Form
      form={form}
      schema={{ fullName: v.pipe(v.string(), v.trim(), v.minLength(1, t('required'))) }}
    >
      <FormLayout>
        {prompt}
        <FormError message={error} />
        <FormSection variant="card" title={t('landlord')}>
          <FormGrid>
            <FormField name="fullName" label={t('fullName')} required>
              <Input />
            </FormField>
            <FormField name="birthDate" label={t('birthDate')} {...DATE_FIELD}>
              <DatePicker />
            </FormField>
            <FormField name="idNumber" label={t('idNumber')}>
              <Input />
            </FormField>
            <FormField name="idIssuedAt" label={t('idIssuedAt')} {...DATE_FIELD}>
              <DatePicker />
            </FormField>
            <FormField name="idIssuedBy" label={t('idIssuedBy')}>
              <Input />
            </FormField>
            <FormField name="permanentAddress" label={t('permanentAddress')}>
              <Input />
            </FormField>
            <FormField name="phone" label={t('phone')}>
              <Input type="tel" />
            </FormField>
          </FormGrid>
        </FormSection>
        <FormSection variant="card" title={t('signature')}>
          <FormGrid columns={1}>
            <SignaturePad label={t('signature')} value={signature} onChange={setSignature} />
            <signatureForm.AppField
              name="uploadFiles"
              listeners={{
                onChange: ({ value: files }) => {
                  void (async (files) => {
                    const file = files[0];

                    if (!file) {
                      setSignature(null);
                      return;
                    }
                    if (file.size > SIGNATURE_IMAGE_MAX_BYTES) {
                      setError(t('fileTooLarge'));
                      return;
                    }
                    try {
                      setSignature(await readDataUrl(file));
                    } catch (cause) {
                      setError(getErrorMessage(cause, t('failed')));
                    }
                  })(files);
                },
              }}
            >
              {(field) => (
                <field.UploadField
                  label={t('signatureUpload')}
                  accept="image/png,image/jpeg"
                  maxBytes={SIGNATURE_IMAGE_MAX_BYTES}
                />
              )}
            </signatureForm.AppField>
          </FormGrid>
        </FormSection>
        <FormActions>
          <FormSubmit form={form}>
            {(loading) => (
              <Button type="submit" loading={loading}>
                {t('save')}
              </Button>
            )}
          </FormSubmit>
        </FormActions>
      </FormLayout>
    </Form>
  );
}

export default function LandlordPage() {
  const { t } = useTranslation('documents');

  const query = useLandlordProfile();

  return (
    <div className="grid gap-5">
      <ScreenHeader title={t('landlord')} />
      {query.isPending ? (
        <Skeleton className="h-64" />
      ) : query.data ? (
        <LandlordForm profile={query.data} />
      ) : (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      )}
    </div>
  );
}
