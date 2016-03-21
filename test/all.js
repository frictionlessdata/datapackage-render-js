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

describe('resourceStream', function() {
  it('works ok', function(done) {
    var resource = {
      "path": "test/data/dp1/data.csv"
    }
    datastream = spec.resourceStream(resource);
    var output = [];
    datastream.on('readable', function() {
      while(row = datastream.read()) {
        output.push(row);
      }
    });
    datastream.on('finish', function() {
      assert.equal(output.length, 3);
      assert.equal(output[0].size, "100");
      done();
    });

//    spec.resourceStream(resource, function(error, datastream) {
//      assert(!error);
//      assert.equal(datastream.length, 3);
//      assert.equal(datastream[0].size, "100");
//      done();
//    });
  });
});

