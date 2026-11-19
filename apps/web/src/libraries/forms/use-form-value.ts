import { useCallback, useSyncExternalStore } from 'react';

type FormStore<State> = {
  store: {
    readonly state: State;
    subscribe: (listener: (value: State) => void) => { unsubscribe: () => void };
  };
};

/**
 * Selects a value from a `useAppForm` form state and re-renders when it changes (the kit's form
 * does not expose TanStack's `useStore`). Return primitives or stable references from `select`.
 */
export function useFormValue<State, Selected>(
  form: FormStore<State>,
  select: (state: State) => Selected,
): Selected {
  const { store } = form;

  const subscribe = useCallback(
    (notify: () => void) => {
      const subscription = store.subscribe(() => notify());

      return () => subscription.unsubscribe();
    },
    [store],
  );

  return useSyncExternalStore(subscribe, () => select(store.state));
}
