const path = require('path')

const debug = {
  log: require('debug')('emitterly:worker:log'),
  warn: require('debug')('emitterly:worker:warn')
}

class Worker {
  constructor(file, options) {
    const { Worker } = require('worker_threads')
    debug.log('Starting thread', file)
    this.worker = new Worker(path.resolve(path.join(__dirname, `../workers/${file}.js`)))
    this.worker.on('message', message => {
      if (message.type === 'terminate') {
        setTimeout(() => {
          this.worker.terminate()
        }, 200)
      }
    })
    this.worker.on('error', error => {
      console.error(error)
      process.exit(1)
    })
    this.worker.postMessage({
      type: 'start',
      data: options
    })
  }

  send(type, data) {
    debug.log('Sending postMessage', type, data)
    this.worker.postMessage({
      type,
      data
    })
  }
}

module.exports = Worker
