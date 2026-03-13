// Central logger for the demo app; uses console in dev, can be extended for prod (e.g. remote logging).

const PREFIX = '[Sodax Demo]';

export const logger = {
  error(message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(`${PREFIX} ${message}`, error);
    } else {
      console.error(`${PREFIX} ${message}`);
    }
  },

  warn(message: string, error?: unknown): void {
    if (error !== undefined) {
      console.warn(`${PREFIX} ${message}`, error);
    } else {
      console.warn(`${PREFIX} ${message}`);
    }
  },
};
