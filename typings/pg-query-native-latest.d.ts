declare module "pg-query-native-latest" {
  type SelectStmtNode = any;
  type CreateFunctionStmtNode = any;
  type SomeStmtNode = SelectStmtNode | CreateFunctionStmtNode | any;
  interface RawStmtNode {
    RawStmt: RawStmt;
  }
  interface RawStmt {
    stmt: SomeStmtNode;

    /**
     * If not present, assume zero.
     */
    stmt_location?: number;

    /**
     * The distance between the end of the previous statement and the end of the
     * semicolon for this statement (I think).
     */
    stmt_len: number;
  }
  export interface ParseResult {
    query: RawStmt[];
    error: Error | null;
    stderr: string;
  }
  export function parse(sql: string): ParseResult;
}
