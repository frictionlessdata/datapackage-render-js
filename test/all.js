var assert = require('assert')
  , spec = require('../index.js')
  ;

describe('html', function() {
  it('html renders ok', function(done) {
    spec.html('test/data/dp1', function(error, html) {
      assert(!error);
      assert.equal(html.slice(0, 20), '<div class="dataset ');
      done();
    });
  });
});

