[![Build Status](https://semaphoreci.com/api/v1/jonotron/jouch/branches/master/shields_badge.svg)](https://semaphoreci.com/jonotron/jouch)

A couchdb 2.0 query parser, using jison

Installation
============

    npm install --save jouch

Usage
=====

### PouchDB

```javascript
import parse from 'jouch'
import PouchDB from 'pouchdb'
import pouchdb-find from 'pouchdb-find'

PouchDB.plugin(pouchdb-find)
const db = new PouchDB('/path/to/pouch')

const selector = parse('id != null')
db.find({
  selector: selector
}).then(res => {
  // results
})
```

### CouchDB 2.0

```javascript
// TODO: add couchdb usage example
```

Expressions
===========

| expression | result           |
|------------|------------------|
| `==`       | `$eq`            |
| `!=`       | `$ne`            |
| `>=`       | `$gte`           |
| `<=`       | `$lte`           |
| `>`        | `$gt`            |
| `<`        | `$lt`            |
| `and`      | `$and`           |
| `or`       | `$or`            |
| `not`      | `$not`           |
| `has`      | `$elemMatch`     |

e.g.

```javascript
const selector = jouch('age >= 18 and skills has "javascript"')
```

would parse to
```json
{ "$and": [
    { "age": {"$gte": 18}},
    { "$elemMatch": {"skills": {"$eq": "javascript"}}}
   ]
}
```


Lead Maintainer: [Jonathan Bowers](https://github.com/jonotron)
