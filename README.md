Compile and convert Data Package views specifications.

## Install

[![NPM](https://nodei.co/npm/datapackage-render.png)](https://nodei.co/npm/datapackage-render/)

```
npm install datapackage-render
```

# Usage

## Library

```
import dprender from 'datapackage-render'

// takes a vega spec that was written for datapackage and compiles data values
// so it is ready and full Vega spec
let vegaSpec = dprender.compileVegaData(...)

// takes a simple graph spec and generates a plotly spec
let plotlySpec = dprender.simpleToPlotly(...)

// takes a recline spec and converts it into simple spec
let simpleSpec = dprender.convertReclineToSimple(...)

// compile a view - normalize and compile data
let compiledView = dprender.compileView(...)

// takes a [handson]table view and returns HandsOnTable spec
let hTableSpec = dprender.handsOnTableToHandsOnTable(...)
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
