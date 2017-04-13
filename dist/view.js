'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getResourceCachedValues = getResourceCachedValues;
exports.simpleToPlotly = simpleToPlotly;
exports.handsOnTableToHandsOnTable = handsOnTableToHandsOnTable;
exports.normalizeView = normalizeView;
exports.convertReclineToSimple = convertReclineToSimple;
exports.compileData = compileData;
exports.findResourceByNameOrIndex = findResourceByNameOrIndex;
exports.compileView = compileView;
exports.allResourcesLoaded = allResourcesLoaded;
exports.vegaToVega = vegaToVega;
exports.reactVirtualizedToReactVirtualized = reactVirtualizedToReactVirtualized;

var _lodash = require('lodash');

function getResourceCachedValues(resource) {
  var rowsAsObjects = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (rowsAsObjects) {
    var fieldNames = resource.schema.fields.map(function (field) {
      return field.name;
    });
    return resource._values.map(function (row) {
      return (0, _lodash.zipObject)(fieldNames, row);
    });
  } else {
    return resource._values;
  }
}

/**
 * Convert a view using a simple graph spec to plotly spec for rendering
 * @param {View} view descriptor with compiled in data
 * @return {Object} Plotly spec
 */
// Utilities and classes for working with Data Package Views
function simpleToPlotly(view) {
  var simpleGraphTypesToPlotly = {
    line: {
      type: 'scatter',
      mode: 'lines',
      line: {
        width: 2,
        shape: 'spline'
      }
    },
    bar: {
      type: 'bar'
    },
    scatter: {
      type: 'scatter'
    }
  };
  var rowsAsObjects = true;
  var rows = getResourceCachedValues(view.resources[0], rowsAsObjects);
  var xValues = rows.map(function (row) {
    return row[view.spec.group];
  });
  // generate the plotly series
  // { 'x': ..., 'y': ..., 'type': ...}
  var data = view.spec.series.map(function (serie) {
    var out = {
      x: xValues,
      y: rows.map(function (row) {
        return row[serie];
      }),
      name: serie
    };
    Object.assign(out, simpleGraphTypesToPlotly[view.spec.type]);
    return out;
  });

  var plotlySpec = {
    data: data,
    layout: {
      title: view.title ? view.title : '',
      height: 450,
      xaxis: {
        title: view.spec.group
      }
    }
  };
  if (view.spec.series.length === 1) {
    plotlySpec.layout.yaxis = {
      title: view.spec.series[0]
    };
  }
  return plotlySpec;
}

/**
 * Convert a [handson]table view to HandsOnTable spec
 * @param {View} view descriptor with compiled in data
 * @return {Object} HandsOnTable spec
 */
function handsOnTableToHandsOnTable(view) {
  var headers = view.resources[0].schema.fields.map(function (field) {
    return field.name;
  });
  var data = getResourceCachedValues(view.resources[0]);
  var height = null;
  if (data && data.length > 16) {
    height = 432;
  }
  return {
    data: data,
    colHeaders: headers,
    readOnly: true,
    width: 1136,
    height: height,
    colWidths: 47,
    rowWidth: 27,
    stretchH: 'all',
    columnSorting: true,
    search: true,
    manualColumnResize: true
  };
}

/**
 * Ensure view spec is in "normal" form - i.e. has all the standard fields (esp
 * the resources attribute)
 * @param {View} viewSpec (note: Changes the viewSpec in place)
 */
function normalizeView(viewSpec) {
  if (!viewSpec.resources) {
    viewSpec.resources = [0];
  }
}

/**
 * convert old Recline "view" to DP View with simple graph spec
 * @param {View} reclineViewSpec
 */
function convertReclineToSimple(reclineViewSpec) {
  var graphTypeConvert = {
    lines: 'line'
  };
  // TODO: support multiple series
  var out = {
    name: reclineViewSpec.id.toLowerCase(),
    specType: 'simple',
    spec: {
      type: graphTypeConvert[reclineViewSpec.state.graphType],
      group: reclineViewSpec.state.group,
      series: reclineViewSpec.state.series
    }
  };
  return out;
}

/**
 * compile together resources needed for this view based on its data source spec
 * @param {View} view descriptor
 * @param {dataPackage} parent data package - used for resolving the resources
 * @return {Array} An array of resources with their data inlined
 */
function compileData(view, dataPackage) {
  var out = view.resources.map(function (resourceId) {
    var resource = Object.assign({}, findResourceByNameOrIndex(dataPackage, resourceId));
    return resource;
  });
  return out;
}

function findResourceByNameOrIndex(dp, nameOrIndex) {
  if (typeof nameOrIndex == 'number') {
    return dp.resources[nameOrIndex];
  } else {
    return (0, _lodash.find)(dp.resources, function (resource) {
      return resource.name == nameOrIndex;
    });
  }
}

/**
 * Prepare a view for conversion to a renderable spec (normalize it and compile in data)
 * Params as for compileData
 * @return {Object} "compiled" view - normalized and with data inline
 */
function compileView(inView, dataPackage) {
  var view = Object.assign({}, inView);
  normalizeView(view);
  var compiledData = compileData(view, dataPackage);
  view.resources = compiledData;
  return view;
}

/**
 * Check if all resources for the view are loaded - vega specific
 * @param {viewResources} Array of resources
 * @return {Boolean} true if all resources have _values, otherwise false
 */
function allResourcesLoaded(viewResources) {
  var length = 0;
  viewResources.forEach(function (resource) {
    if (resource._values) {
      length += 1;
    }
  });
  if (length === viewResources.length) {
    return true;
  }
}

/**
 * Prepare Vega spec
 * @param {view} compiled view descriptor
 * @return {Object} vegaSpec - full spec with data values
 */
function vegaToVega(view) {
  var vegaSpec = Object.assign({}, view.spec);
  var loaded = allResourcesLoaded(view.resources);
  if (loaded) {
    if (!vegaSpec.data) {
      vegaSpec.data = view.resources.map(function (resource) {
        return { "name": resource.name };
      });
    }

    vegaSpec.data.forEach(function (dataItem) {
      if (!dataItem.source && !dataItem.values) {
        var resource = findResourceByNameOrIndex(view, dataItem.name);
        var rowsAsObjects = !(resource.format === "topojson" || resource.format === "geojson");
        dataItem.values = getResourceCachedValues(resource, rowsAsObjects);
      }
    });

    return vegaSpec;
  }
}

function reactVirtualizedToReactVirtualized(view) {
  var headers = view.resources[0].schema.fields.map(function (field) {
    return field.name;
  }),
      rowsAsObjects = true,
      data = view.resources[0]._values ? getResourceCachedValues(view.resources[0], rowsAsObjects) : undefined,
      headerHeight = 20,
      rowHeight = 30,
      rowCount = data ? data.length : 14,
      height = rowCount * rowHeight + headerHeight > 432 ? 432 : rowCount * rowHeight + headerHeight;

  return {
    data: data,
    headers: headers,
    width: 1136,
    height: height,
    headerHeight: headerHeight,
    rowHeight: rowHeight,
    rowCount: rowCount
  };
}