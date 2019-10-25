#!/usr/bin/env node
const program = require('commander')
const Emitterly = require('../emitterly')

program.option('-c, --config <file>', 'Sets config settings file to load', './settings.yml')
program.option('-e, --encoding <encoding>', 'Sets the encoding of the file to tail in events', 'utf-8')
program.option('-s, --separator <separator>', 'Sets the line separator token', /[\r]{0,1}\n/)
program.option('-u, --unsafe', 'Runs native eval function for conditions and eval actions instead of safe-eval', false)
program.option('-b, --beginning', 'Reads event files from the beginning', false)
program.option('-f, --flush', 'Forces flush of data when EOF is reached.', false)
program.option('-p, --pretty', 'Prints pretty errors when thrown', false)

program.parse(process.argv)

if (program.pretty) {
  const pe = require('pretty-error').start()
  pe.skipNodeFiles()
}

new Emitterly({
  config: program.config,
  encoding: program.encoding,
  separator: program.separator,
  unsafe: program.unsafe,
  beginning: program.beginning,
  flush: program.flush
})
