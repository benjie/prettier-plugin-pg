export interface TransactionStmt {
  kind: 0 | 2;
  options: {
    transaction_isolation: any;
    transaction_read_only: any;
    transaction_deferrable: any;
  };
}
