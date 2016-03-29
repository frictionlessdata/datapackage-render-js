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

**Only local data packages are supported atm**

```
var render = require('datapackage-render');

render.html('path-to-datapackage', function(error, html) {
  console.log(html);
});

// Render a "view"

// At the moment we only support vega-lite views (vega coming soon)

// Integration with Data Package is via a resource property on vega-lite data
// property. At runtime the Data Package resource data is injected into the
// vega vis. (Proper documentation coming soon)

// for a good example usage see dprender function in cli.js

var dp = new DataPackage('path-to-datapackage');
var viewIndex = 0;
render.renderView(dp, viewIndex)
  .then(function(vegaView) {
    // do something with vegaView object ...
  });
```

## Command Line

```
// will write html output to stdout
dprender html <path-to-data-package>

// will write png output to stdout
dprender view <path-to-data-package>
```

## Research

This documents some learning about how Vega and Vega-Lite work that is useful for implementors.

### Late data binding in Vega

A working demonstration is in:

```
examples/vega-late-binding.js
```

You can run it to test it:

```
node examples/vega-late-binding.js > tmp.png
```

Current vega documentation is somewhat unclear / misleading re "late-binding" or resetting of data. See e.g.

https://github.com/vega/vega/issues/410 and
https://groups.google.com/forum/#!topic/vega-js/MWy2m1HfIWM

### Vega vs Vega-Lite data structures

Vega and Vege-Lite data structures are different:

* Vega allows a `data` property which is an array of dataset objects - https://github.com/vega/vega/wiki/Data
* Vega-lite only allows one dataset and therefore its data property is a hash and name is not used - https://vega.github.io/vega-lite/docs/data.html
* When Vega-Lite transformed to Vega this anonymous data source is called `source`.

  ```
  # vegalite
  {
    data: {
      "values": ...
    }
  }

  # generated vega
  {
    "data": [
      {
        "name": "source",
        "values": ...
      },
      {
        "name": "layout",
        ...
      }
    ...
  }
  ```

  You can see this for yourself using the Vega / Vega-Lite editor https://vega.github.io/vega-editor/?mode=vega-lite&showEditor=1


  I've raised an issue about Vega-Lite supporting multiple datasets: https://github.com/vega/vega-lite/issues/1271

