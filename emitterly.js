const Tail = require('tail').Tail
const grok = require('grok-js')
const _ = require('lodash')
const path = require('path')
const yaml = require('js-yaml')
const axios = require('axios')
const fs = require('fs')
const isURL = require('valid-url')
const tmp = require('tmp')

tmp.setGracefulCleanup()
const debug = {
  log: require('debug')('emitterly:log'),
  warn: require('debug')('emitterly:warn')
}

class Emitterly {
  constructor(ymlFile = './settings.yml', settings = false) {
    return new Promise((resolve, reject) => {
      // Load the settings
      if (settings) {
        this.settings = settings
        debug.log('Settings object loaded')
      } else {
        this.settings = yaml.safeLoad(fs.readFileSync(ymlFile, 'utf8'))
        debug.log('Settings file', ymlFile, 'loaded')
      }
      debug.log('Settings loaded -', _.size(this.settings.events), 'events')
      if (_.size(this.settings.events) == 0) {
        debug.warn('no events found, closing program')
        return resolve()
      }

      // Begin watching files
      this.tails = []
      _.each(this.settings.events, (event, key) => {
        debug.log('Tailing file', event.file, 'for event', key)

        let watchFile = event.file
        let useWatchFile = false
        let startupTime = 1

        if (isURL.isUri(event.file)) {
          debug.log('File is part of URI, start polling this file')
          const tmpFile = tmp.fileSync()
          setInterval(() => {
            debug.log('Polling', event.file)
            axios.get(event.file).then(response => {
              fs.writeFileSync(tmpFile.fd, response.data)
            })
          }, 3500)

          useWatchFile = true
          watchFile = tmpFile.name
          startupTime = 6000
        }

        // Timeout is needed for poll system if the file path is a URI
        setTimeout(() => {
          try {
            if (!fs.statSync(watchFile).isFile()) {
              return reject(`The file ${watchFile} in event ${key} does not appear to be a file`)
            }
            this.tails.push(
              new Tail(watchFile, { useWatchFile }).on('line', line => {
                this.tailLine(line, event.file)
              })
            )
          } catch (error) {
            if (_.get(error, 'code')) {
              if (error.code === 'ENOENT') {
                return reject(`The file ${watchFile} in event ${key} does not exist`)
              }
            }

            return reject(error)
          }

          return resolve(this)
        }, startupTime)
      })
    })
  }

  // Quit the program
  stop() {
    debug.log('Requesting stop..')

    // Make sure to unwatch all tail files
    _.each(this.tails, tail => {
      debug.log('Unwatch file:', tail.filename)
      tail.unwatch()
    })

    debug.log('Goodbye!')
  }

  // Translates a line of a watched file to a parsed object via supplied grok filters
  // If there are results found on multiple filters, the new keys will be merged in the already parsed object
  grok(filters, line) {
    let parsedObject = {}
    _.each(filters, (filter, key) => {
      const pattern = grok.loadDefaultSync().createPattern(filter)
      const parsed = pattern.parseSync(line)
      if (parsed) {
        debug.log('Grok filter', key, 'matched!')
        parsedObject = _.merge(parsedObject, parsed)
      } else {
        debug.warn('Grok filter', key, 'no match!')
      }
    })

    return parsedObject
  }

  // Returns a contextualized string from the event object's data
  contextVars(str, event) {
    // Find and replace instances of string with enclosed percentage characters (%)
    str = str.replace(/\%(.*?)\%/g, key => {
      const stripped = key.substring(1, key.length - 1)
      // Can return its own event object key values
      const found = _.get(event, stripped)

      // If a valid key has been found, return it's value
      if (found) {
        return found
      }

      // Else return the original encapsulated percentage string
      return key
    })

    return str
  }

  // The tail module reported a new found line on a watched file
  tailLine(line, file) {
    return new Promise((resolve, reject) => {
      debug.log(path.basename(file), line)
      this.lastline = line

      // Find events with this file path
      _.each(this.settings.events, (event, key) => {
        if (event.file == file) {
          // Formulate match object for event object with grok matching filters
          event.match = this.grok(event.filters, line)
          this.lastmatch = event.match

          // Ignore if no matches
          if (Object.keys(event.match).length === 0) {
            debug.warn('No matches found, ignoring')
            return resolve()
          }

          // So we can contextualize %event% strings
          event.event = key

          // Evaluate the events condition
          let condition = true
          if (event.condition) {
            condition = this.contextVars(event.condition, event)
          }

          try {
            eval(condition)
          } catch (error) {
            return reject(`event: ${key} condtion: ${condition} ${error}`)
          }

          if (!eval(condition)) {
            debug.warn('event condition returned false, ignoring actions')
            return resolve()
          }
          debug.log(`event condition returned true: (${condition}) == true`)

          // Translate event custom payload
          _.each(event.payload, (payload, key) => {
            event.payload[key] = this.contextVars(payload, event)
          })

          debug.log('Payload set to', event.payload)
          this.lastpayload = event.payload

          // Check what actions to take
          _.each(event.actions, (data, type) => {
            debug.log('Triggering action type', type)

            // Webhook action
            if (type == 'webhook') {
              debug.log('HTTP post:', data, event.payload)
              axios
                .post(data, event.payload)
                .then(res => {
                  this.lastwebhookStatus = res.status
                  debug.log(`Webhook status: ${res.status} ${res.statusText}`)
                })
                .catch(res => {
                  this.lastwebhookStatus = res.response.status
                  debug.warn(`Webhook status: ${res.response.status} ${res.response.statusText}`)
                })
                .finally(resolve)
            }
          })
        }
      })
    })
  }
}

module.exports = Emitterly
