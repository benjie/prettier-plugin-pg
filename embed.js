const { concat, softline, indent } = require("prettier").doc.builders;

function fallbackToSql() {
  console.warn("Could not determine type of function, falling back to SQL");
  return "sql";
}

module.exports = (path, print, textToDoc, options) => {
  const node = path.getValue();
  if (node.DefElem && node.DefElem.defname === "as") {
    // This might be the function body!
    console.log("Maybe...");
    const functionNode = path.getParentNode(1);
    if (functionNode.CreateFunctionStmt) {
      console.log("YES!");
      const languageOption = functionNode.CreateFunctionStmt.options.find(
        option =>
          option && option.DefElem && option.DefElem.defname === "language"
      );
      const language = languageOption
        ? languageOption.DefElem.arg.String.str
        : fallbackToSql();
      console.log(`YES! Language: ${language}`);
      const parser = {
        plv8: "js",
        plpython: "python",
        plpythonu: "python",
        sql: "postgresql-sql",
        plpgsql: "postgresql-sql", // TODO: add plpgsql specific parser
      }[language];
      if (parser) {
        const doc = textToDoc(node.DefElem.arg[0].String.str, {
          parser,
          __inPostgreSQLFunction: true,
        });
        return concat([indent(concat([softline, doc])), softline]);
      } else {
        console.warn(
          `Do not know how to parse functions of language '${language}'`
        );
      }
    }
  }
  return null;
};
