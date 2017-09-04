'use strict'

var assert = require('assert')
var cp = require('child_process')
var onExit = require('exit-hook')

// Expose lib
module.exports = ATask

/**
 * Creates an async concurrent round robin style task with lazy loaded processes.
 *
 * @param {function} task - the task or setup function to load.
 * @param {object} [opts]
 * @param {number} [opts.concurrency=1] - the maximum number of child processes to spawn.
 * @param {boolean} [opts.setup=false] - should the function be executed immediately.
 * @constructor
 */
function ATask (task, opts) {
  assert(typeof task === 'function', 'ATask: Task must be a function.')

  opts = opts || {}
  var index = 0
  var script = task.toString()
  var concurrency = Math.max(opts.concurrency || 1, 1)
  var processes = new Array(concurrency)

  // Wrap script in iife if setup option used.
  if (opts.setup) script = '(' + script + ')()'

  // Expose task runnner and cleanup function.
  exec.cleanup = cleanup
  onExit(cleanup)
  return exec

  /**
   * Executes spawned child processes in a round robin style.
   * Any arguments provided are passed to task script.
   *
   * Eventually resolves with the results of executing the task in the child process.
   *
   * @param {*} [args] - arguments passed to task.
   * @return {Promise}
   */
  function exec (args) {
    // Lazyily spawn processes.
    var loading = processes[index] = processes[index] || spawn(script)
    // Track calls (batched once per tick)
    loading.calls = loading.calls || []
    var result = loading.calls.push(args) - 1
    // Distrubte calls round robin style.
    if (++index === processes.length) index = 0

    // Batch calls to each process once per tick.
    var pending = loading.pending = loading.pending || loading.then(function (p) {
      var id = Date.now()
      p.send({ id: id, calls: loading.calls })
      loading.pending = loading.calls = null
      return waitForMessage(p, id)
    })

    // Waits for pending call and extracts the results for this particular call.
    return pending.then(function (results) {
      return results[result]
    })
  }

  /**
   * Kills any running child processes.
   */
  function cleanup () {
    for (var i = processes.length; i--;) processes[i] && processes[i].then(kill)
    processes = new Array(concurrency)
  }
}

/**
 * Spawns a new child process and sets it up to run a function and communicate via IPC.
 *
 * @param {string} script - the function script to run.
 * @return {Promise}
 */
function spawn (script) {
  var evalScript = '(' + respondToMessage.toString() + '(' + script + '))'
  // Spawn script with shared stdout and ipc.
  return waitForMessage(cp.spawn('node', ['-e', evalScript], {
    cwd: process.cwd(),
    stdio: ['pipe', 'inherit', 'inherit', 'ipc']
  }))
}

/**
 * Closes a child process.
 * @param {ChildProcess} p - the process to kill.
 */
function kill (p) { p.kill() }

/**
 * Waits for a message from the child process but also propogates errors.
 *
 * @param {ChildProcess} p - the process to wait for.
 * @param {number} id - a specific message id to wait for.
 * @return {Promise}
 */
function waitForMessage (p, id) {
  return new Promise(function (resolve, reject) {
    p.on('message', handleMessage)
    p.on('error', handleError)

    function handleMessage (data) {
      if (data.id === id) {
        cleanup()
        resolve(id ? data.calls : p)
      }
    }

    function handleError (err) {
      cleanup()
      reject(err)
    }

    function cleanup () {
      p.removeListener('message', handleMessage)
      p.removeListener('error', handleError)
    }
  })
}

/**
 * Used inside a forked process to respond to the parent process call.
 * @param {function} transform - the data transformer to run on each item.
 */
function respondToMessage (transform) {
  process.on('message', function (data) {
    var calls = data.calls
    var len = calls.length
    for (var i = 0; i < len; i++) {
      calls[i] = transform.apply(null, calls[i])
    }

    Promise.all(calls).then(function (result) {
      data.calls = result
      process.send(data)
    })
  })

  process.send('ready')
}
