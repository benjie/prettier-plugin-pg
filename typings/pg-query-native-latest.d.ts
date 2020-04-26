/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/class-name-casing */
declare module "pg-query-native-latest" {
  export interface RawStmtDef {
    stmt: StmtNode;

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
  export type RawStmtNode = { RawStmt: RawStmtDef };
  export interface A_ExprDef {
    [key: string]: any /* TODO */;
  }
  export type A_ExprNode = { A_Expr: A_ExprDef };
  export interface AliasDef {
    [key: string]: any /* TODO */;
  }
  export type AliasNode = { Alias: AliasDef };
  export interface A_ArrayExprDef {
    [key: string]: any /* TODO */;
  }
  export type A_ArrayExprNode = { A_ArrayExpr: A_ArrayExprDef };
  export interface A_ConstDef {
    [key: string]: any /* TODO */;
  }
  export type A_ConstNode = { A_Const: A_ConstDef };
  export interface A_IndicesDef {
    [key: string]: any /* TODO */;
  }
  export type A_IndicesNode = { A_Indices: A_IndicesDef };
  export interface A_IndirectionDef {
    [key: string]: any /* TODO */;
  }
  export type A_IndirectionNode = { A_Indirection: A_IndirectionDef };
  export interface A_StarDef {
    [key: string]: any /* TODO */;
  }
  export type A_StarNode = { A_Star: A_StarDef };
  export interface BitStringDef {
    [key: string]: any /* TODO */;
  }
  export type BitStringNode = { BitString: BitStringDef };
  export interface BoolExprDef {
    [key: string]: any /* TODO */;
  }
  export type BoolExprNode = { BoolExpr: BoolExprDef };
  export interface BooleanTestDef {
    [key: string]: any /* TODO */;
  }
  export type BooleanTestNode = { BooleanTest: BooleanTestDef };
  export interface CaseExprDef {
    [key: string]: any /* TODO */;
  }
  export type CaseExprNode = { CaseExpr: CaseExprDef };
  export interface CoalesceExprDef {
    [key: string]: any /* TODO */;
  }
  export type CoalesceExprNode = { CoalesceExpr: CoalesceExprDef };
  export interface CollateClauseDef {
    [key: string]: any /* TODO */;
  }
  export type CollateClauseNode = { CollateClause: CollateClauseDef };
  export interface ColumnDefDef {
    [key: string]: any /* TODO */;
  }
  export type ColumnDefNode = { ColumnDef: ColumnDefDef };
  export interface ColumnRefDef {
    [key: string]: any /* TODO */;
  }
  export type ColumnRefNode = { ColumnRef: ColumnRefDef };
  export interface CommonTableExprDef {
    [key: string]: any /* TODO */;
  }
  export type CommonTableExprNode = { CommonTableExpr: CommonTableExprDef };
  export interface FloatDef {
    [key: string]: any /* TODO */;
  }
  export type FloatNode = { Float: FloatDef };
  export interface FuncCallDef {
    [key: string]: any /* TODO */;
  }
  export type FuncCallNode = { FuncCall: FuncCallDef };
  export interface GroupingFuncDef {
    [key: string]: any /* TODO */;
  }
  export type GroupingFuncNode = { GroupingFunc: GroupingFuncDef };
  export interface GroupingSetDef {
    [key: string]: any /* TODO */;
  }
  export type GroupingSetNode = { GroupingSet: GroupingSetDef };
  export interface IntegerDef {
    [key: string]: any /* TODO */;
  }
  export type IntegerNode = { Integer: IntegerDef };
  export interface IntoClauseDef {
    [key: string]: any /* TODO */;
  }
  export type IntoClauseNode = { IntoClause: IntoClauseDef };
  export interface JoinExprDef {
    [key: string]: any /* TODO */;
  }
  export type JoinExprNode = { JoinExpr: JoinExprDef };
  export interface LockingClauseDef {
    [key: string]: any /* TODO */;
  }
  export type LockingClauseNode = { LockingClause: LockingClauseDef };
  export interface MinMaxExprDef {
    [key: string]: any /* TODO */;
  }
  export type MinMaxExprNode = { MinMaxExpr: MinMaxExprDef };
  export interface NamedArgExprDef {
    [key: string]: any /* TODO */;
  }
  export type NamedArgExprNode = { NamedArgExpr: NamedArgExprDef };
  export interface NullDef {
    [key: string]: any /* TODO */;
  }
  export type NullNode = { Null: NullDef };
  export interface NullTestDef {
    [key: string]: any /* TODO */;
  }
  export type NullTestNode = { NullTest: NullTestDef };
  export interface ParamRefDef {
    [key: string]: any /* TODO */;
  }
  export type ParamRefNode = { ParamRef: ParamRefDef };
  export interface RangeFunctionDef {
    [key: string]: any /* TODO */;
  }
  export type RangeFunctionNode = { RangeFunction: RangeFunctionDef };
  export interface RangeSubselectDef {
    [key: string]: any /* TODO */;
  }
  export type RangeSubselectNode = { RangeSubselect: RangeSubselectDef };
  export interface RangeTableSampleDef {
    [key: string]: any /* TODO */;
  }
  export type RangeTableSampleNode = { RangeTableSample: RangeTableSampleDef };
  export interface RangeVarDef {
    [key: string]: any /* TODO */;
  }
  export type RangeVarNode = { RangeVar: RangeVarDef };
  export interface ResTargetDef {
    [key: string]: any /* TODO */;
  }
  export type ResTargetNode = { ResTarget: ResTargetDef };
  export interface RowExprDef {
    [key: string]: any /* TODO */;
  }
  export type RowExprNode = { RowExpr: RowExprDef };
  export interface SelectStmtDef {
    [key: string]: any /* TODO */;
  }
  export type SelectStmtNode = { SelectStmt: SelectStmtDef };
  export interface CreateStmtDef {
    [key: string]: any /* TODO */;
  }
  export type CreateStmtNode = { CreateStmt: CreateStmtDef };
  export interface ConstraintStmtDef {
    [key: string]: any /* TODO */;
  }
  export type ConstraintStmtNode = { ConstraintStmt: ConstraintStmtDef };
  export interface ReferenceConstraintDef {
    [key: string]: any /* TODO */;
  }
  export type ReferenceConstraintNode = {
    ReferenceConstraint: ReferenceConstraintDef;
  };
  export interface ExclusionConstraintDef {
    [key: string]: any /* TODO */;
  }
  export type ExclusionConstraintNode = {
    ExclusionConstraint: ExclusionConstraintDef;
  };
  export interface ConstraintDef {
    [key: string]: any /* TODO */;
  }
  export type ConstraintNode = { Constraint: ConstraintDef };
  export interface FunctionParameterDef {
    [key: string]: any /* TODO */;
  }
  export type FunctionParameterNode = {
    FunctionParameter: FunctionParameterDef;
  };
  export interface CreateFunctionStmtDef {
    [key: string]: any /* TODO */;
  }
  export type CreateFunctionStmtNode = {
    CreateFunctionStmt: CreateFunctionStmtDef;
  };
  export interface CreateSchemaStmtDef {
    [key: string]: any /* TODO */;
  }
  export type CreateSchemaStmtNode = { CreateSchemaStmt: CreateSchemaStmtDef };
  export interface TransactionStmtDef {
    [key: string]: any /* TODO */;
  }
  export type TransactionStmtNode = { TransactionStmt: TransactionStmtDef };
  export interface SortByDef {
    [key: string]: any /* TODO */;
  }
  export type SortByNode = { SortBy: SortByDef };
  export interface StringDef {
    [key: string]: any /* TODO */;
  }
  export type StringNode = { String: StringDef };
  export interface SubLinkDef {
    [key: string]: any /* TODO */;
  }
  export type SubLinkNode = { SubLink: SubLinkDef };
  export interface TypeCastDef {
    [key: string]: any /* TODO */;
  }
  export type TypeCastNode = { TypeCast: TypeCastDef };
  export interface TypeNameDef {
    [key: string]: any /* TODO */;
  }
  export type TypeNameNode = { TypeName: TypeNameDef };
  export interface CaseWhenDef {
    [key: string]: any /* TODO */;
  }
  export type CaseWhenNode = { CaseWhen: CaseWhenDef };
  export interface WindowDefDef {
    [key: string]: any /* TODO */;
  }
  export type WindowDefNode = { WindowDef: WindowDefDef };
  export interface WithClauseDef {
    [key: string]: any /* TODO */;
  }
  export type WithClauseNode = { WithClause: WithClauseDef };
  export interface DefElemDef {
    [key: string]: any /* TODO */;
  }
  export type DefElemNode = { DefElem: DefElemDef };

  export type ExprNode =
    | A_ExprNode
    | A_ArrayExprNode
    | BoolExprNode
    | CaseExprNode
    | CoalesceExprNode
    | CommonTableExprNode
    | JoinExprNode
    | MinMaxExprNode
    | NamedArgExprNode
    | RowExprNode;

  export type StmtNode =
    | RawStmtNode
    | SelectStmtNode
    | CreateStmtNode
    | ConstraintStmtNode
    | CreateFunctionStmtNode
    | CreateSchemaStmtNode
    | TransactionStmtNode;

  export type PGNode =
    | RawStmtNode
    | A_ExprNode
    | AliasNode
    | A_ArrayExprNode
    | A_ConstNode
    | A_IndicesNode
    | A_IndirectionNode
    | A_StarNode
    | BitStringNode
    | BoolExprNode
    | BooleanTestNode
    | CaseExprNode
    | CoalesceExprNode
    | CollateClauseNode
    | ColumnDefNode
    | ColumnRefNode
    | CommonTableExprNode
    | FloatNode
    | FuncCallNode
    | GroupingFuncNode
    | GroupingSetNode
    | IntegerNode
    | IntoClauseNode
    | JoinExprNode
    | LockingClauseNode
    | MinMaxExprNode
    | NamedArgExprNode
    | NullNode
    | NullTestNode
    | ParamRefNode
    | RangeFunctionNode
    | RangeSubselectNode
    | RangeTableSampleNode
    | RangeVarNode
    | ResTargetNode
    | RowExprNode
    | SelectStmtNode
    | CreateStmtNode
    | ConstraintStmtNode
    | ReferenceConstraintNode
    | ExclusionConstraintNode
    | ConstraintNode
    | FunctionParameterNode
    | CreateFunctionStmtNode
    | CreateSchemaStmtNode
    | TransactionStmtNode
    | SortByNode
    | StringNode
    | SubLinkNode
    | TypeCastNode
    | TypeNameNode
    | CaseWhenNode
    | WindowDefNode
    | WithClauseNode
    | DefElemNode
    | LineCommentNode
    | BlockCommentNode;

  /* Our custom comment types */
  export interface LineCommentDef {
    [key: string]: any /* TODO */;
  }
  export type LineCommentNode = {
    LineComment: LineCommentDef;
  };
  export interface BlockCommentDef {
    [key: string]: any /* TODO */;
  }
  export type BlockCommentNode = {
    LineComment: BlockCommentDef;
  };

  export interface ParseResult {
    query: {
      Document: {
        statements: RawStmtNode[];
      };
      comments: (LineCommentNode | BlockCommentNode)[];
    };
    error: Error | null;
    stderr: string;
  }

  export function parse(sql: string): ParseResult;
}
