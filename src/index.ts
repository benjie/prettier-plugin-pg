import { parse as parseSQL, PGNode } from "pg-query-native-latest";
import { Doc, Parser, Plugin, Printer } from "prettier";
import { inspect } from "util";

import { scanComments } from "./comments";
import embed from "./embed";
import print from "./print";
import {
  AnyNode,
  BlockCommentNode,
  DocumentNode,
  getNodeKey,
  isNodeKey,
  LineCommentNode,
} from "./util";

const LOG_DOCUMENT = false;

function scan(
  thing: any,
  parentNode: AnyNode | null,
  commentLocations: Array<[number, number]>,
  nodes: AnyNode[],
) {
  if (Array.isArray(thing)) {
    thing.map((subthing) =>
      scan(subthing, parentNode, commentLocations, nodes),
    );
  } else if (typeof thing === "object" && thing) {
    const nodeKeys = Object.keys(thing).filter(isNodeKey);
    if (nodeKeys.length === 1) {
      const node: PGNode = thing;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      fixNode(node, parentNode, commentLocations, nodes);
    } else {
      for (const key in thing) {
        scan(thing[key], parentNode, commentLocations, nodes);
      }
    }
  } else {
    /* scop scanning here - scalar, etc */
  }
}

function fixNode(
  node: AnyNode,
  parentNode: AnyNode | null,
  commentLocations: Array<[number, number]>,
  nodes: AnyNode[],
): void {
  nodes.push(node);
  const nodeKey = getNodeKey(node);
  const inner = node[nodeKey];

  if (typeof node.start === "number") {
    /* already done */
  } else if (typeof inner.stmt_len === "number") {
    node.start = inner.stmt_location || 0;
    node.end = node.start + inner.stmt_len;
  } else if (typeof inner.location === "number") {
    node.start = inner.location;
    // TODO: node.end
  } else {
    throw new Error(
      `Node doesn't have location: ${inspect(node, {
        depth: 5,
      })} (parent node: ${inspect(parentNode, { depth: 2 })})`,
    );
  }

  // Special case: for these node types; the child must consume the entire
  // RawStmt space.
  if (nodeKey === "RawStmt") {
    const child = inner.stmt;
    child.start = node.start;
    child.end = node.end;
  } else if (nodeKey === "A_Const") {
    const child = inner.val;
    child.start = node.start;
    child.end = node.end;
  }

  for (const key in inner) {
    scan(inner[key], node, commentLocations, nodes);
  }
}

function fixLocations(doc: DocumentNode): DocumentNode {
  const { comments } = doc;
  const commentLocations = comments
    .map((c): [number, number] => [c.start, c.end])
    .sort((a, b) => a[0] - b[0]);
  const nodes: AnyNode[] = [];
  // Fixes the 'start' position of all nodes, and collects the list of nodes
  // into `nodes`.
  fixNode(doc, null, commentLocations, nodes);

  // Now to fix the `end` position of these nodes!
  nodes.sort((a, b) => a.start - b.start);

  return doc;
}

const parse: Parser["parse"] = (text, _parsers, _options): DocumentNode => {
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
  const comments = scanComments(text);
  return fixLocations({
    Document: {
      statements: query,
      doc_location: 0,
      doc_len: text.length,
    },
    comments,

    start: 0,
    end: text.length,
  });
};

const parser: Parser = {
  parse,
  // preprocess
  astFormat: "postgresql-ast",

  locStart: (node: AnyNode): number | null => {
    return node.start;
  },
  locEnd: (node: AnyNode): number | null => {
    return node.end;
  },
};

function clean(node, newNode /*, parent*/) {
  delete newNode.comments;
}

const printer: Printer = {
  print,
  massageAstNode: clean,
  embed,
  // hasPrettierIgnore: util.hasIgnoreComment,

  // Types are wrong?
  // https://github.com/prettier/prettier/blob/eca28c70c615c3f4aaf339fbb555ab33aae07307/src/language-graphql/printer-graphql.js#L656
  // @ts-expect-error
  printComment(commentPath): Doc {
    const comment = commentPath.getValue();
    if ("LineComment" in comment) {
      console.log("LineComment print");
      return comment.LineComment.value;
    }

    throw new Error("Not a comment: " + JSON.stringify(comment));
  },
  canAttachComment(node: any) {
    if (node.LineComment || node.BlockComment) {
      return false;
    }
    if (node.start) {
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
