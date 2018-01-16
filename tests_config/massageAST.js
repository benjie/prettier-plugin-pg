// From https://github.com/prettier/prettier/blob/cf511ec2e973ed6d794c5b99321f2b3a3458a919/src/common/clean-ast.js
module.exports = function massageAST(ast, options, parent) {
  if (Array.isArray(ast)) {
    return ast.map(e => massageAST(e, options, parent)).filter(e => e);
  }

  if (!ast || typeof ast !== "object") {
    return ast;
  }

  const newObj = {};
  for (const key in ast) {
    if (typeof ast[key] !== "function") {
      newObj[key] = massageAST(ast[key], options, ast);
    }
  }

  [
    "loc",
    "range",
    "raw",
    "comments",
    "leadingComments",
    "trailingComments",
    "extra",
    "start",
    "end",
    "tokens",
    "flags",
    "raws",
    "sourceIndex",
    "id",
    "source",
    "before",
    "after",
    "trailingComma",
    "parent",
    "prev",
    "position",
  ].forEach(name => {
    delete newObj[name];
  });

  if (options.printer.massageAstNode) {
    const result = options.printer.massageAstNode(ast, newObj, parent);
    if (result === null) {
      return undefined;
    }
    if (result) {
      return result;
    }
  }

  return newObj;
};
