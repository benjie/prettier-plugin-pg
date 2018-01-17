#!/usr/bin/env node
const fs = require("fs");

const arg = (process.argv[2] || "").replace(/ /g, "_");

if (process.argv[3]) {
  throw new Error("Expected one argument only");
}

if (!arg.match(/^[A-Z_]+$/)) {
  throw new Error("Invalid statement? Expected 'CREATE FUNCTION' or similar");
}

fs.mkdirSync(`${__dirname}/../tests/${arg}`);
fs.writeFileSync(
  `${__dirname}/../tests/${arg}/jsfmt.spec.js`,
  `run_spec(__dirname, ["postgresql"]);\n`
);
