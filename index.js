const { parse: parseSQL } = require("pg-query-native");
const {
  concat,
  join,
  hardline,
  line,
  softline,
  ifBreak,
  group,
  indent,
} = require("prettier").doc.builders;

const print = require("./print");

function unimp(o) {
  throw new Error("Unimplemented: \n" + JSON.stringify(o, null, 2));
}

function parse(text, _parsers, _options) {
  const { query, error, stderr } = parseSQL(text);
  if (error) {
    throw error;
  }
  if (stderr.length) {
    throw new Error("Error occurred: " + stderr);
  }
  return query;
}

function embed(path, print, textToDoc, options) {}

const languages = [
  {
    name: "postgresql",
    parsers: ["postgresql-sql"],
  },
];

const parsers = {
  "postgresql-sql": {
    parse,
    // preprocess
    astFormat: "postgresql-sql-ast",
  },
};

const printers = {
  "postgresql-sql-ast": {
    print,
    //embed,
  },
};

module.exports = {
  languages,
  parsers,
  printers,
};
