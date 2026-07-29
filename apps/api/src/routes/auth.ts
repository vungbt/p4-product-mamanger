import type { LoginResponse } from '@p4/shared';
import { Router } from 'express';
import { sessions } from '../data/store.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { authRequired, issueToken, validateCredentials } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  const user = validateCredentials(String(email), String(password));
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = issueToken(user.id);
  const body: LoginResponse = { token, user };
  return res.json(body);
});

router.get('/me', authRequired, (req: AuthedRequest, res) => {
  return res.json({ user: req.user });
});

router.post('/logout', authRequired, (req: AuthedRequest, res) => {
  const header = req.headers.authorization;
  const token = header?.slice(7);
  if (token) sessions.delete(token);
  return res.json({ ok: true });
});

export default router;
