export const Logger = {
  debug: (...args: any[]) => {
    // Vite uses import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env && !import.meta.env.PROD) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  }
};
