# ts-mysql-autocomplete

> An autocomplete engine for MySQL queries.

![Alt Text](https://github.com/stevenmiller888/ts-mysql-autocomplete/raw/master/.github/code.png)

## Features

- Autocompletes keywords, table names, and column names
- Supports all versions of MySQL
- Supports database schema

## Installation

```shell
yarn add ts-mysql-autocomplete
# or
npm install ts-mysql-autocomplete
```

## Usage

```typescript
import { MySQLAutocomplete } from 'ts-mysql-autocomplete'

const autocompleter = new MySQLAutocomplete()

const entries1 = autocompleter.autocomplete('SELEC', 5)
console.log(entries1) // [ 'SELECT' ]

const entries2 = autocompleter.autocomplete('SELECT * FROM us', 16)
console.log(entries2) // [ 'users' ]
```

## Related

- [ts-mysql-analyzer](https://github.com/stevenmiller888/ts-mysql-analyzer) - A MySQL query analyzer.
- [ts-mysql-parser](https://github.com/stevenmiller888/ts-mysql-parser) - A standalone, grammar-complete MySQL parser
- [ts-mysql-schema](https://github.com/stevenmiller888/ts-mysql-schema) - A schema extractor for MySQL
- [ts-mysql-uri](https://github.com/stevenmiller888/ts-mysql-uri) - Parse a MySQL connection URI
- [ts-antlr4-scanner](https://github.com/stevenmiller888/ts-antlr4-scanner) - A scanner for antlr4-based lexers

## License

[MIT](https://tldrlegal.com/license/mit-license)

---

> [stevenmiller888.github.io](https://stevenmiller888.github.io) &nbsp;&middot;&nbsp;
> GitHub [@stevenmiller888](https://github.com/stevenmiller888) &nbsp;&middot;&nbsp;
> Twitter [@stevenmiller888](https://twitter.com/stevenmiller888)
