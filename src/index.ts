import MySQLParser, {
  MySQLParser as Parser,
  MySQLLexer,
  RuleName,
  ReferenceType,
  TableReference,
  SchemaReference,
  unquote,
  ParserOptions
} from 'ts-mysql-parser'
import { Schema } from 'ts-mysql-schema'
import { CodeCompletionCore } from 'antlr4-c3'
import { Scanner } from 'ts-antlr4-scanner'
import { noSeparatorRequired } from './lib/no-separator-required'
import { preferredRules } from './lib/preferred-rules'
import { ignoredTokens } from './lib/ignored-tokens'
import { synonyms } from './lib/synonyms'

export interface CompletionItem {
  text: string
  type: 'keyword' | 'column' | 'table'
}

export interface MySQLAutocompleteOptions {
  readonly uppercaseKeywords?: boolean
  readonly parserOptions?: ParserOptions
  readonly schema?: Schema
}

export class MySQLAutocomplete {
  uppercaseKeywords: boolean
  parserOptions?: ParserOptions
  schema?: Schema

  public constructor(options: MySQLAutocompleteOptions = {}) {
    this.uppercaseKeywords = options.uppercaseKeywords || true
    this.parserOptions = options.parserOptions
    this.schema = options.schema
  }

  public autocomplete(text: string, offset: number): CompletionItem[] {
    const mySQLParser = new MySQLParser(this.parserOptions)

    const { tokenStream, parser } = mySQLParser.parse(text)

    tokenStream.seek(0)

    const scanner = new Scanner(tokenStream)
    scanner.advanceToPosition(offset)
    scanner.push()

    const completionItems = this.collectCandidates(parser, scanner)
    return completionItems
  }

  private collectCandidates(parser: Parser, scanner: Scanner): CompletionItem[] {
    parser.reset()

    const core = new CodeCompletionCore(parser)

    core.ignoredTokens = ignoredTokens
    core.preferredRules = preferredRules
    core.showResult = false
    core.showDebugOutput = false

    // Certain tokens (like identifiers) must be treated as if the char directly following them still belongs to that
    // token (e.g. a whitespace after a name), because visually the caret is placed between that token and the
    // whitespace creating the impression we are still at the identifier (and we should show candidates for this
    // identifier position).
    // Other tokens (like operators) don't need a separator and hence we can take the caret index as is for them.
    let caretIndex = scanner.tokenIndex()
    if (caretIndex > 0 && !noSeparatorRequired.has(scanner.lookBack())) {
      --caretIndex
    }

    const context = parser.query()
    const completionCandidates = core.collectCandidates(caretIndex, context)
    const not2Tokens = completionCandidates.tokens.get(MySQLLexer.NOT2_SYMBOL) || []

    // Post processing some entries.
    if (not2Tokens.length > 0) {
      // NOT2 is a NOT with special meaning in the operator precedence chain.
      // For code completion it's the same as NOT.
      const notTokens = completionCandidates.tokens.get(MySQLLexer.NOT2_SYMBOL) || []
      completionCandidates.tokens.set(MySQLLexer.NOT_SYMBOL, notTokens)
      completionCandidates.tokens.set(MySQLLexer.NOT2_SYMBOL, [])
    }

    const tableReferences: TableReference[] = []

    for (const ruleEntry of completionCandidates.rules) {
      if (ruleEntry[0] === Parser.RULE_columnRef) {
        const leadingReferences = this.collectLeadingTableReferences(scanner, caretIndex, false)
        leadingReferences.forEach(r => tableReferences.push(r))
        const remainingReferences = this.collectRemainingTableReferences(scanner)
        remainingReferences.forEach(r => tableReferences.push(r))
        break
      } else if (ruleEntry[0] === Parser.RULE_columnInternalRef) {
        // Note:: rule columnInternalRef is not only used for ALTER TABLE, but atm. we only support that here.
        const leadingReferences = this.collectLeadingTableReferences(scanner, caretIndex, true)
        leadingReferences.forEach(r => tableReferences.push(r))
        break
      }
    }

    const keywordEntries: Set<string> = new Set()
    const columnEntries: Set<string> = new Set()
    const tableEntries: Set<string> = new Set()

    for (const candidate of completionCandidates.tokens) {
      let entry = parser.vocabulary.getDisplayName(candidate[0])
      if (entry.includes('_SYMBOL')) {
        entry = entry.substring(0, entry.length - 7)
      } else {
        entry = unquote(entry)
      }

      // The list where we place the entry in.
      let list = 0
      if (candidate[1].length > 0) {
        // A function call?
        if (candidate[1][0] === MySQLLexer.OPEN_PAR_SYMBOL) {
          list = 1
        } else {
          for (const token of candidate[1]) {
            let subEntry = parser.vocabulary.getDisplayName(token)
            if (subEntry.includes('_SYMBOL')) {
              subEntry = subEntry.substring(0, subEntry.length - 7)
            } else {
              subEntry = unquote(subEntry)
            }
            entry += ' ' + subEntry
          }
        }
      }

      switch (list) {
        case 1: {
          break
        }
        default: {
          if (!this.uppercaseKeywords) {
            entry = entry.toLowerCase()
          }

          keywordEntries.add(entry)

          // Add also synonyms, if there are any.
          if (synonyms.has(candidate[0])) {
            const foundSynonyms = synonyms.get(candidate[0]) || []
            for (let synonym of foundSynonyms) {
              if (!this.uppercaseKeywords) {
                synonym = synonym.toLowerCase()
              }
              keywordEntries.add(synonym)
            }
          }
        }
      }
    }

    for (const candidate of completionCandidates.rules) {
      // Restore the scanner position to the caret position and store that value again for the next round.
      scanner.pop()
      scanner.push()

      switch (candidate[0]) {
        case Parser.RULE_tableRef:
        case Parser.RULE_filterTableRef: {
          const tableNames = this.schema?.tables.map(({ name }) => name) || []
          tableNames.forEach(t => tableEntries.add(t))
          break
        }
        case Parser.RULE_tableWild:
        case Parser.RULE_columnRef: {
          if (tableReferences.length > 0) {
            const table = tableReferences[0].table
            if (table) {
              const schemaTable = this.schema?.tables.find(t => t.name === table)
              if (schemaTable) {
                const columnNames = schemaTable.columns.map(({ name }) => name)
                columnNames.forEach(c => columnEntries.add(c))
              }
            }
          }
          break
        }
        case Parser.RULE_columnInternalRef: {
          if (tableReferences.length > 0) {
            const table = tableReferences[0].table
            if (table) {
              tableEntries.add(table)
            }
          }
          break
        }
      }
    }

    // Clear the scanner stack.
    scanner.pop()

    // Insert the groups "inside out", that is, most likely ones first + most inner first (columns before tables etc).
    const completions: CompletionItem[] = []

    keywordEntries.forEach(entry => {
      completions.push({
        text: entry,
        type: 'keyword'
      })
    })

    columnEntries.forEach(entry => {
      completions.push({
        text: entry,
        type: 'column'
      })
    })

    tableEntries.forEach(entry => {
      completions.push({
        text: entry,
        type: 'table'
      })
    })

    return completions
  }

  /**
   * Called if one of the candidates is a column reference, for table references *before* the caret.
   * SQL code must be valid up to the caret, so we can check nesting strictly.
   */
  collectLeadingTableReferences(scanner: Scanner, caretIndex: number, forTableAlter: boolean): TableReference[] {
    scanner.push()

    const tableReferences: TableReference[] = []

    if (forTableAlter) {
      while (scanner.previous() && scanner.tokenType() !== MySQLLexer.ALTER_SYMBOL) {
        if (scanner.tokenType() === MySQLLexer.ALTER_SYMBOL) {
          scanner.skipTokenSequence([MySQLLexer.ALTER_SYMBOL, MySQLLexer.TABLE_SYMBOL])

          const table = unquote(scanner.tokenText())
          const start = scanner.tokenStart()
          const stop = start + scanner.tokenLength()

          if (scanner.next() && scanner.is(MySQLLexer.DOT_SYMBOL)) {
            const schema = table

            scanner.next()
            scanner.next()

            const schemaReference: SchemaReference = {
              type: ReferenceType.SchemaRef,
              schema,
              start,
              stop
            }

            const tableReference: TableReference = {
              type: ReferenceType.TableRef,
              table: unquote(scanner.tokenText()),
              start: scanner.tokenStart(),
              stop: scanner.tokenStart() + scanner.tokenLength(),
              aliasReference: null,
              schemaReference
            }

            tableReferences.push(tableReference)

            return tableReferences
          }

          const tableReference: TableReference = {
            type: ReferenceType.TableRef,
            schemaReference: null,
            aliasReference: null,
            table,
            start,
            stop
          }

          tableReferences.push(tableReference)
        }
      }
    } else {
      scanner.seek(0)

      let level = 0
      // eslint-disable-next-line
      while (true) {
        let found = scanner.tokenType() === MySQLLexer.FROM_SYMBOL

        while (!found) {
          if (!scanner.next() || scanner.tokenIndex() >= caretIndex) {
            break
          }
          switch (scanner.tokenType()) {
            case MySQLLexer.OPEN_PAR_SYMBOL:
              ++level
              break
            case MySQLLexer.CLOSE_PAR_SYMBOL:
              if (level === 0) {
                scanner.pop()
                return tableReferences // We cannot go above the initial nesting level.
              }
              --level
              break
            case MySQLLexer.FROM_SYMBOL:
              found = true
              break
            default:
              break
          }
        }

        if (!found) {
          scanner.pop()
          return tableReferences // No more FROM clause found.
        }

        const moreTableReferences = this.parseTableReferences(scanner.tokenSubText())
        moreTableReferences.forEach(tableReference => {
          tableReferences.push(tableReference)
        })

        if (scanner.tokenType() === MySQLLexer.FROM_SYMBOL) {
          scanner.next()
        }
      }
    }

    scanner.pop()

    return tableReferences
  }

  /**
   * Called if one of the candidates is a column reference, for table references *after* the caret.
   * The function attempts to get table references together with aliases where possible. This is the only place
   * where we actually look beyond the caret and hence different rules apply: the query doesn't need to be valid
   * beyond that point. We simply scan forward until we find a FROM keyword and work from there. This makes it much
   * easier to work on incomplete queries, which nonetheless need e.g. columns from table references.
   * Because inner queries can use table references from outer queries we can simply scan for all outer FROM clauses
   * (skip over subqueries).
   */
  collectRemainingTableReferences(scanner: Scanner): TableReference[] {
    scanner.push()

    // Continously scan forward to all FROM clauses on the current or any higher nesting level.
    // With certain syntax errors this can lead to a wrong FROM clause (e.g. if parentheses don't match).
    // But that is acceptable.
    let level = 0

    // eslint-disable-next-line
    while (true) {
      let found = scanner.tokenType() === MySQLLexer.FROM_SYMBOL
      while (!found) {
        if (!scanner.next()) {
          break
        }

        switch (scanner.tokenType()) {
          case MySQLLexer.OPEN_PAR_SYMBOL:
            ++level
            break
          case MySQLLexer.CLOSE_PAR_SYMBOL:
            if (level > 0) {
              --level
            }
            break
          case MySQLLexer.FROM_SYMBOL:
            // Open and close parentheses don't need to match, if we come from within a subquery.
            if (level === 0) {
              found = true
            }
            break
          default:
            break
        }
      }

      if (!found) {
        scanner.pop()
        return [] // No more FROM clause found.
      }

      const tableReferences = this.parseTableReferences(scanner.tokenSubText())

      tableReferences.forEach(tableReference => {
        tableReferences.push(tableReference)
      })

      if (scanner.tokenType() === MySQLLexer.FROM_SYMBOL) {
        scanner.next()
      }

      return tableReferences
    }
  }

  /**
   * Parses the given FROM clause text using a local parser and collects all found table references.
   */
  parseTableReferences(fromClause?: string): TableReference[] {
    if (!fromClause) {
      return []
    }

    const parser = new MySQLParser(this.parserOptions)
    const result = parser.parse(fromClause, RuleName.fromClause)

    return result.references.tableReferences
  }
}
