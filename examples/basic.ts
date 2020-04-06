import { MySQLAutocomplete } from '../src'

const autocompleter = new MySQLAutocomplete()

const entries = autocompleter.autocomplete('SELEC', 5)
console.log(entries) // [ 'SELECT' ]
