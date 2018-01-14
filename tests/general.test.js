const prettier = require("prettier");

const ONLY_FIRST = false;

let first = true;
function check(code) {
  if (!first) return test(code);
  test(code, () => {
    const formattedCode = prettier.format(code, {
      parser: "postgresql-sql",
      plugins: ["./"],
    });
    expect(formattedCode).toMatchSnapshot();
  });
  first = !ONLY_FIRST;
}

function expectFail(code) {
  if (ONLY_FIRST) return test(code);
  test(code, () => {
    expect(() => {
      try {
        prettier.format(code, {
          parser: "postgresql-sql",
          plugins: ["./"],
        });
      } catch (e) {
        if (typeof e === "string") {
          // There's an issue with errors somewhere, I think it's in prettier,
          // where Error objects thrown somewhere might be later re-thrown as a
          // string. Undo this.
          throw new Error(e);
        }
        throw e;
      }
    }).toThrowErrorMatchingSnapshot();
  });
}

check(`select 1;
select 2; select '3'; select '4'::text; select '5'::int; select 1, '2', 3 as "three", 4 as four; create function foo() returns text as $$ select 'hi'; $$ language sql;`);
check(`select 1;`);
check("sEleCt 1;");
check("sEleCt 1 from my_table;");
check(`sEleCt 1 from "my_table";`);
check(`sEleCt 1 from "table";`);
expectFail(`sEleCt 1 from table;`);
check(`sEleCt 1 from "Table";`);
check(`sEleCt     1     as       one     from     "Table";`);
check(`sEleCt  
1     as       
       one     from     "Table"
       ;`);
check(
  `create function foo() returns text language plv8 as $$ var a = 1; var b = 2; return a + " + " + b+"="+(((a + b))); $$;`
);
