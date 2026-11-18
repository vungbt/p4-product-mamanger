type LogFn = (...args: unknown[]) => void;

function createLogger() {
  const prefix = (level: string) => `[${level}]`;

  const info: LogFn = (...args) => console.log(prefix('info'), ...args);
  const warn: LogFn = (...args) => console.warn(prefix('warn'), ...args);
  const error: LogFn = (...args) => console.error(prefix('error'), ...args);
  const debug: LogFn = (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(prefix('debug'), ...args);
    }
  };

  return { info, warn, error, debug };
}

export const logger = createLogger();
