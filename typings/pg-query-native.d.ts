declare module "pg-query-native" {
  interface ParseResult {
    query: any;
    error: Error | null;
    stderr: string;
  }
  export function parse(sql: string): ParseResult;
}
