import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Input,
  RadioGroup,
  Textarea,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCreateAnnouncement, useRooms, useUpdateAnnouncement } from '@stay/sdk/react';
import { isIsoDate, isoDateInTimeZone, type StayAnnouncement } from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { todayIsoDate } from '@/libraries/format';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { DATE_FIELD } from '@/libraries/forms/date-field';
import { FormError, LoadingRows } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { Overlay } from '../invoices/invoice-dialogs';

const FIELDS = ['title', 'body', 'expiresOn', 'roomIds'] as const;

const schema = {
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Nhập tiêu đề.'),
    v.maxLength(200, 'Tiêu đề tối đa 200 ký tự.'),
  ),
  body: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Nhập nội dung.'),
    v.maxLength(5000, 'Nội dung tối đa 5000 ký tự.'),
  ),
  expiresOn: v.pipe(
    v.string(),
    v.check((value: string) => !value || isIsoDate(value), 'Ngày không hợp lệ.'),
    v.check((value: string) => !value || value >= todayIsoDate(), 'Không chọn ngày đã qua.'),
  ),
};

const TARGETS = [
  { value: 'building', label: 'Cả toà' },
  { value: 'rooms', label: 'Một số phòng' },
];

/** O-32 form: create (no `announcement`) or edit with its `version`. */
export function AnnouncementDialog({
  buildingId,
  announcement,
  onClose,
}: {
  buildingId: string;
  announcement: StayAnnouncement | null;
  onClose: () => void;
}) {
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const rooms = useRooms(buildingId, { pageSize: 100, sortBy: 'code', sortOrder: 'asc' });
  const [target, setTarget] = useState(announcement?.roomIds?.length ? 'rooms' : 'building');
  const [roomIds, setRoomIds] = useState<ReadonlySet<string>>(new Set(announcement?.roomIds ?? []));
  const [pinned, setPinned] = useState(announcement?.pinned ?? false);
  const [error, setError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const busy = create.isPending || update.isPending;

  const form = useAppForm({
    defaultValues: {
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      expiresOn:
        announcement?.expiresAt && !announcement.expired
          ? isoDateInTimeZone(new Date(announcement.expiresAt))
          : '',
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      setRoomError(null);
      if (target === 'rooms' && roomIds.size === 0) {
        setRoomError('Chọn ít nhất một phòng.');
        return;
      }
      const body = {
        buildingId,
        title: value.title.trim(),
        body: value.body.trim(),
        roomIds: target === 'rooms' ? [...roomIds] : null,
        pinned,
        expiresOn: value.expiresOn || null,
      };

      try {
        if (announcement)
          await update.mutateAsync({
            id: announcement.id,
            body: { ...body, version: announcement.version },
          });
        else await create.mutateAsync(body);
        form.reset();
        toast.success(announcement ? 'Đã lưu thông báo.' : 'Đã tạo thông báo.');
        onClose();
      } catch (cause) {
        const errors = apiFormErrors(cause, FIELDS, 'Không lưu được thông báo.');

        for (const field of ['title', 'body', 'expiresOn'] as const)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        if (errors.fields.roomIds) setRoomError(errors.fields.roomIds);
        setError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);

  useUnsavedChanges(dirty);

  const toggleRoom = (id: string, checked: boolean) =>
    setRoomIds((current) => {
      const next = new Set(current);

      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const close = () => {
    if (busy) return;
    form.reset();
    onClose();
  };

  return (
    <Overlay
      title={announcement ? 'Sửa thông báo' : 'Tạo thông báo'}
      description="Người thuê thấy thông báo trên cổng (thông báo ghim nằm ở trang chủ) tới hết ngày hết hạn."
      onClose={close}
    >
      <Form
        noValidate
        form={form}
        schema={schema}
        className="grid min-w-0 gap-4"
        aria-label="Thông báo cho người thuê"
      >
        <FormLayout size="full">
          <FormSection>
            <FormError message={error} />
            <FormField name="title" label="Tiêu đề" required>
              <Input maxLength={200} autoComplete="off" />
            </FormField>
            <FormField name="body" label="Nội dung" required>
              <Textarea maxLength={5000} rows={4} />
            </FormField>
            <RadioGroup
              label="Gửi cho"
              options={TARGETS}
              value={target}
              onValueChange={setTarget}
            />
            {target === 'rooms' ? (
              <fieldset
                className="m-0 grid min-w-0 gap-2 border-0 p-0"
                aria-describedby="room-error"
              >
                <legend className="mb-1 font-medium">Phòng nhận thông báo</legend>
                {rooms.isPending ? (
                  <LoadingRows rows={2} />
                ) : (
                  <FormGrid columns={2}>
                    {(rooms.data?.data ?? []).map((room) => (
                      <Checkbox
                        key={room.id}
                        label={`Phòng ${room.code}`}
                        checked={roomIds.has(room.id)}
                        onCheckedChange={(value) => toggleRoom(room.id, value === true)}
                      />
                    ))}
                  </FormGrid>
                )}
                {roomError ? (
                  <p id="room-error" role="alert" className="text-ui-sm text-danger-700">
                    {roomError}
                  </p>
                ) : null}
              </fieldset>
            ) : null}
            <Checkbox
              label="Ghim lên trang chủ người thuê"
              checked={pinned}
              onCheckedChange={(value) => setPinned(value === true)}
            />
            <FormField
              name="expiresOn"
              label="Hết hạn hiển thị (ngày cuối còn hiện)"
              {...DATE_FIELD}
            >
              <DatePicker minDate={todayIsoDate()} />
            </FormField>
          </FormSection>
          <FormActions>
            <Button variant="secondary" disabled={busy} onClick={close}>
              Huỷ
            </Button>
            <FormSubmit form={form}>
              {(submitting) => (
                <Button type="submit" loading={submitting}>
                  Lưu thông báo
                </Button>
              )}
            </FormSubmit>
          </FormActions>
        </FormLayout>
      </Form>
    </Overlay>
  );
}
