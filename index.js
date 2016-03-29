var fs = require('fs')
  , nunjucks = require('nunjucks')
  , vl = require("vega-lite")
  , vg = require("vega")
  , Promise = require('bluebird')
  , dpRead = require('datapackage-read')
  , datapackage = require('./datapackage.js')
  ;


// TODO: pass in a loaded dp object - dp loading should not happen here
exports.html = function(path, callback) {
  nunjucks.configure('views', { autoescape: true });

  var dp = new datapackage.DataPackage(path);
  var p = dp.load();
  return p.then(function() {
      // Set local view JS so it all works (e.g. inline relevant data etc)
      var dataViews = dp.data.views || [];
      var res = nunjucks.render('html.html', {
        dataset: dp.data,
        jsonDataPackage: JSON.stringify(dp.data),
        dataViews: JSON.stringify(dataViews),
      });
      return res;
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

