import { CreateFunctionStatement, ReturnsTable } from "pgsql-ast-parser";
import { Doc, doc, FastPath, Options, ParserOptions, Printer } from "prettier";
import { inspect } from "util";

import { PGNodeMarked } from ".";
import { getFunctionBodyEscapeSequence, quoteIdent } from "./util";

const { concat, join, hardline, line, softline, group, indent } = doc.builders;

function tidyLanguage(code: string, language: string | undefined) {
  if (language != null && ["plv8", "sql", "plpgsql"].indexOf(language) >= 0) {
    return code.trim();
  }
  return code;
}

const embedCreateFunctionStatement = (
  path: FastPath<CreateFunctionStatement>,
  print: (path: FastPath<any>) => Doc,
  textToDoc: (text: string, options: Options) => Doc,
  _options: ParserOptions,
) => {
  const node: CreateFunctionStatement = path.getValue();
  const parser = {
    plv8: "babel",
    plpython: "python",
    plpythonu: "python",
    sql: "postgresql",
    plpgsql: "postgresql", // TODO: add plpgsql specific parser
    plruby: "ruby",
  }[node.language?.name ?? "sql"];
  // TODO: we need to do this on the result body, not the source body, in case it's been modified.
  const functionEscape = getFunctionBodyEscapeSequence(node.code);
  const args = concat([
    "(",
    group(
      join(
        ",",
        node.arguments
          ? node.arguments
              .map((_param, index) => {
                return path.call(print, "arguments", index);
              })
              .filter((_) => _)
          : [],
      ),
    ),
    ")",
  ]);
  const createFunctionFooDoc = group(
    concat([
      "CREATE ",
      node.orReplace ? "OR REPLACE " : "",
      "FUNCTION ",
      join(
        ".",
        quoteIdent([
          ...(node.name.schema ? [node.name.schema] : []),
          node.name.name,
        ]),
      ),
      softline,
      args,
    ]),
  );
  let returnStuff: null | Doc = null;
  if (node.returns?.kind === "table") {
    const t = node.returns as ReturnsTable;
    returnStuff = group(
      concat([
        "TABLE(",
        group(
          join(
            concat([",", line]),
            t.columns.map((_param, index) => {
              return path.call(print, "columns", index);
            }),
          ),
        ),
        ")",
      ]),
    );
  } else {
    returnStuff = path.call(print, "returns");
  }
  const returnsDoc = returnStuff
    ? concat([line, "RETURNS ", returnStuff])
    : null;
  const languageDoc = node.language
    ? concat([line, `LANGUAGE '${node.language?.name /* TODO: escape */}'`])
    : null;
  const volatilityDoc = node.purity
    ? concat([line, node.purity.toUpperCase()])
    : null;
  const code = tidyLanguage(node.code, node.language?.name);
  process.stdout.write(`FORMATTING CODE: '''${code}'''\n`);
  const formattedCode = parser
    ? textToDoc(
        code,
        { parser },
        /* { stripTrailingHardline: true } */
      )
    : code;
  const doc = concat([
    indent(concat([hardline, group(formattedCode)])),
    hardline,
  ]);

  return group(
    concat([
      group(
        concat([
          group(
            concat([
              createFunctionFooDoc,
              ...(returnsDoc ? [returnsDoc] : []),
              ...(languageDoc ? [languageDoc] : []),
              ...(volatilityDoc ? [volatilityDoc] : []),
            ]),
          ),
          line,
          "AS ",
          functionEscape,
        ]),
      ),

      group(doc),

      functionEscape,
    ]),
  );
};

const embed: Printer["embed"] = (path, print, textToDoc, options) => {
  try {
    const node: PGNodeMarked = path.getValue();
    process.stdout.write("In embed\n");
    process.stdout.write(`${inspect(node)}\n`);
    if (node?._type === "createFunction") {
      process.stdout.write("Yep\n");
      return embedCreateFunctionStatement(path, print, textToDoc, options);
    }
  } catch (e) {
    process.stderr.write(`ERROR: ${inspect(e)}\n`);
    throw e;
  }
  return null;
};

export default embed;
