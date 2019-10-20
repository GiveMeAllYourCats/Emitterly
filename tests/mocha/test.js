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

  it('Action should never trigger due to faulty condition', async () => {
    const newSettings = defaultSettings
    newSettings.events.newlineevent.condition = `1 === 0`
    emitterly = await new Emitterly(null, newSettings)
    await emitterly.tailLine('[12:08:44] 192.168.2.1 (INFO) - User logged in', path.join(__dirname, 'text.txt'))
    emitterly.stop()
    // TODO: verify
  })

  it('Trigger new line event in file, 1 matched grok filter', async () => {
    emitterly = await new Emitterly(null, defaultSettings)
    await emitterly.tailLine('[12:08:44] 192.168.2.1 (INFO) - User logged in', path.join(__dirname, 'text.txt'))
    emitterly.stop()

    // TODO: verify
  })

  it('Trigger new line event in file, 2 matched grok filter (should merge)', async () => {
    const newSettings = defaultSettings
    newSettings.events.newlineevent.filters.filter2 = `\\[%{TIME:time}\\] %{IP:ip} \\(%{WORD:type}\\) - %{GREEDYDATA:message2}`
    emitterly = await new Emitterly(null, newSettings)
    await emitterly.tailLine('[12:08:44] 192.168.2.1 (INFO) - User logged in', path.join(__dirname, 'text.txt'))
    emitterly.stop()

    // TODO: verify
  })

  it('Trigger new line event file: unmatched grok filter', async () => {
    emitterly = await new Emitterly(null, defaultSettings)
    await emitterly.tailLine('test', path.join(__dirname, 'text.txt'))
    emitterly.stop()

    // TODO: verify
  })

  it('Load Emitterly without a settings yml should error', async () => {
    assert.rejects(async () => {
      emitterly = await new Emitterly('thisdoesnotexist.yml')
    })
  })

  it('Load Emitterly with a settings yml', async () => {
    emitterly = await new Emitterly(path.join(__dirname, 'settings.yml'))
    emitterly.stop()

    // TODO: verify
  })

  it('Load Emitterly without events', async () => {
    emitterly = await new Emitterly(null, {})

    // TODO: verify
  })

  it('Try to listen to a directory', async () => {
    const newSettings = defaultSettings
    newSettings.events.newlineevent.file = `./`
    assert.rejects(async () => {
      emitterly = await new Emitterly(null, newSettings)
    })
  })

  it('Try to listen to a non existing file', async () => {
    const newSettings = defaultSettings
    newSettings.events.newlineevent.file = `./yeet.txt`
    assert.rejects(async () => {
      emitterly = await new Emitterly(null, newSettings)
    })
  })

  it('Trigger new line event', done => {
    // This is friggin ugly lol
    ;(async () => {
      emitterly = await new Emitterly(path.join(__dirname, 'settings.yml'))
      fs.writeFile(path.join(__dirname, 'text.txt'), '[12:08:44] 192.168.2.1 (INFO) - User logged in\n', function(err) {
        if (err) throw err

        this.timeouter = setInterval(() => {
          if (_.get(emitterly, 'lastline')) {
            assert.equal(emitterly.lastline, '[12:08:44] 192.168.2.1 (INFO) - User logged in')

            if (_.get(emitterly, 'lastwebhookStatus')) {
              emitterly.stop()
              clearInterval(this.timeouter)
              done()
            }
          }
        }, 10)
      })
    })()
  })
})
