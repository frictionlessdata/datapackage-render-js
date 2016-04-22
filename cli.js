#!/usr/bin/env node
var lib = require('./index.js')
  , datapackage = require('./datapackage.js')
  , program = require('commander');
  ;

program
  .arguments('<cmd> <path>')
  .action(function(cmd, path){
    // console.log(cmd, path);
    if (cmd == 'html') {
      lib.html(path)
        .then(function(html) {
          console.log(html);
        });
    }
    if (cmd == 'view') {
      var dp = new datapackage.DataPackage(path);
      dp.load()
        .then(function() {
          lib.renderView(dp, 0)
            .then(function(vegaView) {
              vegaView.renderer('canvas').update();
              vegaView.canvasAsync(function(canvas) {
                var stream = canvas.createPNGStream();
                // var out = file ? fs.createWriteStream(file) : process.stdout;
                var out = process.stdout;
                stream.pipe(out);
              });
            });
        });
    }
  });
  ;

program.parse(process.argv)

