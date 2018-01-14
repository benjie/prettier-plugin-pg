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

check(`select 1;
select 2; create function foo() returns text as $$ select 'hi'; $$ language sql;`);
check(`select 1;`);
check("sEleCt 1;");
check("sEleCt 1 from my_table;");
check(`sEleCt 1 from "table";`);
check(`sEleCt 1 from "Table";`);
check(`sEleCt     1     as       one     from     "Table";`);
check(`sEleCt  
1     as       
       one     from     "Table"
       ;`);
