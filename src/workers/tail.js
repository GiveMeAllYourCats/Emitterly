const Tail = require('../classes/tail')
const _ = require('lodash')
const { parentPort } = require('worker_threads')

let tails = []

parentPort.on('message', message => {
  if (message.type === 'start') {
    tails.push(new Tail(message.data.settings, message.data.event, message.data.eventName))
  }
  if (message.type === 'stop') {
    // Make sure to stop all tailed files
    _.each(tails, tailClass => {
      tailClass.stop()
    })

    // And stop the worker
    parentPort.postMessage({
      type: 'terminate'
    })
  }
})
