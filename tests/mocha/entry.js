const assert = require('assert')
const Emitterly = require('../../main')

describe('Emitterly', function() {
  it('does test', () => {
    const emitterly = new Emitterly()
    emitterly.quit()
  })
})
