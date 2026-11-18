export type Draft = {
  value: string;
  version: number;
  confirmed: boolean;
  photoFileId: string | null;
  dirty: boolean;
  error: string | null;
};

export function readDrafts(key: string): Record<string, Draft> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(
      Object.entries(data).filter((entry): entry is [string, Draft] => {
        const value: unknown = entry[1];
        if (!value || typeof value !== 'object') return false;
        return (
          'value' in value &&
          typeof value.value === 'string' &&
          'version' in value &&
          typeof value.version === 'number' &&
          value.version >= 0 &&
          Number.isSafeInteger(value.version) &&
          'confirmed' in value &&
          typeof value.confirmed === 'boolean' &&
          'photoFileId' in value &&
          (value.photoFileId === null || typeof value.photoFileId === 'string') &&
          'dirty' in value &&
          value.dirty === true &&
          'error' in value &&
          (value.error === null || typeof value.error === 'string')
        );
      }),
    );
  } catch {
    return {};
  }
}

export function storeDrafts(key: string, drafts: Record<string, Draft>): boolean {
  try {
    const pending = Object.fromEntries(Object.entries(drafts).filter(([, draft]) => draft.dirty));
    if (Object.keys(pending).length) localStorage.setItem(key, JSON.stringify(pending));
    else localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
