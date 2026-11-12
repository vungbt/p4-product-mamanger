import nodemailer, { type Transporter } from 'nodemailer';
import webpush from 'web-push';
import { emailEnabled, env, pushEnabled } from '@/configs/env.js';

export interface EmailMessage {
  /** Outbox event id: stable across retries (Message-ID), never logged with the address. */
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushMessage {
  title: string;
  body: string;
  /** Path opened on click (same origin as the web app). */
  url: string;
  /** Notification id: the browser replaces a notification with the same tag. */
  tag: string;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<void>;
}

export interface PushTransport {
  send(target: PushTarget, message: PushMessage): Promise<void>;
}

/** `null` = channel disabled (no SMTP host / no VAPID keys): nothing is queued for it. */
export interface NotificationTransports {
  email: EmailTransport | null;
  push: PushTransport | null;
}

/**
 * Delivery failure. `permanent`: retrying cannot help (SMTP 5xx, push 4xx); `gone`: the push
 * endpoint no longer exists (404/410) and the subscription is removed.
 */
export class DeliveryError extends Error {
  constructor(
    readonly code: string,
    readonly permanent = false,
    readonly gone = false,
  ) {
    super(code);
  }
}

let mailer: Transporter | undefined;

/** SMTP like the ttms worker: host/port/secure, optional auth, timeouts. */
export const smtpTransport: EmailTransport = {
  async send(message) {
    mailer ??= nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
      connectionTimeout: 30_000,
      greetingTimeout: 30_000,
      socketTimeout: 60_000,
    });
    const domain = env.smtp.from.split('@')[1] || 'stay.local';

    try {
      await mailer.sendMail({
        from: env.smtp.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        // Same id on every retry: receiving servers can drop duplicates.
        messageId: `<${message.id}@${domain}>`,
      });
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'responseCode' in error ? error.responseCode : null;

      throw new DeliveryError(
        typeof code === 'number' ? `smtp_${code}` : 'smtp_unavailable',
        typeof code === 'number' && code >= 500,
      );
    }
  },
};

export const webPushTransport: PushTransport = {
  async send(target, message) {
    try {
      await webpush.sendNotification(target, JSON.stringify(message), {
        TTL: 24 * 3600,
        urgency: 'normal',
        vapidDetails: {
          subject: env.webPush.subject,
          publicKey: env.webPush.publicKey,
          privateKey: env.webPush.privateKey,
        },
      });
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : null;

      if (status === 404 || status === 410) throw new DeliveryError('push_gone', true, true);
      throw new DeliveryError(
        typeof status === 'number' ? `push_${status}` : 'push_unavailable',
        typeof status === 'number' && status >= 400 && status < 500 && status !== 429,
      );
    }
  },
};

/** Channels configured in the environment (worker default). */
export function configuredTransports(): NotificationTransports {
  return {
    email: emailEnabled() ? smtpTransport : null,
    push: pushEnabled() ? webPushTransport : null,
  };
}
