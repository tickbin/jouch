var jouch = require('./')
var util = require('util')

var exp = 'foo has 1 and field == 1'
var obj = jouch(exp)
console.log('test', util.inspect(obj, {showHidden: false, depth: null}))
