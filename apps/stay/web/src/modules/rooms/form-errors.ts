import { ApiSdkError, getErrorMessage } from '@stay/sdk/shared';
import { useEffect } from 'react';

export type ServerErrors<Field extends string> = {
  /** Messages for the form's own fields, shown at the field. */
  fields: Partial<Record<Field, string>>;
  /** Message for the top of the form: other failures, or field errors the form cannot show. */
  general: string | null;
  /** 409 `version_conflict`: someone else saved the record first. */
  stale: boolean;
};

/** Splits an API error into field messages (`extensions.{field}`) and a general message. */
export function serverErrors<Field extends string>(
  error: unknown,
  fields: readonly Field[],
  fallback: string,
): ServerErrors<Field> {
  const result: ServerErrors<Field> = { fields: {}, general: null, stale: false };

  if (error instanceof ApiSdkError && error.code === 'version_conflict')
    return { ...result, stale: true };

  if (error instanceof ApiSdkError && error.status === 400) {
    const unknown: string[] = [];

    for (const [key, messages] of Object.entries(error.fieldErrors)) {
      const field = fields.find((item) => item === key);

      if (field) result.fields[field] = messages[0];
      else unknown.push(...messages);
    }
    if (unknown.length || !Object.keys(result.fields).length)
      result.general = unknown.join(' ') || getErrorMessage(error, fallback);
    return result;
  }

  return { ...result, general: getErrorMessage(error, fallback) };
}

/**
 * Asks before leaving with unsaved changes: closing/reloading the tab (browser prompt) and
 * following in-app links (confirm). The app uses `BrowserRouter`, so there is no route blocker.
 */
export function useLeaveConfirmation(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;

      if (
        !(target instanceof HTMLAnchorElement) ||
        target.origin !== window.location.origin ||
        target.target === '_blank' ||
        event.defaultPrevented
      )
        return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', click, true);
    };
  }, [dirty, message]);
}
