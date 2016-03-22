var nunjucks = require('nunjucks')
  , dpRead = require('datapackage-read')
  , parse = require('csv-parse')
  , transform = require('stream-transform')
  , fs = require('fs')
  , vl = require("vega-lite")
  , vg = require("vega")
  ;

exports.html = function(path, callback) {
  nunjucks.configure('views', { autoescape: true });

  dpRead.load(path, function(err, dpkg) {
    if (err) {
      callback(err)
      return;
    }

    dpkg.resources.forEach(function(resource, idx) {
      // set special local url for use in javascript
      resource.localurl = '/tools/dataproxy/?url=' + encodeURIComponent(resource.url);
    });
    var dataViews = dpkg.views || [];

    var res = nunjucks.render('html.html', {
      dataset: dpkg,
      jsonDataPackage: JSON.stringify(dpkg),
      dataViews: JSON.stringify(dataViews),
    });
    callback(null, res);
  });
};

// proxy data
exports.toolsDataProxy = function(req, res) {
  var url = req.query.url;
  request.get(url).pipe(res);
}

// given a resource, give me a stream containing json objects representing data in the stream

// if a callback is provided then rather than return the stream return an array containing the rows of the data (as parsed)

// for tabular data this is a stream of the row objects
// TODO: for geo probably something a bit different
// TODO: cast data using the schema
exports.resourceStream = function(resource, callback) {
  var parser = parse({delimiter: ','});

  if (resource.format && resource.format != 'csv') {
    throw Exception('We can only handle CSV data at the moment');
  }

  // TODO: use any csv dialect description info in the data package to parse
  // var parser = parse({columns: true, trim: true}, callback);
  var parser = parse({columns: true, trim: true});
  var transformer = transform(function(data) {
    return data;
  });
  var stream = exports.rawResourceStream(resource);
  var outstream = stream.pipe(parser).pipe(transformer);
  if (!callback) {
    return outstream;
  } else {
    exports.objectStreamToArray(outstream, callback);
  }
}

exports.objectStreamToArray = function(stream, callback) {
  var output = [];
  stream.on('readable', function() {
    while(row = stream.read()) {
      output.push(row);
    }
  });
  stream.on('error', function(error) {
    callback(error);
  });
  stream.on('finish', function() {
    callback(null, output);
  });
}

// get me a resource from a datapackage identified by index or name
exports.resourceByIdentifier = function(datapackage, resourceIdentifier) {
  var resourceIndex = 0
    , resource = null
    ;

  if (resourceIdentifier.match('^\d+$')) {
    resourceIndex = parseInt(resourceIdentifier)
  } else {
    datapackage.resources.forEach(function(res, idx) {
      if (res.name === resourceIdentifier) {
        resourceIndex = idx;
      }
    });
  }

  if (datapackage.resources.length == 0) {
    return null;
  } else {
    resource = datapackage.resources[resourceIndex];
    return resource;
  }
}

// give me a resource stream
exports.rawResourceStream = function(resource) {
  if (resource.url) {
    return request(resource.url);
  } else if (resource.path) {
    return fs.createReadStream(resource.path);
  } else if (resource.data) {
    // TODO: what happens if it is already JSON objects ...?
    return streamFromString(resource.data);
  } else {
    return null
  }
}

function streamFromString(string) {
  var s = new stream.Readable();
  s._read = function noop() {}; // redundant? see update below
  s.push(string);
  s.push(null);
}

// get stream representing vega data
exports.getVegaDataFromViewDataSpec = function(datapackage, viewId, callback) {
  var viewDataSpec = datapackage.views[viewId].data[0];
  // TODO: transforms etc ...
  var resource = exports.resourceByIdentifier(datapackage, viewDataSpec.resource);
  exports.resourceStream(resource, function(error, data) {
    var out = [
      {
        "name": viewDataSpec.resource,
        "values": data
      }
    ]
    callback(error, out);
  });
}
 

// Render a Data Package view to a Vega view component

// 1. get the data for this view and convert to vega structure (note: vega structure not 
// 2. 
exports.renderView = function(datapackage, viewId, callback) {
  var view = datapackage.views[viewId]
    , vgSpec = vl.compile(view.spec).spec;
    ;
  exports.getVegaDataFromViewDataSpec(datapackage, viewId, function(error, data) {
    vg.parse.spec(vgSpec, {data: data}, function(error, chart) {
      var vegaView = chart();
      callback(error, vegaView);
    });
  });
}

function writeToPng(vegaView, file, callback) {
  vegaView.canvasAsync(function(canvas) {
    // writePNG(canvas, outputFile);
    var file = null;
    var out = file ? fs.createWriteStream(file) : process.stdout;
    var stream = canvas.createPNGStream();
    stream.pipe(out);
  });
}

