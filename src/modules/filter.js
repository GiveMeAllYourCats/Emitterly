const _ = require('lodash')
const grok = require('grok-js')
const filter = {}

const debug = {
  log: require('debug')('emitterly:filter:log'),
  warn: require('debug')('emitterly:filter:warn')
}

// Translates a line of a watched file to a parsed object via supplied grok filters
// If there are results found on multiple filters, the new keys will be merged in the already parsed object
filter.grok = (filters, line) => {
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
filter.contextVars = (str, event) => {
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

module.exports = filter
