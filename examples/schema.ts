import { MySQLAutocomplete } from '../src'
import { MySQLSchema } from 'ts-mysql-schema'

const mySQLSchema = new MySQLSchema({
  uri: 'mysql://root@127.0.0.1:3310/test'
})

async function main(): Promise<void> {
  const schema = await mySQLSchema.getSchema()

  const autocompleter = new MySQLAutocomplete({
    uppercaseKeywords: true,
    parserOptions: {
      version: '5.7.7'
    },
    schema
  })

  const entries = autocompleter.autocomplete('SELECT * FROM us', 17)
  console.log(entries) // [ 'users' ]
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
  })
