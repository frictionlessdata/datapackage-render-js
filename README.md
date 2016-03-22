Render data packages and their views to various formats including HTML in both
Node and the browser.

## Install

[![NPM](https://nodei.co/npm/datapackage-render.png)](https://nodei.co/npm/datapackage-render/)

```
npm install datapackage-render
```

Install with comamnd line tool:

```
npm install -g datapackage-render
```

If you want PNG rendering you will need to install node-canvas which in turn
requires additional dependencies outside of node such as Cairo (see
https://github.com/Automattic/node-canvas#installation):

```
npm install node-canvas
```

# Usage

## Library

```
var render = require('datapackage-render');

render.html('path-to-datapackage', function(error, html) {
  console.log(html);
});
```

## Command Line

```
dprender html <path-to-data-package>
```

