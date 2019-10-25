const _ = require('lodash')
const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs')
const Tail = require('./src/classes/tail')

const debug = require('./src/modules/debug')('main')

class Emitterly {
  constructor(init) {
    this.initialize(init)
    this.start()
  }

  start() {
    // Begin tailing events files and/or URLs
    this.tails = []
    this.workers = []
    _.each(this.settings.config.events, (event, eventName) => {
      this.tails.push(new Tail(this.settings, event, eventName))
    })
  }

  initialize(init) {
    this.settings = {}
    // Load yaml settings.yml
    if (init.config.includes('.yml')) {
      this.settings.config = yaml.safeLoad(fs.readFileSync(init.config, 'utf8'))
      debug.log('Settings file', init.config, 'loaded')
    }
    this.settings = _.merge(init, this.settings)
    if (_.get(this.settings, 'config') == undefined) {
      throw new Error('no config key found in settings')
    }

    debug.log('Loaded', _.size(this.settings.config.events), 'events')
    if (_.size(this.settings.config.events) == 0) {
      debug.warn('No events found, closing..')
      process.exit()
    }

    debug.log('Settings initialized:', this.settings)
  }

  // Quit the program
  stop() {
    debug.log('Requesting stop..')

    // Make sure to stop all tailed files
    _.each(this.tails, tailClass => {
      tailClass.stop()
    })

    // Make sure to stop all workers
    _.each(this.workers, workerClass => {
      workerClass.send('stop')
    })

    debug.log('Goodbye!')
  }
}

module.exports = Emitterly
