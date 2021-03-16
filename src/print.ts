import { DataTypeDef } from "pgsql-ast-parser";
import { doc, Printer } from "prettier";

import { Marked, PGNodeMarked } from ".";
import { AnyNode, DocumentNode } from "./util";

const { concat, join, hardline, line, softline, group, indent } = doc.builders;
const commaLine = concat([",", line]);

// Quit whinging about these not being used.
softline;
indent;
commaLine;

const psqlPrint: Printer["print"] = (path, _options, print) => {
  const item: Marked | DocumentNode = path.getValue();
  console.log("In psqlPrint:");
  console.dir(item);
  if (item == null) {
    return null;
  } else if (item._type === "document") {
    const { statements } = item;
    return statements.length
      ? join(
          hardline,
          path
            .map(print, "statements")
            .map((stmt) => group(concat([stmt, ";"]))),
        )
      : "";
  } else {
    switch (item._type) {
      case "dataType": {
        const dataType: DataTypeDef = item;
        if (dataType.kind === "array") {
          return print(dataType.arrayOf) + "[]";
        } else {
          return dataType.name;
        }
      }
      default: {
        console.dir(item);
        throw new Error(`Unsupported node ${JSON.stringify(item)}`);
      }
    }
  }
};

export default psqlPrint;
