const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Emitterly = require('../../emitterly')

const configFile = `events:
  newlineevent:
    file: '${path.join(__dirname, 'test.txt')}'
    filters:
      # will match: [12:08:44] 192.168.2.1 (INFO) - User logged in
      filter1: '\\[%{TIME:time}\\] %{IP:ip} \\(%{WORD:type}\\) - %{GREEDYDATA:message}'
    actions:
      webhook: 'https://webhook.site/04ed7a87-f9e5-472d-8f66-fc50f83b0a67'
    condition: '1 === 1'
    payload:
      data: '%match.ip% %event% %condition% customstring'
`

let emitterly

describe('Emitterly', function() {
  before(function(done) {
    try {
      fs.unlinkSync(path.join(__dirname, 'settings.yml'))
      fs.unlinkSync(path.join(__dirname, 'test.txt'))
    } catch (e) {}
    fs.writeFile(path.join(__dirname, 'settings.yml'), configFile, function(err) {
      if (err) throw err

      fs.writeFile(path.join(__dirname, 'test.txt'), '', function(err) {
        if (err) throw err
        done()
      })
    })
  })

  after(function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'settings.yml'))
      fs.unlinkSync(path.join(__dirname, 'test.txt'))
    } catch (e) {}

    emitterly.quit()
  })

  it('Load the Emitterly class', () => {
    emitterly = new Emitterly(path.join(__dirname, 'settings.yml'))
  })

  it('Trigger new line event', done => {
    fs.writeFile(path.join(__dirname, 'test.txt'), '[12:08:44] 192.168.2.1 (INFO) - User logged in\n', function(err) {
      if (err) throw err

      emitterly.tails[0].on('line', () => {
        emitterly.tails[0].removeAllListeners()
        assert.equal(emitterly.lastline, '[12:08:44] 192.168.2.1 (INFO) - User logged in')
        done()
      })
    })
  })

  it('Correct grok filtering', done => {
    fs.writeFile(path.join(__dirname, 'test.txt'), '[12:08:44] 192.168.2.1 (INFO) - User logged in\n', function(err) {
      if (err) throw err

      assert.deepEqual(emitterly.lastmatch, { time: '12:08:44', ip: '192.168.2.1', type: 'INFO', message: 'User logged in' })
      done()
    })
  })

  it('Correct payload translation', done => {
    fs.writeFile(path.join(__dirname, 'test.txt'), '[12:08:44] 192.168.2.1 (INFO) - User logged in\n', function(err) {
      if (err) throw err

      assert.deepEqual(emitterly.lastpayload, { data: '192.168.2.1 newlineevent 1 === 1 customstring' })
      done()
    })
  })
})
