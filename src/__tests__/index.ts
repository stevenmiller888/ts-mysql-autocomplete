import { MySQLAutocomplete } from '../'
import { MySQLSchema } from 'ts-mysql-schema'

const mySQLSchema = new MySQLSchema({
  uri: 'mysql://root@127.0.0.1:3310/test'
})

let autocompleter: MySQLAutocomplete

beforeAll(async () => {
  const schema = await mySQLSchema.getSchema()
  autocompleter = new MySQLAutocomplete({ schema })
})

test('autocompletes keywords', () => {
  const item = { text: 'SELECT', type: 'keyword' }
  const entries = autocompleter.autocomplete('SELEC', 4)
  const entry = entries.find(e => e.text === item.text && e.type === item.type)
  expect(entry).toMatchObject(item)
})

test('autocompletes table names', () => {
  const item = { text: 'users', type: 'table' }
  const entries = autocompleter.autocomplete('SELECT * FROM use', 16)
  const entry = entries.find(e => e.text === item.text && e.type === item.type)
  expect(entry).toMatchObject(item)
})

test('autocompletes column names before caret', () => {
  const item = { text: 'name', type: 'column' }
  const entries = autocompleter.autocomplete('SELECT nam FROM users', 9)
  const entry = entries.find(e => e.text === item.text && e.type === item.type)
  expect(entry).toMatchObject(item)
})

test('autocompletes column names after caret', () => {
  const item = { text: 'name', type: 'column' }
  const entries = autocompleter.autocomplete('SELECT * FROM users WHERE nam', 28)
  const entry = entries.find(e => e.text === item.text && e.type === item.type)
  expect(entry).toMatchObject(item)
})
