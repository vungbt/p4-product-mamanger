import {
  Button,
  Checkbox,
  Form,
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
  FormSubmit,
  Input,
  useAppForm,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useBuildings, useMemberMutations } from '@stay/sdk/react';
import {
  MANAGER_PERMISSION_GROUPS,
  MANAGER_PERMISSION_LABELS,
  type StayMember,
} from '@stay/shared';
import { useState } from 'react';
import * as v from 'valibot';
import { apiFormErrors, clearServerErrorOnChange, serverError } from '@/libraries/forms/api-errors';
import { FormError, LoadingRows } from '@/libraries/forms/page-states';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormDirty } from '@/libraries/forms/use-form-value';
import { Overlay } from '../invoices/invoice-dialogs';

const schema = {
  email: v.pipe(v.string(), v.trim(), v.email('Email không hợp lệ.')),
  buildingIds: v.pipe(v.array(v.string()), v.minLength(1, 'Chọn ít nhất một toà.')),
  permissionGroups: v.array(v.picklist(MANAGER_PERMISSION_GROUPS)),
};

export function MemberDialog({
  member,
  onClose,
}: {
  member: StayMember | null;
  onClose: () => void;
}) {
  const { invite, update } = useMemberMutations();
  const buildings = useBuildings({ pageSize: 100, status: 'active' });
  const [error, setError] = useState<string | null>(null);
  const busy = invite.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: {
      email: member?.email ?? '',
      buildingIds: member?.buildingIds ?? [],
      permissionGroups: member?.permissionGroups ?? [],
    },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        if (member)
          await update.mutateAsync({
            id: member.id,
            body: {
              buildingIds: value.buildingIds,
              permissionGroups: value.permissionGroups,
              version: member.version,
            },
          });
        else await invite.mutateAsync({ ...value, email: value.email.trim().toLowerCase() });
        form.reset();
        toast.success(
          member ? 'Đã lưu quyền quản lý.' : 'Đã tạo người quản lý và xếp lời mời vào hàng đợi.',
        );
        onClose();
      } catch (cause) {
        const errors = apiFormErrors(
          cause,
          ['email', 'buildingIds', 'permissionGroups'] as const,
          'Không lưu được. Dữ liệu có thể đã thay đổi, vui lòng tải lại.',
        );

        for (const field of ['email', 'buildingIds', 'permissionGroups'] as const)
          if (errors.fields[field]) form.setFieldMeta(field, serverError(errors.fields[field]));
        setError(errors.message);
      }
    },
  });

  const dirty = useFormDirty(form);

  useUnsavedChanges(dirty);

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Overlay title={member ? 'Sửa người quản lý' : 'Mời người quản lý'} onClose={close}>
      <Form
        form={form}
        schema={schema}
        noValidate
        className="grid gap-4"
        aria-label="Người quản lý"
      >
        <FormLayout size="full">
          <FormSection>
            <FormGrid columns={1}>
              <FormError message={error} />
              <FormField name="email" label="Email" required>
                <Input type="email" disabled={Boolean(member)} autoComplete="email" />
              </FormField>
              <form.Field name="buildingIds">
                {(field) => (
                  <fieldset className="grid gap-2">
                    <legend>Toà được gán</legend>
                    {buildings.isPending ? (
                      <LoadingRows rows={2} />
                    ) : buildings.isError ? (
                      <Button variant="secondary" onClick={() => void buildings.refetch()}>
                        Thử tải lại toà
                      </Button>
                    ) : (
                      (buildings.data?.data ?? []).map((building) => (
                        <Checkbox
                          key={building.id}
                          label={building.name}
                          checked={field.state.value.includes(building.id)}
                          onCheckedChange={(checked) =>
                            field.handleChange(
                              checked === true
                                ? [...field.state.value, building.id]
                                : field.state.value.filter((id) => id !== building.id),
                            )
                          }
                        />
                      ))
                    )}
                    {field.state.meta.errors.length ? (
                      <p role="alert" className="text-danger-700">
                        Chọn ít nhất một toà đang hoạt động.
                      </p>
                    ) : null}
                  </fieldset>
                )}
              </form.Field>
              <form.Field name="permissionGroups">
                {(field) => (
                  <fieldset className="grid gap-2">
                    <legend>Nhóm quyền (bỏ chọn tất cả = chỉ xem)</legend>
                    {MANAGER_PERMISSION_GROUPS.map((group) => (
                      <Checkbox
                        key={group}
                        label={MANAGER_PERMISSION_LABELS[group]}
                        checked={field.state.value.includes(group)}
                        onCheckedChange={(checked) =>
                          field.handleChange(
                            checked === true
                              ? [...field.state.value, group]
                              : field.state.value.filter((item) => item !== group),
                          )
                        }
                      />
                    ))}
                  </fieldset>
                )}
              </form.Field>
              <p className="text-ui-sm text-muted">
                Không được sửa đơn giá toà, cấu hình hệ thống, void hoá đơn hoặc thanh lý hợp đồng.
              </p>
            </FormGrid>
          </FormSection>
          <FormActions>
            <Button variant="secondary" disabled={busy} onClick={close}>
              Huỷ
            </Button>
            <FormSubmit form={form}>
              {(submitting) => (
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={buildings.isPending || buildings.isError}
                >
                  {member ? 'Lưu' : 'Gửi lời mời'}
                </Button>
              )}
            </FormSubmit>
          </FormActions>
        </FormLayout>
      </Form>
    </Overlay>
  );
}
