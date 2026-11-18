import {
  Button,
  Form,
  FormField,
  FormSubmit,
  Input,
  Skeleton,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useLandlordProfile, useUpdateLandlordProfile } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import type { LandlordProfile } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import { FormActions, FormGrid, FormLayout, FormSection } from '@/libraries/forms/layout';
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
        <FormSection title={t('landlord')}>
          <FormGrid>
            {(
              [
                'fullName',
                'birthDate',
                'idNumber',
                'idIssuedAt',
                'idIssuedBy',
                'permanentAddress',
                'phone',
              ] as const
            ).map((field) => (
              <FormField key={field} name={field} label={t(field)} required={field === 'fullName'}>
                <Input
                  type={
                    field === 'birthDate' || field === 'idIssuedAt'
                      ? 'date'
                      : field === 'phone'
                        ? 'tel'
                        : 'text'
                  }
                />
              </FormField>
            ))}
          </FormGrid>
        </FormSection>
        <FormSection title={t('signature')}>
          <SignaturePad label={t('signature')} value={signature} onChange={setSignature} />
          <Input
            type="file"
            label={t('signatureUpload')}
            accept="image/png,image/jpeg"
            onChange={async (event) => {
              const file = event.target.files?.[0];

              if (!file) return;
              if (file.size > 200_000) {
                setError(t('fileTooLarge'));
                return;
              }
              try {
                setSignature(await readDataUrl(file));
              } catch (cause) {
                setError(getErrorMessage(cause, t('failed')));
              }
            }}
          />
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
