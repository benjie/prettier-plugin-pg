import { doc, Printer } from "prettier";

import { AnyNode, DocumentNode } from "./util";

const { concat, join, hardline, line, softline, group, indent } = doc.builders;
const commaLine = concat([",", line]);

// Quit whinging about these not being used.
softline;
indent;
commaLine;

const psqlPrint: Printer["print"] = (path, _options, print) => {
  const item: AnyNode = path.getValue();
  console.log("In psqlPrint:");
  console.dir(item);
  if (item == null) {
    return null;
  } else if ((item as any).type === "document") {
    const { statements } = item as DocumentNode;
    return statements.length
      ? join(
          hardline,
          path
            .map(print, "statements")
            .map((stmt) => group(concat([stmt, ";"]))),
        )
      : "";
  } else {
    console.dir(item);
    throw new Error(`Unsupported node ${JSON.stringify(item)}`);
  }
};

export default psqlPrint;
