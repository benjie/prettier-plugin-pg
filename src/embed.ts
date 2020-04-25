import * as prettier from "prettier";
const { group, concat, hardline, indent } = prettier.doc.builders;

function fallbackToSql() {
  console.warn("Could not determine type of function, falling back to SQL");
  return "sql";
}

function tidyLanguage(code: string, language: string) {
  if (["plv8", "sql", "plpgsql"].indexOf(language) >= 0) {
    return code.trim();
  }
  return code;
}

export default (path, print, textToDoc, _options) => {
  const node = path.getValue();
  if (node.DefElem && node.DefElem.defname === "as") {
    // This might be the function body!
    const functionNode = path.getParentNode(1);
    if (functionNode.CreateFunctionStmt) {
      const languageOption = functionNode.CreateFunctionStmt.options.find(
        (option) =>
          option && option.DefElem && option.DefElem.defname === "language",
      );
      const language = languageOption
        ? languageOption.DefElem.arg.String.str
        : fallbackToSql();
      const parser = {
        plv8: "babylon",
        plpython: "python",
        plpythonu: "python",
        sql: "postgresql",
        plpgsql: "postgresql", // TODO: add plpgsql specific parser
      }[language];
      if (parser) {
        const code = tidyLanguage(node.DefElem.arg[0].String.str, language);
        const doc = textToDoc(code, {
          parser,
          //__inPostgreSQLFunction: true,
        });
        return concat([indent(concat([hardline, group(doc)])), hardline]);
      } else {
        console.warn(
          `Do not know how to parse functions of language '${language}'`,
        );
      }
    }
  }
  return null;
};
