import {
  LOCATION,
  PGComment,
  PGNode,
  Statement,
  StatementLocation,
} from "pgsql-ast-parser";

import RESERVED_WORDS from "./reservedWords";

export interface DocumentNode {
  _type: "document";
  comments: PGComment[];
  statements: Statement[];
  [LOCATION]: StatementLocation;
}

export type AnyNode = PGNode | PGComment | DocumentNode;

export function isReserved(identString: string) {
  return RESERVED_WORDS.indexOf(identString) >= 0;
}

export function quoteIdent(value: string[] | string | null) {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((o) => quoteIdent(o));
  }

  if (value.match(/^[a-z_][a-z0-9_]*$/) && !isReserved(value)) {
    return value;
  }

  return '"' + value + '"';
}

export function getFunctionBodyEscapeSequence(text: string): string {
  for (let i = 0; i < 1000; i++) {
    const escape = `$${i === 1 ? "_" : i ? i : ""}$`;
    if (text.indexOf(escape) < 0) {
      return escape;
    }
  }
  throw new Error("Could not find an acceptable function escape sequence");
}
