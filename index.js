var fs = require('fs')
  , nunjucks = require('nunjucks')
  , vl = require("vega-lite")
  , vg = require("vega")
  , Promise = require('bluebird')
  , dpRead = require('datapackage-read')
  , datapackage = require('./datapackage.js')
  ;

// Promise.promisify(dpRead.load);

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

// Render a Data Package view to a Vega view component
exports.renderView = function(datapackage, viewId) {
  var view = datapackage.data.views[viewId]
    , vgSpec = vl.compile(view.spec).spec
    // TODO: support for multiple data resource sources
    // NB: vega-lite only supports one data source
    // ATM we just take first data item
    , viewDataSpec = datapackage.data.views[viewId].spec.data
    , resource = datapackage.getResource(viewDataSpec.resource)
    ;
  var p = new Promise(function(resolve, reject) {
    // get the resource data and inject it into the vega view and return that view
    resource.objects()
      .then(function(data) {
        vg.parse.spec(vgSpec, function(error, chart) {
          if (error) {
            reject(error);
            return;
          }
          var vegaView = chart();
          // late-bind the data
          // vega-lite compiles to vega where the dataset is always called 'source'
          vegaView.data('source').insert(data);
          vegaView.update();
          resolve(vegaView);
        });
      })
      .catch(function(e) {
        reject(e);
      });
  });
  return p;
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

