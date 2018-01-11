const { parse: parseSQL } = require("pg-query-native");
const { concat, join, line, ifBreak, group } = require("prettier").doc.builders;

function parse(text, parsers, options) {
  const { query, stderr } = parseSQL(text);
  console.log(query);
  return query;
}

function print(path, options, print) {
  return concat([]);
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
