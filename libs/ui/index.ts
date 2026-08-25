// Root barrel for the whole `@p4/ui` package — combines `components/`, `modules/`, `hooks/`, `helpers/`
// (each group manages its own exports, no overlap). `package.json` main/exports points here,
// not `components/index.ts` — the components barrel should only contain components, not
// double as the package's "borrowed" entrypoint.
export * from './components';
export * from './helpers';
export * from './hooks';
export * from './modules';
