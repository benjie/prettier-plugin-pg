export interface TransactionStmt {
  kind: 0 | 2;
  options: {
    transaction_isolation;
    transaction_read_only;
    transaction_deferrable;
  };
}
