/**
 * Application configuration.
 *
 * The value that matters here is `dataSource`. Flipping it to `'http'` swaps
 * every read and write in the app over to the Dockerised API in `server/`
 * without touching a single component, store or domain file — that is the
 * whole point of the repository port.
 */
export type DataSource = 'local' | 'http';

const readEnv = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' ? process.env?.[key] : undefined;
  } catch {
    return undefined;
  }
};

const parseDataSource = (value: string | undefined): DataSource =>
  value === 'http' ? 'http' : 'local';

export interface AppConfig {
  readonly dataSource: DataSource;
  readonly apiBaseUrl: string;
  readonly storageNamespace: string;
}

export const appConfig: AppConfig = {
  dataSource: parseDataSource(readEnv('TASKBOARD_DATA_SOURCE')),
  apiBaseUrl: readEnv('TASKBOARD_API_URL') ?? 'http://localhost:4000',
  storageNamespace: 'taskboard',
};
