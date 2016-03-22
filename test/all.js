var assert = require('assert')
  , spec = require('../index.js')
  ;

var dp1 = {
  "name": "abc",
  "resources": [
    {
      "name": "random",
      "format": "csv",
      "path": "test/data/dp1/data.csv"
    }
  ],
  "views": [
    {
      "data": [
        {
          "resource": "random"
        }
      ],
      "spec": {
        "mark": "bar",
        "encoding": {
          "x": {"field": "a", "type": "ordinal"},
          "y": {"field": "b", "type": "quantitative"}
        }
      }
    }
  ]
};

dp2 = {
  "name": "abc",
  "resources": [
    {
      "name": "random",
      "format": "json",
      "data": [
        {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
        {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
        {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
      ]
    }
  ],
  "views": [
    {
      "data": [
        {
          "resource": "random"
        }
      ],
      "spec": {
        "mark": "bar",
        "encoding": {
          "x": {"field": "a", "type": "ordinal"},
          "y": {"field": "b", "type": "quantitative"}
        }
      }
    }
  ]
};

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
  var resource = {
    "path": "test/data/dp1/data.csv"
  }
  it('works ok', function(done) {
    spec.resourceStream(resource, function(error, output) {
      assert(!error);
      assert.equal(output.length, 3);
      assert.equal(output[0].size, "100");
      done();
    });
  });
  it('works with stream', function(done) {
    var stream = spec.resourceStream(resource);
    spec.objectStreamToArray(stream, function(error, output) { 
      assert(!error);
      assert.equal(output.length, 3);
      assert.equal(output[0].size, "100");
      done();
    });
  });
});

describe('misc', function() {
  it('getVegaDataFromViewDataSpec works ok', function(done) {
    spec.getVegaDataFromViewDataSpec(dp1, 0, function(err, data) {
      assert.equal(data[0].values[0].name, 'gb');
      done();
    }); 
  });
});

describe('renderView', function() {
  it('works ok', function(done) {
    spec.renderView(dp1, 0, function(error, vegaView) {
      vegaView.renderer('canvas').update();
      var stream = vegaView.canvas().createPNGStream();
      var output = [];
      stream.on('data', function(chunk) {
        output.push(chunk);
      });
      stream.on('end', function() {
        assert.equal(output[0][0], 137);
        done();
      });
    });
  });
});

