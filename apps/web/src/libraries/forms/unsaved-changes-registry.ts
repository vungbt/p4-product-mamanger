type Guard = { dirty: boolean; bypass: boolean };

/** Shared policy for router navigation and browser reload/close. */
export function createUnsavedChangesRegistry() {
  const guards = new Set<Guard>();

  const isDirty = () => [...guards].some((guard) => guard.dirty && !guard.bypass);

  return {
    isDirty,
    register: (guard: Guard) => {
      guards.add(guard);

      return () => {
        guards.delete(guard);
      };
    },
    beforeUnload: (event: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      event.preventDefault();
      event.returnValue = '';
    },
  };
}
