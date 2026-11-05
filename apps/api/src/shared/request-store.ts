import { AsyncLocalStorage } from 'node:async_hooks';
import type { User } from '@p4/shared';

export const requestStore = new AsyncLocalStorage<{ requestId: string; user?: User }>();
