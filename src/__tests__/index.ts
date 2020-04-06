import { MySQLAutocomplete } from '../'

const autocompleter = new MySQLAutocomplete()

test('autocompletes basic queries', () => {
  const entries = autocompleter.autocomplete('SELEC', 5)
  expect(entries).toMatchInlineSnapshot(`
    Array [
      Object {
        "text": "ALTER",
        "type": "keyword",
      },
      Object {
        "text": "CREATE",
        "type": "keyword",
      },
      Object {
        "text": "DROP",
        "type": "keyword",
      },
      Object {
        "text": "RENAME",
        "type": "keyword",
      },
      Object {
        "text": "TRUNCATE",
        "type": "keyword",
      },
      Object {
        "text": "CALL",
        "type": "keyword",
      },
      Object {
        "text": "DELETE",
        "type": "keyword",
      },
      Object {
        "text": "DO",
        "type": "keyword",
      },
      Object {
        "text": "HANDLER",
        "type": "keyword",
      },
      Object {
        "text": "INSERT",
        "type": "keyword",
      },
      Object {
        "text": "LOAD",
        "type": "keyword",
      },
      Object {
        "text": "REPLACE",
        "type": "keyword",
      },
      Object {
        "text": "SELECT",
        "type": "keyword",
      },
      Object {
        "text": "UPDATE",
        "type": "keyword",
      },
      Object {
        "text": "START",
        "type": "keyword",
      },
      Object {
        "text": "COMMIT",
        "type": "keyword",
      },
      Object {
        "text": "SAVEPOINT",
        "type": "keyword",
      },
      Object {
        "text": "ROLLBACK",
        "type": "keyword",
      },
      Object {
        "text": "RELEASE SAVEPOINT",
        "type": "keyword",
      },
      Object {
        "text": "LOCK",
        "type": "keyword",
      },
      Object {
        "text": "UNLOCK",
        "type": "keyword",
      },
      Object {
        "text": "XA",
        "type": "keyword",
      },
      Object {
        "text": "PURGE",
        "type": "keyword",
      },
      Object {
        "text": "CHANGE",
        "type": "keyword",
      },
      Object {
        "text": "RESET",
        "type": "keyword",
      },
      Object {
        "text": "STOP",
        "type": "keyword",
      },
      Object {
        "text": "PREPARE",
        "type": "keyword",
      },
      Object {
        "text": "EXECUTE",
        "type": "keyword",
      },
      Object {
        "text": "DEALLOCATE PREPARE",
        "type": "keyword",
      },
      Object {
        "text": "GRANT",
        "type": "keyword",
      },
      Object {
        "text": "REVOKE",
        "type": "keyword",
      },
      Object {
        "text": "ANALYZE",
        "type": "keyword",
      },
      Object {
        "text": "CHECK TABLE",
        "type": "keyword",
      },
      Object {
        "text": "CHECKSUM TABLE",
        "type": "keyword",
      },
      Object {
        "text": "OPTIMIZE",
        "type": "keyword",
      },
      Object {
        "text": "REPAIR",
        "type": "keyword",
      },
      Object {
        "text": "INSTALL",
        "type": "keyword",
      },
      Object {
        "text": "UNINSTALL",
        "type": "keyword",
      },
      Object {
        "text": "SET",
        "type": "keyword",
      },
      Object {
        "text": "SHOW",
        "type": "keyword",
      },
      Object {
        "text": "BINLOG",
        "type": "keyword",
      },
      Object {
        "text": "CACHE INDEX",
        "type": "keyword",
      },
      Object {
        "text": "FLUSH",
        "type": "keyword",
      },
      Object {
        "text": "KILL",
        "type": "keyword",
      },
      Object {
        "text": "DESC",
        "type": "keyword",
      },
      Object {
        "text": "DESCRIBE",
        "type": "keyword",
      },
      Object {
        "text": "EXPLAIN",
        "type": "keyword",
      },
      Object {
        "text": "HELP",
        "type": "keyword",
      },
      Object {
        "text": "USE",
        "type": "keyword",
      },
      Object {
        "text": "GET",
        "type": "keyword",
      },
      Object {
        "text": "SIGNAL",
        "type": "keyword",
      },
      Object {
        "text": "RESIGNAL",
        "type": "keyword",
      },
      Object {
        "text": "BEGIN",
        "type": "keyword",
      },
    ]
  `)
})
