
select 1;
select 2; select '3'; select '4'::text; select '5'::int; select 1, '2', 3 as "three", 4 as four; create function foo() returns text as $$ select 'hi'; $$ language sql;
select 1;
sEleCt 1;
sEleCt 1 from my_table;
sEleCt 1 from "my_table";
sEleCt 1 from "table";
sEleCt 1 from "Table";
sEleCt     1     as       one     from     "Table";
sEleCt  
1     as       
       one     from     "Table"
       ;

create function foo() returns text language plv8 as $$ var a = 1; var b = 2; return a + " + " + b+"="+(((a + b))); $$;
