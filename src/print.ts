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
  const item: PGNodeMarked | DocumentNode = path.getValue();
  console.log("In psqlPrint:");
  console.dir(item);
  if (item == null) {
    throw new Error("psqlPrint was passed a null item");
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
        if (item.kind === "array") {
          return concat([path.call(print, "arrayOf"), "[]"]);
        } else {
          return item.name;
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
