var assert = require('assert')
  , spec = require('../index.js')
  , datapackage = require('../datapackage.js')
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
      "type": "vegalite",
      "spec": {
        "data": {
          "resource": "random"
        },
        "mark": "bar",
        "encoding": {
          "x": {"field": "name", "type": "ordinal"},
          "y": {"field": "size", "type": "quantitative"}
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

describe('renderView', function() {
  it('works ok', function(done) {
    var dp = new datapackage.DataPackage(dp1);
    var viewId = 0;
    spec.renderView(dp, viewId)
      .then(function(vegaView) {
        vegaView.renderer('canvas').update();
        var stream = vegaView.canvas().createPNGStream();
        var output = [];
        stream.on('data', function(chunk) {
          output.push(chunk);
        });
        stream.on('end', function() {
          // very hacky test ...
          assert.equal(output[output.length-1][0], 174);
          done();
        });
      });
  });
});

