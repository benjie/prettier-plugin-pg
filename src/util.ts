import * as assert from "assert";
import { PGNode, StmtNode } from "pg-query-native-latest";

/* Our custom comment types */
export type LineCommentNode = {
  LineComment: true; // To make it semi-compatible with our pg-query-native-latest nodes

  // Prettier requires this is on the comment directly
  value: string;
  start: number;
  end: number;
};

export interface BlockCommentNode {
  BlockComment: true; // To make it semi-compatible with our pg-query-native-latest nodes

  // Prettier requires this is on the comment directly
  value: string;
  start: number;
  end: number;
}

export interface DocumentNode {
  Document: {
    statements: StmtNode[];
    doc_location: number;
    doc_len: number;
  };
  comments: (LineCommentNode | BlockCommentNode)[];

  start: number;
  end: number;
}

export type AnyNode =
  | PGNode
  | LineCommentNode
  | BlockCommentNode
  | DocumentNode;

export const isNodeKey = (k: string) => /^[A-Z]/.test(k[0]);

/**
 * AST nodes in Postgres follow the form `{Key: {...}}`, where Key is a string
 * beginning with a capital letter. This function returns said key, ignoring
 * any other lower case keys such as `comments`, `start`, `end`, etc.
 *
 * @param node
 */
export function getNodeKey(node: AnyNode): string {
  const nodeKeys = Object.keys(node).filter(isNodeKey);
  assert.equal(nodeKeys.length, 1, "Expected node to be a Node");
  return nodeKeys[0];
}
