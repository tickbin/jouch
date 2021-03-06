var test = require('tape')
var parse = require('./index')

test('eq num', t => {
  var obj = parse('prop == 1')
  var exp = {prop: {'$eq': 1}}
  t.deepEquals(obj, exp)
  t.end()
})

test('eq string', t => {
  var obj = parse('prop == "something"')
  var exp = {prop: {'$eq': 'something'}}
  t.deepEquals(obj, exp)
  t.end()
})

test('eq string (single quote)', t => {
  var obj = parse("prop == 'something'")
  var exp = {prop: {'$eq': 'something'}}
  t.deepEquals(obj, exp)
  t.end()
})

test('eq array', t => {
  var obj = parse("prop == [1, 'something']")
  var exp = {prop: {'$eq': [1, 'something']}}
  t.deepEquals(obj, exp)
  t.end()
})


// assume that the other comparisons work with various values
test('has num', t => {
  var obj = parse("prop has 1")
  var exp = {prop: {'$elemMatch': {'$eq': 1}}}
  t.deepEquals(obj, exp)
  t.end()
})

test('ne num', t => {
  var obj = parse("prop != 1")
  var exp = {prop: {'$neq': 1}}
  t.deepEquals(obj, exp)
  t.end()
})

test('gte num', t => {
  var obj = parse("prop >= 1")
  var exp = {prop: {'$gte': 1}}
  t.deepEquals(obj, exp)
  t.end()
})

test('lte num', t => {
  var obj = parse("prop <= 1")
  var exp = {prop: {'$lte': 1}}
  t.deepEquals(obj, exp)
  t.end()
})

test('gt num', t => {
  var obj = parse("prop > 1")
  var exp = {prop: {'$gt': 1}}
  t.deepEquals(obj, exp)
  t.end()
})

test('lt num', t => {
  var obj = parse("prop < 1")
  var exp = {prop: {'$lt': 1}}
  t.deepEquals(obj, exp)
  t.end()
})

test('e and e', t => {
  var obj = parse("prop1 == 1 and prop2 == 'something'")
  var exp = {'$and': [{prop1: {'$eq': 1}}, {prop2: {'$eq': 'something'}}]}
  t.deepEquals(obj, exp)
  t.end()
})

test('e or e', t => {
  var obj = parse("prop1 == 1 or prop2 == 'something'")
  var exp = {'$or': [{prop1: {'$eq': 1}}, {prop2: {'$eq': 'something'}}]}
  t.deepEquals(obj, exp)
  t.end()
})

test('not e', t => {
  var obj = parse("not prop1 == 1")
  var exp = {'$not': {prop1: {'$eq': 1}}}
  t.deepEquals(obj, exp)
  t.end()
})

test('multiple %and, %not, %or replaced', t => {
  var obj = parse('not prop1 == 1 and not prop2 == 1')
  var str = JSON.stringify(obj)
  t.notOk(str.match(/\%not/g), 'replaces all %not')

  var obj = parse('prop1 == 1 and prop2 == 1 and prop3 == 4')
  var str = JSON.stringify(obj)
  t.notOk(str.match(/\%and/g), 'replaces all %and')

  var obj = parse('prop1 == 1 or prop2 == 1 or prop3 == 4')
  var str = JSON.stringify(obj)
  t.notOk(str.match(/\%or/g), 'replaces all %or')

  t.end()
})

test('variadic ANDs array nicely', t => {
  var obj = parse('a == 1 and b == 2 and c == 3 and d == 4 and e == 5')
  var exp = { '$and': [
    {a: {'$eq': 1}},
    {b: {'$eq': 2}},
    {c: {'$eq': 3}},
    {d: {'$eq': 4}},
    {e: {'$eq': 5}}
  ]}

  t.deepEquals(obj, exp)
  t.end()
})

test('variadic ORs array nicely', t => {
  var obj = parse('a == 1 or b == 2 or c == 3 or d == 4 or e == 5')
  var exp = { '$or': [
    {a: {'$eq': 1}},
    {b: {'$eq': 2}},
    {c: {'$eq': 3}},
    {d: {'$eq': 4}},
    {e: {'$eq': 5}},
  ]}

  t.deepEquals(obj, exp)
  t.end()
})

test('order of operations handled properly', t => {
  var obj = parse('a == 1 or b == 1 and c == 1')
  var exp = {
    '$or': [
      {a: {'$eq': 1}},
      {'$and': [
        {b: {'$eq': 1}},
        {c: {'$eq': 1}}
      ]}
    ] 
  }
  t.deepEquals(obj, exp)
  t.end()
})

test('handles complex nested boolean order of operations', t => {
  var obj = parse('a == 1 and b == 2 and c == 3 or d == 4 and e == 5 and f == 6')
  var exp = { '$or': [
    {'$and': [
      {a: {'$eq': 1}},
      {b: {'$eq': 2}},
      {c: {'$eq': 3}}
    ]},
    {'$and': [
      {d: {'$eq': 4}},
      {e: {'$eq': 5}},
      {f: {'$eq': 6}}
    ]}
  ]}

  t.deepEquals(obj, exp)
  t.end()
})

test('handles parenthetical order', t => {
  var obj = parse('(a == 1 or b == 2 or c == 3) and (d == 4 or e == 5 or f == 6)')
  var exp = { '$and': [
    {'$or': [
      {a: {'$eq': 1}},
      {b: {'$eq': 2}},
      {c: {'$eq': 3}}
    ]},
    {'$or': [
      {d: {'$eq': 4}},
      {e: {'$eq': 5}},
      {f: {'$eq': 6}}
    ]}
  ]}

  t.deepEquals(obj, exp)
  t.end()
})
