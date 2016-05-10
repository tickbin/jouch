var parser = require('./jouch').parser
var flatten = require('lodash.flatten')

function parse (input) {
  var parsed = parser.parse(input)

  // jouch returns %and, %or and %not due some jison incompatibility
  // we need to replace them here and then parse as JSON
  parsed = parsed.replace(/\%and/g, '$and')
  parsed = parsed.replace(/\%or/g,  '$or')
  parsed = parsed.replace(/\%not/g, '$not')

  var obj = JSON.parse(parsed)
  var flat = flattenBool(obj)
  return flat
}

function flattenBool (obj, op) {
  var ret = {}
  for (var key in obj) {
    if (key === op) {
      // we are in a nested same bool operation
      return flatten(obj[key].map(e => flattenBool(e, op)))
      //return [flattenBool(obj[key][0], op), flattenBool(obj[key][1], op)]
    }
    else if (key === '$and' || key === '$or') {
      ret[key] = flatten(obj[key].map(e => flattenBool(e, key)))
    } else {
      ret[key] = obj[key]
    }
  }

  return ret
}

module.exports = parse
