var task = require('../')
var x2 = task((min, max) => {
  for (var i = min; i < max; i++);
  return i * 2
}, { concurrency: 2 })

Promise.all([
  x2([0, 1000000000]),
  x2([1000000000, 2000000000]),
  x2([2000000000, 3000000000]),
  x2([3000000000, 4000000000])
]).then(console.log).then(x2.cleanup)
