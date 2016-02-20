var nunjucks = require('nunjucks')
  , dpRead = require('datapackage-read')
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

