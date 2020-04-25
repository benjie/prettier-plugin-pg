declare module "pg-query-native" {
  export interface ParseResult {
    query: any;
    error: Error | null;
    stderr: string;
  }
  export function parse(sql: string): ParseResult;
}
