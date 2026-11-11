import {
  Button,
  Form,
  FormField,
  FormSubmit,
  Input,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useGiveNotice } from '@stay/sdk/react';
import type { StayContract } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { displayDate, todayIsoDate } from '@/libraries/format';
import {
  apiFormErrors,
  clearServerErrorOnChange,
  isVersionConflict,
  serverError,
} from '@/libraries/forms/api-errors';
import { ConflictAlert, FormError } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { Overlay } from '@/modules/invoices/invoice-dialogs';

const FIELDS = ['expectedMoveOutDate', 'note'] as const;

/** "Báo trả phòng" (O-17): expected move-out date and note → contract `ending`. */
export function NoticeDialog({
  contract,
  onClose,
  onReload,
}: {
  contract: StayContract;
  onClose: () => void;
  onReload: () => void;
}) {
  const notice = useGiveNotice();
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const today = todayIsoDate();
  const min = contract.startDate > today ? contract.startDate : today;
  const max = contract.endDate ?? undefined;
  const schema = {
    expectedMoveOutDate: v.pipe(
      v.string(),
      v.isoDate('Chọn ngày dự kiến trả phòng.'),
      v.check((value) => value >= min, `Ngày dự kiến từ ${displayDate(min)} trở đi.`),
      v.check(
        (value) => !max || value <= max,
        max ? `Ngày dự kiến không sau ngày kết thúc ${displayDate(max)}.` : '',
      ),
    ),
    note: v.pipe(v.string(), v.maxLength(2000, 'Ghi chú tối đa 2000 ký tự.')),
  };

  const form = useAppForm({
    defaultValues: { expectedMoveOutDate: contract.noticeDate ?? '', note: '' },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      setConflict(false);
      try {
        await notice.mutateAsync({
          id: contract.id,
          body: {
            version: contract.version,
            expectedMoveOutDate: value.expectedMoveOutDate,
            note: value.note.trim() || null,
          },
        });
        form.reset();
        toast.success('Đã ghi nhận báo trả phòng.');
        onClose();
      } catch (cause) {
        if (isVersionConflict(cause)) {
          setConflict(true);
          return;
        }
        const errors = apiFormErrors(cause, FIELDS, 'Không thể báo trả phòng.');

        for (const field of FIELDS)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);
  useUnsavedChanges(dirty);

  const close = () => {
    if (notice.isPending) return;
    form.reset();
    onClose();
  };

  return (
    <Overlay
      title="Báo trả phòng"
      description={`Hợp đồng ${contract.code} · phòng ${contract.roomCode} chuyển sang "Đã báo trả". Có thể huỷ báo trả hoặc gia hạn sau.`}
      onClose={close}
    >
      <Form
        noValidate
        form={form}
        schema={schema}
        className="grid min-w-0 gap-4"
        aria-label="Báo trả phòng"
      >
        <FormError message={error} />
        {conflict ? (
          <ConflictAlert
            onReload={() => {
              setConflict(false);
              onReload();
            }}
          />
        ) : null}
        <FormField name="expectedMoveOutDate" label="Ngày dự kiến trả phòng" required>
          <Input type="date" min={min} max={max} />
        </FormField>
        <FormField name="note" label="Ghi chú">
          <Textarea maxLength={2000} />
        </FormField>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={notice.isPending} onClick={close}>
            Huỷ
          </Button>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                Báo trả phòng
              </Button>
            )}
          </FormSubmit>
        </div>
      </Form>
    </Overlay>
  );
}
