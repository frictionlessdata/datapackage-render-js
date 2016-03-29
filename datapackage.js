var fs = require('fs')
  , path = require('path')
  , parse = require('csv-parse')
  , transform = require('stream-transform')
  , Promise = require('bluebird')
  , dpRead = require('datapackage-read')
  ;

// ========================================================
// DataPackage and Resource objects


// TODO: (??) allow path to be a datapackage identifier and parse it correctly ... (e.g. strip datapackage.json)
// e.g. var dp = new DataPackage('finance-vix')
// dp.path = https://data.okfn.org/data/core/finance-vix

// Instantiate a datapackage
exports.DataPackage = function(datapackageJsonOrPath) {
  this.data = {};
  this.resources = [];
  this.path = null;
  if (datapackageJsonOrPath) {
    if (typeof(datapackageJsonOrPath) == 'string') {
      this.path = datapackageJsonOrPath;
    } else{
      this.setDataPackageJson(datapackageJsonOrPath);
    }
  }
}

// setter method to set datapackage json (and set up resource objects)
exports.DataPackage.prototype.setDataPackageJson = function(data) {
  var that = this;
  this.data = data;
  this.resources = [];
  this.data.resources.forEach(function(resource, idx) {
    var res = new exports.Resource(resource, that.path);
    that.resources.push(res);
  });
}

// load datapackage metadata
exports.DataPackage.prototype.load = function(callback) {
  var that = this;
  var p = new Promise(function(resolve, reject) {
    dpRead.load(that.path, function(error, dpkgObj) {
      if (error) {
        reject(error);
      } else {
        that.setDataPackageJson(dpkgObj);
        resolve();
      }
    });
  });
  return p;
}

// get the resource object specified by resourceIdentifier string which may be a name or an number (index)
exports.DataPackage.prototype.getResource = function(resourceIdentifier) {
  var resourceIndex = 0
    , resource = null
    ;

  if (resourceIdentifier.match('^\d+$')) {
    resourceIndex = parseInt(resourceIdentifier)
  } else {
    this.resources.forEach(function(res, idx) {
      if (res.data.name === resourceIdentifier) {
        resourceIndex = idx;
      }
    });
  }

  if (this.resources.length == 0) {
    return null;
  } else {
    resource = this.resources[resourceIndex];
    return resource;
  }
}


// Resource object
exports.Resource = function(resourceObject, base) {
  this.base = base || '';
  this.data = resourceObject;
}

// TODO: support urls vs just paths ...
exports.Resource.prototype.fullPath = function() {
  return path.join(this.base, this.data.path);
}

// give me a raw (binary) resource stream
// TODO: use the base path when locating the data ...
exports.Resource.prototype.rawStream = function() {
  if (this.data.url) {
    return request(this.data.url);
  } else if (this.data.path) {
    return fs.createReadStream(this.fullPath());
  } else if (resource.data) {
    // TODO: what happens if it is already JSON objects ...?
    return _streamFromString(this.data.data);
  } else {
    return null
  }
}

function _streamFromString(string) {
  var s = new stream.Readable();
  s._read = function noop() {}; // redundant? see update below
  s.push(string);
  s.push(null);
}

// given a resource, give me a stream containing json objects representing data in the stream

// if a callback is provided then rather than return the stream return an array containing the rows of the data (as parsed)

// for tabular data this is a stream of the row objects
// TODO: for geo probably something a bit different
// TODO: cast data using the schema
exports.Resource.prototype.stream = function() {
  var parser = parse({delimiter: ','});

  if (this.data.format && this.data.format != 'csv') {
    throw Exception('We can only handle CSV data at the moment');
  }

  // TODO: use any csv dialect description info in the data package to parse
  // var parser = parse({columns: true, trim: true}, callback);
  var parser = parse({columns: true, trim: true});
  var transformer = transform(function(data) {
    return data;
  });

  var stream = this.rawStream();
  var outstream = stream.pipe(parser).pipe(transformer);
  return outstream;
}

// get resource data as array of objects
exports.Resource.prototype.objects = function() {
  var stream = this.stream();
  return exports.objectStreamToArray(stream);
}


// ========================================================
// Misc Functions

// TODO: should not really be an export but used in tests ...
exports.objectStreamToArray = function(stream, callback) {
  var p = new Promise(function(resolve, reject) {
    var output = [];
    stream.on('readable', function() {
      while(row = stream.read()) {
        output.push(row);
      }
    });
    stream.on('error', function(error) {
      reject(error);
    });
    stream.on('finish', function() {
      resolve(output);
    });
  });
  return p;
}

