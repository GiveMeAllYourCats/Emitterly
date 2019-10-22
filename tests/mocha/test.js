const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Emitterly = require('../../emitterly')
const touch = require('touch')
const yaml = require('js-yaml')
const _ = require('lodash')

let emitterly
const defaultSettings = {
  events: {
    newlineevent: {
      file: path.join(__dirname, 'text.txt'),
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

describe('Emitterly', function() {
  before(() => {
    touch.sync(path.join(__dirname, 'text.txt'))
    touch.sync(path.join(__dirname, 'settings.yml'))
    fs.writeFileSync(path.join(__dirname, 'settings.yml'), yaml.safeDump(defaultSettings))
  })
  after(() => {
    fs.unlinkSync(path.join(__dirname, 'text.txt'))
    fs.unlinkSync(path.join(__dirname, 'settings.yml'))
  })

  it('yeet', () => {
    console.log('yeet')
  })
})
