#!/usr/bin/env node
const program = require('commander')
const Emitterly = require('../emitterly')

program.option('-c, --config <file>', 'config file to load')
program.parse(process.argv)
let emitterly
;(async () => {
  if (program.config) {
    emitterly = await new Emitterly(program.config)
  } else {
    emitterly = await new Emitterly()
  }
})()
