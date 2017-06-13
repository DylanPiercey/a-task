var result = []

for (var i = 0; i < 1000000000; i++);
result.push(i * 2)

for (; i < 2000000000; i++);
result.push(i * 2)

for (; i < 3000000000; i++);
result.push(i * 2)

for (; i < 4000000000; i++);
result.push(i * 2)

console.log(result)
