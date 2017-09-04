# A-Task
Easily run tasks from a seperate process with node. Works great for parallel or long running tasks.

Tasks are automatically batched once per tick and distributed round robin style when in parallel mode.

# Installation

#### Npm
```console
npm install a-task
```

#### Import
```javascript
import task from 'a-task' // es-modules
const task = require('a-task') // commonjs
```

# Basic Example
```javascript
const add = task((a, b) => {
  return a + b
})

// Creates a child process to evaluate the above task.
add([1, 2]).then(result => {
  result === 3
})
```

# Async Tasks
Tasks can return promises that run async.

```javascript
const add = task((a, b) => {
  return Promise.resolve(a + b)
})

// Creates a child process to evaluate the above task.
add([1, 2]).then(result => {
  result === 3
})
```

# Concurrency
```javascript
const inputs = [[1, 2], [3, 4], [5, 6]]

const add = task((a, b) => {
  return a + b
}, { concurrency: 2 })

// Creates two child processes splits the load round robin style.
Promise
  .all(inputs.map(add))
  .then(results => {
    results === [3, 7, 11]
  })
```

# Initializing
```javascript
const add = task(() => {
  let x = 1
  // If setup is true then function provided will be invoked on load.
  // The returned function is then used as the task.
  return (a, b) => {
    x++
    return x + a + b
  }
}, { setup: true })

// Creates a child process to evaluate the above task.
Promise.resolve()
  .then(() => add([1, 2]))
  .then(result1 => {
    result1 === 4
  })
  .then(() => add([1, 2]))
  .then(result2 => {
    result2 === 5 // x was incremented on the previous run.
  })
```

### Contributions

* Use `npm test` to run tests.

Please feel free to create a PR!
