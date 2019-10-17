const Benchmark = require('benchmark')
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

const suite = new Benchmark.Suite('app')
suite.add({
  name: 'Emitterly.tailLine()',
  fn: done => {
    emitterly.tailLine('[12:08:44] 192.168.2.1 (INFO) - User logged in', path.join(__dirname, 'test.txt'))
  },
  onStart: () => {
    fs.writeFileSync(path.join(__dirname, 'settings.yml'), configFile)
    fs.writeFileSync(path.join(__dirname, 'test.txt'), '')
    emitterly = new Emitterly(path.join(__dirname, 'settings.yml'))
  },
  onError: e => {
    console.log(e)
  },
  onComplete: () => {
    try {
      fs.unlinkSync(path.join(__dirname, 'settings.yml'))
      fs.unlinkSync(path.join(__dirname, 'test.txt'))
    } catch (e) {}
  }
})

// called when the suite starts running
suite.on('start', () => {})

// called between running benchmarks
suite.on('cycle', function(event) {
  console.log(String(event.target))
})

// called when aborted
suite.on('abort', () => {
  console.log('bench aborted')
})

// called when a test errors
suite.on('error', e => {
  console.log('bench error', e)
})

suite.on('complete', () => {
  process.exit()
})

suite.run({ async: true })
