/** "Ghi nhớ email trên máy này": only the email is stored, never a password or token. */
const STORAGE_KEY = 'stay_login_email';

export function readRememberedEmail(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function rememberEmail(email: string) {
  try {
    localStorage.setItem(STORAGE_KEY, email);
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

export function forgetEmail() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
