'use strict'

var test = require('tape')
var task = require('../')

test('Basic', t => {
  t.plan(1)

  const add = task((a, b) => a + b)

  add([1, 2]).then((result) => {
    t.equals(result, 3, 'single')
  }).then(add.cleanup)
})

test('Concurrency', t => {
  t.plan(1)

  const inputs = [[1, 2], [3, 4], [5, 6]]
  const add = task((a, b) => {
    return a + b
  }, { concurrency: 2 })

  Promise
    .all(inputs.map(add))
    .then(results => {
      t.deepEqual(results, [3, 7, 11], 'parallel')
    })
    .then(add.cleanup)
})

test('Promise', t => {
  t.plan(1)

  const add = task((a, b) => Promise.resolve(a + b))

  add([1, 2]).then((result) => {
    t.equals(result, 3, 'single')
  }).then(add.cleanup)
})

test('Setup', t => {
  t.plan(2)

  const add = task(() => {
    let x = 1
    return (a, b) => {
      return x++ + a + b
    }
  }, { setup: true })

  Promise.resolve()
    .then(() => add([1, 2]))
    .then(result => {
      t.equals(result, 4, 'first call')
    })
    .then(() => add([1, 2]))
    .then(result => {
      t.equals(result, 5, 'second call')
    }).then(add.cleanup)
})
