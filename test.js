var jouch = require('./src/jouch')
var util = require('util')

var exp = 'foo has 1 and field == 1'
var obj = jouch.compile(exp)
console.log(util.inspect(obj, {showHidden: false, depth: null}))
