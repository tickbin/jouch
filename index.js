var parser = require('./jouch').parser

function parse (input) {
  var parsed = parser.parse(input)

  parsed = parsed.replace('\%and', '$and')
  parsed = parsed.replace('\%or',  '$or')
  parsed = parsed.replace('\%not', '$not')

  var obj = JSON.parse(parsed)
  return obj
}

module.exports = parse
