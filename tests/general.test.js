const prettier = require("prettier");

function check(code) {
  test(code, () => {
    const formattedCode = prettier.format(code, {
      parser: "postgresql-sql",
      plugins: ["./"],
    });
    expect(formattedCode).toMatchSnapshot();
  });
}

function expectFail(code) {
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
select 2; create function foo() returns text as $$ select 'hi'; $$ language sql;`);
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
