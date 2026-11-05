import { BaseError } from '@/utils/errors/base-error.js';
import { type LifecycleStates, TRANSITIONS } from './contracts.js';

export function canTransition<Kind extends keyof LifecycleStates>(
  kind: Kind,
  from: LifecycleStates[Kind],
  to: LifecycleStates[Kind],
) {
  const graph: Record<LifecycleStates[Kind], readonly LifecycleStates[Kind][]> = TRANSITIONS[kind];
  return graph[from].includes(to);
}

export function assertTransition<Kind extends keyof LifecycleStates>(
  kind: Kind,
  from: LifecycleStates[Kind],
  to: LifecycleStates[Kind],
) {
  if (!canTransition(kind, from, to)) {
    throw new BaseError('invalid_state_transition', 409, 'invalid_state_transition', {
      resource: kind,
      from,
      to,
    });
  }
}

export function assertVersion(actual: number, expected: number) {
  if (actual !== expected)
    throw new BaseError('version_conflict', 409, 'version_conflict', {
      expectedVersion: expected,
      actualVersion: actual,
    });
}
