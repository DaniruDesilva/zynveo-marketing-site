declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }
  export const Pool: any;
  export type Pool = any;
  export const Client: any;
  export type Client = any;
  export type QueryResult<R = any> = any;
}
