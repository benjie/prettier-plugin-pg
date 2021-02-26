import { LOCATION, parseWithComments as parseSQL } from "pgsql-ast-parser";
import { Doc, FastPath, Parser, Plugin, Printer } from "prettier";
import { inspect } from "util";

import embed from "./embed";
import print from "./print";
import { AnyNode, DocumentNode } from "./util";

const LOG_DOCUMENT = false;

const parse: Parser["parse"] = (text, _parsers, _options): DocumentNode => {
  const { comments, ast } = parseSQL(text, { locationTracking: true });
  if (LOG_DOCUMENT) {
    console.log(inspect(ast, { depth: 12 }));
  }
  return {
    type: "document",
    comments,
    statements: ast,
    [LOCATION]: {
      start: 0,
      end: text.length,
    },
  };
};

const parser: Parser = {
  parse,
  // preprocess
  astFormat: "postgresql-ast",

  locStart: (node: AnyNode): number | null => {
    return node[LOCATION].start;
  },
  locEnd: (node: AnyNode): number | null => {
    return node[LOCATION].end;
  },
};

function clean(node, newNode /* , parent*/) {
  delete newNode.comments;
}

const printer: Printer = {
  print,
  massageAstNode: clean,
  embed,
  // hasPrettierIgnore: util.hasIgnoreComment,

  printComment(commentPath: FastPath<any>): Doc {
    const comment = commentPath.getValue();
    if (typeof comment.comment === "string") {
      return comment.comment;
    }
    throw new Error("Not a comment: " + JSON.stringify(comment));
  },
  canAttachComment(node: any) {
    if (typeof node.comment === "string" && node.type !== "comment") {
      return false;
    }
    if (node[LOCATION].start) {
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
