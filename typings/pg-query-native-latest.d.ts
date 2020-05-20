/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/class-name-casing */
declare module "pg-query-native-latest" {
  type NodeLocation = { start: number; end: number };
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
  export type RawStmtNode = { RawStmt: RawStmtDef } & NodeLocation;
  export interface A_ExprDef {
    [key: string]: any /* TODO */;
  }
  export type A_ExprNode = { A_Expr: A_ExprDef } & NodeLocation;
  export interface AliasDef {
    [key: string]: any /* TODO */;
  }
  export type AliasNode = { Alias: AliasDef } & NodeLocation;
  export interface A_ArrayExprDef {
    [key: string]: any /* TODO */;
  }
  export type A_ArrayExprNode = { A_ArrayExpr: A_ArrayExprDef } & NodeLocation;
  export interface A_ConstDef {
    [key: string]: any /* TODO */;
  }
  export type A_ConstNode = { A_Const: A_ConstDef } & NodeLocation;
  export interface A_IndicesDef {
    [key: string]: any /* TODO */;
  }
  export type A_IndicesNode = { A_Indices: A_IndicesDef } & NodeLocation;
  export interface A_IndirectionDef {
    [key: string]: any /* TODO */;
  }
  export type A_IndirectionNode = {
    A_Indirection: A_IndirectionDef;
  } & NodeLocation;
  export interface A_StarDef {
    [key: string]: any /* TODO */;
  }
  export type A_StarNode = { A_Star: A_StarDef } & NodeLocation;
  export interface BitStringDef {
    [key: string]: any /* TODO */;
  }
  export type BitStringNode = { BitString: BitStringDef } & NodeLocation;
  export interface BoolExprDef {
    [key: string]: any /* TODO */;
  }
  export type BoolExprNode = { BoolExpr: BoolExprDef } & NodeLocation;
  export interface BooleanTestDef {
    [key: string]: any /* TODO */;
  }
  export type BooleanTestNode = { BooleanTest: BooleanTestDef } & NodeLocation;
  export interface CaseExprDef {
    [key: string]: any /* TODO */;
  }
  export type CaseExprNode = { CaseExpr: CaseExprDef } & NodeLocation;
  export interface CoalesceExprDef {
    [key: string]: any /* TODO */;
  }
  export type CoalesceExprNode = {
    CoalesceExpr: CoalesceExprDef;
  } & NodeLocation;
  export interface CollateClauseDef {
    [key: string]: any /* TODO */;
  }
  export type CollateClauseNode = {
    CollateClause: CollateClauseDef;
  } & NodeLocation;
  export interface ColumnDefDef {
    [key: string]: any /* TODO */;
  }
  export type ColumnDefNode = { ColumnDef: ColumnDefDef } & NodeLocation;
  export interface ColumnRefDef {
    [key: string]: any /* TODO */;
  }
  export type ColumnRefNode = { ColumnRef: ColumnRefDef } & NodeLocation;
  export interface CommonTableExprDef {
    [key: string]: any /* TODO */;
  }
  export type CommonTableExprNode = {
    CommonTableExpr: CommonTableExprDef;
  } & NodeLocation;
  export interface FloatDef {
    [key: string]: any /* TODO */;
  }
  export type FloatNode = { Float: FloatDef } & NodeLocation;
  export interface FuncCallDef {
    [key: string]: any /* TODO */;
  }
  export type FuncCallNode = { FuncCall: FuncCallDef } & NodeLocation;
  export interface GroupingFuncDef {
    [key: string]: any /* TODO */;
  }
  export type GroupingFuncNode = {
    GroupingFunc: GroupingFuncDef;
  } & NodeLocation;
  export interface GroupingSetDef {
    [key: string]: any /* TODO */;
  }
  export type GroupingSetNode = { GroupingSet: GroupingSetDef } & NodeLocation;
  export interface IntegerDef {
    [key: string]: any /* TODO */;
  }
  export type IntegerNode = { Integer: IntegerDef } & NodeLocation;
  export interface IntoClauseDef {
    [key: string]: any /* TODO */;
  }
  export type IntoClauseNode = { IntoClause: IntoClauseDef } & NodeLocation;
  export interface JoinExprDef {
    [key: string]: any /* TODO */;
  }
  export type JoinExprNode = { JoinExpr: JoinExprDef } & NodeLocation;
  export interface LockingClauseDef {
    [key: string]: any /* TODO */;
  }
  export type LockingClauseNode = {
    LockingClause: LockingClauseDef;
  } & NodeLocation;
  export interface MinMaxExprDef {
    [key: string]: any /* TODO */;
  }
  export type MinMaxExprNode = { MinMaxExpr: MinMaxExprDef } & NodeLocation;
  export interface NamedArgExprDef {
    [key: string]: any /* TODO */;
  }
  export type NamedArgExprNode = {
    NamedArgExpr: NamedArgExprDef;
  } & NodeLocation;
  export interface NullDef {
    [key: string]: any /* TODO */;
  }
  export type NullNode = { Null: NullDef } & NodeLocation;
  export interface NullTestDef {
    [key: string]: any /* TODO */;
  }
  export type NullTestNode = { NullTest: NullTestDef } & NodeLocation;
  export interface ParamRefDef {
    [key: string]: any /* TODO */;
  }
  export type ParamRefNode = { ParamRef: ParamRefDef } & NodeLocation;
  export interface RangeFunctionDef {
    [key: string]: any /* TODO */;
  }
  export type RangeFunctionNode = {
    RangeFunction: RangeFunctionDef;
  } & NodeLocation;
  export interface RangeSubselectDef {
    [key: string]: any /* TODO */;
  }
  export type RangeSubselectNode = {
    RangeSubselect: RangeSubselectDef;
  } & NodeLocation;
  export interface RangeTableSampleDef {
    [key: string]: any /* TODO */;
  }
  export type RangeTableSampleNode = {
    RangeTableSample: RangeTableSampleDef;
  } & NodeLocation;
  export interface RangeVarDef {
    [key: string]: any /* TODO */;
  }
  export type RangeVarNode = { RangeVar: RangeVarDef } & NodeLocation;
  export interface ResTargetDef {
    [key: string]: any /* TODO */;
  }
  export type ResTargetNode = { ResTarget: ResTargetDef } & NodeLocation;
  export interface RowExprDef {
    [key: string]: any /* TODO */;
  }
  export type RowExprNode = { RowExpr: RowExprDef } & NodeLocation;
  export interface SelectStmtDef {
    [key: string]: any /* TODO */;
  }
  export type SelectStmtNode = { SelectStmt: SelectStmtDef } & NodeLocation;
  export interface CreateStmtDef {
    [key: string]: any /* TODO */;
  }
  export type CreateStmtNode = { CreateStmt: CreateStmtDef } & NodeLocation;
  export interface ConstraintStmtDef {
    [key: string]: any /* TODO */;
  }
  export type ConstraintStmtNode = {
    ConstraintStmt: ConstraintStmtDef;
  } & NodeLocation;
  export interface ReferenceConstraintDef {
    [key: string]: any /* TODO */;
  }
  export type ReferenceConstraintNode = {
    ReferenceConstraint: ReferenceConstraintDef;
  } & NodeLocation;
  export interface ExclusionConstraintDef {
    [key: string]: any /* TODO */;
  }
  export type ExclusionConstraintNode = {
    ExclusionConstraint: ExclusionConstraintDef;
  } & NodeLocation;
  export interface ConstraintDef {
    [key: string]: any /* TODO */;
  }
  export type ConstraintNode = { Constraint: ConstraintDef } & NodeLocation;
  export interface FunctionParameterDef {
    [key: string]: any /* TODO */;
  }
  export type FunctionParameterNode = {
    FunctionParameter: FunctionParameterDef;
  } & NodeLocation;
  export interface CreateFunctionStmtDef {
    [key: string]: any /* TODO */;
  }
  export type CreateFunctionStmtNode = {
    CreateFunctionStmt: CreateFunctionStmtDef;
  } & NodeLocation;
  export interface CreateSchemaStmtDef {
    [key: string]: any /* TODO */;
  }
  export type CreateSchemaStmtNode = {
    CreateSchemaStmt: CreateSchemaStmtDef;
  } & NodeLocation;
  export interface TransactionStmtDef {
    [key: string]: any /* TODO */;
  }
  export type TransactionStmtNode = {
    TransactionStmt: TransactionStmtDef;
  } & NodeLocation;
  export interface SortByDef {
    [key: string]: any /* TODO */;
  }
  export type SortByNode = { SortBy: SortByDef } & NodeLocation;
  export interface StringDef {
    [key: string]: any /* TODO */;
  }
  export type StringNode = { String: StringDef } & NodeLocation;
  export interface SubLinkDef {
    [key: string]: any /* TODO */;
  }
  export type SubLinkNode = { SubLink: SubLinkDef } & NodeLocation;
  export interface TypeCastDef {
    [key: string]: any /* TODO */;
  }
  export type TypeCastNode = { TypeCast: TypeCastDef } & NodeLocation;
  export interface TypeNameDef {
    [key: string]: any /* TODO */;
  }
  export type TypeNameNode = { TypeName: TypeNameDef } & NodeLocation;
  export interface CaseWhenDef {
    [key: string]: any /* TODO */;
  }
  export type CaseWhenNode = { CaseWhen: CaseWhenDef } & NodeLocation;
  export interface WindowDefDef {
    [key: string]: any /* TODO */;
  }
  export type WindowDefNode = { WindowDef: WindowDefDef } & NodeLocation;
  export interface WithClauseDef {
    [key: string]: any /* TODO */;
  }
  export type WithClauseNode = { WithClause: WithClauseDef } & NodeLocation;
  export interface DefElemDef {
    [key: string]: any /* TODO */;
  }
  export type DefElemNode = { DefElem: DefElemDef } & NodeLocation;

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
    | DefElemNode;

  export interface ParseResult {
    query: RawStmtNode[];
    error: Error | null;
    stderr: string;
  }

  export function parse(sql: string): ParseResult;
}
