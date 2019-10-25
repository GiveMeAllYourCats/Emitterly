module.exports = file => {
  return {
    log: require('debug')(`emitterly:${file}:log`),
    warn: require('debug')(`emitterly:${file}:warn`)
  }
}
