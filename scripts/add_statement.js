#!/usr/bin/env node
const fs = require("fs");

const arg = process.argv[2];

if (!arg.match(/^[A-Z][a-zA-Z]+Stmt$/)) {
  throw new Error("Invalid statement? Expected FooStmt or similar");
}

fs.mkdirSync(`${__dirname}/../tests/${arg}`);
fs.writeFileSync(
  `${__dirname}/../tests/${arg}/jsfmt.spec.js`,
  `run_spec(__dirname, ["postgresql"]);\n`
);
