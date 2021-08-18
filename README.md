# datapackage-render-js

[![NPM](https://img.shields.io/npm/v/datapackage-render.svg)](https://www.npmjs.com/package/datapackage-render)
[![Codebase](https://img.shields.io/badge/codebase-github-brightgreen)](https://github.com/frictionlessdata/datapackage-render-js)
[![Support](https://img.shields.io/badge/support-discord-brightgreen)](https://discordapp.com/invite/Sewv6av)

Compile and convert Data Package views specifications.

## Install

```
npm install datapackage-render
```

## Usage

```javascript
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

// takes a reactVirtualized view and returns ReactVirtualized spec
let reactVirtualizedSpec = dprender.reactVirtualizedToReactVirtualized(...)
```
