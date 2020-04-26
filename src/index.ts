import { parse as parseSQL, PGNode } from "pg-query-native-latest";
import { Doc, Parser, Plugin, Printer } from "prettier";
import { inspect } from "util";

import embed from "./embed";
import print from "./print";

const LOG_DOCUMENT = false;

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

const parse: Parser["parse"] = (text, _parsers, _options) => {
  const { query, error, stderr } = parseSQL(text);
  if (error) {
    throw error;
  }
  if (stderr.length) {
    throw new Error("Error occurred: " + stderr);
  }
  if (LOG_DOCUMENT) {
    console.log(inspect(query, { depth: 12 }));
  }
  const comments: (LineCommentNode | BlockCommentNode)[] = [];
  if (text.startsWith("-- Hello!")) {
    comments.push({
      LineComment: true,
      value: "-- Hello!",
      start: 0,
      end: 9,
    });
  }
  return {
    Document: {
      statements: query,
    },
    comments,
  };
};

const parser: Parser = {
  parse,
  // preprocess
  astFormat: "postgresql-ast",

  locStart: (node: PGNode | LineCommentNode | BlockCommentNode) => {
    if ("RawStmt" in node) {
      return node.RawStmt.stmt_location || 0;
    }
    if ("LineComment" in node || "BlockComment" in node) {
      return node.start;
    }
  },
  locEnd: (node: PGNode | LineCommentNode | BlockCommentNode) => {
    if ("RawStmt" in node) {
      return (node.RawStmt.stmt_location || 0) + node.RawStmt.stmt_len;
    }
    if ("LineComment" in node || "BlockComment" in node) {
      return node.end;
    }
  },
};

const printer: Printer = {
  print,
  embed,
  // hasPrettierIgnore: util.hasIgnoreComment,

  // Types are wrong?
  // https://github.com/prettier/prettier/blob/eca28c70c615c3f4aaf339fbb555ab33aae07307/src/language-graphql/printer-graphql.js#L656
  // @ts-expect-error
  printComment(commentPath): Doc {
    const comment = commentPath.getValue();
    if ("LineComment" in comment) {
      return comment.LineComment.value;
    }

    throw new Error("Not a comment: " + JSON.stringify(comment));
  },
  canAttachComment(node: any) {
    if (node.LineComment || node.BlockComment) {
      return false;
    }
    if (node.RawStmt) {
      return true;
    }
    return false;
  },
};

const plugin: Plugin = {
  languages: [
    {
      name: "postgresql",
      parsers: ["postgresql"],
    },
  ],
  parsers: {
    postgresql: parser,
  },
  printers: {
    "postgresql-ast": printer,
  },
};
const { languages, parsers, printers } = plugin;

export { languages, parsers, printers };
