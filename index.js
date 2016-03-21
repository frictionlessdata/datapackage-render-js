var nunjucks = require('nunjucks')
  , dpRead = require('datapackage-read')
  , parse = require('csv-parse')
  , transform = require('stream-transform')
  , fs = require('fs')
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
// for tabular data this is a stream of the row objects
// TODO: for geo probably something a bit different
exports.resourceStream = function(resource) {
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
  return stream.pipe(parser).pipe(transformer);
}

// get me a resource from a datapackage identified by index or name
exports.resourceByIdentifier = function(datapackage, resourceIdentifier) {
  var resourceIndex = 0
    , resource = null
    ;

  if (resourceName.match('^\d+$')) {
    resourceIndex = parseInt(resourceName)
  } else {
    datapackage.resources.forEach(function(res, idx) {
      if (res.name === resourceName) {
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
    // TODO
  } else {
    return null
  }
}

