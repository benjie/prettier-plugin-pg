const { parse: parseSQL } = require("pg-query-native");
const {
  concat,
  join,
  line,
  ifBreak,
  group,
  indent,
} = require("prettier").doc.builders;

const Deparser = require("./deparser");

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
  console.log(query);
  return query;
}

function print(path, options, print) {
  const n = path.getValue();
  if (Array.isArray(n)) {
    return join(line, path.map(print));
  }
  if (!n) {
    throw new Error("!n?!");
  }

  if (n.SelectStmt) {
    return concat([
      "SELECT",
      line,
      join(concat([",", line]), path.map(print, "SelectStmt", "targetList")),
      // TODO: all the other parts
      ";",
    ]);
  } else if (n.ResTarget) {
    const { val } = n.ResTarget;
    if (val) {
      const { A_Const } = val;
      if (A_Const) {
        const { val } = A_Const;
        if (val) {
          const { Integer } = val;
          if (Integer) {
            const { ival } = Integer;
            return String(ival);
          }
        }
      }
    }
    unimp(n);
  } else {
    //unimp(n);
    return new Deparser().deparse(n);
  }

  console.log(n);
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
