create function foo() returns text as $$ select 'hi'; $$ language sql;
create function foo() returns text language plv8 as $$ var a = 1; var b = 2; return a + " + " + b+"="+(((a + b))); $$;
create function foo() returns text language plv8 as $$
var a = 1;
  var b = 2;
  return a + " + " +
b+"="+(((a + b)));
$$;
