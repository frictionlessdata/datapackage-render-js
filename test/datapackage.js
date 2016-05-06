var assert = require('assert')
  , spec = require('../datapackage.js')
  , stream = require('stream')
  ;

var dp1 = {
  "name": "abc",
  "resources": [
    {
      "name": "random",
      "format": "csv",
      "path": "test/data/dp1/data.csv",
      "schema": {
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "size",
            "type": "integer"
          }
        ]
      }
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

describe('DataPackage', function() {
  it('instantiates', function() {
    var dp = new spec.DataPackage();
  });

  it('instantiates with string', function() {
    var dp = new spec.DataPackage('abc');
    assert.equal(dp.path, 'abc');
  });
  
  it('instantiates with object', function() {
    var dp = new spec.DataPackage(dp1);
    assert.deepEqual(dp.data, dp1);
  });

  it('loads', function(done) {
    var dp = new spec.DataPackage('test/data/dp1');
    dp.load()
      .then(function() {
        assert.equal(dp.data.name, 'abc');
        assert.equal(dp.resources.length, 1);
        assert.equal(dp.resources[0].fullPath(), 'test/data/dp1/data.csv');
        done();
      });
  });

});

describe('Resource', function() {
  var resource = {
    "path": "test/data/dp1/data.csv"
  }
  it('instantiates', function() {
    var res = new spec.Resource(resource);
    assert.equal(res.data, resource);
    assert.equal(res.base, '');
  });
  it('fullPath works', function() {
    var res = new spec.Resource(resource, 'abc');
    assert.equal(res.base, 'abc');
    assert.equal(res.fullPath(), 'abc/test/data/dp1/data.csv');
  });
  it('objects works', function(done) {
    var res = new spec.Resource(resource);
    res.objects()
      .then(function(output) {
        assert.equal(output.length, 3);
        assert.equal(output[0].size, "100");
        done();
      });
  });
  it('stream works', function(done) {
    var res = new spec.Resource(resource);
    spec.objectStreamToArray(res.stream()).
      then(function(output) { 
        assert.equal(output.length, 3);
        assert.strictEqual(output[0].size, "100");
        done();
      });
  });
  it('stream works with jts', function(done) {
    var res = new spec.Resource(dp1.resources[0]);
    spec.objectStreamToArray(res.stream()).
      then(function(output) { 
        assert.equal(output.length, 3);
        assert.strictEqual(output[0].size, 100);
        done();
      });
  });
});

function makeStream(text) {
  var s = new stream.Readable();
  s.push(text);
  s.push(null);
  return s;
}

describe('csvToStream', function() {
  it('casting works', function(done) {
    var dp = new spec.DataPackage(dp1);
    var stream = spec.csvToStream(dp.resources[0].rawStream(), dp.resources[0].data.schema);
    spec.objectStreamToArray(stream).
      then(function(output) { 
        assert.equal(output.length, 3);
        assert.strictEqual(output[0].size, 100);
        done();
      });
  });
  it('works with csv dialect', function(done) {
    var tsv = 'name\tsize\nus\t100\ngb\t200';
    var dp = new spec.DataPackage(dp1);
    var stream = spec.csvToStream(makeStream(tsv), dp.resources[0].data.schema, {delimiter: '\t'});
    spec.objectStreamToArray(stream).
      then(function(output) { 
        assert.equal(output.length, 2);
        assert.strictEqual(output[0].size, 100);
        done();
      });
  });
});

