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

/**
 * Recursively flatten same boolean operations
 *
 * e.g. 
 *  {'$and':[
 *    {'$and': [{a:1}, {b:2}]},
 *    {c:3}
 *  ]}
 *
 *  would be flattened to 
 *
 *  {'$and': [{a:1}, {b:2}, {c:3}]}
 */
function flattenBool (obj, op) {
  // a copy of the branch of the tree we are operating on
  // to be returned when finished
  var ret = {}
  for (var key in obj) {
    if (key === op) {
      // we are in a nested same bool operation
      // keep flattening
      return flatten(obj[key].map(function(e) {
        return flattenBool(e, op)
      }))
    }
    else if (key === '$and' || key === '$or') {
      // encountered a boolean operator, start recursing through it's children
      // and flatten on the way out
      ret[key] = flatten(obj[key].map(function(e) {
        return flattenBool(e, key)
      }))
    } else {
      // nothing special, copy out the results and terminate the recursion
      ret[key] = obj[key]
    }
  }

  return ret
}

module.exports = parse
