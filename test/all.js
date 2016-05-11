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

var dpVega = {
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
      "type": "vega",
      "spec": {
        "data": [
          {
            "name": "blah",
            "resource": "random"
          }
        ],
        "width": 400,
        "height": 200,
        "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},
        "scales": [
          {
            "name": "x",
            "type": "ordinal",
            "range": "width",
            "domain": {"data": "blah", "field": "name"}
          },
          {
            "name": "y",
            "type": "linear",
            "range": "height",
            "domain": {"data": "blah", "field": "size"},
            "nice": true
          }
        ],
        "axes": [
          {"type": "x", "scale": "x"},
          {"type": "y", "scale": "y"}
        ],
        "marks": [
          {
            "type": "rect",
            "from": {"data": "blah"},
            "properties": {
              "enter": {
                "x": {"scale": "x", "field": "name"},
                "width": {"scale": "x", "band": true, "offset": -1},
                "y": {"scale": "y", "field": "size"},
                "y2": {"scale": "y", "value": 0}
              },
              "update": {
                "fill": {"value": "steelblue"}
              }
            }
          }
        ]
      }
    }
  ]
};

// TODO: test errors
describe('html', function() {
  it('html renders ok', function(done) {
    spec.html('test/data/dp1')
      .then(function(html) {
        assert.equal(html.slice(0, 20), '<div class="dataset ');
        done();
      });
  });
});

describe('renderView', function() {
  it('works for vegalite', function(done) {
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
          // how do we test png output better ...
          assert.equal(output[output.length-1][0], 174);
          done();
        });
      });
  });

  it('works for vega', function(done) {
    var dp = new datapackage.DataPackage(dpVega);
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

describe('view to HTML', function() {
  it('works', function(done) {
    var dp = new datapackage.DataPackage(dp1);
    var viewId = 0;
    spec.renderViewToHtml(dp, viewId)
      .then(function(html) {
        assert.equal(html.slice(0, 5), '<scri');
        assert.equal(html.slice(332, 373), 'var vegaViewData = [\n  {\n    \"name\": \"gb\"');
        done();
      });
  });
});

