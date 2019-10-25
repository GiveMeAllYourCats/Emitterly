const tail = require('tail').Tail
const _ = require('lodash')
const isURL = require('valid-url')
const axios = require('axios')
const tmp = require('tmp')
const path = require('path')
const safeEval = require('safe-eval')
const fs = require('fs')

const filter = require('../modules/filter')
const debug = require('../modules/debug')('event')

// If for some reason the program exits, clean up the tmp folder
tmp.setGracefulCleanup()

class Event {
  constructor(settings, event, eventName) {
    this.settings = settings
    this.event = event
    this.eventName = eventName

    this.eval = safeEval
    if (this.settings.unsafe) {
      this.eval = eval
    }

    debug.log('Tailing file', event.file, 'for event', eventName)
    this.tails = []

    let watchFile = event.file
    let useWatchFile = false
    let startupTime = 1

    if (isURL.isUri(event.file)) {
      debug.log('File is part of URI, start polling this file')
      this.settings.tmp = tmp.fileSync()
      this.intervals.push(
        setInterval(() => {
          debug.log('Polling', event.file)
          axios
            .get(event.file)
            .then(response => {
              fs.writeFileSync(this.settings.tmp.fd, response.data)
            })
            .catch(e => {
              throw new Error(e)
            })
        }, 3500)
      )

      useWatchFile = true
      watchFile = this.settings.tmp.name
      startupTime = 6000
    }

    // Timeout is needed for poll system if the file path is a URI
    setTimeout(() => {
      if (!fs.statSync(watchFile).isFile()) {
        throw new Error(`The file ${watchFile} in event ${eventName} does not appear to be a file`)
      }
      this.tails.push(
        new tail(watchFile, {
          useWatchFile: useWatchFile,
          separator: this.settings.separator,
          encoding: this.settings.encoding,
          unsafe: this.settings.unsafe,
          beginning: this.settings.beginning,
          flush: this.settings.flush
        }).on('line', line => {
          this.tailLine(line)
        })
      )
    }, startupTime)
  }

  stop() {
    debug.log('Requesting stop tail worker..')

    // Make sure to stop all setIntervals
    _.each(this.intervals, interval => {
      clearInterval(interval)
    })

    // Make sure to unwatch all tail files
    _.each(this.tails, tail => {
      debug.log('Unwatch file:', tail.filename)
      tail.unwatch()
    })
  }

  // The tail module reported a new found line on a watched file
  tailLine(line) {
    return new Promise((resolve, reject) => {
      debug.log(path.basename(this.event.file), line)

      // Formulate match object for event object with grok matching filters
      this.event.match = filter.grok(this.event.filters, line)

      // Ignore if no matches
      if (Object.keys(this.event.match).length === 0) {
        return debug.warn('No matches found, ignoring')
      }

      // So we can contextualize %event% strings
      this.event.event = this.eventName

      // Evaluate the events condition
      let condition = true
      if (this.event.condition) {
        condition = filter.contextVars(this.event.condition, this.event)
      }

      try {
        this.eval(condition)
      } catch (error) {
        throw new Error(`event: ${this.eventName} condtion: ${condition} ${error}`)
      }

      if (!this.eval(condition)) {
        return debug.warn('event condition returned false, ignoring actions')
      }
      debug.log(`event condition returned true: (${condition}) == true`)

      // Translate event custom payload
      _.each(this.event.payload, (payload, key) => {
        this.event.payload[key] = filter.contextVars(payload, this.event)
      })

      debug.log('Payload set to', this.event.payload)

      // Check what actions to take
      _.each(this.event.actions, (data, type) => {
        debug.log('Triggering action type', type)

        if (type == 'exec') {
          debug.log('exec:', data)
          const execDebug = require('../modules/debug')(`exec`)
          const { exec } = require('child_process')
          exec(data, (error, stdout, stderr) => {
            if (error) {
              throw new Error(error)
            }
            execDebug.log(`STDOUT: ${stdout}`)
            execDebug.log(`STDERR: ${stderr}`)
          })
        } else if (type == 'eval') {
          debug.log('eval:', data.substr(0, 40), '...')
          this.eval(data)
        } else if (type == 'webhook') {
          debug.log('HTTP post:', data, this.event.payload)
          axios
            .post(data, this.event.payload)
            .then(res => {
              debug.log(`Webhook status: ${res.status} ${res.statusText}`)
            })
            .catch(res => {
              debug.warn(`Webhook status: ${res.response.status} ${res.response.statusText}`)
            })
        }
      })
    })
  }
}

module.exports = Event
