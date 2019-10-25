const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Emitterly = require('../../emitterly')
const touch = require('touch')
const yaml = require('js-yaml')
const _ = require('lodash')

const textFile = path.join(__dirname, 'text.txt')
const settingsFile = path.join(__dirname, 'settings.yml')

let emitterly
const defaultSettings = {
  events: {
    newlineevent: {
      file: textFile,
      filters: {
        filter1: `\\[%{TIME:time}\\] %{IP:ip} \\(%{WORD:type}\\) - %{GREEDYDATA:message}`
      },
      actions: {
        webhook: 'https://webhook.site/04ed7a87-f9e5-472d-8f66-fc50f83b0a67'
      },
      condition: '1 === 1',
      payload: {
        data: '%match.ip% %event% %condition% customstring %encapsulated% %yeet yeet%'
      }
    }
  }
}

describe('Emitterly event file', function() {
  before(done => {
    touch.sync(textFile)
    touch.sync(settingsFile)
    fs.writeFileSync(settingsFile, yaml.safeDump(defaultSettings))
    setTimeout(() => {
      done()
    }, 500)
  })
  after(() => {
    emitterly.stop()
    setTimeout(() => {
      fs.unlinkSync(textFile)
      fs.unlinkSync(settingsFile)
    }, 500)
  })

  it('Trigger new line event in file', done => {
    emitterly = new Emitterly({
      config: settingsFile,
      encoding: 'utf-8',
      separator: /[\r]{0,1}\n/,
      unsafe: false,
      beginning: false,
      flush: false
    })
    setTimeout(() => {
      fs.writeFileSync(textFile, '[12:08:44] 192.168.2.1 (INFO) - User logged in\r\n')
      setTimeout(() => {
        fs.writeFileSync(textFile, '[12:08:44] 192.168.2.1 (INFO) - User logged in\r\n')
        setTimeout(() => {
          fs.writeFileSync(textFile, '[12:08:44] 192.168.2.1 (INFO) - User logged in\r\n')
          done()
        }, 500)
      }, 500)
    }, 500)
  })
})
