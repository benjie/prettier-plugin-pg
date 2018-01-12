/*
Copyright (c) Zac McCormick zac.mccormick@gmail.com All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name "pg-query-parser" nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const { format } = require("util");

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

const indent = (text, count = 1) => text;

class Deparser {
  static deparse(query) {
    return new Deparser(query).deparseQuery();
  }

  constructor(tree) {
    this.tree = tree;
  }

  deparseQuery() {
    return this.tree.map(node => this.deparse(node)).join("\n\n");
  }

  deparseNodes(nodes) {
    return nodes.map(node => this.deparse(node));
  }

  list(nodes, separator = ", ") {
    if (!nodes) {
      return "";
    }

    return this.deparseNodes(nodes).join(separator);
  }

  quote(value) {
    if (value == null) {
      return null;
    }

    if (_.isArray(value)) {
      return value.map(o => this.quote(o));
    }

    return '"' + value + '"';
  }

  // SELECT encode(E'''123\\000\\001', 'base64')
  escape(literal) {
    return "'" + literal.replace(/'/g, "''") + "'";
  }

  convertTypeName(typeName, size) {
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

  type(names, args) {
    const [catalog, type] = names.map(name => this.deparse(name));

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
      return mods(this.list(names, "."), args);
    }

    const res = this.convertTypeName(type, args);

    return mods(res, args);
  }

  deparse(item, context) {
    if (item == null) {
      return null;
    }

    if (_.isNumber(item)) {
      return item;
    }

    const type = keys(item)[0];
    const node = _.values(item)[0];

    if (this[type] == null) {
      throw new Error(type + " is not implemented");
    }

    return this[type](node, context);
  }

  ["A_Expr"](node, context) {
    const output = [];

    switch (node.kind) {
      case 0: // AEXPR_OP
        if (node.lexpr) {
          output.push(parens(this.deparse(node.lexpr)));
        }

        if (node.name.length > 1) {
          const schema = this.deparse(node.name[0]);
          const operator = this.deparse(node.name[1]);
          output.push(`OPERATOR(${schema}.${operator})`);
        } else {
          output.push(this.deparse(node.name[0]));
        }

        if (node.rexpr) {
          output.push(parens(this.deparse(node.rexpr)));
        }

        if (output.length === 2) {
          return parens(output.join(""));
        }

        return parens(output.join(" "));

      case 1: // AEXPR_OP_ANY
        output.push(this.deparse(node.lexpr));
        output.push(format("ANY (%s)", this.deparse(node.rexpr)));
        return output.join(` ${this.deparse(node.name[0])} `);

      case 2: // AEXPR_OP_ALL
        output.push(this.deparse(node.lexpr));
        output.push(format("ALL (%s)", this.deparse(node.rexpr)));
        return output.join(` ${this.deparse(node.name[0])} `);

      case 3: // AEXPR_DISTINCT
        return format(
          "%s IS DISTINCT FROM %s",
          this.deparse(node.lexpr),
          this.deparse(node.rexpr)
        );

      case 4: // AEXPR_NULLIF
        return format(
          "NULLIF(%s, %s)",
          this.deparse(node.lexpr),
          this.deparse(node.rexpr)
        );

      case 5: {
        // AEXPR_OF
        const op = node.name[0].String.str === "=" ? "IS OF" : "IS NOT OF";
        return format(
          "%s %s (%s)",
          this.deparse(node.lexpr),
          op,
          this.list(node.rexpr)
        );
      }

      case 6: {
        // AEXPR_IN
        const operator = node.name[0].String.str === "=" ? "IN" : "NOT IN";

        return format(
          "%s %s (%s)",
          this.deparse(node.lexpr),
          operator,
          this.list(node.rexpr)
        );
      }

      case 7: // AEXPR_LIKE
        output.push(this.deparse(node.lexpr));

        if (node.name[0].String.str === "!~~") {
          output.push(format("NOT LIKE (%s)", this.deparse(node.rexpr)));
        } else {
          output.push(format("LIKE (%s)", this.deparse(node.rexpr)));
        }

        return output.join(" ");

      case 8: // AEXPR_ILIKE
        output.push(this.deparse(node.lexpr));

        if (node.name[0].String.str === "!~~*") {
          output.push(format("NOT ILIKE (%s)", this.deparse(node.rexpr)));
        } else {
          output.push(format("ILIKE (%s)", this.deparse(node.rexpr)));
        }

        return output.join(" ");

      case 9: // AEXPR_SIMILAR
        // SIMILAR TO emits a similar_escape FuncCall node with the first argument
        output.push(this.deparse(node.lexpr));

        if (this.deparse(node.rexpr.FuncCall.args[1].Null)) {
          output.push(
            format("SIMILAR TO %s", this.deparse(node.rexpr.FuncCall.args[0]))
          );
        } else {
          output.push(
            format(
              "SIMILAR TO %s ESCAPE %s",
              this.deparse(node.rexpr.FuncCall.args[0]),
              this.deparse(node.rexpr.FuncCall.args[1])
            )
          );
        }

        return output.join(" ");

      case 10: // AEXPR_BETWEEN TODO(zhm) untested
        output.push(this.deparse(node.lexpr));
        output.push(
          format(
            "BETWEEN %s AND %s",
            this.deparse(node.rexpr[0]),
            this.deparse(node.rexpr[1])
          )
        );
        return output.join(" ");

      case 11: // AEXPR_NOT_BETWEEN TODO(zhm) untested
        output.push(this.deparse(node.lexpr));
        output.push(
          format(
            "NOT BETWEEN %s AND %s",
            this.deparse(node.rexpr[0]),
            this.deparse(node.rexpr[1])
          )
        );
        return output.join(" ");

      default:
        return fail("A_Expr", node);
    }
  }

  ["Alias"](node, context) {
    const name = node.aliasname;

    const output = ["AS"];

    if (node.colnames) {
      output.push(name + parens(this.list(node.colnames)));
    } else {
      output.push(this.quote(name));
    }

    return output.join(" ");
  }

  ["A_ArrayExpr"](node) {
    return format("ARRAY[%s]", this.list(node.elements));
  }

  ["A_Const"](node, context) {
    if (node.val.String) {
      return this.escape(this.deparse(node.val));
    }

    return this.deparse(node.val);
  }

  ["A_Indices"](node) {
    if (node.lidx) {
      return format(
        "[%s:%s]",
        this.deparse(node.lidx),
        this.deparse(node.uidx)
      );
    }

    return format("[%s]", this.deparse(node.uidx));
  }

  ["A_Indirection"](node) {
    const output = [`(${this.deparse(node.arg)})`];

    // TODO(zhm) figure out the actual rules for when a '.' is needed
    //
    // select a.b[0] from a;
    // select (select row(1)).*
    // select c2[2].f2 from comptable
    // select c2.a[2].f2[1].f3[0].a1 from comptable

    for (let i = 0; i < node.indirection.length; i++) {
      const subnode = node.indirection[i];

      if (subnode.String || subnode.A_Star) {
        const value = subnode.A_Star ? "*" : this.quote(subnode.String.str);

        output.push(`.${value}`);
      } else {
        output.push(this.deparse(subnode));
      }
    }

    return output.join("");
  }

  ["A_Star"](node, context) {
    return "*";
  }

  ["BitString"](node) {
    const prefix = node.str[0];
    return `${prefix}'${node.str.substring(1)}'`;
  }

  ["BoolExpr"](node) {
    switch (node.boolop) {
      case 0:
        return parens(this.list(node.args, " AND "));
      case 1:
        return parens(this.list(node.args, " OR "));
      case 2:
        return format("NOT (%s)", this.deparse(node.args[0]));
      default:
        return fail("BoolExpr", node);
    }
  }

  ["BooleanTest"](node) {
    const output = [];

    output.push(this.deparse(node.arg));

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
  }

  ["CaseExpr"](node) {
    const output = ["CASE"];

    if (node.arg) {
      output.push(this.deparse(node.arg));
    }

    for (let i = 0; i < node.args.length; i++) {
      output.push(this.deparse(node.args[i]));
    }

    if (node.defresult) {
      output.push("ELSE");
      output.push(this.deparse(node.defresult));
    }

    output.push("END");

    return output.join(" ");
  }

  ["CoalesceExpr"](node) {
    return format("COALESCE(%s)", this.list(node.args));
  }

  ["CollateClause"](node) {
    const output = [];

    if (node.arg) {
      output.push(this.deparse(node.arg));
    }

    output.push("COLLATE");

    if (node.collname) {
      output.push(this.quote(this.deparseNodes(node.collname)));
    }

    return output.join(" ");
  }

  ["ColumnDef"](node) {
    const output = [this.quote(node.colname)];

    output.push(this.deparse(node.typeName));

    if (node.raw_default) {
      output.push("USING");
      output.push(this.deparse(node.raw_default));
    }

    if (node.constraints) {
      output.push(this.list(node.constraints, " "));
    }

    return _.compact(output).join(" ");
  }

  ["ColumnRef"](node) {
    const fields = node.fields.map(field => {
      if (field.String) {
        return this.quote(this.deparse(field));
      }

      return this.deparse(field);
    });

    return fields.join(".");
  }

  ["CommonTableExpr"](node) {
    const output = [];

    output.push(node.ctename);

    if (node.aliascolnames) {
      output.push(
        format("(%s)", this.quote(this.deparseNodes(node.aliascolnames)))
      );
    }

    output.push(format("AS (%s)", this.deparse(node.ctequery)));

    return output.join(" ");
  }

  ["Float"](node) {
    // wrap negative numbers in parens, SELECT (-2147483648)::int4 * (-1)::int4
    if (node.str[0] === "-") {
      return `(${node.str})`;
    }

    return node.str;
  }

  ["FuncCall"](node, context) {
    const output = [];

    let params = [];

    if (node.args) {
      params = node.args.map(item => {
        return this.deparse(item);
      });
    }

    // COUNT(*)
    if (node.agg_star) {
      params.push("*");
    }

    const name = this.list(node.funcname, ".");

    const order = [];

    const withinGroup = node.agg_within_group;

    if (node.agg_order) {
      order.push("ORDER BY");
      order.push(this.list(node.agg_order, ", "));
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
      output.push(format("FILTER (WHERE %s)", this.deparse(node.agg_filter)));
    }

    if (node.over != null) {
      output.push(format("OVER %s", this.deparse(node.over)));
    }

    return output.join(" ");
  }

  ["GroupingFunc"](node) {
    return "GROUPING(" + this.list(node.args) + ")";
  }

  ["GroupingSet"](node) {
    switch (node.kind) {
      case 0: // GROUPING_SET_EMPTY
        return "()";

      case 1: // GROUPING_SET_SIMPLE
        return fail("GroupingSet", node);

      case 2: // GROUPING_SET_ROLLUP
        return "ROLLUP (" + this.list(node.content) + ")";

      case 3: // GROUPING_SET_CUBE
        return "CUBE (" + this.list(node.content) + ")";

      case 4: // GROUPING_SET_SETS
        return "GROUPING SETS (" + this.list(node.content) + ")";

      default:
        return fail("GroupingSet", node);
    }
  }

  ["Integer"](node) {
    if (node.ival < 0) {
      return `(${node.ival})`;
    }

    return node.ival.toString();
  }

  ["IntoClause"](node) {
    return this.deparse(node.rel);
  }

  ["JoinExpr"](node, context) {
    const output = [];

    output.push(this.deparse(node.larg));

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
        output.push(`(${this.deparse(node.rarg)})`);
      } else {
        output.push(this.deparse(node.rarg));
      }
    }

    if (node.quals) {
      output.push(`ON ${this.deparse(node.quals)}`);
    }

    if (node.usingClause) {
      const using = this.quote(this.deparseNodes(node.usingClause)).join(", ");

      output.push(`USING (${using})`);
    }

    const wrapped =
      node.rarg.JoinExpr != null || node.alias
        ? "(" + output.join(" ") + ")"
        : output.join(" ");

    if (node.alias) {
      return wrapped + " " + this.deparse(node.alias);
    }

    return wrapped;
  }

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
      output.push(this.list(node.lockedRels));
    }

    return output.join(" ");
  }

  ["MinMaxExpr"](node) {
    const output = [];

    if (node.op === 0) {
      output.push("GREATEST");
    } else {
      output.push("LEAST");
    }

    output.push(parens(this.list(node.args)));

    return output.join("");
  }

  ["NamedArgExpr"](node) {
    const output = [];

    output.push(node.name);
    output.push(":=");
    output.push(this.deparse(node.arg));

    return output.join(" ");
  }

  ["Null"](node) {
    return "NULL";
  }

  ["NullTest"](node) {
    const output = [this.deparse(node.arg)];

    if (node.nulltesttype === 0) {
      output.push("IS NULL");
    } else if (node.nulltesttype === 1) {
      output.push("IS NOT NULL");
    }

    return output.join(" ");
  }

  ["ParamRef"](node) {
    if (node.number >= 0) {
      return ["$", node.number].join("");
    }
    return "?";
  }

  ["RangeFunction"](node) {
    const output = [];

    if (node.lateral) {
      output.push("LATERAL");
    }

    const funcs = [];

    for (let i = 0; i < node.functions.length; i++) {
      const funcCall = node.functions[i];
      const call = [this.deparse(funcCall[0])];

      if (funcCall[1] && funcCall[1].length) {
        call.push(format("AS (%s)", this.list(funcCall[1])));
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
      output.push(this.deparse(node.alias));
    }

    if (node.coldeflist) {
      const defList = this.list(node.coldeflist);

      if (!node.alias) {
        output.push(` AS (${defList})`);
      } else {
        output.push(`(${defList})`);
      }
    }

    return output.join(" ");
  }

  ["RangeSubselect"](node, context) {
    let output = "";

    if (node.lateral) {
      output += "LATERAL ";
    }

    output += parens(this.deparse(node.subquery));

    if (node.alias) {
      return output + " " + this.deparse(node.alias);
    }

    return output;
  }

  ["RangeTableSample"](node) {
    const output = [];

    output.push(this.deparse(node.relation));
    output.push("TABLESAMPLE");
    output.push(this.deparse(node.method[0]));

    if (node.args) {
      output.push(parens(this.list(node.args)));
    }

    if (node.repeatable) {
      output.push("REPEATABLE(" + this.deparse(node.repeatable) + ")");
    }

    return output.join(" ");
  }

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
      output.push(this.quote(node.schemaname));
      output.push(".");
    }

    output.push(this.quote(node.relname));

    if (node.alias) {
      output.push(this.deparse(node.alias));
    }

    return output.join(" ");
  }

  ["ResTarget"](node, context) {
    if (context === "select") {
      return compact([this.deparse(node.val), this.quote(node.name)]).join(
        " AS "
      );
    } else if (context === "update") {
      return compact([node.name, this.deparse(node.val)]).join(" = ");
    } else if (!(node.val != null)) {
      return this.quote(node.name);
    }

    return fail("ResTarget", node);
  }

  ["RowExpr"](node) {
    if (node.row_format === 2) {
      return parens(this.list(node.args));
    }

    return format("ROW(%s)", this.list(node.args));
  }

  ["SelectStmt"](node, context) {
    const output = [];

    if (node.withClause) {
      output.push(this.deparse(node.withClause));
    }

    if (node.op === 0) {
      // VALUES select's don't get SELECT
      if (node.valuesLists == null) {
        output.push("SELECT");
      }
    } else {
      output.push(parens(this.deparse(node.larg)));

      const sets = ["NONE", "UNION", "INTERSECT", "EXCEPT"];

      output.push(sets[node.op]);

      if (node.all) {
        output.push("ALL");
      }

      output.push(parens(this.deparse(node.rarg)));
    }

    if (node.distinctClause) {
      if (node.distinctClause[0] != null) {
        output.push("DISTINCT ON");

        const clause = node.distinctClause
          .map(e => this.deparse(e, "select"))
          .join(",\n");

        output.push(`(${clause})`);
      } else {
        output.push("DISTINCT");
      }
    }

    if (node.targetList) {
      output.push(
        indent(node.targetList.map(e => this.deparse(e, "select")).join(",\n"))
      );
    }

    if (node.intoClause) {
      output.push("INTO");
      output.push(indent(this.deparse(node.intoClause)));
    }

    if (node.fromClause) {
      output.push("FROM");
      output.push(
        indent(node.fromClause.map(e => this.deparse(e, "from")).join(",\n"))
      );
    }

    if (node.whereClause) {
      output.push("WHERE");
      output.push(indent(this.deparse(node.whereClause)));
    }

    if (node.valuesLists) {
      output.push("VALUES");

      const lists = node.valuesLists.map(list => {
        return `(${list.map(v => this.deparse(v)).join(", ")})`;
      });

      output.push(lists.join(", "));
    }

    if (node.groupClause) {
      output.push("GROUP BY");
      output.push(
        indent(node.groupClause.map(e => this.deparse(e, "group")).join(",\n"))
      );
    }

    if (node.havingClause) {
      output.push("HAVING");
      output.push(indent(this.deparse(node.havingClause)));
    }

    if (node.windowClause) {
      output.push("WINDOW");

      const windows = [];

      for (let i = 0; i < node.windowClause.length; i++) {
        const w = node.windowClause[i];
        const window = [];

        if (w.WindowDef.name) {
          window.push(this.quote(w.WindowDef.name) + " AS");
        }

        window.push(parens(this.deparse(w, "window")));

        windows.push(window.join(" "));
      }

      output.push(windows.join(", "));
    }

    if (node.sortClause) {
      output.push("ORDER BY");
      output.push(
        indent(node.sortClause.map(e => this.deparse(e, "sort")).join(",\n"))
      );
    }

    if (node.limitCount) {
      output.push("LIMIT");
      output.push(indent(this.deparse(node.limitCount)));
    }

    if (node.limitOffset) {
      output.push("OFFSET");
      output.push(indent(this.deparse(node.limitOffset)));
    }

    if (node.lockingClause) {
      node.lockingClause.forEach(item => {
        return output.push(this.deparse(item));
      });
    }

    return output.join(" ");
  }

  ["SortBy"](node) {
    const output = [];

    output.push(this.deparse(node.node));

    if (node.sortby_dir === 1) {
      output.push("ASC");
    }

    if (node.sortby_dir === 2) {
      output.push("DESC");
    }

    if (node.sortby_dir === 3) {
      output.push(`USING ${this.deparseNodes(node.useOp)}`);
    }

    if (node.sortby_nulls === 1) {
      output.push("NULLS FIRST");
    }

    if (node.sortby_nulls === 2) {
      output.push("NULLS LAST");
    }

    return output.join(" ");
  }

  ["String"](node) {
    return node.str;
  }

  ["SubLink"](node) {
    switch (true) {
      case node.subLinkType === 0:
        return format("EXISTS (%s)", this.deparse(node.subselect));
      case node.subLinkType === 1:
        return format(
          "%s %s ALL (%s)",
          this.deparse(node.testexpr),
          this.deparse(node.operName[0]),
          this.deparse(node.subselect)
        );
      case node.subLinkType === 2 && !(node.operName != null):
        return format(
          "%s IN (%s)",
          this.deparse(node.testexpr),
          this.deparse(node.subselect)
        );
      case node.subLinkType === 2:
        return format(
          "%s %s ANY (%s)",
          this.deparse(node.testexpr),
          this.deparse(node.operName[0]),
          this.deparse(node.subselect)
        );
      case node.subLinkType === 3:
        return format(
          "%s %s (%s)",
          this.deparse(node.testexpr),
          this.deparse(node.operName[0]),
          this.deparse(node.subselect)
        );
      case node.subLinkType === 4:
        return format("(%s)", this.deparse(node.subselect));
      case node.subLinkType === 5:
        // TODO(zhm) what is this?
        return fail("SubLink", node);
      // MULTIEXPR_SUBLINK
      // format('(%s)', @deparse(node.subselect))
      case node.subLinkType === 6:
        return format("ARRAY (%s)", this.deparse(node.subselect));
      default:
        return fail("SubLink", node);
    }
  }

  ["TypeCast"](node) {
    return this.deparse(node.arg) + "::" + this.deparse(node.typeName);
  }

  ["TypeName"](node) {
    if (_.last(node.names).String.str === "interval") {
      return this.deparseInterval(node);
    }

    const output = [];

    if (node.setof) {
      output.push("SETOF");
    }

    let args = null;

    if (node.typmods != null) {
      args = node.typmods.map(item => {
        return this.deparse(item);
      });
    }

    const type = [];

    type.push(this.type(node.names, args && args.join(", ")));

    if (node.arrayBounds != null) {
      type.push("[]");
    }

    output.push(type.join(""));

    return output.join(" ");
  }

  ["CaseWhen"](node) {
    const output = ["WHEN"];

    output.push(this.deparse(node.expr));
    output.push("THEN");
    output.push(this.deparse(node.result));

    return output.join(" ");
  }

  ["WindowDef"](node, context) {
    const output = [];

    if (context !== "window") {
      if (node.name) {
        output.push(node.name);
      }
    }

    const empty =
      !(node.partitionClause != null) && !(node.orderClause != null);

    const frameOptions = this.deparseFrameOptions(
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

      const clause = node.partitionClause.map(item => this.deparse(item));

      partition.push(clause.join(", "));

      windowParts.push(partition.join(" "));
      useParens = true;
    }

    if (node.orderClause) {
      windowParts.push("ORDER BY");

      const orders = node.orderClause.map(item => {
        return this.deparse(item);
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
  }

  ["WithClause"](node) {
    const output = ["WITH"];

    if (node.recursive) {
      output.push("RECURSIVE");
    }

    output.push(this.list(node.ctes));

    return output.join(" ");
  }

  deparseFrameOptions(options, refName, startOffset, endOffset) {
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
      output.push(this.deparse(startOffset) + " PRECEDING");
    }

    if (options & FRAMEOPTION_START_VALUE_FOLLOWING) {
      output.push(this.deparse(startOffset) + " FOLLOWING");
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
        output.push(this.deparse(endOffset) + " PRECEDING");
      }

      if (options & FRAMEOPTION_END_VALUE_FOLLOWING) {
        output.push(this.deparse(endOffset) + " FOLLOWING");
      }
    }

    return output.join(" ");
  }

  deparseInterval(node) {
    const type = ["interval"];

    if (node.arrayBounds != null) {
      type.push("[]");
    }

    if (node.typmods) {
      const typmods = node.typmods.map(item => this.deparse(item));

      let intervals = this.interval(typmods[0]);

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

  interval(mask) {
    // ported from https://github.com/lfittl/pg_query/blob/master/lib/pg_query/deparse/interval.rb
    if (this.MASKS == null) {
      this.MASKS = {
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
    }

    if (this.BITS == null) {
      this.BITS = _.invert(this.MASKS);
    }

    if (this.INTERVALS == null) {
      this.INTERVALS = {};
      this.INTERVALS[1 << this.BITS.YEAR] = ["year"];
      this.INTERVALS[1 << this.BITS.MONTH] = ["month"];
      this.INTERVALS[1 << this.BITS.DAY] = ["day"];
      this.INTERVALS[1 << this.BITS.HOUR] = ["hour"];
      this.INTERVALS[1 << this.BITS.MINUTE] = ["minute"];
      this.INTERVALS[1 << this.BITS.SECOND] = ["second"];
      this.INTERVALS[(1 << this.BITS.YEAR) | (1 << this.BITS.MONTH)] = [
        "year",
        "month",
      ];
      this.INTERVALS[(1 << this.BITS.DAY) | (1 << this.BITS.HOUR)] = [
        "day",
        "hour",
      ];
      this.INTERVALS[
        (1 << this.BITS.DAY) | (1 << this.BITS.HOUR) | (1 << this.BITS.MINUTE)
      ] = ["day", "minute"];
      this.INTERVALS[
        (1 << this.BITS.DAY) |
          (1 << this.BITS.HOUR) |
          (1 << this.BITS.MINUTE) |
          (1 << this.BITS.SECOND)
      ] = ["day", "second"];
      this.INTERVALS[(1 << this.BITS.HOUR) | (1 << this.BITS.MINUTE)] = [
        "hour",
        "minute",
      ];
      this.INTERVALS[
        (1 << this.BITS.HOUR) |
          (1 << this.BITS.MINUTE) |
          (1 << this.BITS.SECOND)
      ] = ["hour", "second"];
      this.INTERVALS[(1 << this.BITS.MINUTE) | (1 << this.BITS.SECOND)] = [
        "minute",
        "second",
      ];

      // utils/timestamp.h
      // #define INTERVAL_FULL_RANGE (0x7FFF)
      this.INTERVALS[(this.INTERVAL_FULL_RANGE = "32767")] = [];
    }

    return this.INTERVALS[mask.toString()];
  }
}

module.exports = Deparser;
