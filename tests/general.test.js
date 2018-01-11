const prettier = require("prettier");
let first = true;

function check(code) {
  (first ? test.only : test)(code, () => {
    const formattedCode = prettier.format(code, {
      parser: "postgresql-sql",
      plugins: ["./"],
    });
    expect(formattedCode).toMatchSnapshot();
  });
  first = false;
}

check(`select 1;
select 2; create function foo() returns text as $$ select 'hi'; $$ language sql;`);
check(`select 1;`);
check("sEleCt 1;");
check("sEleCt 1 from table;");
check(`sEleCt 1 from "table";`);
check(`sEleCt 1 from "Table";`);
check(`sEleCt     1     as       one     from     "Table";`);
check(`sEleCt  
1     as       
       one     from     "Table"
       ;`);
