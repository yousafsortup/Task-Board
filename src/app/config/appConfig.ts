/**
 * Application configuration.
 *
 * The value that matters is `dataSource`. Setting it to `'http'` swaps every
 * read and write in the app over to the API in `server/` without touching a
 * single component, store or domain file — that is what the repository port
 * is for.
 *
 *   TASKBOARD_DATA_SOURCE=http npm run desktop
 *   TASKBOARD_DATA_SOURCE=http npm run ios
 *
 * The reads below are deliberately *static* member accesses: that is the only
 * form Babel's inline-env plugin (Metro) and Vite's `define` (desktop) can
 * both substitute at build time.
 */
export type DataSource = 'local' | 'http';

const env = (() => {
  try {
    return {
      dataSource: process.env.TASKBOARD_DATA_SOURCE,
      apiBaseUrl: process.env.TASKBOARD_API_URL,
    };
  } catch {
    return { dataSource: undefined, apiBaseUrl: undefined };
  }
})();

export interface AppConfig {
  readonly dataSource: DataSource;
  readonly apiBaseUrl: string;
  readonly storageNamespace: string;
}

export const appConfig: AppConfig = {
  dataSource: env.dataSource === 'http' ? 'http' : 'local',
  apiBaseUrl: env.apiBaseUrl ?? 'http://localhost:4000',
  storageNamespace: 'taskboard',
};
