/*
Original work Copyright (c) Zac McCormick zac.mccormick@gmail.com All rights reserved.
Modified work Copyright (c) Benjie Gillam code@benjiegillam.com All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name "pg-query-parser" nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const { format } = require("util");

const RESERVED_WORDS = require("./reservedWords");

const _ = {
  keys: Object.keys,
  identity: val => val,
  isArray: Array.isArray,
  isNumber: n => typeof n === "number",
  values: Object.values,
  filter: (arr, fn) => arr.filter(fn),
  compact: arr => arr.filter(_.identity),
  last: arr => arr[arr.length - 1],
  invert: input => {
    const output = {};
    for (const key in input) {
      output[input[key]] = key;
    }
    return output;
  },
};

function getOnlyKey(obj) {
  const allKeys = Object.keys(obj);
  if (allKeys.length !== 1) {
    throw new Error(
      `Expected object to have exactly one key, instead it had: '${allKeys.join(
        "', '"
      )}'`
    );
  }
  return allKeys[0];
}

function escapeFunctionBody(body) {
  // TODO: make this safe against bodies that contain `$$`!!
  return `$$${body}$$`;
}

function oldIndent(str) {
  return str;
}

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

function assertEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

const CONSTRAINT_TYPES = [
  "NULL",
  "NOT NULL",
  "DEFAULT",
  "CHECK",
  "PRIMARY KEY",
  "UNIQUE",
  "EXCLUDE",
  "REFERENCES",
];

const { keys } = _;

const compact = o => {
  return _.filter(_.compact(o), p => {
    if (p == null) {
      return false;
    }

    return p.toString().length;
  });
};

const fail = (type, node) => {
  throw new Error(format("Unhandled %s node: %s", type, JSON.stringify(node)));
};

const parens = string => {
  return "(" + string + ")";
};

function deparseNodes(nodes) {
  return nodes.map(node => deparse(node));
}

function list(nodes, separator = ", ") {
  if (!nodes) {
    return "";
  }

  return deparseNodes(nodes).join(separator);
}

function quote(value) {
  if (value == null) {
    return null;
  }

  if (_.isArray(value)) {
    return value.map(o => quote(o));
  }

  return '"' + value + '"';
}

function isReserved(identString) {
  return RESERVED_WORDS.indexOf(identString) >= 0;
}

function quoteIdent(value) {
  if (value == null) {
    return null;
  }

  if (_.isArray(value)) {
    return value.map(o => quoteIdent(o));
  }

  if (value.match(/^[a-z_][a-z0-9_]*$/) && !isReserved(value)) {
    return value;
  }

  return '"' + value + '"';
}

// SELECT encode(E'''123\\000\\001', 'base64')
function escape(literal) {
  return "'" + literal.replace(/'/g, "''") + "'";
}

function convertTypeName(typeName, size) {
  switch (typeName) {
    case "bpchar":
      if (size != null) {
        return "char";
      }
      // return `pg_catalog.bpchar` below so that the following is symmetric
      // SELECT char 'c' = char 'c' AS true
      return "pg_catalog.bpchar";
    case "varchar":
      return "varchar";
    case "numeric":
      return "numeric";
    case "bool":
      return "boolean";
    case "int2":
      return "smallint";
    case "int4":
      return "int";
    case "int8":
      return "bigint";
    case "real":
    case "float4":
      return "real";
    case "float8":
      return "pg_catalog.float8";
    case "text":
      // SELECT EXTRACT(CENTURY FROM CURRENT_DATE)>=21 AS True
      return "pg_catalog.text";
    case "date":
      return "pg_catalog.date";
    case "time":
      return "time";
    case "timetz":
      return "pg_catalog.timetz";
    case "timestamp":
      return "timestamp";
    case "timestamptz":
      return "pg_catalog.timestamptz";
    case "interval":
      return "interval";
    case "bit":
      return "bit";
    default:
      throw new Error(format("Unhandled data type: %s", typeName));
  }
}

function getType(names, args) {
  const [catalog, type] = names.map(name => deparse(name));

  const mods = (name, size) => {
    if (size != null) {
      return name + "(" + size + ")";
    }

    return name;
  };

  // handle the special "char" (in quotes) type
  if (names[0].String.str === "char") {
    names[0].String.str = '"char"';
  }

  if (catalog !== "pg_catalog") {
    return mods(list(names, "."), args);
  }

  const res = convertTypeName(type, args);

  return mods(res, args);
}

function deparse(item, context) {
  if (item == null) {
    return null;
  }

  if (_.isNumber(item)) {
    return item;
  }

  const type = getOnlyKey(item);
  const node = item[type];

  if (TYPES[type] == null) {
    throw new Error(type + " is not implemented");
  }

  return TYPES[type](node, context);
}

module.exports = function print(path, options, print) {
  const n = path.getValue();
  if (!Array.isArray(n)) {
    throw new Error("Expected an array of SQL AST nodes");
  }
  return n.length
    ? concat([
        join(
          hardline,
          n.map(statement => {
            const output = deparse(statement);
            if (output) {
              return concat([output, ";"]);
            } else {
              return output;
            }
          })
        ),
        hardline,
      ])
    : "";
};

function deparseFrameOptions(options, refName, startOffset, endOffset) {
  const FRAMEOPTION_NONDEFAULT = 0x00001; // any specified?
  const FRAMEOPTION_RANGE = 0x00002; // RANGE behavior
  const FRAMEOPTION_ROWS = 0x00004; // ROWS behavior
  const FRAMEOPTION_BETWEEN = 0x00008; // BETWEEN given?
  const FRAMEOPTION_START_UNBOUNDED_PRECEDING = 0x00010; // start is U. P.
  const FRAMEOPTION_END_UNBOUNDED_PRECEDING = 0x00020; // (disallowed)
  const FRAMEOPTION_START_UNBOUNDED_FOLLOWING = 0x00040; // (disallowed)
  const FRAMEOPTION_END_UNBOUNDED_FOLLOWING = 0x00080; // end is U. F.
  const FRAMEOPTION_START_CURRENT_ROW = 0x00100; // start is C. R.
  const FRAMEOPTION_END_CURRENT_ROW = 0x00200; // end is C. R.
  const FRAMEOPTION_START_VALUE_PRECEDING = 0x00400; // start is V. P.
  const FRAMEOPTION_END_VALUE_PRECEDING = 0x00800; // end is V. P.
  const FRAMEOPTION_START_VALUE_FOLLOWING = 0x01000; // start is V. F.
  const FRAMEOPTION_END_VALUE_FOLLOWING = 0x02000; // end is V. F.

  if (!(options & FRAMEOPTION_NONDEFAULT)) {
    return "";
  }

  const output = [];

  if (refName != null) {
    output.push(refName);
  }

  if (options & FRAMEOPTION_RANGE) {
    output.push("RANGE");
  }

  if (options & FRAMEOPTION_ROWS) {
    output.push("ROWS");
  }

  const between = options & FRAMEOPTION_BETWEEN;

  if (between) {
    output.push("BETWEEN");
  }

  if (options & FRAMEOPTION_START_UNBOUNDED_PRECEDING) {
    output.push("UNBOUNDED PRECEDING");
  }

  if (options & FRAMEOPTION_START_UNBOUNDED_FOLLOWING) {
    output.push("UNBOUNDED FOLLOWING");
  }

  if (options & FRAMEOPTION_START_CURRENT_ROW) {
    output.push("CURRENT ROW");
  }

  if (options & FRAMEOPTION_START_VALUE_PRECEDING) {
    output.push(deparse(startOffset) + " PRECEDING");
  }

  if (options & FRAMEOPTION_START_VALUE_FOLLOWING) {
    output.push(deparse(startOffset) + " FOLLOWING");
  }

  if (between) {
    output.push("AND");

    if (options & FRAMEOPTION_END_UNBOUNDED_PRECEDING) {
      output.push("UNBOUNDED PRECEDING");
    }

    if (options & FRAMEOPTION_END_UNBOUNDED_FOLLOWING) {
      output.push("UNBOUNDED FOLLOWING");
    }

    if (options & FRAMEOPTION_END_CURRENT_ROW) {
      output.push("CURRENT ROW");
    }

    if (options & FRAMEOPTION_END_VALUE_PRECEDING) {
      output.push(deparse(endOffset) + " PRECEDING");
    }

    if (options & FRAMEOPTION_END_VALUE_FOLLOWING) {
      output.push(deparse(endOffset) + " FOLLOWING");
    }
  }

  return output.join(" ");
}

function deparseInterval(node) {
  const type = ["interval"];

  if (node.arrayBounds != null) {
    type.push("[]");
  }

  if (node.typmods) {
    const typmods = node.typmods.map(item => deparse(item));

    let intervals = interval(typmods[0]);

    // SELECT interval(0) '1 day 01:23:45.6789'
    if (
      node.typmods[0] &&
      node.typmods[0].A_Const &&
      node.typmods[0].A_Const.val.Integer.ival === 32767 &&
      node.typmods[1] &&
      node.typmods[1].A_Const != null
    ) {
      intervals = [`(${node.typmods[1].A_Const.val.Integer.ival})`];
    } else {
      intervals = intervals.map(part => {
        if (part === "second" && typmods.length === 2) {
          return "second(" + _.last(typmods) + ")";
        }

        return part;
      });
    }

    type.push(intervals.join(" to "));
  }

  return type.join(" ");
}

const TYPES = {
  ["A_Expr"](node, context) {
    const output = [];

    switch (node.kind) {
      case 0: // AEXPR_OP
        if (node.lexpr) {
          output.push(parens(deparse(node.lexpr)));
        }

        if (node.name.length > 1) {
          const schema = deparse(node.name[0]);
          const operator = deparse(node.name[1]);
          output.push(`OPERATOR(${schema}.${operator})`);
        } else {
          output.push(deparse(node.name[0]));
        }

        if (node.rexpr) {
          output.push(parens(deparse(node.rexpr)));
        }

        if (output.length === 2) {
          return parens(output.join(""));
        }

        return parens(output.join(" "));

      case 1: // AEXPR_OP_ANY
        output.push(deparse(node.lexpr));
        output.push(format("ANY (%s)", deparse(node.rexpr)));
        return output.join(` ${deparse(node.name[0])} `);

      case 2: // AEXPR_OP_ALL
        output.push(deparse(node.lexpr));
        output.push(format("ALL (%s)", deparse(node.rexpr)));
        return output.join(` ${deparse(node.name[0])} `);

      case 3: // AEXPR_DISTINCT
        return format(
          "%s IS DISTINCT FROM %s",
          deparse(node.lexpr),
          deparse(node.rexpr)
        );

      case 4: // AEXPR_NULLIF
        return format(
          "NULLIF(%s, %s)",
          deparse(node.lexpr),
          deparse(node.rexpr)
        );

      case 5: {
        // AEXPR_OF
        const op = node.name[0].String.str === "=" ? "IS OF" : "IS NOT OF";
        return format("%s %s (%s)", deparse(node.lexpr), op, list(node.rexpr));
      }

      case 6: {
        // AEXPR_IN
        const operator = node.name[0].String.str === "=" ? "IN" : "NOT IN";

        return format(
          "%s %s (%s)",
          deparse(node.lexpr),
          operator,
          list(node.rexpr)
        );
      }

      case 7: // AEXPR_LIKE
        output.push(deparse(node.lexpr));

        if (node.name[0].String.str === "!~~") {
          output.push(format("NOT LIKE (%s)", deparse(node.rexpr)));
        } else {
          output.push(format("LIKE (%s)", deparse(node.rexpr)));
        }

        return output.join(" ");

      case 8: // AEXPR_ILIKE
        output.push(deparse(node.lexpr));

        if (node.name[0].String.str === "!~~*") {
          output.push(format("NOT ILIKE (%s)", deparse(node.rexpr)));
        } else {
          output.push(format("ILIKE (%s)", deparse(node.rexpr)));
        }

        return output.join(" ");

      case 9: // AEXPR_SIMILAR
        // SIMILAR TO emits a similar_escape FuncCall node with the first argument
        output.push(deparse(node.lexpr));

        if (deparse(node.rexpr.FuncCall.args[1].Null)) {
          output.push(
            format("SIMILAR TO %s", deparse(node.rexpr.FuncCall.args[0]))
          );
        } else {
          output.push(
            format(
              "SIMILAR TO %s ESCAPE %s",
              deparse(node.rexpr.FuncCall.args[0]),
              deparse(node.rexpr.FuncCall.args[1])
            )
          );
        }

        return output.join(" ");

      case 10: // AEXPR_BETWEEN TODO(zhm) untested
        output.push(deparse(node.lexpr));
        output.push(
          format(
            "BETWEEN %s AND %s",
            deparse(node.rexpr[0]),
            deparse(node.rexpr[1])
          )
        );
        return output.join(" ");

      case 11: // AEXPR_NOT_BETWEEN TODO(zhm) untested
        output.push(deparse(node.lexpr));
        output.push(
          format(
            "NOT BETWEEN %s AND %s",
            deparse(node.rexpr[0]),
            deparse(node.rexpr[1])
          )
        );
        return output.join(" ");

      default:
        return fail("A_Expr", node);
    }
  },

  ["Alias"](node, context) {
    const name = node.aliasname;

    const output = ["AS"];

    if (node.colnames) {
      output.push(name + parens(list(node.colnames)));
    } else {
      output.push(quoteIdent(name));
    }

    return output.join(" ");
  },

  ["A_ArrayExpr"](node) {
    return format("ARRAY[%s]", list(node.elements));
  },

  ["A_Const"](node, context) {
    if (node.val.String) {
      return escape(deparse(node.val));
    }

    return deparse(node.val);
  },

  ["A_Indices"](node) {
    if (node.lidx) {
      return format("[%s:%s]", deparse(node.lidx), deparse(node.uidx));
    }

    return format("[%s]", deparse(node.uidx));
  },

  ["A_Indirection"](node) {
    const output = [`(${deparse(node.arg)})`];

    // TODO(zhm) figure out the actual rules for when a '.' is needed
    //
    // select a.b[0] from a;
    // select (select row(1)).*
    // select c2[2].f2 from comptable
    // select c2.a[2].f2[1].f3[0].a1 from comptable

    for (let i = 0; i < node.indirection.length; i++) {
      const subnode = node.indirection[i];

      if (subnode.String || subnode.A_Star) {
        const value = subnode.A_Star ? "*" : quote(subnode.String.str);

        output.push(`.${value}`);
      } else {
        output.push(deparse(subnode));
      }
    }

    return output.join("");
  },

  ["A_Star"](node, context) {
    return "*";
  },

  ["BitString"](node) {
    const prefix = node.str[0];
    return `${prefix}'${node.str.substring(1)}'`;
  },

  ["BoolExpr"](node) {
    switch (node.boolop) {
      case 0:
        return parens(list(node.args, " AND "));
      case 1:
        return parens(list(node.args, " OR "));
      case 2:
        return format("NOT (%s)", deparse(node.args[0]));
      default:
        return fail("BoolExpr", node);
    }
  },

  ["BooleanTest"](node) {
    const output = [];

    output.push(deparse(node.arg));

    const tests = [
      "IS TRUE",
      "IS NOT TRUE",
      "IS FALSE",
      "IS NOT FALSE",
      "IS UNKNOWN",
      "IS NOT UNKNOWN",
    ];

    output.push(tests[node.booltesttype]);

    return output.join(" ");
  },

  ["CaseExpr"](node) {
    const output = ["CASE"];

    if (node.arg) {
      output.push(deparse(node.arg));
    }

    for (let i = 0; i < node.args.length; i++) {
      output.push(deparse(node.args[i]));
    }

    if (node.defresult) {
      output.push("ELSE");
      output.push(deparse(node.defresult));
    }

    output.push("END");

    return output.join(" ");
  },

  ["CoalesceExpr"](node) {
    return format("COALESCE(%s)", list(node.args));
  },

  ["CollateClause"](node) {
    const output = [];

    if (node.arg) {
      output.push(deparse(node.arg));
    }

    output.push("COLLATE");

    if (node.collname) {
      output.push(quote(deparseNodes(node.collname)));
    }

    return output.join(" ");
  },

  ["ColumnDef"](node) {
    const output = [quoteIdent(node.colname)];

    output.push(deparse(node.typeName));

    if (node.raw_default) {
      output.push("USING");
      output.push(deparse(node.raw_default));
    }

    if (node.constraints) {
      output.push(list(node.constraints, " "));
    }

    return _.compact(output).join(" ");
  },

  ["ColumnRef"](node) {
    const fields = node.fields.map(field => {
      if (field.String) {
        return quoteIdent(deparse(field));
      }

      return deparse(field);
    });

    return fields.join(".");
  },

  ["CommonTableExpr"](node) {
    const output = [];

    output.push(node.ctename);

    if (node.aliascolnames) {
      output.push(format("(%s)", quoteIdent(deparseNodes(node.aliascolnames))));
    }

    output.push(format("AS (%s)", deparse(node.ctequery)));

    return output.join(" ");
  },

  ["Float"](node) {
    // wrap negative numbers in parens, SELECT (-2147483648)::int4 * (-1)::int4
    if (node.str[0] === "-") {
      return `(${node.str})`;
    }

    return node.str;
  },

  ["FuncCall"](node, context) {
    const output = [];

    let params = [];

    if (node.args) {
      params = node.args.map(item => {
        return deparse(item);
      });
    }

    // COUNT(*)
    if (node.agg_star) {
      params.push("*");
    }

    const name = list(node.funcname, ".");

    const order = [];

    const withinGroup = node.agg_within_group;

    if (node.agg_order) {
      order.push("ORDER BY");
      order.push(list(node.agg_order, ", "));
    }

    const call = [];

    call.push(name + "(");

    if (node.agg_distinct) {
      call.push("DISTINCT ");
    }

    // prepend variadic before the last parameter
    // SELECT CONCAT('|', VARIADIC ARRAY['1','2','3'])
    if (node.func_variadic) {
      params[params.length - 1] = "VARIADIC " + params[params.length - 1];
    }

    call.push(params.join(", "));

    if (order.length && !withinGroup) {
      call.push(" ");
      call.push(order.join(" "));
    }

    call.push(")");

    output.push(compact(call).join(""));

    if (order.length && withinGroup) {
      output.push("WITHIN GROUP");
      output.push(parens(order.join(" ")));
    }

    if (node.agg_filter != null) {
      output.push(format("FILTER (WHERE %s)", deparse(node.agg_filter)));
    }

    if (node.over != null) {
      output.push(format("OVER %s", deparse(node.over)));
    }

    return output.join(" ");
  },

  ["GroupingFunc"](node) {
    return "GROUPING(" + list(node.args) + ")";
  },

  ["GroupingSet"](node) {
    switch (node.kind) {
      case 0: // GROUPING_SET_EMPTY
        return "()";

      case 1: // GROUPING_SET_SIMPLE
        return fail("GroupingSet", node);

      case 2: // GROUPING_SET_ROLLUP
        return "ROLLUP (" + list(node.content) + ")";

      case 3: // GROUPING_SET_CUBE
        return "CUBE (" + list(node.content) + ")";

      case 4: // GROUPING_SET_SETS
        return "GROUPING SETS (" + list(node.content) + ")";

      default:
        return fail("GroupingSet", node);
    }
  },

  ["Integer"](node) {
    if (node.ival < 0) {
      return `(${node.ival})`;
    }

    return node.ival.toString();
  },

  ["IntoClause"](node) {
    return deparse(node.rel);
  },

  ["JoinExpr"](node, context) {
    const output = [];

    output.push(deparse(node.larg));

    if (node.isNatural) {
      output.push("NATURAL");
    }

    let join = null;

    switch (true) {
      case node.jointype === 0 && node.quals != null:
        join = "INNER JOIN";
        break;

      case node.jointype === 0 &&
        !node.isNatural &&
        !(node.quals != null) &&
        !(node.usingClause != null):
        join = "CROSS JOIN";
        break;

      case node.jointype === 0:
        join = "JOIN";
        break;

      case node.jointype === 1:
        join = "LEFT OUTER JOIN";
        break;

      case node.jointype === 2:
        join = "FULL OUTER JOIN";
        break;

      case node.jointype === 3:
        join = "RIGHT OUTER JOIN";
        break;

      default:
        fail("JoinExpr", node);
        break;
    }

    output.push(join);

    if (node.rarg) {
      // wrap nested join expressions in parens to make the following symmetric:
      // select * from int8_tbl x cross join (int4_tbl x cross join lateral (select x.f1) ss)
      if (node.rarg.JoinExpr != null && !(node.rarg.JoinExpr.alias != null)) {
        output.push(`(${deparse(node.rarg)})`);
      } else {
        output.push(deparse(node.rarg));
      }
    }

    if (node.quals) {
      output.push(`ON ${deparse(node.quals)}`);
    }

    if (node.usingClause) {
      const using = quoteIdent(deparseNodes(node.usingClause)).join(", ");

      output.push(`USING (${using})`);
    }

    const wrapped =
      node.rarg.JoinExpr != null || node.alias
        ? "(" + output.join(" ") + ")"
        : output.join(" ");

    if (node.alias) {
      return wrapped + " " + deparse(node.alias);
    }

    return wrapped;
  },

  ["LockingClause"](node) {
    const strengths = [
      "NONE", // LCS_NONE
      "FOR KEY SHARE",
      "FOR SHARE",
      "FOR NO KEY UPDATE",
      "FOR UPDATE",
    ];

    const output = [];

    output.push(strengths[node.strength]);

    if (node.lockedRels) {
      output.push("OF");
      output.push(list(node.lockedRels));
    }

    return output.join(" ");
  },

  ["MinMaxExpr"](node) {
    const output = [];

    if (node.op === 0) {
      output.push("GREATEST");
    } else {
      output.push("LEAST");
    }

    output.push(parens(list(node.args)));

    return output.join("");
  },

  ["NamedArgExpr"](node) {
    const output = [];

    output.push(node.name);
    output.push(":=");
    output.push(deparse(node.arg));

    return output.join(" ");
  },

  ["Null"](node) {
    return "NULL";
  },

  ["NullTest"](node) {
    const output = [deparse(node.arg)];

    if (node.nulltesttype === 0) {
      output.push("IS NULL");
    } else if (node.nulltesttype === 1) {
      output.push("IS NOT NULL");
    }

    return output.join(" ");
  },

  ["ParamRef"](node) {
    if (node.number >= 0) {
      return ["$", node.number].join("");
    }
    return "?";
  },

  ["RangeFunction"](node) {
    const output = [];

    if (node.lateral) {
      output.push("LATERAL");
    }

    const funcs = [];

    for (let i = 0; i < node.functions.length; i++) {
      const funcCall = node.functions[i];
      const call = [deparse(funcCall[0])];

      if (funcCall[1] && funcCall[1].length) {
        call.push(format("AS (%s)", list(funcCall[1])));
      }

      funcs.push(call.join(" "));
    }

    const calls = funcs.join(", ");

    if (node.is_rowsfrom) {
      output.push(`ROWS FROM (${calls})`);
    } else {
      output.push(calls);
    }

    if (node.ordinality) {
      output.push("WITH ORDINALITY");
    }

    if (node.alias) {
      output.push(deparse(node.alias));
    }

    if (node.coldeflist) {
      const defList = list(node.coldeflist);

      if (!node.alias) {
        output.push(` AS (${defList})`);
      } else {
        output.push(`(${defList})`);
      }
    }

    return output.join(" ");
  },

  ["RangeSubselect"](node, context) {
    let output = "";

    if (node.lateral) {
      output += "LATERAL ";
    }

    output += parens(deparse(node.subquery));

    if (node.alias) {
      return output + " " + deparse(node.alias);
    }

    return output;
  },

  ["RangeTableSample"](node) {
    const output = [];

    output.push(deparse(node.relation));
    output.push("TABLESAMPLE");
    output.push(deparse(node.method[0]));

    if (node.args) {
      output.push(parens(list(node.args)));
    }

    if (node.repeatable) {
      output.push("REPEATABLE(" + deparse(node.repeatable) + ")");
    }

    return output.join(" ");
  },

  ["RangeVar"](node, context) {
    const output = [];

    if (node.inhOpt === 0) {
      output.push("ONLY");
    }

    if (node.relpersistence === "u") {
      output.push("UNLOGGED");
    }

    if (node.relpersistence === "t") {
      output.push("TEMPORARY");
    }

    if (node.schemaname != null) {
      output.push(quoteIdent(node.schemaname));
      output.push(".");
    }

    output.push(quoteIdent(node.relname));

    if (node.alias) {
      output.push(deparse(node.alias));
    }

    return output.join(" ");
  },

  ["ResTarget"](node, context) {
    if (context === "select") {
      return compact([deparse(node.val), quoteIdent(node.name)]).join(" AS ");
    } else if (context === "update") {
      return compact([node.name, deparse(node.val)]).join(" = ");
    } else if (!(node.val != null)) {
      return quoteIdent(node.name);
    }

    return fail("ResTarget", node);
  },

  ["RowExpr"](node) {
    if (node.row_format === 2) {
      return parens(list(node.args));
    }

    return format("ROW(%s)", list(node.args));
  },

  ["SelectStmt"](node, context) {
    const output = [];
    const {
      withClause,
      op,
      all,
      valuesLists,
      larg,
      rarg,
      distinctClause,
      targetList,
      intoClause,
      fromClause,
      whereClause,
      groupClause,
      havingClause,
      windowClause,
      sortClause,
      limitCount,
      limitOffset,
      lockingClause,
      ...rest
    } = node;
    assertEmptyObject(rest);

    if (withClause) {
      output.push(deparse(withClause));
    }

    if (op === 0) {
      // VALUES select's don't get SELECT
      if (valuesLists == null) {
        output.push("SELECT");
      }
    } else {
      output.push(parens(deparse(larg)));

      const sets = ["NONE", "UNION", "INTERSECT", "EXCEPT"];

      output.push(sets[op]);

      if (all) {
        output.push("ALL");
      }

      output.push(parens(deparse(rarg)));
    }

    if (distinctClause) {
      if (distinctClause[0] != null) {
        output.push("DISTINCT ON");

        const clause = distinctClause
          .map(e => deparse(e, "select"))
          .join(",\n");

        output.push(`(${clause})`);
      } else {
        output.push("DISTINCT");
      }
    }

    if (targetList) {
      output.push(
        oldIndent(targetList.map(e => deparse(e, "select")).join(",\n"))
      );
    }

    if (intoClause) {
      output.push("INTO");
      output.push(oldIndent(deparse(intoClause)));
    }

    if (fromClause) {
      output.push("FROM");
      output.push(
        oldIndent(fromClause.map(e => deparse(e, "from")).join(",\n"))
      );
    }

    if (whereClause) {
      output.push("WHERE");
      output.push(oldIndent(deparse(whereClause)));
    }

    if (valuesLists) {
      output.push("VALUES");

      const lists = valuesLists.map(list => {
        return `(${list.map(v => deparse(v)).join(", ")})`;
      });

      output.push(lists.join(", "));
    }

    if (groupClause) {
      output.push("GROUP BY");
      output.push(
        oldIndent(groupClause.map(e => deparse(e, "group")).join(",\n"))
      );
    }

    if (havingClause) {
      output.push("HAVING");
      output.push(oldIndent(deparse(havingClause)));
    }

    if (windowClause) {
      output.push("WINDOW");

      const windows = [];

      for (let i = 0; i < windowClause.length; i++) {
        const w = windowClause[i];
        const window = [];

        if (w.WindowDef.name) {
          window.push(quoteIdent(w.WindowDef.name) + " AS");
        }

        window.push(parens(deparse(w, "window")));

        windows.push(window.join(" "));
      }

      output.push(windows.join(", "));
    }

    if (sortClause) {
      output.push("ORDER BY");
      output.push(
        oldIndent(sortClause.map(e => deparse(e, "sort")).join(",\n"))
      );
    }

    if (limitCount) {
      output.push("LIMIT");
      output.push(oldIndent(deparse(limitCount)));
    }

    if (limitOffset) {
      output.push("OFFSET");
      output.push(oldIndent(deparse(limitOffset)));
    }

    if (lockingClause) {
      lockingClause.forEach(item => {
        return output.push(deparse(item));
      });
    }

    return output.join(" ");
  },

  ["CreateStmt"](node) {
    const output = [];
    output.push("CREATE TABLE");
    output.push(deparse(node.relation));
    output.push("(");
    output.push(list(node.tableElts));
    output.push(")");
    output.push(";");
    return output.join(" ");
  },

  ["ConstraintStmt"](node) {
    const output = [];
    const constraint = CONSTRAINT_TYPES[node.contype];

    if (node.conname) {
      output.push(`CONSTRAINT ${node.conname} ${constraint}`);
    } else {
      output.push(constraint);
    }

    return output.join(" ");
  },

  ["ReferenceConstraint"](node) {
    const output = [];
    if (node.pk_attrs && node.fk_attrs) {
      output.push("FOREIGN KEY");
      output.push("(");
      output.push(list(node.fk_attrs));
      output.push(")");
      output.push("REFERENCES");
      output.push(deparse(node.pktable));
      output.push("(");
      output.push(list(node.pk_attrs));
      output.push(")");
    } else if (node.pk_attrs) {
      output.push(TYPES.ConstraintStmt(node));
      output.push(deparse(node.pktable));
      output.push("(");
      output.push(list(node.pk_attrs));
      output.push(")");
    } else {
      output.push(TYPES.ConstraintStmt(node));
      output.push(deparse(node.pktable));
    }
    return output.join(" ");
  },

  ["ExclusionConstraint"](node) {
    const output = [];
    function getExclusionGroup(node) {
      var output = [];
      var a = node.exclusions.map(excl => {
        if (excl[0].IndexElem.name) {
          return excl[0].IndexElem.name;
        } else if (excl[0].IndexElem.expr) {
          return deparse(excl[0].IndexElem.expr);
        }
      });

      var b = node.exclusions.map(excl => deparse(excl[1][0]));

      for (var i = 0; i < a.length; i++) {
        output.push(`${a[i]} WITH ${b[i]}`);
        i !== a.length - 1 && output.push(",");
      }

      return output.join(" ");
    }

    if (node.exclusions && node.access_method) {
      output.push("USING");
      output.push(node.access_method);
      output.push("(");
      output.push(getExclusionGroup(node));
      output.push(")");
    }

    return output.join(" ");
  },

  ["Constraint"](node) {
    const output = [];

    const constraint = CONSTRAINT_TYPES[node.contype];
    if (!constraint) {
      throw new Error("type not implemented: " + node.contype);
    }

    if (constraint === "REFERENCES") {
      output.push(TYPES.ReferenceConstraint(node));
    } else {
      output.push(TYPES.ConstraintStmt(node));
    }

    if (node.keys) {
      output.push("(");
      output.push(list(node.keys));
      output.push(")");
    }

    if (node.raw_expr) {
      output.push(deparse(node.raw_expr));
    }

    if (node.fk_del_action) {
      switch (node.fk_del_action) {
        case "r":
          output.push("ON DELETE RESTRICT");
          break;
        case "c":
          output.push("ON DELETE CASCADE");
          break;
        default:
      }
    }

    if (node.fk_upd_action) {
      switch (node.fk_upd_action) {
        case "r":
          output.push("ON UPDATE RESTRICT");
          break;
        case "c":
          output.push("ON UPDATE CASCADE");
          break;
        default:
      }
    }

    if (constraint === "EXCLUDE") {
      output.push(TYPES.ExclusionConstraint(node));
    }

    return output.join(" ");
  },

  ["FunctionParameter"](node) {
    const output = [];

    output.push(node.name);
    output.push(deparse(node.argType));

    return output.join(" ");
  },

  ["CreateFunctionStmt"](node) {
    const returns = node.parameters
      ? node.parameters.filter(
          ({ FunctionParameter }) => FunctionParameter.mode === 116
        )
      : [];
    // var setof = node.parameters.filter(
    //   ({ FunctionParameter }) => FunctionParameter.mode === 109
    // );
    var elems = {};

    node.options.forEach(option => {
      if (option && option.DefElem) {
        switch (option.DefElem.defname) {
          case "as":
            elems.as = option;
            break;

          case "language":
            elems.language = option;
            break;

          case "volatility":
            elems.volatility = option;
            break;
        }
      }
    });
    return group(
      concat([
        "CREATE ",
        node.replace ? "OR REPLACE " : "",
        "FUNCTION ",
        join(".", node.funcname.map(name => deparse(name))),
        softline,
        "(",
        group(
          join(
            ",",
            node.parameters
              ? node.parameters
                  .filter(
                    ({ FunctionParameter }) => FunctionParameter.mode === 105
                  )
                  .map(param => deparse(param))
              : []
          )
        ),
        ")",
        line,
        "RETURNS",
        line,
        returns.length
          ? group(
              concat([
                "TABLE(",
                group(
                  join(
                    concat(",", line),
                    node.parameters
                      .filter(
                        ({ FunctionParameter }) =>
                          FunctionParameter.mode === 116
                      )
                      .map(param => deparse(param))
                  )
                ),
                ")",
              ])
            )
          : deparse(node.returnType),
        line,
        `LANGUAGE '${deparse(elems.language.DefElem.arg)}'`,
        line,

        elems.volatility
          ? deparse(elems.volatility.DefElem.arg).toUpperCase()
          : "",
        "AS ",
        escapeFunctionBody(deparse(elems.as.DefElem.arg[0])),
      ])
    );
  },

  ["CreateSchemaStmt"](node) {
    const output = [];

    output.push("CREATE");
    if (node.replace) {
      output.push("OR REPLACE");
    }
    output.push("SCHEMA");
    output.push(node.schemaname);
    return output.join(" ");
  },

  ["TransactionStmt"](node) {
    switch (node.kind) {
      case 0:
        return "BEGIN";
        break;
      case 1:
        break;
      case 2:
        return "COMMIT";
      default:
    }
  },

  ["SortBy"](node) {
    const output = [];

    output.push(deparse(node.node));

    if (node.sortby_dir === 1) {
      output.push("ASC");
    }

    if (node.sortby_dir === 2) {
      output.push("DESC");
    }

    if (node.sortby_dir === 3) {
      output.push(`USING ${deparseNodes(node.useOp)}`);
    }

    if (node.sortby_nulls === 1) {
      output.push("NULLS FIRST");
    }

    if (node.sortby_nulls === 2) {
      output.push("NULLS LAST");
    }

    return output.join(" ");
  },

  ["String"](node) {
    return node.str;
  },

  ["SubLink"](node) {
    switch (true) {
      case node.subLinkType === 0:
        return format("EXISTS (%s)", deparse(node.subselect));
      case node.subLinkType === 1:
        return format(
          "%s %s ALL (%s)",
          deparse(node.testexpr),
          deparse(node.operName[0]),
          deparse(node.subselect)
        );
      case node.subLinkType === 2 && !(node.operName != null):
        return format(
          "%s IN (%s)",
          deparse(node.testexpr),
          deparse(node.subselect)
        );
      case node.subLinkType === 2:
        return format(
          "%s %s ANY (%s)",
          deparse(node.testexpr),
          deparse(node.operName[0]),
          deparse(node.subselect)
        );
      case node.subLinkType === 3:
        return format(
          "%s %s (%s)",
          deparse(node.testexpr),
          deparse(node.operName[0]),
          deparse(node.subselect)
        );
      case node.subLinkType === 4:
        return format("(%s)", deparse(node.subselect));
      case node.subLinkType === 5:
        // TODO(zhm) what is this?
        return fail("SubLink", node);
      // MULTIEXPR_SUBLINK
      // format('(%s)', @deparse(node.subselect))
      case node.subLinkType === 6:
        return format("ARRAY (%s)", deparse(node.subselect));
      default:
        return fail("SubLink", node);
    }
  },

  ["TypeCast"](node) {
    return deparse(node.arg) + "::" + deparse(node.typeName);
  },

  ["TypeName"](node) {
    if (_.last(node.names).String.str === "interval") {
      return deparseInterval(node);
    }

    const output = [];

    if (node.setof) {
      output.push("SETOF");
    }

    let args = null;

    if (node.typmods != null) {
      args = node.typmods.map(item => {
        return deparse(item);
      });
    }

    const type = [];

    type.push(getType(node.names, args && args.join(", ")));

    if (node.arrayBounds != null) {
      type.push("[]");
    }

    output.push(type.join(""));

    return output.join(" ");
  },

  ["CaseWhen"](node) {
    const output = ["WHEN"];

    output.push(deparse(node.expr));
    output.push("THEN");
    output.push(deparse(node.result));

    return output.join(" ");
  },

  ["WindowDef"](node, context) {
    const output = [];

    if (context !== "window") {
      if (node.name) {
        output.push(node.name);
      }
    }

    const empty =
      !(node.partitionClause != null) && !(node.orderClause != null);

    const frameOptions = deparseFrameOptions(
      node.frameOptions,
      node.refname,
      node.startOffset,
      node.endOffset
    );

    if (
      empty &&
      context !== "window" &&
      !(node.name != null) &&
      frameOptions.length === 0
    ) {
      return "()";
    }

    const windowParts = [];

    let useParens = false;

    if (node.partitionClause) {
      const partition = ["PARTITION BY"];

      const clause = node.partitionClause.map(item => deparse(item));

      partition.push(clause.join(", "));

      windowParts.push(partition.join(" "));
      useParens = true;
    }

    if (node.orderClause) {
      windowParts.push("ORDER BY");

      const orders = node.orderClause.map(item => {
        return deparse(item);
      });

      windowParts.push(orders.join(", "));

      useParens = true;
    }

    if (frameOptions.length) {
      useParens = true;
      windowParts.push(frameOptions);
    }

    if (useParens && context !== "window") {
      return output.join(" ") + " (" + windowParts.join(" ") + ")";
    }

    return output.join(" ") + windowParts.join(" ");
  },

  ["WithClause"](node) {
    const output = ["WITH"];

    if (node.recursive) {
      output.push("RECURSIVE");
    }

    output.push(list(node.ctes));

    return output.join(" ");
  },
};

////////////////////////////////////////////////////////////////////////////////

// ported from https://github.com/lfittl/pg_query/blob/master/lib/pg_query/deparse/interval.rb
const MASKS = {
  0: "RESERV",
  1: "MONTH",
  2: "YEAR",
  3: "DAY",
  4: "JULIAN",
  5: "TZ",
  6: "DTZ",
  7: "DYNTZ",
  8: "IGNORE_DTF",
  9: "AMPM",
  10: "HOUR",
  11: "MINUTE",
  12: "SECOND",
  13: "MILLISECOND",
  14: "MICROSECOND",
  15: "DOY",
  16: "DOW",
  17: "UNITS",
  18: "ADBC",
  19: "AGO",
  20: "ABS_BEFORE",
  21: "ABS_AFTER",
  22: "ISODATE",
  23: "ISOTIME",
  24: "WEEK",
  25: "DECADE",
  26: "CENTURY",
  27: "MILLENNIUM",
  28: "DTZMOD",
};
const BITS = _.invert(MASKS);
const INTERVALS = {};
INTERVALS[1 << BITS.YEAR] = ["year"];
INTERVALS[1 << BITS.MONTH] = ["month"];
INTERVALS[1 << BITS.DAY] = ["day"];
INTERVALS[1 << BITS.HOUR] = ["hour"];
INTERVALS[1 << BITS.MINUTE] = ["minute"];
INTERVALS[1 << BITS.SECOND] = ["second"];
INTERVALS[(1 << BITS.YEAR) | (1 << BITS.MONTH)] = ["year", "month"];
INTERVALS[(1 << BITS.DAY) | (1 << BITS.HOUR)] = ["day", "hour"];
INTERVALS[(1 << BITS.DAY) | (1 << BITS.HOUR) | (1 << BITS.MINUTE)] = [
  "day",
  "minute",
];
INTERVALS[
  (1 << BITS.DAY) | (1 << BITS.HOUR) | (1 << BITS.MINUTE) | (1 << BITS.SECOND)
] = ["day", "second"];
INTERVALS[(1 << BITS.HOUR) | (1 << BITS.MINUTE)] = ["hour", "minute"];
INTERVALS[(1 << BITS.HOUR) | (1 << BITS.MINUTE) | (1 << BITS.SECOND)] = [
  "hour",
  "second",
];
INTERVALS[(1 << BITS.MINUTE) | (1 << BITS.SECOND)] = ["minute", "second"];

// utils/timestamp.h
// #define INTERVAL_FULL_RANGE (0x7FFF)
const INTERVAL_FULL_RANGE = 32767;
INTERVALS[INTERVAL_FULL_RANGE] = [];

function interval(mask) {
  return INTERVALS[mask.toString()];
}
