import { parse as parseSQL } from "pg-query-native";
import { Parser, Plugin, Printer } from "prettier";

import embed from "./embed";
import print from "./print";

const parse: Parser["parse"] = (text, _parsers, _options) => {
  const { query, error, stderr } = parseSQL(text);
  if (error) {
    throw error;
  }
  if (stderr.length) {
    throw new Error("Error occurred: " + stderr);
  }
  return query;
};

const parser: Parser = {
  parse,
  // preprocess
  astFormat: "postgresql-ast",

  //TODO
  locStart: (_node) => 0,
  locEnd: (_node) => 0,
};

const printer: Printer = {
  print,
  embed,
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
