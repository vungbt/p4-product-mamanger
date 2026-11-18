/**
 * Browser notifications (Web Push): service worker registration, permission and subscription.
 * Every call is safe on browsers without support (returns `unsupported`/null).
 */
export type PushScope = 'staff' | 'portal';

export type PushState = 'unsupported' | 'default' | 'denied' | 'granted';

const PROMPTED_KEY = (scope: PushScope) => `stay.push.prompted.${scope}`;

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function pushPermission(): PushState {
  return pushSupported() ? Notification.permission : 'unsupported';
}

/** Whether the automatic prompt already ran on this browser (asked once, denial remembered). */
export function wasPrompted(scope: PushScope): boolean {
  try {
    return window.localStorage.getItem(PROMPTED_KEY(scope)) !== null;
  } catch {
    return false;
  }
}

export function rememberPrompt(scope: PushScope, outcome: PushState) {
  try {
    window.localStorage.setItem(PROMPTED_KEY(scope), outcome);
  } catch {
    // Private mode: the browser's own permission state still prevents re-asking after a denial.
  }
}

function applicationServerKey(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64url}${'='.repeat((4 - (base64url.length % 4)) % 4)}`
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  const raw = window.atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));

  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return (
    (await navigator.serviceWorker.getRegistration('/')) ??
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
  );
}

export interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function toInput(subscription: PushSubscription): BrowserSubscription | null {
  const json = subscription.toJSON();

  return json.endpoint && json.keys?.p256dh && json.keys.auth
    ? { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }
    : null;
}

/**
 * Asks for permission when needed and subscribes this browser with the server's VAPID key.
 * Returns the subscription to register, or the permission state that prevented it.
 */
export async function subscribeBrowser(
  publicKey: string,
): Promise<BrowserSubscription | Exclude<PushState, 'granted'>> {
  if (!pushSupported()) return 'unsupported';
  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== 'granted') return permission;
  await registration();
  const { pushManager } = await navigator.serviceWorker.ready;
  const subscription =
    (await pushManager.getSubscription()) ??
    (await pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(publicKey),
    }));

  return toInput(subscription) ?? 'unsupported';
}

/** The endpoint of this browser, if it is subscribed. */
export async function currentEndpoint(): Promise<string | null> {
  if (!pushSupported()) return null;
  const worker = await navigator.serviceWorker.getRegistration('/');
  const subscription = await worker?.pushManager.getSubscription();

  return subscription?.endpoint ?? null;
}

/** Unsubscribes this browser (the caller removes the endpoint on the server). */
export async function unsubscribeBrowser(): Promise<string | null> {
  if (!pushSupported()) return null;
  const worker = await navigator.serviceWorker.getRegistration('/');
  const subscription = await worker?.pushManager.getSubscription();

  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription.endpoint;
}
