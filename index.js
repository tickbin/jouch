var parser = require('./jouch').parser

function parse (input) {
  var parsed = parser.parse(input)

  // jouch returns %and, %or and %not due some jison incompatibility
  // we need to replace them here and then parse as JSON
  parsed = parsed.replace(/\%and/g, '$and')
  parsed = parsed.replace(/\%or/g,  '$or')
  parsed = parsed.replace(/\%not/g, '$not')

  var obj = JSON.parse(parsed)
  return obj
}

module.exports = parse
