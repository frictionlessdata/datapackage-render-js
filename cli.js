#!/usr/bin/env node
var lib = require('./index.js')
  , program = require('commander');
  ;

program
  .arguments('<cmd> <path>')
  .action(function(cmd, path){
    // console.log(cmd, path);
    if (cmd == 'html') {
      lib.html(path, function(error, html) {
        console.log(html);
      });
    }
  });
  ;

program.parse(process.argv)

