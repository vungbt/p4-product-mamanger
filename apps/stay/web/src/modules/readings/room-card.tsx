import { Button, Checkbox, Form, FormField, Input, useAppForm } from '@itclabs/react-ui';
import { useSaveReadings, useStaySdk } from '@stay/sdk/react';
import { createUploadApi, getErrorMessage } from '@stay/sdk/shared';
import { METER_READING_MAX, type ReadingMeter, type ReadingRoom } from '@stay/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as v from 'valibot';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { type Draft, readDrafts, storeDrafts } from './drafts';
import { ReplacementDialog } from './replacement-dialog';

const schema = { electricity: v.string(), water: v.string() };

function problem(draft: Draft, meter: ReadingMeter) {
  if (!draft.value.trim()) return 'Chưa nhập chỉ số.';
  const value = Number(draft.value);
  if (!Number.isSafeInteger(value) || value < 0 || value > METER_READING_MAX)
    return 'Nhập số nguyên không âm.';
  if (value < meter.previous) return 'Số mới phải lớn hơn hoặc bằng số cũ.';
  return null;
}

export function ReadingRoomCard({
  room,
  buildingId,
  period,
  accountId,
  onPending,
}: {
  room: ReadingRoom;
  buildingId: string;
  period: string;
  accountId: string;
  onPending: (id: string, pending: boolean) => void;
}) {
  const key = `stay:readings:${accountId}:${buildingId}:${period}:${room.roomId}`;
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => readDrafts(key));
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState<ReadingMeter | null>(null);
  const busy = useRef(false);
  const latest = useRef(drafts);
  const save = useSaveReadings();
  const sdk = useStaySdk();
  const uploader = useMemo(() => createUploadApi(sdk, { baseUrl: window.location.origin }), [sdk]);
  const form = useAppForm({ defaultValues: { electricity: '', water: '' } });

  const draftFor = useCallback(
    (meter: ReadingMeter): Draft =>
      (drafts[meter.meterId]?.dirty ? drafts[meter.meterId] : undefined) ?? {
        value: meter.current ? String(meter.current.reading) : '',
        version: meter.current?.version ?? 0,
        confirmed: false,
        photoFileId: meter.current?.photoFileId ?? null,
        dirty: false,
        error: null,
      },
    [drafts],
  );
  const dirty = Object.values(drafts).some((draft) => draft.dirty);
  useUnsavedChanges(dirty || uploading);

  const commit = useCallback(
    (next: Record<string, Draft>) => {
      latest.current = next;
      setDrafts(next);
      setStorageError(!storeDrafts(key, next));
    },
    [key],
  );

  useEffect(() => {
    onPending(room.roomId, dirty);
  }, [dirty, room.roomId, onPending]);
  useEffect(() => {
    const connected = () => {
      setOnline(true);
      commit(
        Object.fromEntries(
          Object.entries(latest.current).map(([id, draft]) => [id, { ...draft, error: null }]),
        ),
      );
    };
    const disconnected = () => setOnline(false);
    window.addEventListener('online', connected);
    window.addEventListener('offline', disconnected);
    return () => {
      window.removeEventListener('online', connected);
      window.removeEventListener('offline', disconnected);
    };
  }, [commit]);

  const submit = useCallback(async () => {
    if (busy.current || !navigator.onLine || uploading || replacing) return;
    const pending = room.meters.flatMap((meter) => {
      const draft = latest.current[meter.meterId];
      if (
        !draft?.dirty ||
        draft.error ||
        problem(draft, meter) ||
        meter.current?.status === 'locked'
      )
        return [];
      const consumption = Number(draft.value) - meter.previous + meter.carriedConsumption;
      if (meter.average !== null && consumption > 2 * meter.average && !draft.confirmed) return [];
      return [{ meter, draft }];
    });
    if (!pending.length) return;
    busy.current = true;
    setSaving(true);
    try {
      const lastDay = new Date(Number(period.slice(0, 4)), Number(period.slice(5)), 0).getDate();
      const result = await save.mutateAsync({
        buildingId,
        body: {
          rows: pending.map(({ meter, draft }) => ({
            meterId: meter.meterId,
            period,
            reading: Number(draft.value),
            readOn: `${period}-${lastDay}`,
            version: draft.version,
            confirmHighConsumption: draft.confirmed,
            photoFileId: draft.photoFileId,
          })),
        },
      });
      const next = { ...latest.current };
      for (const row of result.results) {
        const sent = pending.find((entry) => entry.meter.meterId === row.meterId);
        const current = next[row.meterId];
        if (!current || !sent) continue;
        if (row.error)
          next[row.meterId] = {
            ...current,
            error:
              row.error.status === 409
                ? 'Dữ liệu đã thay đổi hoặc đã khoá. Tải lại để kiểm tra.'
                : row.error.message,
          };
        else if (row.data)
          next[row.meterId] = {
            ...current,
            version: row.data.version,
            dirty: current !== sent.draft,
            error: null,
          };
      }
      commit(next);
    } catch (cause) {
      if (navigator.onLine)
        commit(
          Object.fromEntries(
            Object.entries(latest.current).map(([id, draft]) => [
              id,
              {
                ...draft,
                error: draft.dirty ? getErrorMessage(cause, 'Không thể lưu. Thử lại.') : null,
              },
            ]),
          ),
        );
      else setOnline(false);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, [room.meters, period, buildingId, save, commit, uploading, replacing]);

  useEffect(() => {
    if (!dirty || !online || saving || uploading || replacing) return;
    const timer = window.setTimeout(() => void submit(), 700);
    return () => window.clearTimeout(timer);
  }, [dirty, drafts, online, saving, uploading, replacing, submit]);

  const change = (meter: ReadingMeter, patch: Partial<Draft>) =>
    commit({
      ...latest.current,
      [meter.meterId]: { ...draftFor(meter), ...patch, dirty: true, error: null },
    });
  const hasError = room.meters.some(
    (meter) => draftFor(meter).error || (draftFor(meter).dirty && problem(draftFor(meter), meter)),
  );

  return (
    <article
      className="grid min-w-0 gap-3 rounded-panel border border-line bg-surface p-4"
      data-testid="reading-room"
      aria-label={`Phòng ${room.code}`}
    >
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="font-semibold">Phòng {room.code}</h2>
        <span role="status">
          {saving || uploading
            ? 'Đang lưu'
            : hasError
              ? 'Lỗi'
              : dirty
                ? 'Chưa đồng bộ'
                : room.meters.every((meter) => meter.current)
                  ? 'Đã lưu'
                  : 'Chưa nhập đủ'}
        </span>
      </div>
      {storageError ? (
        <p role="alert">Không thể giữ bản nháp trên máy. Giữ trang mở để tránh mất dữ liệu.</p>
      ) : null}
      <Form
        form={form}
        schema={schema}
        className="grid min-w-0 gap-4"
        onKeyDown={(event) => {
          if (
            event.key !== 'Enter' ||
            !(event.target instanceof HTMLInputElement) ||
            event.target.type !== 'number'
          )
            return;
          event.preventDefault();
          const inputs = Array.from(
            document.querySelectorAll<HTMLInputElement>('[data-reading-input]:not(:disabled)'),
          ).filter((input) => input.getClientRects().length > 0);
          inputs[inputs.indexOf(event.target) + 1]?.focus();
        }}
      >
        {room.meters.map((meter) => {
          const draft = draftFor(meter);
          const label = meter.kind === 'electricity' ? 'Điện' : 'Nước';
          const error = draft.dirty ? problem(draft, meter) : null;
          const consumption =
            draft.value && !error
              ? Number(draft.value) - meter.previous + meter.carriedConsumption
              : null;
          const high =
            consumption !== null && meter.average !== null && consumption > 2 * meter.average;
          const locked = meter.current?.status === 'locked';
          return (
            <div key={meter.meterId} className="grid min-w-0 gap-2">
              <p>
                {label}: {meter.previous} → {locked ? 'Đã khoá' : 'Số mới'}
              </p>
              <FormField name={meter.kind} label={`${label} số mới`} required>
                {() => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={meter.previous}
                    max={METER_READING_MAX}
                    step={1}
                    value={draft.value}
                    disabled={locked || uploading}
                    data-reading-input
                    aria-label={`${label} số mới phòng ${room.code}`}
                    error={error || draft.error}
                    onChange={(event) =>
                      change(meter, { value: event.target.value, confirmed: false })
                    }
                  />
                )}
              </FormField>
              <p>
                Tiêu thụ: {consumption ?? '—'} {meter.kind === 'electricity' ? 'kWh' : 'm³'} · TB 3
                kỳ: {meter.average === null ? '—' : Math.round(meter.average * 10) / 10}
              </p>
              {consumption === 0 ? (
                <p className="text-muted">Không phát sinh tiêu thụ; kiểm tra lại.</p>
              ) : null}
              {high ? (
                <Checkbox
                  checked={draft.confirmed}
                  disabled={locked}
                  onCheckedChange={(checked) => change(meter, { confirmed: checked === true })}
                  label={`Tiêu thụ hơn 2 lần trung bình. Xác nhận chỉ số ${label.toLowerCase()}.`}
                />
              ) : null}
              <Input
                label={`Ảnh ${label.toLowerCase()} (tuỳ chọn)`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={locked || !online || saving || uploading}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const photoFileId = await uploader.uploadImage({
                      purpose: 'contract_meter',
                      buildingId,
                      file,
                    });
                    change(meter, { photoFileId });
                  } catch (cause) {
                    commit({
                      ...latest.current,
                      [meter.meterId]: {
                        ...draftFor(meter),
                        dirty: true,
                        error: getErrorMessage(cause, 'Không thể tải ảnh.'),
                      },
                    });
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {meter.current?.photo ? (
                <a
                  href={meter.current.photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  Xem ảnh {label.toLowerCase()}
                </a>
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                disabled={locked || saving || uploading || !online}
                onClick={() => setReplacing(meter)}
              >
                Thay đồng hồ {label.toLowerCase()}
              </Button>
            </div>
          );
        })}
      </Form>
      {hasError ? (
        <Button
          variant="secondary"
          onClick={() =>
            commit(
              Object.fromEntries(
                Object.entries(latest.current).map(([id, draft]) => [
                  id,
                  { ...draft, error: null },
                ]),
              ),
            )
          }
        >
          Thử lưu lại
        </Button>
      ) : null}
      {Object.values(drafts).some((draft) => draft.error?.includes('Tải lại')) ? (
        <Button
          variant="secondary"
          onClick={() => {
            commit({});
            window.location.reload();
          }}
        >
          Tải lại chỉ số từ máy chủ
        </Button>
      ) : null}
      {replacing ? (
        <ReplacementDialog
          meter={replacing}
          onClose={() => setReplacing(null)}
          onReplaced={() => {
            const next = { ...latest.current };
            delete next[replacing.meterId];
            commit(next);
          }}
        />
      ) : null}
    </article>
  );
}
