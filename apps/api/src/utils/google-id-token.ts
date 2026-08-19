import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { BadRequest, Unauthorized } from '@/utils/errors/index.js';

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

export type VerifiedGoogleIdentity = {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
};

/** Verify Google ID token via tokeninfo (no extra npm dep). */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
  if (!env.google.clientId) {
    throw new BadRequest(errorKeys.googleNotConfigured);
  }

  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Unauthorized(errorKeys.googleTokenInvalid);
  }

  const payload = (await response.json()) as GoogleTokenInfo;
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

  if (
    !payload.aud ||
    payload.aud !== env.google.clientId ||
    !payload.sub ||
    !payload.email ||
    !emailVerified
  ) {
    throw new Unauthorized(errorKeys.googleTokenInvalid);
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name,
    picture: payload.picture,
  };
}
