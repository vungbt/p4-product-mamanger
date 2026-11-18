import { Button, Form, FormField, FormSubmit, Input, useAppForm } from '@itclabs/react-ui';
import { PortalSdkProvider, usePortalLookup, usePortalSignIn } from '@stay/sdk/react';
import { ApiSdkError } from '@stay/sdk/shared';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as v from 'valibot';
import { useGenericDocumentMeta } from '@/libraries/document-meta';
import { isNotFound } from '@/libraries/forms/api-errors';
import { FormError, LoadError } from '@/libraries/forms/page-states';
import { getPortalSdk } from './portal-sdk';
import { InvalidLink, PORTAL_TITLE, PortalSpinner, portalPaths } from './portal-ui';

const schema = {
  phoneLast4: v.pipe(v.string(), v.regex(/^[0-9]{4}$/, 'Nhập đúng 4 chữ số cuối.')),
};

/** One message for every failure: never tells whether the link or the digits were wrong. */
function signInMessage(error: unknown): string {
  if (error instanceof ApiSdkError && error.status === 429)
    return 'Bạn đã nhập sai quá nhiều lần. Link tạm khoá, vui lòng thử lại sau 15 phút.';
  if (error instanceof ApiSdkError && error.status === 401)
    return 'Link không còn hiệu lực hoặc 4 số cuối điện thoại không đúng.';
  return 'Không vào được cổng. Vui lòng thử lại.';
}

function EntryForm({ token }: { token: string }) {
  const lookup = usePortalLookup(token);
  const signIn = usePortalSignIn();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { phoneLast4: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await signIn.mutateAsync({ token, phoneLast4: value.phoneLast4 });
        // Leave the token out of the history entry once the device is verified.
        navigate(portalPaths.home, { replace: true });
      } catch (cause) {
        setError(signInMessage(cause));
      }
    },
  });

  const signedIn = lookup.data?.signedIn === true;

  useEffect(() => {
    if (signedIn) navigate(portalPaths.home, { replace: true });
  }, [signedIn, navigate]);

  if (lookup.isPending || signedIn) return <PortalSpinner />;
  if (!lookup.data)
    return isNotFound(lookup.error) ? (
      <InvalidLink />
    ) : (
      <main className="min-h-dvh bg-canvas px-4 py-10">
        <div className="mx-auto max-w-md">
          <LoadError error={lookup.error} onRetry={() => void lookup.refetch()} />
        </div>
      </main>
    );

  return (
    <main className="min-h-dvh bg-canvas px-4 py-10">
      <div className="mx-auto grid w-full max-w-md min-w-0 gap-5 rounded-panel border border-line bg-surface p-5">
        <div className="grid gap-1">
          <h1 className="text-heading font-bold break-words" data-testid="portal-greeting">
            Xin chào, phòng {lookup.data.roomCode} – {lookup.data.buildingName}
          </h1>
          <p className="text-muted">
            Để bảo vệ thông tin của bạn, hãy nhập 4 số cuối số điện thoại bạn đã đăng ký với chủ
            trọ. Thiết bị này sẽ được ghi nhớ 90 ngày.
          </p>
        </div>
        <Form noValidate form={form} schema={schema} className="grid gap-4" aria-label="Vào cổng">
          <FormError message={error} />
          <FormField name="phoneLast4" label="4 số cuối số điện thoại" required>
            <Input inputMode="numeric" autoComplete="off" maxLength={4} />
          </FormField>
          <FormSubmit form={form}>
            {(submitting) => (
              <Button type="submit" loading={submitting}>
                Vào cổng
              </Button>
            )}
          </FormSubmit>
        </Form>
      </div>
    </main>
  );
}

/** T-02 `/p/:token`: greeting, then the occupant's last 4 phone digits → portal home (T-03). */
export default function PortalEntryPage() {
  const { token = '' } = useParams();
  useGenericDocumentMeta(PORTAL_TITLE);

  return (
    <PortalSdkProvider sdk={getPortalSdk()}>
      <EntryForm token={token} />
    </PortalSdkProvider>
  );
}
