prettier-plugin-pg-sql
======================

[![Package on npm](https://img.shields.io/npm/v/prettier-plugin-pg-sql.svg?style=flat)](https://www.npmjs.com/package/prettier-plugin-pg-sql)
![MIT license](https://img.shields.io/npm/l/prettier-plugin-pg-sql.svg)
[![Gitter chat room](https://badges.gitter.im/prettier-plugin-pg-sql.svg)](https://gitter.im/prettier-plugin-pg-sql?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
<span class="badge-patreon"><a href="https://patreon.com/benjie" title="Donate to support development on this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.me/benjie)
[![Follow](https://img.shields.io/badge/twitter-@benjie-blue.svg)](https://twitter.com/benjie)

This is a work-in-progress plugin for prettier to support formatting of
PostgreSQL-flavour SQL, including formatting view and function bodies as SQL,
PL/pgSQL, Python (plpython), JavaScript (plv8) etc.

Guiding principles
------------------

Try and match pg\_dump-style capitalisation and word order, but with prettier
line-wrapping/indentation.

- Capitalise keywords
- Use lower case for case-insensitive identifiers (table/column/function/etc
	names)
- Only escape case-insensitive identifiers if they are reserved words
- Always escape identifiers if they are reserved words
- Always escape case-sensitive identifiers (obviously)
- Where a statement can be expressed in many orders, express it in the same
	order that `pg_dump` would
- Try not to add/remove things (e.g. functions are volatile by default, mark
	them as `VOLATILE` in the output if and only if they were marked as such in
	the input (otherwise omit))
- Be safe! If we don't understand something, throw an error - don't just carry
	on regardless!

How to use it
-------------

Don't! We're not ready yet!

```
git clone git@github.com:benjie/prettier-plugin-pg-sql.git
cd prettier-plugin-pg-sql
yarn
npm run test
```

How it works / history
----------------------

We use [pg-query-native](https://github.com/zhm/node-pg-query-native) which
uses [libpq_query](https://github.com/lfittl/libpg_query) to parse the SQL
using the same parser code that PostgreSQL uses internally.

We then took [the deparser from
pg-query-parser](https://github.com/pyramation/pg-query-parser/blob/8a83b18bfd3ff85d40f10ea1d679e4605a8b1022/src/deparser.js)
as the foundation for the printer, and converted it from using strings
internally to using prettier's formatting commands. [This is where we're
working currently.]

We've not got this far yet, but next we'll be adding a library of tests (if you
have any particularly tricky SQL, please submit it!) to ensure that nothing is
corrupted.

Finally we'll be optimising the formatting of the output queries - putting the
`group`s and `line`s in the correct places.

Status
------

Very much a work in progress - do NOT use this for basically ANYTHING yet,
we've got a long way to go.


Contributing
------------

Help would be very much appreciated - just jot down
in an issue what you'd like to do and if you get the nod (which tends to be
fairly prompt!) then please send a PR. Issues will be opened up to other
contributors after a short period of inactivity, so you're encouraged to open a
PR before it's ready to merge, just mark it as `[WIP]` in the PR title.

Self-promotion
--------------

While I've got your attention:

- my open source work is self-funded through freelance consulting work and
	generous donations from the community, you can support my open source work via
	[Patreon](https://patreon.com/benjie), or [PayPal](https://paypal.me/benjie)
- you can follow me on Twitter: [@benjie](https://twitter.com/Benjie)
- if you're looking for an instant GraphQL server for your PostgreSQL database
	that leverages the power of PostgreSQL and doesn't fall foul of N+1 issues,
	check out [PostGraphile](https://graphile.org/postgraphile) (formerly
	PostGraphQL)
